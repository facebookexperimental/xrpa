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
exports.isGameEngineBindingConfig = exports.isCallerBindingConfig = exports.isModuleBindingConfig = void 0;
function isModuleBindingConfig(binding) {
    return binding === undefined;
}
exports.isModuleBindingConfig = isModuleBindingConfig;
function isCallerBindingConfig(binding) {
    return binding !== undefined;
}
exports.isCallerBindingConfig = isCallerBindingConfig;
function isGameEngineBindingConfig(binding) {
    if (binding === undefined) {
        return false;
    }
    return typeof binding.componentBaseClass === "string";
}
exports.isGameEngineBindingConfig = isGameEngineBindingConfig;
//# sourceMappingURL=EngineBindings.js.map
