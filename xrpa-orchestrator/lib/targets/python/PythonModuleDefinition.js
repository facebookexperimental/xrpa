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
exports.PythonModuleDefinition = void 0;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const xrpa_file_utils_1 = require("@xrpa/xrpa-file-utils");
const BuiltinTypes_1 = require("../../shared/BuiltinTypes");
const Helpers_1 = require("../../shared/Helpers");
const ModuleDefinition_1 = require("../../shared/ModuleDefinition");
const PythonCodeGenImpl = __importStar(require("./PythonCodeGenImpl"));
const PythonCodeGenImpl_1 = require("./PythonCodeGenImpl");
// import { genDataflowProgram } from "./GenDataflowProgram";
const GenDataStore_1 = require("./GenDataStore");
const GenProgramInterfacesClass_1 = require("./GenProgramInterfacesClass");
const GenTypesDefinitions_1 = require("./GenTypesDefinitions");
class PythonModuleDefinition extends ModuleDefinition_1.ModuleDefinition {
    constructor(name, datamap, genOutputDir, guidGen) {
        super(PythonCodeGenImpl, name, datamap, guidGen ?? {
            includes: [{
                    filename: "uuid",
                }],
            code: "uuid.uuid4()",
        });
        this.genOutputDir = genOutputDir;
        this.libDir = path_1.default.join(this.genOutputDir, "xrpa");
        this.runtimeDir = path_1.default.join(this.genOutputDir, "xrpa_runtime");
    }
    createObjectUuid() {
        const ObjectUuid = this.createStruct("Identifier", "", {
            ID0: { type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.BitField) },
            ID1: { type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.BitField) },
        }, { typename: "xrpa_runtime.utils.xrpa_types.ObjectUuid", headerFile: "xrpa_runtime.utils.xrpa_types" });
        ObjectUuid.datasetType = { typename: "xrpa_runtime.utils.xrpa_types.ObjectUuid", headerFile: "xrpa_runtime.utils.xrpa_types" };
        return ObjectUuid;
    }
    doCodeGen() {
        const fileWriter = new xrpa_file_utils_1.FileWriter();
        fileWriter.copyFolderContents((0, Helpers_1.getRuntimeSrcPath)("python"), this.runtimeDir, (srcRelPath, fileExt, fileData) => {
            if (srcRelPath.endsWith("BUCK")) {
                return null;
            }
            if (fileExt === ".py") {
                return (0, PythonCodeGenImpl_1.injectGeneratedTag)(fileData);
            }
            return fileData;
        });
        fileWriter.writeFile(path_1.default.join(this.libDir, "__init__.py"), PythonCodeGenImpl.HEADER);
        (0, GenProgramInterfacesClass_1.genProgramInterfacesClass)(fileWriter, this.libDir, this);
        for (const storeDef of this.getDataStores()) {
            // generate DS types
            (0, GenTypesDefinitions_1.genTypesDefinitions)(fileWriter, this.libDir, storeDef);
            // generate DataStore files
            const ctx = {
                moduleDef: this,
                storeDef,
                namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
            };
            (0, GenDataStore_1.genDataStore)(fileWriter, this.libDir, ctx);
        }
        const dataflowPrograms = this.getDataflowPrograms();
        for (const name in dataflowPrograms) {
            (0, assert_1.default)(false, `Python dataflow programs not yet supported (${name})`);
            /*
            genDataflowProgram(
              {
                namespace: "xrpa",
                moduleDef: this,
              },
              fileWriter,
              this.libDir,
              dataflowPrograms[name],
            );
            */
        }
        return fileWriter;
    }
}
exports.PythonModuleDefinition = PythonModuleDefinition;
//# sourceMappingURL=PythonModuleDefinition.js.map
