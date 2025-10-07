# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


from typing import Generic, TypeVar

from xrpa_runtime.reconciler.data_store_interfaces import IDataStoreObjectAccessor
from xrpa_runtime.utils.xrpa_types import ObjectAccessorInterface

ObjectAccessorType = TypeVar("ObjectAccessorType", bound=ObjectAccessorInterface)
ReconciledType = TypeVar(
    "ReconciledType", bound=IDataStoreObjectAccessor[ObjectAccessorType]
)
IndexFieldType = TypeVar("IndexFieldType")


class ObjectCollectionIndex(
    Generic[ObjectAccessorType, ReconciledType, IndexFieldType]
):
    def __init__(self):
        self._value_map = {}
        self._object_index = {}

    def get_indexed_objects(self, index_value: IndexFieldType) -> list[ReconciledType]:
        return self._object_index.get(index_value, [])

    def on_create(self, obj: ReconciledType, index_value: IndexFieldType) -> None:
        self._value_map[obj.get_xrpa_id()] = index_value

        obj_list = self._object_index.get(index_value, None)
        if obj_list is None:
            obj_list = []
            self._object_index[index_value] = obj_list

        obj_list.append(obj)

    def on_delete(self, obj: ReconciledType, index_value: IndexFieldType) -> None:
        self._value_map.pop(obj.get_xrpa_id())

        obj_list = self._object_index.get(index_value, None)
        if obj_list is None:
            return

        obj_list.remove(obj)
        if len(obj_list) == 0:
            self._object_index.pop(index_value)

    def on_update(self, obj: ReconciledType, index_value: IndexFieldType) -> None:
        old_index_value = self._value_map.get(obj.get_xrpa_id(), None)
        if old_index_value == index_value:
            return
        self.on_delete(obj, old_index_value)
        self.on_create(obj, index_value)
