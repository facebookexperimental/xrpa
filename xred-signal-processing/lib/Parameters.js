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
exports.Vector3Param = exports.ScalarParam = exports.FrequencyParam = void 0;
const SignalProcessingTypes_1 = require("./SignalProcessingTypes");
function FrequencyParam(name, defaultValue, description) {
    return new SignalProcessingTypes_1.FrequencyParamType(name, defaultValue, description);
}
exports.FrequencyParam = FrequencyParam;
function ScalarParam(name, defaultValue, description) {
    return new SignalProcessingTypes_1.ScalarParamType(name, defaultValue, description);
}
exports.ScalarParam = ScalarParam;
function Vector3Param(name, description) {
    return new SignalProcessingTypes_1.Vector3ParamType(name, description);
}
exports.Vector3Param = Vector3Param;
//# sourceMappingURL=Parameters.js.map
