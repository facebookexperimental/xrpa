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

// @generated

using System;
using UnityEngine;
using Xrpa;

namespace SensoryStimulusDataStore {

public class StimulusReader : Xrpa.ObjectAccessorInterface {
  private Xrpa.MemoryOffset _readOffset = new();

  public StimulusReader() {}

  public StimulusReader(Xrpa.MemoryAccessor memAccessor) {
    SetAccessor(memAccessor);
  }

  public Pose GetPose() {
    return DSPose.ReadValue(_memAccessor, _readOffset);
  }

  public float GetVisualDelay() {
    return DSScalar.ReadValue(_memAccessor, _readOffset);
  }

  public float GetAudioDelay() {
    return DSScalar.ReadValue(_memAccessor, _readOffset);
  }

  public bool CheckPoseChanged(ulong fieldsChanged) {
    return (fieldsChanged & 1) != 0;
  }

  public bool CheckVisualDelayChanged(ulong fieldsChanged) {
    return (fieldsChanged & 2) != 0;
  }

  public bool CheckAudioDelayChanged(ulong fieldsChanged) {
    return (fieldsChanged & 4) != 0;
  }
}

public class StimulusWriter : StimulusReader {
  private Xrpa.MemoryOffset _writeOffset = new();

  public StimulusWriter() {}

  public StimulusWriter(Xrpa.MemoryAccessor memAccessor) {
    SetAccessor(memAccessor);
  }

  public static StimulusWriter Create(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, int changeByteCount, ulong timestamp) {
    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionChangeEventAccessor>((int)Xrpa.CollectionChangeType.CreateObject, changeByteCount, timestamp);
    changeEvent.SetCollectionId(collectionId);
    changeEvent.SetObjectId(id);
    return new StimulusWriter(changeEvent.AccessChangeData());
  }

  public static StimulusWriter Update(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, ulong fieldsChanged, int changeByteCount) {
    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionUpdateChangeEventAccessor>((int)Xrpa.CollectionChangeType.UpdateObject, changeByteCount);
    changeEvent.SetCollectionId(collectionId);
    changeEvent.SetObjectId(id);
    changeEvent.SetFieldsChanged(fieldsChanged);
    return new StimulusWriter(changeEvent.AccessChangeData());
  }

  public void SetPose(Pose value) {
    DSPose.WriteValue(value, _memAccessor, _writeOffset);
  }

  public void SetVisualDelay(float value) {
    DSScalar.WriteValue(value, _memAccessor, _writeOffset);
  }

  public void SetAudioDelay(float value) {
    DSScalar.WriteValue(value, _memAccessor, _writeOffset);
  }
}

public class DisplayReader : Xrpa.ObjectAccessorInterface {
  private Xrpa.MemoryOffset _readOffset = new();

  public DisplayReader() {}

  public DisplayReader(Xrpa.MemoryAccessor memAccessor) {
    SetAccessor(memAccessor);
  }

  public Xrpa.Image GetImage() {
    return DSImage.ReadValue(_memAccessor, _readOffset);
  }
}

public class DisplayWriter : DisplayReader {
  private Xrpa.MemoryOffset _writeOffset = new();

  public DisplayWriter() {}

  public DisplayWriter(Xrpa.MemoryAccessor memAccessor) {
    SetAccessor(memAccessor);
  }

  public void SetImage(Xrpa.Image value) {
    DSImage.WriteValue(value, _memAccessor, _writeOffset);
  }
}

public class PsychoPyWindowReader : Xrpa.ObjectAccessorInterface {
  private Xrpa.MemoryOffset _readOffset = new();

  public PsychoPyWindowReader() {}

  public PsychoPyWindowReader(Xrpa.MemoryAccessor memAccessor) {
    SetAccessor(memAccessor);
  }
}

public class PsychoPyWindowWriter : PsychoPyWindowReader {
  private Xrpa.MemoryOffset _writeOffset = new();

  public PsychoPyWindowWriter() {}

  public PsychoPyWindowWriter(Xrpa.MemoryAccessor memAccessor) {
    SetAccessor(memAccessor);
  }

  public static PsychoPyWindowWriter Create(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, int changeByteCount, ulong timestamp) {
    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionChangeEventAccessor>((int)Xrpa.CollectionChangeType.CreateObject, changeByteCount, timestamp);
    changeEvent.SetCollectionId(collectionId);
    changeEvent.SetObjectId(id);
    return new PsychoPyWindowWriter(changeEvent.AccessChangeData());
  }

  public static PsychoPyWindowWriter Update(Xrpa.TransportStreamAccessor accessor, int collectionId, Xrpa.ObjectUuid id, ulong fieldsChanged, int changeByteCount) {
    var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionUpdateChangeEventAccessor>((int)Xrpa.CollectionChangeType.UpdateObject, changeByteCount);
    changeEvent.SetCollectionId(collectionId);
    changeEvent.SetObjectId(id);
    changeEvent.SetFieldsChanged(fieldsChanged);
    return new PsychoPyWindowWriter(changeEvent.AccessChangeData());
  }
}

// Reconciled Types
public class ReconciledStimulus : Xrpa.DataStoreObject, Xrpa.IDataStoreObjectAccessor<StimulusReader> {
  private System.Action<ulong> _xrpaFieldsChangedHandler = null;
  private System.Action _xrpaDeleteHandler = null;
  private Pose _localPose = new Pose{position = new UnityEngine.Vector3{x = 0f, y = 0f, z = 0f}, orientation = new UnityEngine.Quaternion{x = 0f, y = 0f, z = 0f, w = 1f}};
  private float _localVisualDelay = 1f;
  private float _localAudioDelay = 1f;

  public ReconciledStimulus(Xrpa.ObjectUuid id, Xrpa.IObjectCollection collection) : base(id, collection) {}

  protected virtual void HandleXrpaFieldsChanged(ulong fieldsChanged) {
    _xrpaFieldsChangedHandler?.Invoke(fieldsChanged);
  }

  public void OnXrpaFieldsChanged(System.Action<ulong> handler) {
    _xrpaFieldsChangedHandler = handler;
  }

  public virtual void HandleXrpaDelete() {
    _xrpaDeleteHandler?.Invoke();
  }

  public void OnXrpaDelete(System.Action handler) {
    _xrpaDeleteHandler = handler;
  }

  public void ProcessDSUpdate(StimulusReader value, ulong fieldsChanged) {
    if (value.CheckPoseChanged(fieldsChanged)) {
      _localPose = value.GetPose();
    }
    if (value.CheckVisualDelayChanged(fieldsChanged)) {
      _localVisualDelay = value.GetVisualDelay();
    }
    if (value.CheckAudioDelayChanged(fieldsChanged)) {
      _localAudioDelay = value.GetAudioDelay();
    }
    HandleXrpaFieldsChanged(fieldsChanged);
  }

  public static ReconciledStimulus Create(Xrpa.ObjectUuid id, StimulusReader obj, Xrpa.IObjectCollection collection) {
    return new ReconciledStimulus(id, collection);
  }

  public Pose GetPose() {
    return _localPose;
  }

  public float GetVisualDelay() {
    return _localVisualDelay;
  }

  public float GetAudioDelay() {
    return _localAudioDelay;
  }

  public bool CheckPoseChanged(ulong fieldsChanged) {
    return (fieldsChanged & 1) != 0;
  }

  public bool CheckVisualDelayChanged(ulong fieldsChanged) {
    return (fieldsChanged & 2) != 0;
  }

  public bool CheckAudioDelayChanged(ulong fieldsChanged) {
    return (fieldsChanged & 4) != 0;
  }

  public void SendUserResponse() {
    _collection.SendMessage(
        GetXrpaId(),
        3,
        0);
  }

  public void ProcessDSMessage(int messageType, ulong msgTimestamp, Xrpa.MemoryAccessor messageData) {
  }

  public virtual void WriteDSChanges(Xrpa.TransportStreamAccessor accessor) {
  }

  public ulong PrepDSFullUpdate() {
    return 0;
  }
}

public class ReconciledPsychoPyWindow : Xrpa.DataStoreObject, Xrpa.IDataStoreObjectAccessor<PsychoPyWindowReader> {
  private System.Action<ulong> _xrpaFieldsChangedHandler = null;
  private System.Action _xrpaDeleteHandler = null;
  private System.Action<ulong, DisplayReader> _displayMessageHandler = null;

  public ReconciledPsychoPyWindow(Xrpa.ObjectUuid id, Xrpa.IObjectCollection collection) : base(id, collection) {}

  protected virtual void HandleXrpaFieldsChanged(ulong fieldsChanged) {
    _xrpaFieldsChangedHandler?.Invoke(fieldsChanged);
  }

  public void OnXrpaFieldsChanged(System.Action<ulong> handler) {
    _xrpaFieldsChangedHandler = handler;
  }

  public virtual void HandleXrpaDelete() {
    _xrpaDeleteHandler?.Invoke();
  }

  public void OnXrpaDelete(System.Action handler) {
    _xrpaDeleteHandler = handler;
  }

  public void ProcessDSUpdate(PsychoPyWindowReader value, ulong fieldsChanged) {
    HandleXrpaFieldsChanged(fieldsChanged);
  }

  public static ReconciledPsychoPyWindow Create(Xrpa.ObjectUuid id, PsychoPyWindowReader obj, Xrpa.IObjectCollection collection) {
    return new ReconciledPsychoPyWindow(id, collection);
  }

  public void OnDisplay(System.Action<ulong, DisplayReader> handler) {
    _displayMessageHandler = handler;
  }

  public void ProcessDSMessage(int messageType, ulong msgTimestamp, Xrpa.MemoryAccessor messageData) {
    if (messageType == 0) {
      DisplayReader message = new(messageData);
      _displayMessageHandler?.Invoke(msgTimestamp, message);
    }
  }

  public virtual void WriteDSChanges(Xrpa.TransportStreamAccessor accessor) {
  }

  public ulong PrepDSFullUpdate() {
    return 0;
  }
}

// Object Collections
public class InboundStimulusReaderCollection : Xrpa.ObjectCollection<StimulusReader, ReconciledStimulus> {
  public InboundStimulusReaderCollection(Xrpa.DataStoreReconciler reconciler) : base(reconciler, 0, 7, 0, false) {
    SetCreateDelegateInternal(ReconciledStimulus.Create);
  }

  public void SetCreateDelegate(CreateDelegateFunction createDelegate) {
    SetCreateDelegateInternal(createDelegate);
  }
}

public class InboundPsychoPyWindowReaderCollection : Xrpa.ObjectCollection<PsychoPyWindowReader, ReconciledPsychoPyWindow> {
  public InboundPsychoPyWindowReaderCollection(Xrpa.DataStoreReconciler reconciler) : base(reconciler, 1, 0, 0, false) {
    SetCreateDelegateInternal(ReconciledPsychoPyWindow.Create);
  }

  public void SetCreateDelegate(CreateDelegateFunction createDelegate) {
    SetCreateDelegateInternal(createDelegate);
  }
}

// Data Store Implementation
public class SensoryStimulusDataStore : Xrpa.DataStoreReconciler {
  public SensoryStimulusDataStore(Xrpa.TransportStream inboundTransport, Xrpa.TransportStream outboundTransport)
      : base(inboundTransport, outboundTransport, 11074036) {
    Stimulus = new InboundStimulusReaderCollection(this);
    RegisterCollection(Stimulus);
    PsychoPyWindow = new InboundPsychoPyWindowReaderCollection(this);
    RegisterCollection(PsychoPyWindow);
  }

  public InboundStimulusReaderCollection Stimulus;
  public InboundPsychoPyWindowReaderCollection PsychoPyWindow;
}

} // namespace SensoryStimulusDataStore
