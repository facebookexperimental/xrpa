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

from typing import Generic, TypeVar

from xrpa_runtime.reconciler.data_store_interfaces import IDataStoreObjectAccessor
from xrpa_runtime.reconciler.object_collection_index import ObjectCollectionIndex
from xrpa_runtime.utils.xrpa_types import ObjectAccessorInterface

ObjectAccessorType = TypeVar("ObjectAccessorType", bound=ObjectAccessorInterface)
ReconciledType = TypeVar(
    "ReconciledType", bound=IDataStoreObjectAccessor[ObjectAccessorType]
)
IndexFieldType = TypeVar("IndexFieldType")
LocalType = TypeVar("LocalType")


class ObjectCollectionIndexedBinding(
    ObjectCollectionIndex[ObjectAccessorType, ReconciledType, IndexFieldType],
    Generic[ObjectAccessorType, ReconciledType, IndexFieldType, LocalType],
):
    def __init__(self):
        ObjectCollectionIndex.__init__(self)
        self._local_objects = {}
        self._bound_local_objects = {}

    def add_local_object(self, index_value: IndexFieldType, local_obj: LocalType):
        # add local object to lookup
        local_objects = self._local_objects.get(index_value, None)
        if local_objects is None:
            local_objects = []
            self._local_objects[index_value] = local_objects
        local_objects.append(local_obj)

        # check if there is already a reconciled object for this index value and bind to it if it exists
        reconciled_objects = self.get_indexed_objects(index_value)
        for reconciled_obj in reconciled_objects:
            if local_obj.add_xrpa_binding(reconciled_obj):
                id = reconciled_obj.get_xrpa_id()
                local_bound_objects = self._bound_local_objects.get(id, None)
                if local_bound_objects is None:
                    local_bound_objects = []
                    self._bound_local_objects[id] = local_bound_objects
                local_bound_objects.append(local_obj)

    def remove_local_object(self, index_value: IndexFieldType, local_obj: LocalType):
        # remove local object from lookup
        local_objects = self._local_objects.get(index_value, None)
        if local_objects is not None:
            local_objects.remove(local_obj)
            if len(local_objects) == 0:
                del self._local_objects[index_value]

        # unbind local object from reconciled object
        reconciled_objects = self.get_indexed_objects(index_value)
        for reconciled_obj in reconciled_objects:
            local_obj.remove_xrpa_binding(reconciled_obj)

            id = reconciled_obj.get_xrpa_id()
            local_bound_objects = self._bound_local_objects.get(id, None)
            if local_bound_objects is not None:
                local_bound_objects.remove(local_obj)
                if len(local_bound_objects) == 0:
                    del self._bound_local_objects[id]

    def on_create(self, reconciled_obj: ReconciledType, index_value: IndexFieldType):
        ObjectCollectionIndex.on_create(self, reconciled_obj, index_value)

        # bind local objects to reconciled object
        id = reconciled_obj.get_xrpa_id()
        local_objects = self._local_objects.get(index_value, None)
        if local_objects is None:
            return

        for local_obj in local_objects:
            if local_obj.add_xrpa_binding(reconciled_obj):
                local_bound_objects = self._bound_local_objects.get(id, None)
                if local_bound_objects is None:
                    local_bound_objects = []
                    self._bound_local_objects[id] = local_bound_objects
                local_bound_objects.append(local_obj)

    def on_delete(self, reconciled_obj: ReconciledType, index_value: IndexFieldType):
        id = reconciled_obj.get_xrpa_id()
        ObjectCollectionIndex.on_delete(self, reconciled_obj, index_value)

        # unbind local objects from reconciled object
        local_bound_objects = self._bound_local_objects.get(id, None)
        if local_bound_objects is not None:
            for local_obj in local_bound_objects:
                local_obj.remove_xrpa_binding(reconciled_obj)
            del self._bound_local_objects[id]
