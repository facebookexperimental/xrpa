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
exports.genPackage = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
function writePackageJson(fileWriter, packageRoot, packageInfo) {
    const lines = [
        `{`,
        `  "name": "${packageInfo.name}",`,
        `  "version": "${packageInfo.version.join(".")}",`,
        `  "displayName": "${packageInfo.displayName}",`,
        `  "description": "${packageInfo.description}",`,
        `  "dependencies": {`,
        ...(0, xrpa_utils_1.indent)(2, (0, xrpa_utils_1.removeLastTrailingComma)([`"com.meta.xrpa": "1.0.0",`].concat(packageInfo.dependencies.map(entry => `"${entry[0]}": "${entry[1]}",`)))),
        `  }`,
        `}`,
    ];
    fileWriter.writeFile(path_1.default.join(packageRoot, `package.json`), lines);
}
function writeAssemblyDefinition(fileWriter, runtimeDir, packageInfo) {
    const lines = [
        `{`,
        `  "name": "${packageInfo.companyName}.${packageInfo.packageName}",`,
        `  "references": ["Xrpa"],`,
        `  "includePlatforms": [],`,
        `  "excludePlatforms": [],`,
        `  "precompiledReferences": [],`,
        `  "defineConstraints": [],`,
        `  "versionDefines": [],`,
        `  "allowUnsafeCode": false,`,
        `  "overrideReferences": false,`,
        `  "autoReferenced": true,`,
        `  "noEngineReferences": false`,
        `}`,
    ];
    fileWriter.writeFile(path_1.default.join(runtimeDir, `${packageInfo.companyName}.${packageInfo.packageName}.asmdef`), lines);
}
function genPackage(fileWriter, packageRoot, packageInfo) {
    const runtimeDir = path_1.default.join(packageRoot, "Runtime");
    writePackageJson(fileWriter, packageRoot, packageInfo);
    writeAssemblyDefinition(fileWriter, packageRoot, packageInfo);
    return {
        runtimeDir,
    };
}
exports.genPackage = genPackage;
//# sourceMappingURL=GenPackage.js.map
