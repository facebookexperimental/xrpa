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

using System.Runtime.InteropServices;

namespace Xrpa {

  unsafe public class SharedDataset : DatasetInterface {
    public SharedDataset(string name, DatasetConfig config) {
      _datasetName = name;
      _datasetConfig = config;
      _memoryBlock = new();
    }

    public override void Dispose() {
      if (_memoryBlock != null) {
        _memoryBlock.Dispose();
        _memoryBlock = null;
      }
    }

    public bool Initialize() {
      int totalBytes = DatasetAccessor.GetTotalBytes(_datasetConfig);

      _isInitialized = false;
      bool didCreate = _memoryBlock.OpenMemory(_datasetName, totalBytes);

      if (didCreate) {
        bool didLock = Acquire(5000, accessor => accessor.InitContents(_datasetConfig));
        if (!didLock) {
          return false;
        }
      } else {
        // lock-free version check against the dataset's metadata
        var memAccessor = _memoryBlock.AcquireUnsafeAccess();
        if (memAccessor == null || !DatasetAccessor.VersionCheck(memAccessor, _datasetConfig)) {
          // TODO log a warning for the version mismatch? it isn't a hard failure but it will be
          // confusing without a log message
          _memoryBlock.ReleaseUnsafeAccess();
          return false;
        }
        _memoryBlock.ReleaseUnsafeAccess();
      }
      _isInitialized = true;
      return true;
    }

    public override bool CheckSchemaHash(DSHashValue schemaHash) {
      var memAccessor = _memoryBlock?.AcquireUnsafeAccess();
      if (memAccessor == null) {
        return false;
      }
      DSHeader header = new(memAccessor);
      bool ret = header.SchemaHash == schemaHash;
      _memoryBlock.ReleaseUnsafeAccess();
      return ret;
    }

    public override ulong GetBaseTimestamp() {
      var memAccessor = _memoryBlock?.AcquireUnsafeAccess();
      if (memAccessor == null) {
        return 0;
      }
      DSHeader header = new(memAccessor);
      ulong ret = header.BaseTimestamp;
      _memoryBlock.ReleaseUnsafeAccess();
      return ret;
    }

    public override int GetLastChangelogID() {
      var memAccessor = _memoryBlock?.AcquireUnsafeAccess();
      if (memAccessor == null) {
        return 0;
      }
      DSHeader header = new(memAccessor);
      int ret = header.LastChangelogID;
      _memoryBlock.ReleaseUnsafeAccess();
      return ret;
    }

    public override int GetLastMessageID() {
      var memAccessor = _memoryBlock?.AcquireUnsafeAccess();
      if (memAccessor == null) {
        return 0;
      }
      DSHeader header = new(memAccessor);
      int ret = header.LastMessageID;
      _memoryBlock.ReleaseUnsafeAccess();
      return ret;
    }

    public override bool Acquire(int timeoutMS, System.Action<DatasetAccessor> func) {
      if (_memoryBlock == null) {
        return false;
      }
      if (!_memoryBlock.IsOpen()) {
        Initialize();
      }
      using (MutexLockedAccessor lockedMemView = _memoryBlock.Acquire(timeoutMS)) {
        if (lockedMemView == null) {
          return false;
        }
        using (var accessor = new DatasetAccessor(lockedMemView.Memory, !_isInitialized)) {
          func(accessor);
        }
        return true;
      }
    }

    private readonly string _datasetName;
    private readonly DatasetConfig _datasetConfig;
    private SharedMemoryBlock _memoryBlock;
    private bool _isInitialized = false;
  }

}
