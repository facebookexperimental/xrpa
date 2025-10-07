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

using SensoryStimulusDataStore;
using UnityEngine;
using Xrpa;

public class PsychoPyWindowComponentSpawner : MonoBehaviour {
  public GameObject entityPrefab;

  private static PsychoPyWindowComponentSpawner _Instance;

  public static PsychoPyWindowComponentSpawner Instance { get => _Instance; }

  void Awake() {
    if (_Instance == null) {
      _Instance = this;
      SensoryStimulusDataStoreSubsystem.Instance.DataStore.PsychoPyWindow.SetCreateDelegate(PsychoPyWindowComponentSpawner.Spawn);
    } else if (_Instance != this) {
      Destroy(gameObject);
    }
  }

  void OnDestroy() {
    if (_Instance == this) {
      _Instance = null;
    }
  }

  private static SensoryStimulusDataStore.ReconciledPsychoPyWindow Spawn(
      Xrpa.ObjectUuid id,
      SensoryStimulusDataStore.PsychoPyWindowReader remoteValue,
      Xrpa.IObjectCollection collection) {
    GameObject go = null;
    if (_Instance?.entityPrefab) {
      go = Instantiate(_Instance.entityPrefab);
    } else {
      go = new GameObject("SpawnedPsychoPyWindowComponent");
    }
    var comp = go.GetComponent<PsychoPyWindowComponent>();
    if (comp == null) {
      comp = go.AddComponent<PsychoPyWindowComponent>();
    }
    var obj = SensoryStimulusDataStore.ReconciledPsychoPyWindow.Create(id, remoteValue, collection);
    comp.SetXrpaObject(obj);
    return obj;
  }
}
