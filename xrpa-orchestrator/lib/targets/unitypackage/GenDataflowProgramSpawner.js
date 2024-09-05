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
exports.genDataflowProgramSpawner = void 0;
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const StructType_1 = require("../../shared/StructType");
const DataflowProgramDefinition_1 = require("../../shared/DataflowProgramDefinition");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpCodeGenImpl = __importStar(require("../csharp/CsharpCodeGenImpl"));
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
function genParameterAccessors(ctx, classSpec, programDef) {
    const spawnInitializerLines = [];
    const runInitializerLines = [];
    const validateLines = [];
    const currentObj = (0, CsharpCodeGenImpl_1.privateMember)("currentObj");
    const paramsStruct = new StructType_1.StructType(CsharpCodeGenImpl, "DataflowProgramParams", CsharpCodeGenImpl_1.XRPA_NAMESPACE, undefined, (0, DataflowProgramDefinition_1.getDataflowInputStructSpec)((0, DataflowProgramDefinition_1.getDataflowInputs)(programDef), ctx.moduleDef));
    const fields = paramsStruct.getAllFields();
    for (const paramName in fields) {
        const memberName = (0, Helpers_1.upperFirst)(paramName);
        const memberFieldName = (0, CsharpCodeGenImpl_1.privateMember)(memberName);
        const fieldType = fields[paramName].type;
        const objGetterName = `Get${(0, Helpers_1.upperFirst)(paramName)}`;
        const objSetterName = `Set${(0, Helpers_1.upperFirst)(paramName)}`;
        const decorations = [
            "[SerializeField]"
        ];
        paramsStruct.declareLocalFieldClassMember(classSpec, paramName, memberFieldName, true, decorations, "private");
        spawnInitializerLines.push(`${(0, CsharpCodeGenImpl_1.genDerefMethodCall)("ret", objSetterName, [memberName])};`);
        runInitializerLines.push(`${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, [memberName])};`);
        classSpec.members.push({
            name: memberName,
            type: fieldType,
            getter: memberFieldName,
            setter: [
                // set the local member value
                `${memberFieldName} = value;`,
                `if (${(0, CsharpCodeGenImpl_1.genNonNullCheck)(currentObj)}) {`,
                `  ${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, ["value"])};`,
                `}`,
            ],
        });
        validateLines.push(`if (!${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objGetterName, [])}.Equals(${memberFieldName})) {`, `  ${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, [memberFieldName])};`, `}`);
    }
    classSpec.methods.push({
        name: "OnValidate",
        body: [
            `if (${(0, CsharpCodeGenImpl_1.genNonNullCheck)(currentObj)}) {`,
            ...(0, Helpers_1.indent)(1, validateLines),
            `}`,
        ],
        visibility: "private",
    });
    return {
        spawnInitializerLines,
        runInitializerLines,
    };
}
function genDataflowProgramSpawner(ctx, fileWriter, outDir, programDef) {
    const storeDefs = programDef.programInterfaceNames.map(storeName => ctx.moduleDef.getDataStore(storeName));
    const storeAccessors = storeDefs.map(storeDef => `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(storeDef)}.Instance.DataStore`);
    const programClass = (0, CsharpCodeGenImpl_1.nsJoin)(ctx.namespace, programDef.interfaceName);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: (0, MonoBehaviourShared_1.getComponentClassName)(programDef.interfaceName),
        superClass: "MonoBehaviour",
        namespace: "",
        includes: new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine", ctx.namespace]),
    });
    classSpec.members.push({
        name: "AutoRun",
        type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.bool.typename,
        initialValue: false,
        visibility: "public",
        decorations: ["[SerializeField]"]
    });
    const { spawnInitializerLines, runInitializerLines } = genParameterAccessors(ctx, classSpec, programDef);
    classSpec.members.push({
        name: "currentObj",
        type: (0, CsharpCodeGenImpl_1.genObjectPtrType)(programClass),
        visibility: "private",
    });
    classSpec.methods.push({
        name: "Start",
        body: [
            `if (AutoRun) {`,
            `  Run();`,
            `}`,
        ],
        visibility: "private",
    });
    classSpec.methods.push({
        name: "OnDestroy",
        body: [
            `Stop();`,
        ],
        visibility: "private",
    });
    classSpec.methods.push({
        name: "Run",
        body: () => {
            return [
                `Stop();`,
                `${(0, CsharpCodeGenImpl_1.privateMember)("currentObj")} = ${(0, CsharpCodeGenImpl_1.genCreateObject)(programClass, storeAccessors)};`,
                ...runInitializerLines,
            ];
        },
        visibility: "public",
    });
    classSpec.methods.push({
        name: "Stop",
        body: () => {
            return [
                `if (${(0, CsharpCodeGenImpl_1.genNonNullCheck)((0, CsharpCodeGenImpl_1.privateMember)("currentObj"))}) {`,
                `  ${(0, CsharpCodeGenImpl_1.genDerefMethodCall)((0, CsharpCodeGenImpl_1.privateMember)("currentObj"), "terminate", [])};`,
                `}`,
                `${(0, CsharpCodeGenImpl_1.privateMember)("currentObj")} = ${(0, CsharpCodeGenImpl_1.getNullValue)()};`,
            ];
        },
        visibility: "public",
    });
    classSpec.methods.push({
        name: "Spawn",
        returnType: (0, CsharpCodeGenImpl_1.genObjectPtrType)(programClass),
        body: () => {
            return [
                `var ret = ${(0, CsharpCodeGenImpl_1.genCreateObject)(programClass, storeAccessors)};`,
                ...spawnInitializerLines,
                "return ret;",
            ];
        },
        visibility: "public",
    });
    (0, MonoBehaviourShared_1.writeMonoBehaviour)(classSpec, {
        fileWriter,
        outDir,
    });
}
exports.genDataflowProgramSpawner = genDataflowProgramSpawner;
//# sourceMappingURL=GenDataflowProgramSpawner.js.map
