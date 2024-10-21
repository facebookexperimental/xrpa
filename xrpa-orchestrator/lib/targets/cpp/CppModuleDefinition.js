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

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CppModuleDefinition = void 0;
const path_1 = __importDefault(require("path"));
const BuckHelpers_1 = require("../../shared/BuckHelpers");
const BuiltinTypes_1 = require("../../shared/BuiltinTypes");
const FileWriter_1 = require("../../shared/FileWriter");
const Helpers_1 = require("../../shared/Helpers");
const ModuleDefinition_1 = require("../../shared/ModuleDefinition");
const CppCodeGenImpl = __importStar(require("./CppCodeGenImpl"));
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const GenDataflowProgram_1 = require("./GenDataflowProgram");
const GenDataStore_1 = require("./GenDataStore");
const GenModuleClass_1 = require("./GenModuleClass");
const GenTypesHeader_1 = require("./GenTypesHeader");
class CppModuleDefinition extends ModuleDefinition_1.ModuleDefinition {
    constructor(name, datamap, genOutputDir, buckDef, guidGen) {
        super(CppCodeGenImpl, name, datamap, guidGen ?? {
            includes: [{
                    filename: "<xrpa-runtime/external_utils/UuidGen.h>",
                }],
            code: (0, CppCodeGenImpl_1.nsJoin)(CppCodeGenImpl_1.XRPA_NAMESPACE, "generateDSID()"),
        });
        this.genOutputDir = genOutputDir;
        this.buckDef = buckDef;
        this.libDir = path_1.default.join(this.genOutputDir, "lib");
        this.runtimeDir = path_1.default.join(this.genOutputDir, "xrpa-runtime");
    }
    createDSIdentifier() {
        const DSIdentifier = this.createStruct("Identifier", "", {
            id0: { type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.BitField) },
            id1: { type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.BitField) },
        }, { typename: this.codegen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSIdentifier"), headerFile: "<xrpa-runtime/core/DatasetTypes.h>" });
        DSIdentifier.datasetType = { typename: this.codegen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSIdentifier"), headerFile: "<xrpa-runtime/core/DatasetTypes.h>" };
        return DSIdentifier;
    }
    doCodeGen() {
        const fileWriter = new FileWriter_1.FileWriter();
        fileWriter.copyFolderContents((0, Helpers_1.getRuntimeSrcPath)("cpp"), this.runtimeDir, (_srcRelPath, fileExt, fileData) => {
            if (fileExt === ".cpp" || fileExt === ".h") {
                return (0, CppCodeGenImpl_1.injectGeneratedTag)(fileData);
            }
            return fileData;
        });
        // generate module class
        (0, GenModuleClass_1.genModuleClass)(fileWriter, this.libDir, this);
        if (this.buckDef) {
            // generate lib buck file
            this.genBuckFile(fileWriter, this, this.buckDef.oncall);
        }
        for (const storeDef of this.getDataStores()) {
            // generate DS types
            (0, GenTypesHeader_1.genTypesHeader)(fileWriter, this.libDir, storeDef);
            // generate DataStore files
            const ctx = {
                moduleDef: this,
                storeDef,
                namespace: this.codegen.getDataStoreName(storeDef.apiname),
            };
            (0, GenDataStore_1.genDataStore)(fileWriter, this.libDir, ctx);
        }
        const dataflowPrograms = this.getDataflowPrograms();
        for (const name in dataflowPrograms) {
            (0, GenDataflowProgram_1.genDataflowProgram)({
                namespace: "XrpaDataflowPrograms",
                moduleDef: this,
            }, fileWriter, this.libDir, dataflowPrograms[name]);
        }
        return fileWriter;
    }
    genBuckFile(fileWriter, moduleDef, oncall) {
        fileWriter.writeFile(path_1.default.join(this.libDir, "BUCK"), async () => {
            const buckRoot = await (0, BuckHelpers_1.buckRootDir)();
            const runtimeRelPath = path_1.default.relative(buckRoot, this.runtimeDir);
            const runtimeDepPath = `//${runtimeRelPath.replace(/\\/g, "/")}`;
            const deps = (moduleDef.datamap.typeBuckDeps).map(s => `"${s}",`).concat([
                `"${runtimeDepPath}:core",`,
                `"${runtimeDepPath}:reconciler",`,
            ]).sort();
            return [
                ...CppCodeGenImpl.BUCK_HEADER,
                `load("//arvr/tools/build_defs:oxx.bzl", "oxx_static_library")`,
                ``,
                `oncall("${oncall}")`,
                ``,
                `oxx_static_library(`,
                `    name = "${moduleDef.name}",`,
                `    srcs = glob(["*.cpp"]),`,
                `    public_include_directories = [".."],`,
                `    public_raw_headers = glob(["*.h"]),`,
                `    visibility = ["PUBLIC"],`,
                `    deps = [`,
                ...(0, Helpers_1.indent)(4, deps),
                `    ],`,
                `)`,
                ``,
            ];
        });
    }
}
exports.CppModuleDefinition = CppModuleDefinition;
//# sourceMappingURL=CppModuleDefinition.js.map
