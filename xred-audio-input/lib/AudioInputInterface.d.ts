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


import { XrpaDataflowConnection, XrpaDataType, XrpaProgramParam, XrpaDataflowGraphNode } from "@xrpa/xrpa-orchestrator";
import { StringFilter } from "@xrpa/xrpa-utils";
export declare const DEFAULT_AUDIO_INPUT_MAX_COUNT = 16;
export declare const XredAudioInputInterface: import("@xrpa/xrpa-orchestrator").ProgramInterface;
export declare function InputFromDevice(params: {
    device: XrpaProgramParam | XrpaDataflowGraphNode;
    frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
    numChannels?: number;
}): {
    audioSignal: {
        numChannels: number;
        signal: XrpaDataflowConnection;
    };
    isActive: XrpaDataflowConnection;
    errorMessage: XrpaDataflowConnection;
};
export declare function InputFromMatchingDevice(params: {
    name: StringFilter;
    frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
    numChannels?: number;
}): {
    audioSignal: {
        numChannels: number;
        signal: XrpaDataflowConnection;
    };
    isActive: XrpaDataflowConnection;
    errorMessage: XrpaDataflowConnection;
};
export declare function InputFromSystemAudio(params: {
    frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
    numChannels?: number;
}): {
    audioSignal: {
        numChannels: number;
        signal: XrpaDataflowConnection;
    };
    isActive: XrpaDataflowConnection;
    errorMessage: XrpaDataflowConnection;
};
export declare function InputFromTcpStream(params: {
    hostname: string | XrpaProgramParam | XrpaDataflowConnection;
    port: number | XrpaProgramParam | XrpaDataflowConnection;
    frameRate?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">> | number;
    numChannels?: number;
}): {
    audioSignal: {
        numChannels: number;
        signal: XrpaDataflowConnection;
    };
    isActive: XrpaDataflowConnection;
    errorMessage: XrpaDataflowConnection;
};

