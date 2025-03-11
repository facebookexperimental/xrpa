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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsharpModuleDefinition = void 0;
const xrpa_file_utils_1 = require("@xrpa/xrpa-file-utils");
const BuiltinTypes_1 = require("../../shared/BuiltinTypes");
const ModuleDefinition_1 = require("../../shared/ModuleDefinition");
const CsharpCodeGenImpl = __importStar(require("./CsharpCodeGenImpl"));
const CsharpCodeGenImpl_1 = require("./CsharpCodeGenImpl");
const GenDataflowProgram_1 = require("./GenDataflowProgram");
const GenDataStore_1 = require("./GenDataStore");
const GenTypesDefinitions_1 = require("./GenTypesDefinitions");
class CsharpModuleDefinition extends ModuleDefinition_1.ModuleDefinition {
    constructor(datamap, name, outputDir, guidGen) {
        super(CsharpCodeGenImpl, name, datamap, guidGen ?? {
            includes: [
                { namespace: "System" },
            ],
            code: "System.Guid.NewGuid()",
        });
        this.outputDir = outputDir;
    }
    createObjectUuid() {
        const ObjectUuid = this.createStruct("Identifier", "", {
            ID0: { type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.BitField) },
            ID1: { type: this.getPrimitiveTypeDefinition(BuiltinTypes_1.BuiltinType.BitField) },
        }, { typename: this.codegen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "ObjectUuid") });
        ObjectUuid.datasetType = { typename: this.codegen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "ObjectUuid") };
        return ObjectUuid;
    }
    doCodeGen() {
        const fileWriter = new xrpa_file_utils_1.FileWriter();
        for (const storeDef of this.getDataStores()) {
            // generate DS types
            (0, GenTypesDefinitions_1.genTypesDefinitions)(fileWriter, this.outputDir, storeDef);
            // generate DataStore files
            const ctx = {
                moduleDef: this,
                storeDef,
                namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
            };
            (0, GenDataStore_1.genDataStore)(fileWriter, this.outputDir, ctx);
        }
        const dataflowPrograms = this.getDataflowPrograms();
        for (const name in dataflowPrograms) {
            (0, GenDataflowProgram_1.genDataflowProgram)({
                namespace: "XrpaDataflowPrograms",
                moduleDef: this,
            }, fileWriter, this.outputDir, dataflowPrograms[name]);
        }
        return fileWriter;
    }
}
exports.CsharpModuleDefinition = CsharpModuleDefinition;
//# sourceMappingURL=CsharpModuleDefinition.js.map
