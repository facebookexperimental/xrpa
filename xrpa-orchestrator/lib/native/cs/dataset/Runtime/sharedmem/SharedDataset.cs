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

  public class SharedDataset : DatasetInterface {
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
      DSHeader header = DatasetAccessor.GenHeader(_datasetConfig);

      bool didCreate = _memoryBlock.OpenMemory(_datasetName, header.TotalBytes);

      if (didCreate) {
        bool didLock = Acquire(5000, accessor => accessor.InitContents(header, _datasetConfig));
        if (!didLock) {
          return false;
        }
      } else {
        // lock-free version check against the dataset's metadata
        var memView = _memoryBlock.UnsafeAccess();
        if (memView == null || !DatasetAccessor.VersionCheck(memView, _datasetConfig)) {
          // TODO log a warning for the version mismatch? it isn't a hard failure but it will be
          // confusing without a log message
          return false;
        }
      }
      return true;
    }

    public override bool CheckSchemaHash(DSHashValue schemaHash) {
      var memView = _memoryBlock?.UnsafeAccess();
      if (memView == null) {
        return false;
      }
      MemoryAccessor memAccessor = new(memView, 0, memView.Capacity);
      DSHashValue headerSchemaHash = DSHashValue.ReadValue(memAccessor, DatasetAccessor.HeaderSchemaHash_Offset);
      return headerSchemaHash == schemaHash;
    }

    public override ulong GetBaseTimestamp() {
      var memView = _memoryBlock?.UnsafeAccess();
      if (memView == null) {
        return 0;
      }
      return memView.ReadUInt64(DatasetAccessor.HeaderBaseTimestamp_Offset);
    }

    public override int GetLastChangelogID() {
      var memView = _memoryBlock?.UnsafeAccess();
      if (memView == null) {
        return 0;
      }
      return memView.ReadInt32(DatasetAccessor.HeaderLastChangelogID_Offset);
    }

    public override int GetLastMessageID() {
      var memView = _memoryBlock?.UnsafeAccess();
      if (memView == null) {
        return 0;
      }
      return memView.ReadInt32(DatasetAccessor.HeaderLastMessageID_Offset);
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
        using (var accessor = new DatasetAccessor(lockedMemView.View)) {
          func(accessor);
        }
        return true;
      }
    }

    private readonly string _datasetName;
    private readonly DatasetConfig _datasetConfig;
    private SharedMemoryBlock _memoryBlock;
  }

}
