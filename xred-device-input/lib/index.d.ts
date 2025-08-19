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


import { XrpaDataflowConnection, XrpaProgramParam } from "@xrpa/xrpa-orchestrator";
import { ISignalNodeType } from "@xrpa/xred-signal-processing";
export declare enum KnobControlMode {
    Disabled = 0,
    Position = 1,
    Detent = 2
}
export type ColorSRGBA = [number, number, number, number];
export declare const XredSmartControllerInterface: import("@xrpa/xrpa-orchestrator").ProgramInterface;
export declare function KnobControl(params: {
    ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
    controlMode: KnobControlMode | XrpaProgramParam | XrpaDataflowConnection;
    position?: number | XrpaProgramParam | XrpaDataflowConnection;
    detentCount?: number | XrpaProgramParam | XrpaDataflowConnection;
}): {
    isConnected: XrpaDataflowConnection;
    inputEvent: XrpaDataflowConnection;
    positionEvent: XrpaDataflowConnection;
};
export declare function LightControl(params: {
    ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
    lightColors: Array<ColorSRGBA> | XrpaProgramParam | XrpaDataflowConnection;
    rotationOffset?: number | XrpaProgramParam | XrpaDataflowConnection;
    rotationSpeed?: number | XrpaProgramParam | XrpaDataflowConnection;
    priority?: number | XrpaProgramParam | XrpaDataflowConnection;
}): {
    isConnected: XrpaDataflowConnection;
};
export declare function InputFromSmartMicrophone(params: {
    ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
}): {
    audioSignal: {
        numChannels: number;
        signal: XrpaDataflowConnection;
    };
    isActive: XrpaDataflowConnection;
    errorMessage: XrpaDataflowConnection;
};
export declare function OutputToSmartSpeaker(params: {
    ipAddress: string | XrpaProgramParam | XrpaDataflowConnection;
    audioSignal: XrpaProgramParam | XrpaDataflowConnection | ISignalNodeType;
}): {
    isConnected: XrpaDataflowConnection;
};

