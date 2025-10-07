/*
// @generated
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


using System.Collections.Generic;

namespace Xrpa
{

    public class ObjectCollectionIndex<ObjectAccessorType, ReconciledType, IndexFieldType>
      where ObjectAccessorType : ObjectAccessorInterface, new()
      where ReconciledType : class, IDataStoreObjectAccessor<ObjectAccessorType>
      where IndexFieldType : System.IEquatable<IndexFieldType>
    {

        public List<ReconciledType> GetIndexedObjects(IndexFieldType indexValue)
        {
            if (_objectIndex.TryGetValue(indexValue, out var objList))
            {
                return objList;
            }
            return _emptyList;
        }

        public virtual void OnCreate(ReconciledType obj, IndexFieldType indexValue)
        {
            _valueMap[obj.GetXrpaId()] = indexValue;
            if (_objectIndex.TryGetValue(indexValue, out var objList))
            {
                objList.Add(obj);
            }
            else
            {
                _objectIndex[indexValue] = new List<ReconciledType>() { obj };
            }
        }

        public virtual void OnDelete(ReconciledType obj, IndexFieldType indexValue)
        {
            _valueMap.Remove(obj.GetXrpaId());
            if (_objectIndex.TryGetValue(indexValue, out var objList))
            {
                objList.Remove(obj);
                if (objList.Count == 0)
                {
                    _objectIndex.Remove(indexValue);
                }
            }
        }

        public virtual void OnUpdate(ReconciledType obj, IndexFieldType newIndexValue)
        {
            var oldIndexValue = _valueMap[obj.GetXrpaId()];
            if (!oldIndexValue.Equals(newIndexValue))
            {
                OnDelete(obj, oldIndexValue);
                OnCreate(obj, newIndexValue);
            }
        }

        protected Dictionary<ObjectUuid, IndexFieldType> _valueMap = new();
        protected Dictionary<IndexFieldType, List<ReconciledType>> _objectIndex = new();
        protected List<ReconciledType> _emptyList = new();
    }

}
