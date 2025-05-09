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
exports.PythonStandalone = void 0;
const GenProgramInterfacesClass_1 = require("./GenProgramInterfacesClass");
class PythonStandalone {
    constructor(moduleDef) {
        this.moduleDef = moduleDef;
    }
    doCodeGen() {
        const fileWriter = this.moduleDef.doCodeGen();
        (0, GenProgramInterfacesClass_1.genApplicationInterfaceClass)(fileWriter, this.moduleDef.libDir, this.moduleDef, false);
        return fileWriter;
    }
}
exports.PythonStandalone = PythonStandalone;
//# sourceMappingURL=PythonStandalone.js.map
