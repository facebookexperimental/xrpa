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

from enum import Enum

from xrpa_runtime.transport.transport_stream_accessor import ChangeEventAccessor

from xrpa_runtime.utils.memory_accessor import MemoryAccessor, MemoryOffset
from xrpa_runtime.utils.xrpa_types import ObjectUuid


class CollectionChangeType(Enum):
    RequestFullUpdate = 0
    FullUpdate = 1
    Shutdown = 2
    CreateObject = 3
    DeleteObject = 4
    UpdateObject = 5
    Message = 6


class CollectionChangeEventAccessor(ChangeEventAccessor):
    DS_SIZE = ChangeEventAccessor.DS_SIZE + 20

    def __init__(self, mem_accessor: MemoryAccessor):
        ChangeEventAccessor.__init__(self, mem_accessor)

    def get_object_id(self) -> ObjectUuid:
        return ObjectUuid.read_value(
            self._mem_accessor, MemoryOffset(ChangeEventAccessor.DS_SIZE)
        )

    def set_object_id(self, id: ObjectUuid):
        ObjectUuid.write_value(
            id, self._mem_accessor, MemoryOffset(ChangeEventAccessor.DS_SIZE)
        )

    def get_collection_id(self) -> int:
        return self._mem_accessor.read_int(
            MemoryOffset(ChangeEventAccessor.DS_SIZE + 16)
        )

    def set_collection_id(self, id: int):
        self._mem_accessor.write_int(id, MemoryOffset(ChangeEventAccessor.DS_SIZE + 16))

    def access_change_data(self) -> MemoryAccessor:
        return self._mem_accessor.slice(self.DS_SIZE)


class CollectionUpdateChangeEventAccessor(CollectionChangeEventAccessor):
    DS_SIZE = CollectionChangeEventAccessor.DS_SIZE + 8

    def __init__(self, mem_accessor: MemoryAccessor):
        CollectionChangeEventAccessor.__init__(self, mem_accessor)

    def get_fields_changed(self) -> int:
        return self._mem_accessor.read_ulong(
            MemoryOffset(CollectionChangeEventAccessor.DS_SIZE)
        )

    def set_fields_changed(self, fields_changed: int):
        self._mem_accessor.write_ulong(
            fields_changed, MemoryOffset(CollectionChangeEventAccessor.DS_SIZE)
        )

    def access_change_data(self) -> MemoryAccessor:
        return self._mem_accessor.slice(self.DS_SIZE)


class CollectionMessageChangeEventAccessor(CollectionChangeEventAccessor):
    # TODO this should be 4 bytes, not 8
    DS_SIZE = CollectionChangeEventAccessor.DS_SIZE + 8

    def __init__(self, mem_accessor: MemoryAccessor):
        CollectionChangeEventAccessor.__init__(self, mem_accessor)

    def get_field_id(self) -> int:
        return self._mem_accessor.read_int(
            MemoryOffset(CollectionChangeEventAccessor.DS_SIZE)
        )

    def set_field_id(self, field_id: int):
        self._mem_accessor.write_int(
            field_id, MemoryOffset(CollectionChangeEventAccessor.DS_SIZE)
        )

    def access_change_data(self) -> MemoryAccessor:
        return self._mem_accessor.slice(self.DS_SIZE)
