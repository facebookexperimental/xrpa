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
    private const int DATASET_VERSION = 7; // conorwdickinson: ring buffer added LastElemOffset

    public DatasetAccessor(MemoryAccessor memAccessor, bool isInitializing) {
      _memAccessor = memAccessor;
      _header = new DSHeader(_memAccessor);

      _nullObjectHeader = new DSObjectHeader {
        Type = -1,
        PoolOffset = 0
      };

      if (!isInitializing) {
        InitRegionWrappers();
      }
    }

    public void Dispose() {
    }

    private static long TicksPerMicrosecond = System.TimeSpan.TicksPerMillisecond / 1000;
    private static long UnixEpochStart = (new System.DateTime(1970, 1, 1, 0, 0, 0, System.DateTimeKind.Utc)).Ticks;

    public static ulong GetCurrentClockTimeMicroseconds() {
      return (ulong)((System.DateTime.UtcNow.Ticks - UnixEpochStart) / TicksPerMicrosecond);
    }

    private void InitRegionWrappers() {
      _objectHeaders = new DSObjectHeaderArray(_memAccessor, _header.ObjectHeadersRegion, DSObjectHeader.DS_SIZE, DSObjectHeader.ReadValue, DSObjectHeader.WriteValue, DSObjectHeader.Compare);
      _memoryPool = new PlacedMemoryAllocator(_memAccessor, _header.MemoryPoolRegion);
      _changeLog = new PlacedRingBuffer(_memAccessor, _header.ChangelogRegion);
      _messageQueue = new PlacedRingBuffer(_memAccessor, _header.MessageQueueRegion);
    }

    public void InitContents(DatasetConfig config) {
      // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
      // (note there is still sort of a race condition there... but a reader always has to acquire
      // the lock before actually doing anything anyway)
      _header.BaseTimestamp = 0;

      _header.DatasetVersion = DATASET_VERSION;
      _header.SchemaHash = config.SchemaHash;
      _header.TotalBytes = DSHeader.DS_SIZE;
      _header.LastChangelogID = -1;
      _header.LastMessageID = -1;

      _header.ObjectHeadersRegion = _header.TotalBytes;
      _header.TotalBytes += DSObjectHeaderArray.GetMemSize(config.MaxObjectCount, DSObjectHeader.DS_SIZE);

      _header.MemoryPoolRegion = _header.TotalBytes;
      _header.TotalBytes += PlacedMemoryAllocator.GetMemSize(config.MemPoolSize);

      _header.ChangelogRegion = _header.TotalBytes;
      _header.TotalBytes += PlacedRingBuffer.GetMemSize(config.ChangelogPoolSize);

      _header.MessageQueueRegion = _header.TotalBytes;
      _header.TotalBytes += PlacedRingBuffer.GetMemSize(config.MessagePoolSize);

      InitRegionWrappers();

      _objectHeaders.Init(config.MaxObjectCount);
      _memoryPool.Init(config.MemPoolSize);
      _changeLog.Init(config.ChangelogPoolSize);
      _messageQueue.Init(config.MessagePoolSize);

      // set this last (and not in genHeader()) as it tells anyone accessing the header
      // without a mutex lock that the header is not yet initialized
      _header.BaseTimestamp = GetCurrentClockTimeMicroseconds();
    }

    public void Clear() {
      // initialize baseTimestamp to 0 first, to let lock-free readers know the data is invalid
      // (note there is still sort of a race condition there... but a reader always has to acquire
      // the lock before actually doing anything anyway)
      _header.BaseTimestamp = 0;

      _header.LastChangelogID = -1;
      _header.LastMessageID = -1;

      _objectHeaders.Reset();
      _memoryPool.Reset();
      _changeLog.Reset();
      _messageQueue.Reset();

      // set this last (and not in genHeader()) as it tells anyone accessing the header
      // without a mutex lock that the header is not yet initialized
      _header.BaseTimestamp = GetCurrentClockTimeMicroseconds();
    }

    public int GetCurrentTimestamp() {
      return (int)(GetCurrentClockTimeMicroseconds() - _header.BaseTimestamp);
    }

    public List<DSIdentifier> GetAllObjectIDs() {
      List<DSIdentifier> ret = new();
      int count = _objectHeaders.Count;
      for (int i = 0; i < count; ++i) {
        DSObjectHeader entry = _objectHeaders.GetAt(i);
        ret.Add(entry.ID);
      }
      return ret;
    }

    public List<DSIdentifier> GetAllObjectIDsByType(int type) {
      List<DSIdentifier> ret = new();
      int count = _objectHeaders.Count;
      for (int i = 0; i < count; ++i) {
        DSObjectHeader entry = _objectHeaders.GetAt(i);
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

      return _objectHeaders.GetAt(idx);
    }

    private DSObjectHeader GetObjectHeader(DSIdentifier id, int type) {
      int idx = _objectHeaders.Find(ref id, DSObjectHeader.Compare, out bool isInIndex);
      if (!isInIndex) {
        return _nullObjectHeader;
      }

      DSObjectHeader objHeader = _objectHeaders.GetAt(idx);
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

      int messageId = 0;
      DSMessageAccessor message = new(_messageQueue.Push(
        DSMessageAccessor.DS_SIZE + numBytes, ref messageId));
      message.SetTarget(ref target);
      message.SetMessageType(messageType);
      message.SetTimestamp(
        timestamp != 0 ? (int)(timestamp - _header.BaseTimestamp) : GetCurrentTimestamp());

      _header.LastMessageID = messageId;

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
      int lastChangelogID = 0;
      DSChangeEventAccessor changeEvent = new(_changeLog.Push(DSChangeEventAccessor.DS_SIZE, ref lastChangelogID));
      changeEvent.SetChangeType(DSChangeType.CreateObject);
      changeEvent.SetTarget(ref objHeader);
      changeEvent.SetTimestamp(GetCurrentTimestamp());

      _header.LastChangelogID = lastChangelogID;

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
      int lastChangelogID = 0;
      DSChangeEventAccessor changeEvent = new(_changeLog.Push(DSChangeEventAccessor.DS_SIZE + 8, ref lastChangelogID));
      changeEvent.SetChangeType(DSChangeType.UpdateObject);
      changeEvent.SetTarget(ref objHeader);
      changeEvent.SetTimestamp(GetCurrentTimestamp());
      changeEvent.SetChangedFields(fieldMask);

      _header.LastChangelogID = lastChangelogID;

      return GetObjectFromHeader(objHeader);
    }

    // caller is responsible for freeing any subobject allocations referenced in object fields
    public void DeleteObject(DSIdentifier id) {
      int idx = _objectHeaders.Find(ref id, DSObjectHeader.Compare, out bool isInIndex);
      if (!isInIndex) {
        return;
      }

      // free memoryPool memory
      DSObjectHeader objHeader = _objectHeaders.GetAt(idx);
      _memoryPool.Free(objHeader.PoolOffset);

      // remove from objectHeaders
      _objectHeaders.RemoveIndex(idx);

      // add entry to log
      int lastChangelogID = 0;
      DSChangeEventAccessor changeEvent = new(_changeLog.Push(DSChangeEventAccessor.DS_SIZE, ref lastChangelogID));
      changeEvent.SetChangeType(DSChangeType.DeleteObject);
      changeEvent.SetTarget(ref objHeader);
      changeEvent.SetTimestamp(GetCurrentTimestamp());

      _header.LastChangelogID = lastChangelogID;

      // clear out all changelog pointers to the target memory location since they are now invalid
      PlacedRingBufferIterator iter = new();
      while (iter.HasNext(_changeLog)) {
        DSChangeEventAccessor entry = new(iter.Next(_changeLog));
        entry.ClearPoolOffsetIfMatch(objHeader.PoolOffset);
      }
    }

    public void DeleteAllByType(int dsType) {
      int lastChangelogID = _header.LastChangelogID;
      int count = _objectHeaders.Count;

      for (int i = 0; i < count; ++i) {
        DSObjectHeader objHeader = _objectHeaders.GetAt(i);
        if (objHeader.Type != dsType) {
          continue;
        }

        // free memoryPool memory
        _memoryPool.Free(objHeader.PoolOffset);

        // remove from objectHeaders
        _objectHeaders.RemoveIndex(i);
        count--;
        i--;

        // add entry to log
        DSChangeEventAccessor changeEvent = new(_changeLog.Push(DSChangeEventAccessor.DS_SIZE, ref lastChangelogID));
        changeEvent.SetChangeType(DSChangeType.DeleteObject);
        changeEvent.SetTarget(ref objHeader);
        changeEvent.SetTimestamp(GetCurrentTimestamp());
      }

      _header.LastChangelogID = lastChangelogID;

      // clear out all changelog pointers to the target entries since they are now invalid
      PlacedRingBufferIterator iter = new();
      while (iter.HasNext(_changeLog)) {
        DSChangeEventAccessor entry = new(iter.Next(_changeLog));
        if (entry.GetTargetType() == dsType) {
          entry.SetTargetPoolOffset(0);
        }
      }
    }

    public static int GetTotalBytes(DatasetConfig config) {
      int totalBytes = DSHeader.DS_SIZE;
      totalBytes += DSObjectHeaderArray.GetMemSize(config.MaxObjectCount, DSObjectHeader.DS_SIZE);
      totalBytes += PlacedMemoryAllocator.GetMemSize(config.MemPoolSize);
      totalBytes += PlacedRingBuffer.GetMemSize(config.ChangelogPoolSize);
      totalBytes += PlacedRingBuffer.GetMemSize(config.MessagePoolSize);
      return totalBytes;
    }

    public static bool VersionCheck(MemoryAccessor memAccessor, DatasetConfig config) {
      DSHeader header = new(memAccessor);
      return header.BaseTimestamp != 0 && header.DatasetVersion == DATASET_VERSION && header.SchemaHash == config.SchemaHash;
    }

    private readonly MemoryAccessor _memAccessor;

    private DSHeader _header;
    private DSObjectHeaderArray _objectHeaders;
    private PlacedMemoryAllocator _memoryPool;
    private PlacedRingBuffer _changeLog;
    private PlacedRingBuffer _messageQueue;

    private DSObjectHeader _nullObjectHeader;
  }

}
