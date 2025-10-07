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

using UnityEngine;
using Xrpa;

[AddComponentMenu("")]
public class SensoryStimulusTransportSubsystem : MonoBehaviour {
  private static SensoryStimulusTransportSubsystem _Instance;

  public static SensoryStimulusTransportSubsystem MaybeInstance { get => _Instance; }

  public static SensoryStimulusTransportSubsystem Instance {
    get {
      if (_Instance == null) {
        _Instance = FindAnyObjectByType<SensoryStimulusTransportSubsystem>();
      }
      if (_Instance == null) {
        GameObject obj = new() { name = typeof(SensoryStimulusTransportSubsystem).Name };
        _Instance = obj.AddComponent<SensoryStimulusTransportSubsystem>();
      }
      return _Instance;
    }
  }

  void Awake() {
    if (_Instance == null) {
      _Instance = this;
      DontDestroyOnLoad(gameObject);
      {
        var localSensoryStimulusInboundTransport = new Xrpa.SharedMemoryTransportStream("SensoryStimulusInput", SensoryStimulusDataStore.SensoryStimulusDataStoreConfig.GenTransportConfig());
        SensoryStimulusInboundTransport = localSensoryStimulusInboundTransport;

        var localSensoryStimulusOutboundTransport = new Xrpa.SharedMemoryTransportStream("SensoryStimulusOutput", SensoryStimulusDataStore.SensoryStimulusDataStoreConfig.GenTransportConfig());
        SensoryStimulusOutboundTransport = localSensoryStimulusOutboundTransport;
      }
    } else if (_Instance != this) {
      Destroy(gameObject);
    }
  }

  void OnDestroy() {
    SensoryStimulusDataStoreSubsystem.MaybeInstance?.Shutdown();
    SensoryStimulusOutboundTransport?.Dispose();
    SensoryStimulusOutboundTransport = null;
    SensoryStimulusInboundTransport?.Dispose();
    SensoryStimulusInboundTransport = null;
    if (_Instance == this) {
      _Instance = null;
    }
  }

  public Xrpa.TransportStream SensoryStimulusInboundTransport;
  public Xrpa.TransportStream SensoryStimulusOutboundTransport;
}
