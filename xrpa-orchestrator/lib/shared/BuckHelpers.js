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
exports.buckBuild = exports.buckRun = exports.buckRootDir = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("./Helpers");
const BUCK = "buck2";
async function buckRootDir() {
    return await (0, Helpers_1.runProcess)({ filename: BUCK, args: ["root"] });
}
exports.buckRootDir = buckRootDir;
async function buckBuildAndPrep(params) {
    try {
        const buckRoot = await (0, Helpers_1.runProcess)({ filename: BUCK, args: ["root"] });
        const buildOutput = await (0, Helpers_1.runProcess)({
            filename: BUCK,
            args: ["build", params.mode, params.target, "--show-json-output"],
            onLineReceived: line => console.log(line),
        });
        const buildOutputJson = JSON.parse(buildOutput);
        let outputPath = path_1.default.join(buckRoot, buildOutputJson[Object.keys(buildOutputJson)[0]]);
        // strip off filename if outputPath is not a directory
        if ((await fs_extra_1.default.stat(outputPath)).isFile()) {
            outputPath = path_1.default.dirname(outputPath);
        }
        // copy resources to the output dir
        if (params.resourceFilenames) {
            for (const filename of params.resourceFilenames) {
                await fs_extra_1.default.copyFile(filename, path_1.default.join(outputPath, path_1.default.basename(filename)));
            }
        }
        return outputPath;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function buckRun(params) {
    try {
        const exeFilename = params.exeFilename ?? (params.target.split(":").pop() + ".exe");
        const outputPath = await buckBuildAndPrep(params);
        const exePath = path_1.default.join(outputPath, exeFilename);
        console.log(exePath);
        return await (0, Helpers_1.runProcess)({
            filename: exePath,
            onLineReceived: line => console.log(line),
        });
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.buckRun = buckRun;
async function buckBuild(params) {
    try {
        const outputPath = await buckBuildAndPrep(params);
        // copy executables and dlls to dstPath
        const filenames = [];
        await (0, Helpers_1.recursiveDirScan)(outputPath, filenames);
        for (const filename of filenames) {
            if (filename.endsWith(".exe") || filename.endsWith(".dll")) {
                const dstFilename = path_1.default.join(params.dstPath, filename.slice(outputPath.length + 1));
                await fs_extra_1.default.ensureDir(path_1.default.dirname(dstFilename));
                await fs_extra_1.default.copyFile(filename, dstFilename);
            }
        }
        // copy resources to dstPath
        if (params.resourceFilenames) {
            for (const filename of params.resourceFilenames) {
                await fs_extra_1.default.copyFile(filename, path_1.default.join(params.dstPath, path_1.default.basename(filename)));
            }
        }
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.buckBuild = buckBuild;
//# sourceMappingURL=BuckHelpers.js.map
