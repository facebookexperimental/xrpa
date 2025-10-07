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


import { FileWriter } from "@xrpa/xrpa-file-utils";
import { indent, removeLastTrailingComma } from "@xrpa/xrpa-utils";
import path from "path";

export interface PackageInfo {
  name: string;
  version: [number, number, number];
  displayName: string;
  description: string;
  dependencies: [string, string][];
  companyName: string;
  packageName: string;
}

function writePackageJson(fileWriter: FileWriter, packageRoot: string, packageInfo: PackageInfo) {
  const lines = [
    `{`,
    `  "name": "${packageInfo.name}",`,
    `  "version": "${packageInfo.version.join(".")}",`,
    `  "displayName": "${packageInfo.displayName}",`,
    `  "description": "${packageInfo.description}",`,
    `  "dependencies": {`,
    ...indent(2, removeLastTrailingComma(
      [`"com.meta.xrpa": "1.0.0",`].concat(
        packageInfo.dependencies.map(entry => `"${entry[0]}": "${entry[1]}",`),
      ),
    )),
    `  }`,
    `}`,
  ];

  fileWriter.writeFile(path.join(packageRoot, `package.json`), lines);
}

function writeAssemblyDefinition(fileWriter: FileWriter, runtimeDir: string, packageInfo: PackageInfo) {
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

  fileWriter.writeFile(path.join(runtimeDir, `${packageInfo.companyName}.${packageInfo.packageName}.asmdef`), lines);
}

export function genPackage(fileWriter: FileWriter, packageRoot: string, packageInfo: PackageInfo) {
  const runtimeDir = path.join(packageRoot, "Runtime");

  writePackageJson(fileWriter, packageRoot, packageInfo);
  writeAssemblyDefinition(fileWriter, packageRoot, packageInfo);

  return {
    runtimeDir,
  };
}
