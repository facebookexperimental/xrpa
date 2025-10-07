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
using UnityEngine;

[AddComponentMenu("")]
public class StimulusComponent : MonoBehaviour {
  private SensoryStimulusDataStore.Pose _Pose = new SensoryStimulusDataStore.Pose{position = new UnityEngine.Vector3{x = 0f, y = 0f, z = 0f}, orientation = new UnityEngine.Quaternion{x = 0f, y = 0f, z = 0f, w = 1f}};

  public SensoryStimulusDataStore.Pose Pose {
    get => _Pose;
  }

  private float _VisualDelay = 1f;

  public float VisualDelay {
    get => _VisualDelay;
  }

  private float _AudioDelay = 1f;

  public float AudioDelay {
    get => _AudioDelay;
  }

  private SensoryStimulusDataStore.ReconciledStimulus _xrpaObject;
  protected bool _dsIsInitialized = false;

  void Start() {
    InitializeDS();
  }

  void OnDestroy() {
    DeinitializeDS();
  }

  public void HandleXrpaFieldsChanged(ulong fieldsChanged) {
    if (_xrpaObject.CheckPoseChanged(fieldsChanged)) {
      _Pose = _xrpaObject.GetPose();
      transform.localPosition = Pose.position;
      transform.localRotation = Pose.orientation;
    }
    if (_xrpaObject.CheckVisualDelayChanged(fieldsChanged)) {
      _VisualDelay = _xrpaObject.GetVisualDelay();
    }
    if (_xrpaObject.CheckAudioDelayChanged(fieldsChanged)) {
      _AudioDelay = _xrpaObject.GetAudioDelay();
    }
  }

  public void SendUserResponse() {
    _xrpaObject?.SendUserResponse();
  }

  public void SetXrpaObject(SensoryStimulusDataStore.ReconciledStimulus obj) {
    _xrpaObject = obj;
    _xrpaObject.SetXrpaOwner(this);
    _xrpaObject.OnXrpaFieldsChanged(HandleXrpaFieldsChanged);
    HandleXrpaFieldsChanged(7);
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

    _VisualDelay = 1f;
    _AudioDelay = 1f;
  }

  void DeinitializeDS() {
    if (!_dsIsInitialized) {
      return;
    }
    _dsIsInitialized = false;
  }
}
