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

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerceptionTypes = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
function getPerceptionTypes() {
    const slamImage = (0, xrpa_orchestrator_1.Image)("SlamImage", {
        expectedWidth: 480,
        expectedHeight: 640,
        expectedBytesPerPixel: 0.5, // jpeg compression
    });
    const rgbImage = (0, xrpa_orchestrator_1.Image)("RgbImage", {
        expectedWidth: 1408,
        expectedHeight: 1408,
        expectedBytesPerPixel: 1.5, // jpeg compression
    });
    const pose = (0, xrpa_orchestrator_1.Struct)("Pose", {
        position: xrpa_orchestrator_1.Vector3,
        orientation: xrpa_orchestrator_1.Quaternion,
    });
    const poseDynamics = (0, xrpa_orchestrator_1.Struct)("PoseDynamics", {
        timestamp: xrpa_orchestrator_1.HiResTimestamp,
        localFrameId: xrpa_orchestrator_1.Count,
        localFromDeviceRotation: xrpa_orchestrator_1.Quaternion,
        localFromDeviceTranslation: xrpa_orchestrator_1.Vector3,
        localLinearVelocity: xrpa_orchestrator_1.Vector3,
        deviceRotationalVelocity: xrpa_orchestrator_1.Vector3,
        localGravityDirection: xrpa_orchestrator_1.UnitVector3,
    });
    return {
        slamImage,
        rgbImage,
        pose,
        poseDynamics,
        slamMessage: (0, xrpa_orchestrator_1.MessageRate)(30, (0, xrpa_orchestrator_1.Message)({
            image: slamImage,
        })),
        rgbMessage: (0, xrpa_orchestrator_1.MessageRate)(10, (0, xrpa_orchestrator_1.Message)({
            image: rgbImage,
        })),
        poseDynamicsMessage: (0, xrpa_orchestrator_1.MessageRate)(200, (0, xrpa_orchestrator_1.Message)({
            data: poseDynamics,
        })),
    };
}
exports.getPerceptionTypes = getPerceptionTypes;
//# sourceMappingURL=Shared.js.map
