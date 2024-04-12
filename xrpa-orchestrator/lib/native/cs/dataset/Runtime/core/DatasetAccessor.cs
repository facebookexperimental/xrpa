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

using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace Xrpa {

  using DSObjectHeaderArray = PlacedSortedArray<DSObjectHeader>;

  public class DatasetConfig {
    public DSHashValue SchemaHash;
    public int MaxObjectCount;
    public int MemPoolSize;
    public int ChangelogPoolSize;
    public int MessagePoolSize;
  }

  public class DatasetAccessor : System.IDisposable {
    public static readonly int HeaderBaseTimestamp_Offset = (int)Marshal.OffsetOf(typeof(DSHeader), "BaseTimestamp");
    public static readonly int HeaderDatasetVersion_Offset =(int)Marshal.OffsetOf(typeof(DSHeader), "DatasetVersion");
    public static readonly int HeaderSchemaHash_Offset =(int)Marshal.OffsetOf(typeof(DSHeader), "SchemaHash");
    public static readonly int HeaderLastMessageID_Offset = (int)Marshal.OffsetOf(typeof(DSHeader), "LastMessageID");
    public static readonly int HeaderLastChangelogID_Offset = (int)Marshal.OffsetOf(typeof(DSHeader), "LastChangelogID");

    private const int DATASET_VERSION = 6; // conorwdickinson: schema hash as struct

    public DatasetAccessor(System.IO.UnmanagedMemoryAccessor lockedMemView) {
      _dataSource = lockedMemView;

      _dataSource.Read(0, out _header);

      _nullObjectHeader = new DSObjectHeader {
        Type = -1,
        PoolOffset = 0
      };

      InitRegionWrappers();
    }

    public void Dispose() {
    }

    private static long TicksPerMicrosecond = System.TimeSpan.TicksPerMillisecond / 1000;
    private static long UnixEpochStart = (new System.DateTime(1970, 1, 1, 0, 0, 0, System.DateTimeKind.Utc)).Ticks;

    public static ulong GetCurrentClockTimeMicroseconds() {
      return (ulong)((System.DateTime.UtcNow.Ticks - UnixEpochStart) / TicksPerMicrosecond);
    }

    private void InitRegionWrappers() {
      _objectHeaders = new DSObjectHeaderArray(_dataSource, _header.ObjectHeadersRegion, DSObjectHeader.Compare);
      _memoryPool = new PlacedMemoryAllocator(_dataSource, _header.MemoryPoolRegion);
      _changeLog = new PlacedRingBuffer(_dataSource, _header.ChangelogRegion);
      _messageQueue = new PlacedRingBuffer(_dataSource, _header.MessageQueueRegion);
    }

    public void InitContents(DSHeader prefilledHeader, DatasetConfig config) {
      // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
      // (note there is still sort of a race condition there... but a reader always has to acquire
      // the lock before actually doing anything anyway)
      _dataSource.Write(HeaderBaseTimestamp_Offset, 0);

      _header = prefilledHeader;
      _dataSource.Write(0, ref _header);

      InitRegionWrappers();

      _objectHeaders.Init(config.MaxObjectCount);
      _memoryPool.Init(config.MemPoolSize);
      _changeLog.Init(config.ChangelogPoolSize);
      _messageQueue.Init(config.MessagePoolSize);

      // set this last (and not in genHeader()) as it tells anyone accessing the header
      // without a mutex lock that the header is not yet initialized
      _header.BaseTimestamp = GetCurrentClockTimeMicroseconds();
      _dataSource.Write(HeaderBaseTimestamp_Offset, _header.BaseTimestamp);
    }

    public void Clear() {
      // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
      // (note there is still sort of a race condition there... but a reader always has to acquire
      // the lock before actually doing anything anyway)
      _dataSource.Write(HeaderBaseTimestamp_Offset, 0);

      _header.BaseTimestamp = 0;
      _header.LastChangelogID = -1;
      _header.LastMessageID = -1;
      _dataSource.Write(0, ref _header);

      _objectHeaders.Reset();
      _memoryPool.Reset();
      _changeLog.Reset();
      _messageQueue.Reset();

      // set this last (and not in genHeader()) as it tells anyone accessing the header
      // without a mutex lock that the header is not yet initialized
      _header.BaseTimestamp = GetCurrentClockTimeMicroseconds();
      _dataSource.Write(HeaderBaseTimestamp_Offset, _header.BaseTimestamp);
    }

    public int GetCurrentTimestamp() {
      return (int)(GetCurrentClockTimeMicroseconds() - _header.BaseTimestamp);
    }

    public List<DSIdentifier> GetAllObjectIDs() {
      List<DSIdentifier> ret = new();
      int count = _objectHeaders.Count;
      for (int i = 0; i < count; ++i) {
        _objectHeaders.GetAt(i, out DSObjectHeader entry);
        ret.Add(entry.ID);
      }
      return ret;
    }

    public List<DSIdentifier> GetAllObjectIDsByType(int type) {
      List<DSIdentifier> ret = new();
      int count = _objectHeaders.Count;
      for (int i = 0; i < count; ++i) {
        _objectHeaders.GetAt(i, out DSObjectHeader entry);
        if (entry.Type == type) {
          ret.Add(entry.ID);
        }
      }
      return ret;
    }

    public ulong GetBaseTimestamp() {
      return _header.BaseTimestamp;
    }

    public int GetChangelogTotal() {
      return _changeLog.GetMaxID() + 1;
    }

    public int GetLastMessageID() {
      return _header.LastMessageID;
    }

    public int GetObjectCount() {
      return _objectHeaders.Count;
    }

    public DSObjectHeaderArray GetObjectIndex() {
      return _objectHeaders;
    }

    public PlacedRingBuffer GetChangeLog() {
      return _changeLog;
    }

    public PlacedRingBuffer GetMessageQueue() {
      return _messageQueue;
    }

    public MemoryAccessor GetObject(DSIdentifier id, int dsType) {
      return GetObjectFromHeader(GetObjectHeader(id, dsType));
    }

    public ObjectAccessor GetObject<ObjectAccessor>(DSIdentifier id) where ObjectAccessor : ObjectAccessorInterface, new() {
      var objAccessor = new ObjectAccessor();
      var memAccessor = GetObject(id, objAccessor.GetDSType());
      objAccessor.SetAccessor(memAccessor);
      return objAccessor;
    }

    public MemoryAccessor GetObjectFromOffset(int poolOffset) {
      return _memoryPool.Get(poolOffset);
    }

    public MemoryAccessor GetObjectFromHeader(DSObjectHeader objHeader) {
      return GetObjectFromOffset(objHeader.PoolOffset);
    }

    private DSObjectHeader GetObjectHeader(DSIdentifier id) {
      int idx = _objectHeaders.Find(ref id, DSObjectHeader.Compare, out bool isInIndex);
      if (!isInIndex) {
        return _nullObjectHeader;
      }

      _objectHeaders.GetAt(idx, out DSObjectHeader objHeader);
      return objHeader;
    }

    private DSObjectHeader GetObjectHeader(DSIdentifier id, int type) {
      int idx = _objectHeaders.Find(ref id, DSObjectHeader.Compare, out bool isInIndex);
      if (!isInIndex) {
        return _nullObjectHeader;
      }

      _objectHeaders.GetAt(idx, out DSObjectHeader objHeader);
      if (objHeader.Type != type) {
        return _nullObjectHeader;
      }

      return objHeader;
    }

    public MemoryAccessor SendMessage(
        DSIdentifier targetID,
        int messageType,
        int numBytes,
        ulong timestamp = 0) {
      DSObjectHeader target = GetObjectHeader(targetID);
      if (target.PoolOffset == 0) {
        return new MemoryAccessor();
      }

      DSMessageAccessor message = new(_messageQueue.Push(
        DSMessageAccessor.DS_SIZE + numBytes, ref _header.LastMessageID));
      message.SetTarget(ref target);
      message.SetMessageType(messageType);
      message.SetTimestamp(
        timestamp != 0 ? (int)(timestamp - _header.BaseTimestamp) : GetCurrentTimestamp());

      _dataSource.Write(HeaderLastMessageID_Offset, _header.LastMessageID);

      return message.AccessMessageData();
    }

    public MessageAccessor SendMessage<MessageAccessor>(DSIdentifier targetID, int messageType, ulong createTimestamp = 0) where MessageAccessor : ObjectAccessorInterface, new() {
      var msgAccessor = new MessageAccessor();
      var memAccessor = SendMessage(targetID, messageType, msgAccessor.GetByteCount(), createTimestamp);
      msgAccessor.SetAccessor(memAccessor);
      return msgAccessor;
    }

    public ObjectAccessor CreateObject<ObjectAccessor>(DSIdentifier id, ulong createTimestamp = 0) where ObjectAccessor : ObjectAccessorInterface, new() {
      var objAccessor = new ObjectAccessor();
      var memAccessor = CreateObject(id, objAccessor.GetDSType(), objAccessor.GetByteCount(), createTimestamp);
      objAccessor.SetAccessor(memAccessor);
      return objAccessor;
    }

    public MemoryAccessor CreateObject(DSIdentifier id, int dsType, int numBytes, ulong createTimestamp = 0) {
      if (_objectHeaders.IsFull()) {
        return new MemoryAccessor();
      }

      int idx = _objectHeaders.Find(ref id, DSObjectHeader.Compare, out bool isInIndex);
      if (isInIndex) {
        // already exists
        return new MemoryAccessor();
      }

      // allocate memory from the memoryPool
      MemoryAccessor mem = _memoryPool.Alloc(numBytes);
      if (mem == null) {
        return new MemoryAccessor();
      }

      // add entry to objectHeaders
      DSObjectHeader objHeader = new();
      objHeader.ID = id;
      objHeader.Type = dsType;
      objHeader.CreateTimestamp = createTimestamp != 0 ? (int)(createTimestamp - _header.BaseTimestamp)
                                                       : GetCurrentTimestamp();
      objHeader.PoolOffset = _memoryPool.GetAllocOffset(mem);
      _objectHeaders.InsertPresorted(ref objHeader, idx);

      // add entry to log
      DSChangeEventAccessor changeEvent = new(_changeLog.Push(DSChangeEventAccessor.DS_SIZE, ref _header.LastChangelogID));
      changeEvent.SetChangeType(DSChangeType.CreateObject);
      changeEvent.SetTarget(ref objHeader);
      changeEvent.SetTimestamp(GetCurrentTimestamp());

      _dataSource.Write(HeaderLastChangelogID_Offset, _header.LastChangelogID);

      mem.WriteToZeros();

      return mem;
    }

    public ObjectAccessor UpdateObject<ObjectAccessor>(DSIdentifier id, ulong fieldMask) where ObjectAccessor : ObjectAccessorInterface, new() {
      var objAccessor = new ObjectAccessor();
      var memAccessor = UpdateObject(id, objAccessor.GetDSType(), fieldMask);
      objAccessor.SetAccessor(memAccessor);
      return objAccessor;
    }

    public MemoryAccessor UpdateObject(DSIdentifier id, int dsType, ulong fieldMask) {
      DSObjectHeader objHeader = GetObjectHeader(id, dsType);
      if (objHeader.PoolOffset == 0) {
        return new MemoryAccessor();
      }

      // add entry to log
      DSChangeEventAccessor changeEvent = new(_changeLog.Push(DSChangeEventAccessor.DS_SIZE + 8, ref _header.LastChangelogID));
      changeEvent.SetChangeType(DSChangeType.UpdateObject);
      changeEvent.SetTarget(ref objHeader);
      changeEvent.SetTimestamp(GetCurrentTimestamp());
      changeEvent.SetChangedFields(fieldMask);

      _dataSource.Write(HeaderLastChangelogID_Offset, _header.LastChangelogID);

      return GetObjectFromHeader(objHeader);
    }

    // caller is responsible for freeing any subobject allocations referenced in object fields
    public void DeleteObject(DSIdentifier id) {
      int idx = _objectHeaders.Find(ref id, DSObjectHeader.Compare, out bool isInIndex);
      if (!isInIndex) {
        return;
      }

      // free memoryPool memory
      _objectHeaders.GetAt(idx, out DSObjectHeader objHeader);
      _memoryPool.Free(objHeader.PoolOffset);

      // remove from objectHeaders
      _objectHeaders.RemoveIndex(idx);

      // add entry to log
      DSChangeEventAccessor changeEvent = new(_changeLog.Push(DSChangeEventAccessor.DS_SIZE, ref _header.LastChangelogID));
      changeEvent.SetChangeType(DSChangeType.DeleteObject);
      changeEvent.SetTarget(ref objHeader);
      changeEvent.SetTimestamp(GetCurrentTimestamp());

      _dataSource.Write(HeaderLastChangelogID_Offset, _header.LastChangelogID);

      // clear out all changelog pointers to the target memory location since they are now invalid
      int changeCount = _changeLog.Count;
      for (int i = 0; i < changeCount; ++i) {
        DSChangeEventAccessor entry = new(_changeLog.GetAt(i));
        entry.ClearPoolOffsetIfMatch(objHeader.PoolOffset);
      }
    }

    public static DSHeader GenHeader(DatasetConfig config) {
      DSHeader header = new();
      header.DatasetVersion = DATASET_VERSION;
      header.SchemaHash = config.SchemaHash;
      header.TotalBytes = Marshal.SizeOf(typeof(DSHeader));
      header.BaseTimestamp = 0; // set for real in InitContents()
      header.LastChangelogID = -1;
      header.LastMessageID = -1;

      header.ObjectHeadersRegion = header.TotalBytes;
      header.TotalBytes += DSObjectHeaderArray.GetMemSize(config.MaxObjectCount);

      header.MemoryPoolRegion = header.TotalBytes;
      header.TotalBytes += PlacedMemoryAllocator.GetMemSize(config.MemPoolSize);

      header.ChangelogRegion = header.TotalBytes;
      header.TotalBytes += PlacedRingBuffer.GetMemSize(config.ChangelogPoolSize);

      header.MessageQueueRegion = header.TotalBytes;
      header.TotalBytes += PlacedRingBuffer.GetMemSize(config.MessagePoolSize);

      return header;
    }

    public static bool VersionCheck(System.IO.UnmanagedMemoryAccessor memView, DatasetConfig config) {
      MemoryAccessor memAccessor = new(memView, 0, memView.Capacity);
      memView.Read(HeaderDatasetVersion_Offset, out int datasetVersion);
      memView.Read(HeaderBaseTimestamp_Offset, out ulong baseTimestamp);
      DSHashValue schemaHash = DSHashValue.ReadValue(memAccessor, HeaderSchemaHash_Offset);
      return baseTimestamp != 0 && datasetVersion == DATASET_VERSION && schemaHash == config.SchemaHash;
    }

    private readonly System.IO.UnmanagedMemoryAccessor _dataSource;

    private DSHeader _header;
    private DSObjectHeaderArray _objectHeaders;
    private PlacedMemoryAllocator _memoryPool;
    private PlacedRingBuffer _changeLog;
    private PlacedRingBuffer _messageQueue;

    private DSObjectHeader _nullObjectHeader;
  }

}
