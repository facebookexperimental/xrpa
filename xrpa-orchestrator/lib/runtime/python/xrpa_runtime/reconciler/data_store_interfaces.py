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

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generic, TypeVar

from xrpa_runtime.reconciler.data_store_reconciler import DataStoreReconciler
from xrpa_runtime.transport.transport_stream_accessor import TransportStreamAccessor
from xrpa_runtime.utils.memory_accessor import MemoryAccessor
from xrpa_runtime.utils.xrpa_types import ObjectAccessorInterface, ObjectUuid


@dataclass
class FullUpdateEntry:
    object_id: ObjectUuid
    collection_id: int
    timestamp: int


class IObjectCollection(ABC):
    def __init__(self, reconciler: DataStoreReconciler, collection_id: int):
        self._reconciler = reconciler
        self._collection_id = collection_id

    def send_message(
        self, id: str, message_type: int, num_bytes: int
    ) -> MemoryAccessor:
        return self._reconciler.send_message(
            id, self._collection_id, message_type, num_bytes
        )

    def notify_object_needs_write(self, id: ObjectUuid):
        self._reconciler.notify_object_needs_write(id, self._collection_id)

    @abstractmethod
    def set_dirty(self, id: str, fields_changed: int):
        pass

    def get_id(self) -> int:
        return self._collection_id

    @abstractmethod
    def is_local_owned(self) -> bool:
        pass

    @abstractmethod
    def tick(self) -> None:
        pass

    @abstractmethod
    def write_changes(self, accessor: TransportStreamAccessor, id: ObjectUuid) -> None:
        pass

    @abstractmethod
    def prep_full_update(self, entries: list[FullUpdateEntry]) -> None:
        pass

    @abstractmethod
    def process_create(self, id: ObjectUuid, mem_accessor: MemoryAccessor) -> None:
        pass

    @abstractmethod
    def process_update(
        self, id: ObjectUuid, mem_accessor: MemoryAccessor, fields_changed: int
    ) -> bool:
        pass

    @abstractmethod
    def process_delete(self, id: ObjectUuid) -> None:
        pass

    @abstractmethod
    def process_message(
        self,
        id: ObjectUuid,
        message_type: int,
        timestamp: int,
        msg_accessor: MemoryAccessor,
    ) -> None:
        pass

    @abstractmethod
    def process_upsert(self, id: ObjectUuid, mem_accessor: MemoryAccessor) -> None:
        pass

    @abstractmethod
    def process_full_reconcile(self, reconciled_ids: set[ObjectUuid]) -> None:
        pass

    @abstractmethod
    def process_shutdown(self) -> None:
        pass


class IDataStoreObject(ABC):
    @abstractmethod
    def get_xrpa_id(self) -> ObjectUuid:
        pass

    @abstractmethod
    def get_collection_id(self) -> int:
        pass

    @abstractmethod
    def set_xrpa_collection(self, collection: IObjectCollection):
        pass


ObjectAccessorType = TypeVar("ObjectAccessorType", bound=ObjectAccessorInterface)


class IDataStoreObjectAccessor(IDataStoreObject, ABC, Generic[ObjectAccessorType]):
    @abstractmethod
    def write_ds_changes(self, accessor: TransportStreamAccessor) -> None:
        pass

    @abstractmethod
    def process_ds_message(
        self, message_type: int, timestamp: int, msg_accessor: MemoryAccessor
    ) -> None:
        pass

    @abstractmethod
    def process_ds_update(
        self, remote_value: ObjectAccessorType, fields_changed: int
    ) -> None:
        pass

    def process_ds_delete(self) -> None:
        pass

    def prep_ds_full_update(self) -> int:
        return 0

    def tick_xrpa(self) -> None:
        pass


class DataStoreObject(IDataStoreObject):
    def __init__(self, id: ObjectUuid, collection: IObjectCollection):
        self._id = id
        self._collection = collection
        self._has_notified_needs_write = False

    def get_xrpa_id(self) -> str:
        return self._id

    def get_collection_id(self) -> int:
        return self._collection.get_id() if self._collection is not None else -1

    def set_xrpa_collection(self, collection):
        if (
            collection is None
            and self._collection is not None
            and not self._has_notified_needs_write
        ):
            # object removed from collection
            self._collection.notify_object_needs_write(self._id)
            self._has_notified_needs_write = True

        self._collection = collection

        if self._collection is not None and not self._has_notified_needs_write:
            # object added to collection
            self._collection.notify_object_needs_write(self._id)
            self._has_notified_needs_write = True
