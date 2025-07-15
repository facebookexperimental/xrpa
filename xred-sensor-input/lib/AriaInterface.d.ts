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


import { BuiltinType, XrpaDataType, XrpaProgramParam } from "@xrpa/xrpa-orchestrator";
export declare const XredAriaInterface: import("@xrpa/xrpa-orchestrator").ProgramInterface;
export declare function AriaGlasses(params: {
    ipAddress: string | XrpaProgramParam<XrpaDataType<BuiltinType.String>>;
    isFlashlight?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>;
    usbStreaming?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>;
    trackPose?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>;
    sendAudioOutput?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>;
    sendRgbOutput?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>;
    sendSlamOutputs?: boolean | XrpaProgramParam<XrpaDataType<BuiltinType.Boolean>>;
}): {
    calibrationJson: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    isStreaming: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    lastUpdate: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    audio: {
        numChannels: number;
        signal: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    };
    rgbCamera: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    slamCamera1: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    slamCamera2: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    poseDynamics: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    pose: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
    coordinateFrameId: import("@xrpa/xrpa-orchestrator").XrpaDataflowConnection;
};

