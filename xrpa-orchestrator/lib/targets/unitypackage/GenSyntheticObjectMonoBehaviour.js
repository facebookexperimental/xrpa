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
exports.genSyntheticObjectMonoBehaviour = void 0;
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const StructType_1 = require("../../shared/StructType");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpCodeGenImpl = __importStar(require("../csharp/CsharpCodeGenImpl"));
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
function genParameterAccessors(ctx, classSpec, objectDef) {
    const spawnInitializerLines = [];
    const paramsStruct = new StructType_1.StructType(CsharpCodeGenImpl, "SyntheticObjectParams", CsharpCodeGenImpl_1.XRPA_NAMESPACE, undefined, objectDef.buildStructSpec(ctx.storeDef.datamodel));
    const fields = paramsStruct.getAllFields();
    for (const paramName in fields) {
        const memberName = (0, Helpers_1.upperFirst)(paramName);
        const fieldType = fields[paramName].type;
        const objSetterName = `Set${(0, Helpers_1.upperFirst)(paramName)}`;
        const decorations = [
            "[SerializeField]"
        ];
        paramsStruct.declareLocalFieldClassMember(classSpec, paramName, (0, CsharpCodeGenImpl_1.privateMember)(memberName), true, decorations, "private");
        spawnInitializerLines.push(`${(0, CsharpCodeGenImpl_1.genDerefMethodCall)("ret", objSetterName, [memberName])};`);
        classSpec.members.push({
            name: memberName,
            type: fieldType,
            getter: (0, CsharpCodeGenImpl_1.privateMember)(memberName),
            setter: [
                // set the local member value
                `${(0, CsharpCodeGenImpl_1.privateMember)(memberName)} = value;`,
                `if (${(0, CsharpCodeGenImpl_1.genNonNullCheck)((0, CsharpCodeGenImpl_1.privateMember)("currentObj"))}) {`,
                `  ${(0, CsharpCodeGenImpl_1.genDerefMethodCall)((0, CsharpCodeGenImpl_1.privateMember)("currentObj"), objSetterName, ["value"])};`,
                `}`,
            ],
        });
    }
    return {
        spawnInitializerLines,
    };
}
function genSyntheticObjectMonoBehaviour(ctx, fileWriter, outDir, syntheticObjectName, objectDef) {
    const syntheticObjectClass = (0, CsharpCodeGenImpl_1.nsJoin)(ctx.namespace, syntheticObjectName);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: (0, MonoBehaviourShared_1.getComponentClassName)(syntheticObjectName),
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
    const { spawnInitializerLines } = genParameterAccessors(ctx, classSpec, objectDef);
    classSpec.members.push({
        name: "currentObj",
        type: (0, CsharpCodeGenImpl_1.genObjectPtrType)(syntheticObjectClass),
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
                `${(0, CsharpCodeGenImpl_1.privateMember)("currentObj")} = ${(0, CsharpCodeGenImpl_1.genCreateObject)(syntheticObjectClass, [`${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore`])};`,
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
        returnType: (0, CsharpCodeGenImpl_1.genObjectPtrType)(syntheticObjectClass),
        body: () => {
            return [
                `var ret = ${(0, CsharpCodeGenImpl_1.genCreateObject)(syntheticObjectClass, [`${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore`])};`,
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
exports.genSyntheticObjectMonoBehaviour = genSyntheticObjectMonoBehaviour;
//# sourceMappingURL=GenSyntheticObjectMonoBehaviour.js.map
