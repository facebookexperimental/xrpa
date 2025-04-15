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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnobControl = exports.XredKnobInputInterface = exports.KnobControlMode = void 0;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
var KnobControlMode;
(function (KnobControlMode) {
    KnobControlMode[KnobControlMode["Disabled"] = 0] = "Disabled";
    KnobControlMode[KnobControlMode["Position"] = 1] = "Position";
    KnobControlMode[KnobControlMode["Detent"] = 2] = "Detent";
})(KnobControlMode = exports.KnobControlMode || (exports.KnobControlMode = {}));
exports.XredKnobInputInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.KnobInput", () => {
    const KnobControlModeType = (0, xrpa_orchestrator_1.Enum)("KnobControlMode", ["Disabled", "Position", "Detent"]);
    const KnobDevice = (0, xrpa_orchestrator_1.ProgramOutput)("KnobDevice", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 4,
        fields: {
            name: xrpa_orchestrator_1.String,
            controlMode: KnobControlModeType,
            position: xrpa_orchestrator_1.Count,
            absolutePosition: xrpa_orchestrator_1.Count,
            detentPosition: xrpa_orchestrator_1.Count,
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("KnobControl", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 4,
        fields: {
            name: (0, xrpa_orchestrator_1.String)("", "name of the device to control; leave empty to use the first device found"),
            controlMode: KnobControlModeType,
            position: (0, xrpa_orchestrator_1.Count)(0, "Position to set the knob to, when controlMode == Position"),
            detentCount: (0, xrpa_orchestrator_1.Count)(10, "Number of detents to set the knob to, when controlMode == Detent"),
            device: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.ReferenceTo)(KnobDevice)),
            inputEvent: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)("InputEvent", {
                type: (0, xrpa_orchestrator_1.Enum)("InputEventType", ["Release", "Press"]),
                source: xrpa_orchestrator_1.Count,
            })),
            positionEvent: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Message)("PositionEvent", {
                position: xrpa_orchestrator_1.Count,
                absolutePosition: xrpa_orchestrator_1.Count,
                detentPosition: xrpa_orchestrator_1.Count,
            })),
        },
    }));
});
function KnobControl(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredKnobInputInterface), "KnobControl"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues.name = params.name ?? "";
    dataflowNode.fieldValues.controlMode = params.controlMode;
    dataflowNode.fieldValues.position = params.position ?? 0;
    dataflowNode.fieldValues.detentCount = params.detentCount ?? 10;
    return {
        device: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "device"),
        inputEvent: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "inputEvent"),
        positionEvent: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "positionEvent"),
    };
}
exports.KnobControl = KnobControl;
//# sourceMappingURL=index.js.map
