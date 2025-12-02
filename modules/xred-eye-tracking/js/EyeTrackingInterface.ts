/**
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


import {
  Angle,
  bindExternalProgram,
  Boolean,
  BuiltinType,
  Collection,
  Count,
  Distance,
  Enum,
  HiResTimestamp,
  Image,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  Message,
  MessageRate,
  ObjectField,
  Output,
  OvrCoordinateSystem,
  ProgramInput,
  Quaternion,
  Scalar,
  Signal,
  String,
  Timestamp,
  UnitVector3,
  useCoordinateSystem,
  Vector2,
  Vector3,
  XrpaDataType,
  XrpaProgramInterface,
  XrpaProgramParam,
} from "@xrpa/xrpa-orchestrator";

import assert from "assert";
import path from "path";

function createEyeTrackingInterface() {
  return XrpaProgramInterface("Xred.EyeTracking", path.join(__dirname, "../package.json"), () => {
    useCoordinateSystem(OvrCoordinateSystem);

    const sceneImage = Image("SceneImage", {
      expectedWidth: 1600,
      expectedHeight: 1200,
      expectedBytesPerPixel: 1.5, // jpeg compression
    });

    const EyeEventType = Enum("EyeEventType", [
      "Blink",
      "Fixation",
      "Saccade",
      "FixationOnset",
      "SaccadeOnset",
    ]);

    const ImuData = Message("ImuData", {
      timestamp: HiResTimestamp("Timestamp of the IMU sample"),
      gyro: Vector3("Gyroscope data in deg/s (X-right, Y-forward, Z-up)"),
      accel: Vector3("Accelerometer data in m/s² (X-right, Y-forward, Z-up)"),
    });

    const EyeEvent = Message("EyeEvent", {
      eventType: EyeEventType,
      startTime: HiResTimestamp("Event start timestamp"),
      endTime: HiResTimestamp("Event end timestamp"),
      meanGaze: Vector2("Mean gaze position in scene camera pixels"),
      amplitude: Angle(0, "Event amplitude in degrees"),
      maxVelocity: Scalar(0, "Maximum velocity in pixels/degree"),
    });

    const SceneCameraMessage = Message({
      image: sceneImage,
      gazePosition: Vector2("Gaze position in scene camera pixels corresponding to this frame"),
    });

    ProgramInput("EyeTrackingDevice", Collection({
      maxCount: 4,
      fields: {
        deviceAddress: String("", "Network address or device name for discovery"),
        streamGaze: Boolean(false, "Enable gaze data streaming"),
        streamSceneCamera: Boolean(false, "Enable scene camera streaming"),
        streamImu: Boolean(false, "Enable IMU data streaming"),
        streamEyeEvents: Boolean(false, "Enable eye events (blinks, fixations, saccades)"),
        streamAudio: Boolean(false, "Enable audio streaming"),

        deviceName: Output(String("", "Human-readable device name")),
        hardwareVersion: Output(String("", "Hardware version info")),
        serialNumber: Output(String("", "Device serial number")),
        isConnected: Output(Boolean(false, "Connection status")),
        calibrationJson: Output(String("", "Camera calibration data (JSON format)")),
        lastUpdate: Output(Timestamp("Last data update timestamp")),

        headOrientation: Output(Quaternion("Head orientation (always updated)")),
        gazeDirection: Output(UnitVector3("Gaze direction in world space")),
        worn: Output(Boolean(false, "Whether glasses are worn")),
        pupilDiameterLeft: Output(Distance(0, "Left pupil diameter")),
        pupilDiameterRight: Output(Distance(0, "Right pupil diameter")),

        sceneCamera: Output(MessageRate(30, SceneCameraMessage)),
        sceneCameraFrameRate: Output(Count(0, "Current scene camera frame rate")),

        imuData: Output(ImuData),

        eyeEvent: Output(EyeEvent),

        audio: Output(Signal),
      },
    }));
  });
}

export const XredEyeTrackingInterface = createEyeTrackingInterface();

export function EyeTrackingDevice(params: {
  deviceAddress: string | XrpaProgramParam<XrpaDataType<BuiltinType.String>>,
  streamGaze?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  streamSceneCamera?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  streamImu?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  streamEyeEvents?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
  streamAudio?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>,
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredEyeTrackingInterface), "EyeTrackingDevice"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));
  dataflowNode.fieldValues = { ...params };

  return {
    deviceName: ObjectField(dataflowNode, "deviceName"),
    hardwareVersion: ObjectField(dataflowNode, "hardwareVersion"),
    serialNumber: ObjectField(dataflowNode, "serialNumber"),
    isConnected: ObjectField(dataflowNode, "isConnected"),
    calibrationJson: ObjectField(dataflowNode, "calibrationJson"),
    lastUpdate: ObjectField(dataflowNode, "lastUpdate"),

    headOrientation: ObjectField(dataflowNode, "headOrientation"),
    gazeDirection: ObjectField(dataflowNode, "gazeDirection"),
    worn: ObjectField(dataflowNode, "worn"),
    pupilDiameterLeft: ObjectField(dataflowNode, "pupilDiameterLeft"),
    pupilDiameterRight: ObjectField(dataflowNode, "pupilDiameterRight"),

    sceneCamera: ObjectField(dataflowNode, "sceneCamera"),
    sceneCameraFrameRate: ObjectField(dataflowNode, "sceneCameraFrameRate"),

    imuData: ObjectField(dataflowNode, "imuData"),

    eyeEvent: ObjectField(dataflowNode, "eyeEvent"),

    audio: { numChannels: 1, signal: ObjectField(dataflowNode, "audio") },
  };
}
