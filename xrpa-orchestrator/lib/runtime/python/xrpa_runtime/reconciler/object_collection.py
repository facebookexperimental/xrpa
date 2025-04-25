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

from typing import Callable, Generic, Type, TypeVar

from xrpa_runtime.reconciler.collection_change_types import (
    CollectionChangeEventAccessor,
    CollectionChangeType,
)
from xrpa_runtime.reconciler.data_store_interfaces import (
    FullUpdateEntry,
    IDataStoreObjectAccessor,
    IObjectCollection,
)
from xrpa_runtime.reconciler.data_store_reconciler import DataStoreReconciler
from xrpa_runtime.transport.transport_stream_accessor import TransportStreamAccessor
from xrpa_runtime.utils.memory_accessor import MemoryAccessor
from xrpa_runtime.utils.xrpa_types import ObjectAccessorInterface, ObjectUuid

ObjectAccessorType = TypeVar("ObjectAccessorType", bound=ObjectAccessorInterface)
ReconciledType = TypeVar(
    "ReconciledType", bound=IDataStoreObjectAccessor[ObjectAccessorType]
)


class ObjectCollection(IObjectCollection, Generic[ObjectAccessorType, ReconciledType]):
    def __init__(
        self,
        object_accessor_type: Type[ObjectAccessorType],
        reconciler: DataStoreReconciler,
        collection_id: int,
        inbound_field_mask: int,
        indexed_field_mask: int,
        is_local_owned: bool,
    ):
        IObjectCollection.__init__(self, reconciler, collection_id)
        self._object_accessor_type = object_accessor_type
        self._inbound_field_mask = inbound_field_mask
        self._indexed_field_mask = indexed_field_mask
        self._is_local_owned = is_local_owned
        self._objects = {}
        self._create_delegate = None

    def is_local_owned(self) -> bool:
        return self._is_local_owned

    def get_object(self, id: ObjectUuid) -> ReconciledType:
        return self._objects.get(id, None)

    def get_enumerator(self) -> list[ReconciledType]:
        return list(self._objects.values())

    def __len__(self) -> int:
        return len(self._objects)

    # these functions are for updating indexes in derived classes
    def _index_notify_create(self, obj: ReconciledType) -> None:
        pass

    def _index_notify_update(self, obj: ReconciledType, fields_changed: int) -> None:
        pass

    def _index_notify_delete(self, obj: ReconciledType) -> None:
        pass

    # these functions are for isLocalOwned=true derived classes; they typically will be exposed with public wrapper functions
    def _add_object_internal(self, obj: ReconciledType):
        if not self._is_local_owned:
            return

        id = obj.get_xrpa_id()
        self._objects[id] = obj
        obj.set_xrpa_collection(self)

        if self._indexed_field_mask != 0:
            self._index_notify_create(obj)

    def _remove_object_internal(self, id: ObjectUuid):
        if not self._is_local_owned:
            return

        obj = self._objects.get(id, None)
        if obj is None:
            return

        if self._indexed_field_mask != 0:
            self._index_notify_delete(obj)

        obj.set_xrpa_collection(None)
        del self._objects[id]

    # this function is for isLocalOwned=false derived classes; it will either be called in the constructor or exposed with a public wrapper function
    def _set_create_delegate_internal(
        self,
        delegate: Callable[
            [ObjectUuid, ObjectAccessorType, IObjectCollection], ReconciledType
        ],
    ):
        self._create_delegate = delegate

    def set_dirty(self, id: ObjectUuid, fields_changed: int):
        if (self._indexed_field_mask & fields_changed) != 0:
            obj = self._objects.get(id, None)
            if obj is not None:
                self._index_notify_update(obj, fields_changed)

    def tick(self):
        for obj in self._objects.values():
            obj.tick_xrpa()

    def write_changes(self, accessor: TransportStreamAccessor, id: ObjectUuid):
        obj = self._objects.get(id, None)
        if obj is not None:
            obj.write_ds_changes(accessor)
        elif self._is_local_owned:
            change_event = accessor.write_change_event(
                CollectionChangeEventAccessor, CollectionChangeType.DeleteObject.value
            )
            change_event.set_collection_id(self._collection_id)
            change_event.set_object_id(id)

    def prep_full_update(self, entries: list[FullUpdateEntry]):
        for obj in self._objects.values():
            timestamp = obj.prep_ds_full_update()
            if timestamp > 0:
                entries.append(
                    FullUpdateEntry(
                        obj.get_xrpa_id(),
                        self._collection_id,
                        timestamp,
                    )
                )

    def process_create(self, id: ObjectUuid, mem_accessor: MemoryAccessor):
        if self._is_local_owned:
            return

        obj_accessor = self._object_accessor_type(mem_accessor)
        obj = self._create_delegate(id, obj_accessor, self)
        if obj is None:
            return

        self._objects[id] = obj
        self._process_update_internal(id, mem_accessor, self._inbound_field_mask, False)

        if self._indexed_field_mask != 0:
            self._index_notify_create(obj)

    def process_update(
        self, id: ObjectUuid, mem_accessor: MemoryAccessor, fields_changed: int
    ) -> bool:
        return self._process_update_internal(id, mem_accessor, fields_changed, True)

    def _process_update_internal(
        self,
        id: ObjectUuid,
        mem_accessor: MemoryAccessor,
        fields_changed: int,
        notify: bool,
    ) -> bool:
        fields_changed = fields_changed & self._inbound_field_mask
        if fields_changed == 0:
            # No inbound fields changed, ignore this update
            return False

        obj = self._objects.get(id, None)
        if obj is None:
            return False

        obj_accessor = self._object_accessor_type(mem_accessor)
        obj.process_ds_update(obj_accessor, fields_changed)

        if notify and (self._indexed_field_mask & fields_changed) != 0:
            self._index_notify_update(obj, fields_changed)

        return True

    def process_delete(self, id: ObjectUuid):
        if self._is_local_owned:
            return

        obj = self._objects.get(id, None)
        if obj is not None:
            self._process_delete_internal(id, obj)

    def _process_delete_internal(self, id: ObjectUuid, obj: ReconciledType):
        if self._indexed_field_mask != 0:
            self._index_notify_delete(obj)

        obj.handle_xrpa_delete()
        del self._objects[id]

    def process_message(
        self,
        id: ObjectUuid,
        message_type: int,
        timestamp: int,
        msg_accessor: MemoryAccessor,
    ):
        obj = self._objects.get(id, None)
        if obj is None:
            return

        obj.process_ds_message(message_type, timestamp, msg_accessor)

    def process_upsert(self, id: ObjectUuid, mem_accessor: MemoryAccessor):
        if not self._process_update_internal(
            id, mem_accessor, self._inbound_field_mask, True
        ):
            self.process_create(id, mem_accessor)

    def process_full_reconcile(self, reconciled_ids: set[ObjectUuid]):
        if self._is_local_owned:
            return

        to_delete = set(self._objects.keys()) - reconciled_ids

        for id in to_delete:
            self._process_delete_internal(id, self._objects[id])

    def process_shutdown(self):
        if self._is_local_owned:
            return

        for obj in list(self._objects.values()):
            self._process_delete_internal(obj.get_xrpa_id(), obj)
