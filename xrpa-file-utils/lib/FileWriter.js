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
exports.FileWriter = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const FileUtils_1 = require("./FileUtils");
async function writeFileIfUnchanged(filename, filedata) {
    await fs_extra_1.default.ensureFile(filename);
    const oldfiledata = await fs_extra_1.default.readFile(filename);
    if (!(0, FileUtils_1.hashCheck)(filedata, oldfiledata)) {
        await fs_extra_1.default.writeFile(filename, filedata, "utf-8");
    }
}
function normalizeManifestPath(filename) {
    return filename.split("\\").join("/");
}
function linesToBuffer(lines) {
    const linesOut = (0, xrpa_utils_1.removeSuperfluousEmptyLines)(lines);
    if (linesOut[linesOut.length - 1] !== "") {
        linesOut.push("");
    }
    return Buffer.from(linesOut.join("\n"));
}
class FileWriter {
    constructor() {
        this.manifest = {};
        this.foldersToCopy = [];
    }
    writeFile(filename, contents) {
        this.manifest[normalizeManifestPath(filename)] = (0, xrpa_utils_1.chainAsyncThunk)(contents, linesToBuffer);
    }
    writeFileBase64(filename, data) {
        this.manifest[normalizeManifestPath(filename)] = (0, xrpa_utils_1.chainAsyncThunk)(data, res => Buffer.from(res, "base64"));
    }
    merge(fileWriter) {
        for (const filename in fileWriter.manifest) {
            this.manifest[filename] = fileWriter.manifest[filename];
        }
        this.foldersToCopy.push(...fileWriter.foldersToCopy);
    }
    copyFolderContents(srcFolder, dstFolder, preprocessor) {
        this.foldersToCopy.push({ srcFolder, dstFolder, preprocessor });
    }
    async finalize(manifestFilename) {
        for (const { srcFolder, dstFolder, preprocessor } of this.foldersToCopy) {
            const filenames = [];
            await (0, FileUtils_1.recursiveDirScan)(srcFolder, filenames);
            for (const srcFilename of filenames) {
                const srcRelPath = path_1.default.relative(srcFolder, srcFilename);
                const dstFilename = path_1.default.join(dstFolder, srcRelPath);
                const fileData = await fs_extra_1.default.readFile(srcFilename);
                const fileDataOut = preprocessor ? preprocessor(normalizeManifestPath(srcRelPath), path_1.default.extname(srcFilename), fileData) : fileData;
                if (fileDataOut !== null) {
                    this.manifest[normalizeManifestPath(dstFilename)] = fileDataOut;
                }
            }
        }
        const baseDir = path_1.default.dirname(manifestFilename);
        const newManifest = {};
        for (const fullPath in this.manifest) {
            const newKey = normalizeManifestPath(path_1.default.relative(baseDir, fullPath));
            const entry = this.manifest[fullPath];
            newManifest[newKey] = await (0, xrpa_utils_1.resolveAsyncThunk)(entry);
        }
        try {
            const oldManifest = await fs_extra_1.default.readJson(manifestFilename);
            for (const filename of oldManifest) {
                if (!(filename in newManifest)) {
                    try {
                        await fs_extra_1.default.remove(path_1.default.join(baseDir, filename));
                    }
                    catch (err2) {
                        // ignore
                    }
                }
            }
        }
        catch (err) {
            // ignore
        }
        for (const relFilename in newManifest) {
            const filedata = newManifest[relFilename];
            const filename = path_1.default.join(baseDir, relFilename);
            await writeFileIfUnchanged(filename, filedata);
        }
        const manifestData = JSON.stringify(Object.keys(newManifest).sort(), null, 2);
        await writeFileIfUnchanged(manifestFilename, Buffer.from(manifestData));
    }
}
exports.FileWriter = FileWriter;
//# sourceMappingURL=FileWriter.js.map
