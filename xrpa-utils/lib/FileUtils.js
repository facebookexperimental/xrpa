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
exports.recursiveDirScan = exports.isDirectory = exports.runProcess = exports.hashCheck = exports.HashValue = void 0;
const assert_1 = __importDefault(require("assert"));
const child_process_1 = __importDefault(require("child_process"));
const crypto_1 = __importDefault(require("crypto"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
class HashValue {
    constructor(str) {
        const hash = crypto_1.default.createHash("sha256");
        hash.update(str);
        const hexHash = hash.digest("hex");
        (0, assert_1.default)(hexHash.length === 64);
        this.values = [
            hexHash.slice(0, 16),
            hexHash.slice(16, 32),
            hexHash.slice(32, 48),
            hexHash.slice(48, 64),
        ];
    }
}
exports.HashValue = HashValue;
function hashCheck(a, b) {
    const hashA = crypto_1.default.createHash("sha256");
    hashA.update(a);
    const hashB = crypto_1.default.createHash("sha256");
    hashB.update(b);
    return hashA.digest("hex") === hashB.digest("hex");
}
exports.hashCheck = hashCheck;
async function runProcess(params) {
    const p = new Promise((resolve, reject) => {
        const child = child_process_1.default.spawn(params.filename, params.args, { cwd: params.cwd });
        const dataLines = [];
        let dataString = "";
        let errorString = "";
        child.stdout.on('data', (data) => {
            dataString = dataString + data.toString().replace(/\r\n/g, "\n");
            if (dataString.includes("\n")) {
                const lines = dataString.split("\n");
                dataString = lines.pop() ?? "";
                dataLines.push(...lines);
                params.onLineReceived && lines.forEach(params.onLineReceived);
            }
        });
        child.stderr.on('data', (data) => {
            errorString = errorString + data.toString();
            if (errorString.includes("\n")) {
                const lines = errorString.split("\n");
                errorString = lines.pop() ?? "";
                params.onLineReceived && lines.forEach(params.onLineReceived);
            }
        });
        child.on('error', error => {
            reject(error);
        });
        child.on('close', code => {
            if (code !== 0) {
                reject(new Error(`${params.filename} exited with code ${code}`));
            }
            else {
                if (dataString) {
                    dataLines.push(dataString);
                    dataString = "";
                }
                resolve(dataLines.join("\n"));
            }
        });
        process.stdin.pipe(child.stdin);
    });
    return p;
}
exports.runProcess = runProcess;
async function isDirectory(pathname) {
    try {
        const stat = await fs_extra_1.default.stat(pathname);
        return stat.isDirectory();
    }
    catch (e) {
        return false;
    }
}
exports.isDirectory = isDirectory;
async function recursiveDirScan(fullpath, filenames) {
    if (await isDirectory(fullpath)) {
        const files = await fs_extra_1.default.readdir(fullpath);
        for (const filename of files) {
            await recursiveDirScan(path_1.default.join(fullpath, filename), filenames);
        }
    }
    else {
        filenames.push(fullpath);
    }
}
exports.recursiveDirScan = recursiveDirScan;
//# sourceMappingURL=FileUtils.js.map
