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
export declare enum KnobControlMode {
    Disabled = 0,
    Position = 1,
    Detent = 2
}
export declare const XredKnobInputInterface: import("@xrpa/xrpa-orchestrator").ProgramInterface;
export declare function KnobControl(params: {
    name?: string;
    controlMode: KnobControlMode | XrpaProgramParam | XrpaDataflowConnection;
    position?: number | XrpaProgramParam | XrpaDataflowConnection;
    detentCount?: number | XrpaProgramParam | XrpaDataflowConnection;
}): {
    device: XrpaDataflowConnection;
    inputEvent: XrpaDataflowConnection;
    positionEvent: XrpaDataflowConnection;
};

