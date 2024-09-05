/*
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

using System.Threading;

namespace Xrpa
{

    unsafe public class HeapDataset : DatasetInterface
    {
        public HeapDataset(DatasetConfig config)
        {
            _datasetConfig = config;
            _mutex = new();

            var totalBytes = DatasetAccessor.GetTotalBytes(_datasetConfig);
            _memoryBlock = new(totalBytes);
            _isInitialized = false;
            Acquire(1000, accessor => accessor.InitContents(_datasetConfig));
            _isInitialized = true;
        }

        public override void Dispose()
        {
            if (_memoryBlock != null)
            {
                _memoryBlock.Dispose();
                _memoryBlock = null;
            }
        }

        public override bool CheckSchemaHash(DSHashValue schemaHash)
        {
            var memAccessor = _memoryBlock?.Accessor;
            if (memAccessor == null)
            {
                return false;
            }
            DSHeader header = new(memAccessor);
            bool ret = header.SchemaHash == schemaHash;
            return ret;
        }

        public override ulong GetBaseTimestamp()
        {
            var memAccessor = _memoryBlock?.Accessor;
            if (memAccessor == null)
            {
                return 0;
            }
            DSHeader header = new(memAccessor);
            return header.BaseTimestamp;
        }

        public override int GetLastChangelogID()
        {
            var memAccessor = _memoryBlock?.Accessor;
            if (memAccessor == null)
            {
                return 0;
            }
            DSHeader header = new(memAccessor);
            return header.LastChangelogID;
        }

        public override int GetLastMessageID()
        {
            var memAccessor = _memoryBlock?.Accessor;
            if (memAccessor == null)
            {
                return 0;
            }
            DSHeader header = new(memAccessor);
            return header.LastMessageID;
        }

        public override bool Acquire(int timeoutMS, System.Action<DatasetAccessor> func)
        {
            if (_memoryBlock == null)
            {
                return false;
            }
            if (_mutex.WaitOne(timeoutMS))
            {
                try
                {
                    using (var accessor = new DatasetAccessor(_memoryBlock.Accessor, !_isInitialized))
                    {
                        func(accessor);
                    }
                }
                finally
                {
                    _mutex.ReleaseMutex();
                }
                return true;
            }
            return false;
        }

        private readonly DatasetConfig _datasetConfig;
        private AllocatedMemory _memoryBlock;
        private Mutex _mutex;
        private bool _isInitialized = false;
    }

}
