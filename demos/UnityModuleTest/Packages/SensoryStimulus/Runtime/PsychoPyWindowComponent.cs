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

#pragma warning disable CS0414

using SensoryStimulusDataStore;
using System;
using UnityEngine;
using Xrpa;

[AddComponentMenu("")]
public class PsychoPyWindowComponent : MonoBehaviour {
  public event System.Action<ulong, Xrpa.Image> OnDisplay;
  private SensoryStimulusDataStore.ReconciledPsychoPyWindow _xrpaObject;
  protected bool _dsIsInitialized = false;

  void Start() {
    InitializeDS();
  }

  void OnDestroy() {
    DeinitializeDS();
  }

  public void HandleXrpaFieldsChanged(ulong fieldsChanged) {
  }

  void DispatchDisplay(ulong msgTimestamp, SensoryStimulusDataStore.DisplayReader message) {
    OnDisplay?.Invoke(msgTimestamp, message.GetImage());
  }

  public void SetXrpaObject(SensoryStimulusDataStore.ReconciledPsychoPyWindow obj) {
    _xrpaObject = obj;
    _xrpaObject.SetXrpaOwner(this);
    _xrpaObject.OnXrpaFieldsChanged(HandleXrpaFieldsChanged);
    HandleXrpaFieldsChanged(0);
    _xrpaObject.OnDisplay(DispatchDisplay);
    _xrpaObject.OnXrpaDelete(HandleXrpaDelete);
  }

  public void HandleXrpaDelete() {
    _xrpaObject.OnXrpaFieldsChanged(null);
    _xrpaObject.OnXrpaDelete(null);
    _xrpaObject = null;
    Destroy(gameObject);
  }

  public void InitializeDS() {
    if (_dsIsInitialized) {
      return;
    }
    _dsIsInitialized = true;
  }

  void DeinitializeDS() {
    if (!_dsIsInitialized) {
      return;
    }
    _dsIsInitialized = false;
  }
}
