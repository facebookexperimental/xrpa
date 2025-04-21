# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from dataclasses import dataclass

from xrpa_runtime.reconciler.collection_change_types import (
    CollectionChangeEventAccessor,
    CollectionChangeType,
    CollectionMessageChangeEventAccessor,
    CollectionUpdateChangeEventAccessor,
)
from xrpa_runtime.transport.transport_stream import TransportStream
from xrpa_runtime.transport.transport_stream_accessor import (
    ChangeEventAccessor,
    TransportStreamAccessor,
)
from xrpa_runtime.utils.allocated_memory import AllocatedMemory
from xrpa_runtime.utils.memory_accessor import MemoryAccessor
from xrpa_runtime.utils.placed_ring_buffer import (
    PlacedRingBuffer,
    PlacedRingBufferIterator,
)
from xrpa_runtime.utils.time_utils import TimeUtils
from xrpa_runtime.utils.xrpa_types import ObjectUuid


@dataclass
class PendingWrite:
    object_id: ObjectUuid
    collection_id: int


class DataStoreReconciler:
    def __init__(
        self,
        inbound_transport: TransportStream,
        outbound_transport: TransportStream,
        message_data_pool_size: int,
    ):
        self._inbound_transport = inbound_transport
        self._outbound_transport = outbound_transport

        if message_data_pool_size > 0:
            self._outbound_messages_memory = AllocatedMemory(
                PlacedRingBuffer.get_mem_size(message_data_pool_size)
            )
            self._outbound_messages = PlacedRingBuffer(
                self._outbound_messages_memory.accessor, 0
            )
            self._outbound_messages.init(message_data_pool_size)
            self._outbound_messages_iterator = PlacedRingBufferIterator()
            self._outbound_messages_iterator.set_to_end(self._outbound_messages)
        else:
            self._outbound_messages = None
            self._outbound_messages_memory = None
            self._outbound_messages_iterator = None

        self._message_lifetime_us = 5000000

        self._collections = {}
        self._pending_writes = []
        self._pending_outbound_full_update = True
        self._request_inbound_full_update = False
        self._waiting_for_inbound_full_update = False
        self._inbound_transport_iter = inbound_transport.create_iterator()

    def shutdown(self):
        if self._outbound_transport is None:
            return

        self._outbound_transport.transact(
            1,
            lambda accessor: accessor.write_change_event(
                ChangeEventAccessor, CollectionChangeType.Shutdown.value
            ),
        )

        del self._outbound_messages_memory
        self._outbound_messages_memory = None
        self._outbound_messages = None

        self._inbound_transport = None
        self._outbound_transport = None

    def tick_inbound(self) -> None:
        if self._inbound_transport is None:
            return

        # non-blocking check for inbound changes
        if not self._inbound_transport_iter.needs_processing():
            return

        did_lock = self._inbound_transport.transact(
            1, lambda accessor: self._reconcile_inbound_changes(accessor)
        )
        if not did_lock:
            # TODO raise a warning about this, the expiry time for the transact call may need adjusting
            return

    def tick_outbound(self) -> None:
        # tick each collection
        for collection in self._collections.values():
            collection.tick()

        has_outbound_messages = (
            self._outbound_messages is not None
        ) and self._outbound_messages_iterator.has_next(self._outbound_messages)
        has_outbound_changes = (
            self._request_inbound_full_update
            or self._pending_outbound_full_update
            or len(self._pending_writes) > 0
        )
        if not has_outbound_messages and not has_outbound_changes:
            return

        if self._outbound_transport is None:
            return

        did_lock = self._outbound_transport.transact(
            1, lambda accessor: self._reconcile_outbound_changes(accessor)
        )
        if not did_lock:
            # TODO raise a warning about this, the expiry time for the transact call may need adjusting
            return

    def set_message_lifetime(self, message_lifetime_ms: int):
        self._message_lifetime_us = message_lifetime_ms * 1000

    def send_message(
        self, object_id: ObjectUuid, collection_id: int, field_id: int, num_bytes: int
    ) -> MemoryAccessor:
        (message_mem, rbid) = self._outbound_messages.push(
            CollectionMessageChangeEventAccessor.DS_SIZE + num_bytes
        )
        message = CollectionMessageChangeEventAccessor(message_mem)
        message.set_change_type(CollectionChangeType.Message.value)
        message.set_object_id(object_id)
        message.set_collection_id(collection_id)
        message.set_field_id(field_id)
        return message.access_change_data()

    def notify_object_needs_write(self, object_id: ObjectUuid, collection_id: int):
        cur_size = len(self._pending_writes)
        if cur_size > 0:
            last_write = self._pending_writes[cur_size - 1]
            if (
                last_write.collection_id == collection_id
                and last_write.object_id == object_id
            ):
                return
        self._pending_writes.append(PendingWrite(object_id, collection_id))

    def _register_collection(self, collection: "IObjectCollection"):  # noqa: F821
        collection_id = collection.get_id()
        self._collections[collection_id] = collection

    def _send_full_update(self):
        self._pending_outbound_full_update = True

        # sort by timestamp so that we can send the full update in creation order
        entries = []
        for collection in self._collections.values():
            collection.prep_full_update(entries)

        entries.sort(key=lambda x: x.timestamp)
        for entry in entries:
            self._pending_writes.append(
                PendingWrite(entry.object_id, entry.collection_id)
            )

    def _reconcile_inbound_changes(self, accessor: TransportStreamAccessor):
        # process inbound changes
        if self._inbound_transport_iter.has_missed_entries(accessor):
            # More changes came in between tick() calls than the changelog can hold.
            # Send message to outbound dataset to reconcile the entire dataset, then make sure to
            # wait for the FullUpdate message.
            self._request_inbound_full_update = True
            self._waiting_for_inbound_full_update = True
            return

        oldest_message_timestamp = (
            TimeUtils.get_current_clock_time_microseconds() - self._message_lifetime_us
        )
        base_timestamp = accessor.get_base_timestamp()
        in_full_update = False
        reconciled_ids = set()

        while True:
            entry_mem = self._inbound_transport_iter.get_next_entry(accessor)
            if entry_mem.is_null():
                break

            change_type = CollectionChangeType(
                ChangeEventAccessor(entry_mem).get_change_type()
            )

            if change_type == CollectionChangeType.RequestFullUpdate:
                self._send_full_update()
                continue

            if (
                self._waiting_for_inbound_full_update
                and change_type != CollectionChangeType.FullUpdate
            ):
                # skip all changes until we see the FullUpdate marker
                continue

            if change_type == CollectionChangeType.FullUpdate:
                self._request_inbound_full_update = False
                self._waiting_for_inbound_full_update = False
                in_full_update = True

            elif change_type == CollectionChangeType.Shutdown:
                for collection in self._collections.values():
                    collection.process_shutdown()

            elif change_type == CollectionChangeType.CreateObject:
                entry = CollectionChangeEventAccessor(entry_mem)
                collection = self._collections.get(entry.get_collection_id(), None)
                if collection is None:
                    continue
                id = entry.get_object_id()
                if in_full_update:
                    collection.process_upsert(id, entry.access_change_data())
                    reconciled_ids.add(id)
                else:
                    collection.process_create(id, entry.access_change_data())

            elif change_type == CollectionChangeType.UpdateObject:
                entry = CollectionUpdateChangeEventAccessor(entry_mem)
                collection = self._collections.get(entry.get_collection_id(), None)
                if collection is None:
                    continue
                collection.process_update(
                    entry.get_object_id(),
                    entry.access_change_data(),
                    entry.get_fields_changed(),
                )

            elif change_type == CollectionChangeType.DeleteObject:
                entry = CollectionChangeEventAccessor(entry_mem)
                collection = self._collections.get(entry.get_collection_id(), None)
                if collection is None:
                    continue
                collection.process_delete(entry.get_object_id())

            elif change_type == CollectionChangeType.Message:
                entry = CollectionMessageChangeEventAccessor(entry_mem)
                timestamp = entry.get_timestamp(base_timestamp)
                if timestamp < oldest_message_timestamp:
                    continue
                collection = self._collections.get(entry.get_collection_id(), None)
                if collection is None:
                    continue
                collection.process_message(
                    entry.get_object_id(),
                    entry.get_field_id(),
                    timestamp,
                    entry.access_change_data(),
                )

        if in_full_update:
            for collection in self._collections.values():
                collection.process_full_reconcile(reconciled_ids)

    def _reconcile_outbound_changes(self, accessor: TransportStreamAccessor):
        # process outbound changes
        if self._request_inbound_full_update:
            accessor.write_change_event(
                ChangeEventAccessor, CollectionChangeType.RequestFullUpdate.value
            )
            self._request_inbound_full_update = False

        if self._pending_outbound_full_update:
            accessor.write_change_event(
                ChangeEventAccessor, CollectionChangeType.FullUpdate.value
            )
            self._pending_outbound_full_update = False

        # write changes
        for pending_write in self._pending_writes:
            collection = self._collections.get(pending_write.collection_id, None)
            if collection is None:
                continue
            collection.write_changes(accessor, pending_write.object_id)
        self._pending_writes.clear()

        # write messages
        if self._outbound_messages is not None:
            while self._outbound_messages_iterator.has_next(self._outbound_messages):
                message = self._outbound_messages_iterator.next(self._outbound_messages)
                accessor.write_prefilled_change_event(message)
