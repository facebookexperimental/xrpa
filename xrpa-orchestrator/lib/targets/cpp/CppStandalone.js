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
exports.CppStandalone = void 0;
const xrpa_file_utils_1 = require("@xrpa/xrpa-file-utils");
const path_1 = __importDefault(require("path"));
const GenStandaloneCpp_1 = require("./GenStandaloneCpp");
class CppStandalone {
    constructor(moduleDef, standaloneDir, manifestFilename) {
        this.moduleDef = moduleDef;
        this.standaloneDir = standaloneDir;
        this.manifestFilename = manifestFilename;
        this.resourceFilenames = [];
    }
    doCodeGen() {
        const fileWriter = this.moduleDef.doCodeGen();
        // generate standalone wrapper files
        (0, GenStandaloneCpp_1.genStandaloneCpp)(fileWriter, this.standaloneDir, this.moduleDef);
        if (this.moduleDef.buckDef) {
            // generate buck file
            (0, GenStandaloneCpp_1.genStandaloneBuck)(fileWriter, this.standaloneDir, this.moduleDef.runtimeDir, this.moduleDef.buckDef, this.moduleDef);
        }
        return fileWriter;
    }
    addResourceFile(filename) {
        this.resourceFilenames.push(filename);
    }
    async getStandaloneTarget() {
        const buckRoot = await (0, xrpa_file_utils_1.buckRootDir)();
        const standaloneRelPath = path_1.default.relative(buckRoot, this.standaloneDir);
        return `//${standaloneRelPath.replace(/\\/g, "/")}:${this.moduleDef.name}`;
    }
    getBuckMode(optLevel) {
        const buckDef = this.moduleDef.buckDef;
        if (!buckDef) {
            throw new Error("Buck is not configured for this module");
        }
        let buckMode;
        if (process.platform == "win32") {
            buckMode = buckDef.modes.windows?.[optLevel];
        }
        else if (process.platform == "darwin") {
            buckMode = buckDef.modes.macos?.[optLevel];
        }
        if (!buckMode) {
            throw new Error("There is no buck mode configured for the current platform");
        }
        return buckMode;
    }
    async buckRunDebug() {
        await this.doCodeGen().finalize(this.manifestFilename);
        await (0, xrpa_file_utils_1.buckRun)({
            mode: this.getBuckMode("debug"),
            target: await this.getStandaloneTarget(),
            resourceFilenames: this.resourceFilenames,
        });
    }
    async buckBuildRelease(dstPath) {
        await this.doCodeGen().finalize(this.manifestFilename);
        let mode = "";
        try {
            mode = this.getBuckMode("release");
        }
        catch (e) {
            // ignore, it is just not supported on this platform
            return;
        }
        await (0, xrpa_file_utils_1.buckBuild)({
            mode,
            target: await this.getStandaloneTarget(),
            dstPath,
            resourceFilenames: this.resourceFilenames,
        });
    }
}
exports.CppStandalone = CppStandalone;
//# sourceMappingURL=CppStandalone.js.map
