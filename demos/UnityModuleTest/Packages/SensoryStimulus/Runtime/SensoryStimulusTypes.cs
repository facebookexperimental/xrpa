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

using System.Runtime.InteropServices;
using UnityEngine;
using Xrpa;

namespace SensoryStimulusDataStore {

public class SensoryStimulusDataStoreConfig {
  public static Xrpa.TransportConfig GenTransportConfig() {
    Xrpa.TransportConfig config = new();
    config.SchemaHash = new Xrpa.HashValue(0x748cf01432af8f7c, 0x2feb41b1214accbe, 0xca40b1cae9317d9e, 0x8729a24008450788);
    config.ChangelogByteCount = 11092756;
    return config;
  }
}

public class Pose {
  public UnityEngine.Vector3 position;
  public UnityEngine.Quaternion orientation;
}

public class DSVector3 {
  public static UnityEngine.Vector3 ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    float x = memAccessor.ReadFloat(offset);
    float y = memAccessor.ReadFloat(offset);
    float z = memAccessor.ReadFloat(offset);
    return new UnityEngine.Vector3{x = x, y = y, z = z};
  }

  public static void WriteValue(UnityEngine.Vector3 val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    memAccessor.WriteFloat(val.x, offset);
    memAccessor.WriteFloat(val.y, offset);
    memAccessor.WriteFloat(val.z, offset);
  }
}

public class DSQuaternion {
  public static UnityEngine.Quaternion ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    float x = memAccessor.ReadFloat(offset);
    float y = memAccessor.ReadFloat(offset);
    float z = memAccessor.ReadFloat(offset);
    float w = memAccessor.ReadFloat(offset);
    return new UnityEngine.Quaternion{x = x, y = y, z = z, w = w};
  }

  public static void WriteValue(UnityEngine.Quaternion val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    memAccessor.WriteFloat(val.x, offset);
    memAccessor.WriteFloat(val.y, offset);
    memAccessor.WriteFloat(val.z, offset);
    memAccessor.WriteFloat(val.w, offset);
  }
}

public class DSPose {
  public static Pose ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    UnityEngine.Vector3 position = DSVector3.ReadValue(memAccessor, offset);
    UnityEngine.Quaternion orientation = DSQuaternion.ReadValue(memAccessor, offset);
    return new Pose{position = position, orientation = orientation};
  }

  public static void WriteValue(Pose val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    DSVector3.WriteValue(val.position, memAccessor, offset);
    DSQuaternion.WriteValue(val.orientation, memAccessor, offset);
  }
}

public class DSScalar {
  public static float ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    float value = memAccessor.ReadFloat(offset);
    return value;
  }

  public static void WriteValue(float val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    memAccessor.WriteFloat(val, offset);
  }
}

public class DSImage {
  public static Xrpa.Image ReadValue(Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    int width = memAccessor.ReadInt(offset);
    int height = memAccessor.ReadInt(offset);
    uint format = memAccessor.ReadUint(offset);
    uint encoding = memAccessor.ReadUint(offset);
    uint orientation = memAccessor.ReadUint(offset);
    float gain = DSScalar.ReadValue(memAccessor, offset);
    ulong exposureDuration = memAccessor.ReadUlong(offset);
    ulong timestamp = memAccessor.ReadUlong(offset);
    float captureFrameRate = DSScalar.ReadValue(memAccessor, offset);
    byte[] data = memAccessor.ReadBytes(offset);
    return new Xrpa.Image{width = width, height = height, format = (Xrpa.ImageFormat)(uint)(format), encoding = (Xrpa.ImageEncoding)(uint)(encoding), orientation = (Xrpa.ImageOrientation)(uint)(orientation), gain = gain, exposureDuration = exposureDuration, timestamp = timestamp, captureFrameRate = captureFrameRate, data = data};
  }

  public static void WriteValue(Xrpa.Image val, Xrpa.MemoryAccessor memAccessor, Xrpa.MemoryOffset offset) {
    memAccessor.WriteInt(val.width, offset);
    memAccessor.WriteInt(val.height, offset);
    memAccessor.WriteUint((uint)(val.format), offset);
    memAccessor.WriteUint((uint)(val.encoding), offset);
    memAccessor.WriteUint((uint)(val.orientation), offset);
    DSScalar.WriteValue(val.gain, memAccessor, offset);
    memAccessor.WriteUlong(val.exposureDuration, offset);
    memAccessor.WriteUlong(val.timestamp, offset);
    DSScalar.WriteValue(val.captureFrameRate, memAccessor, offset);
    memAccessor.WriteBytes(val.data, offset);
  }

  public static int DynSizeOfValue(Xrpa.Image val) {
    return Xrpa.MemoryAccessor.DynSizeOfBytes(val.data);
  }
}

} // namespace SensoryStimulusDataStore
