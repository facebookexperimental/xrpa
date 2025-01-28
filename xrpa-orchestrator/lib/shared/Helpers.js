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
exports.getRuntimeSrcPath = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
let runtimeSrcRootPath = path_1.default.join(__dirname, "../runtime");
if (!fs_extra_1.default.pathExistsSync(runtimeSrcRootPath)) {
    runtimeSrcRootPath = path_1.default.join(__dirname, "../../../runtime");
}
function getRuntimeSrcPath(target) {
    if (target === "python") {
        return path_1.default.join(runtimeSrcRootPath, target, "xrpa_runtime");
    }
    return path_1.default.join(runtimeSrcRootPath, target, "xrpa-runtime");
}
exports.getRuntimeSrcPath = getRuntimeSrcPath;
//# sourceMappingURL=Helpers.js.map
