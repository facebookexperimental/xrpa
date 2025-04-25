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
exports.genDataflowProgramSpawner = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const StructType_1 = require("../../shared/StructType");
const DataflowProgramDefinition_1 = require("../../shared/DataflowProgramDefinition");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpCodeGenImpl = __importStar(require("../csharp/CsharpCodeGenImpl"));
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
function genStateInputParameterAccessors(params) {
    const memberName = (0, xrpa_utils_1.upperFirst)(params.paramName);
    const memberFieldName = (0, CsharpCodeGenImpl_1.privateMember)(memberName);
    const objGetterName = `Get${(0, xrpa_utils_1.upperFirst)(params.paramName)}`;
    const objSetterName = `Set${(0, xrpa_utils_1.upperFirst)(params.paramName)}`;
    const currentObj = (0, CsharpCodeGenImpl_1.privateMember)("currentObj");
    const decorations = [
        "[SerializeField]"
    ];
    params.inputParamsStruct.declareLocalFieldClassMember(params.classSpec, params.paramName, memberFieldName, true, decorations, "private");
    params.spawnInitializerLines.push(`${(0, CsharpCodeGenImpl_1.genDerefMethodCall)("ret", objSetterName, [memberName])};`);
    params.runInitializerLines.push(`${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, [memberName])};`);
    params.classSpec.members.push({
        name: memberName,
        type: params.fieldType,
        getter: memberFieldName,
        setter: [
            // set the local member value
            `${memberFieldName} = value;`,
            `if (${(0, CsharpCodeGenImpl_1.genNonNullCheck)(currentObj)}) {`,
            `  ${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, ["value"])};`,
            `}`,
        ],
    });
    params.validateLines.push(`if (!${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objGetterName, [])}.Equals(${memberFieldName})) {`, `  ${(0, CsharpCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, [memberFieldName])};`, `}`);
}
function genStateOutputParameterAccessors(params) {
    const memberName = (0, xrpa_utils_1.upperFirst)(params.fieldName);
    const memberFieldName = (0, CsharpCodeGenImpl_1.privateMember)(memberName);
    const currentObj = (0, CsharpCodeGenImpl_1.privateMember)("currentObj");
    params.outputParamsStruct.declareLocalFieldClassMember(params.classSpec, params.fieldName, memberFieldName, true, [], "private");
    params.classSpec.members.push({
        name: memberName,
        type: params.fieldType,
        getter: memberFieldName,
    });
    params.classSpec.members.push({
        name: `On${memberName}Changed`,
        type: `event System.Action<${params.fieldType.getLocalType(params.classSpec.namespace, params.classSpec.includes)}>`,
    });
    params.classSpec.methods.push({
        name: `Dispatch${memberName}Changed`,
        parameters: [{
                name: "value",
                type: params.fieldType,
            }],
        body: [
            `${memberFieldName} = value;`,
            `On${memberName}Changed?.Invoke(${memberFieldName});`,
        ],
        visibility: "private",
    });
    params.runInitializerLines.push(`${currentObj}.On${memberName}Changed += Dispatch${memberName}Changed;`);
}
function genInputParameterAccessors(ctx, classSpec, programDef) {
    const spawnInitializerLines = [];
    const runInitializerLines = [];
    const validateLines = [];
    const currentObj = (0, CsharpCodeGenImpl_1.privateMember)("currentObj");
    const inputParamsStruct = new StructType_1.StructType(CsharpCodeGenImpl, "DataflowProgramInputParams", CsharpCodeGenImpl_1.XRPA_NAMESPACE, undefined, (0, DataflowProgramDefinition_1.getDataflowInputParamsStructSpec)((0, DataflowProgramDefinition_1.getDataflowInputs)(programDef), ctx.moduleDef));
    const fields = inputParamsStruct.getAllFields();
    for (const paramName in fields) {
        const fieldType = fields[paramName].type;
        if ((0, TypeDefinition_1.typeIsMessageData)(fieldType)) {
            (0, MonoBehaviourShared_1.genUnitySendMessageAccessor)(classSpec, {
                namespace: ctx.namespace,
                typeDef: inputParamsStruct,
                fieldName: paramName,
                fieldType,
                proxyObj: currentObj,
            });
        }
        else if ((0, TypeDefinition_1.typeIsStateData)(fieldType)) {
            genStateInputParameterAccessors({
                classSpec,
                inputParamsStruct,
                paramName,
                fieldType,
                validateLines,
                spawnInitializerLines,
                runInitializerLines,
            });
        }
        else {
            (0, assert_1.default)(false, `Unsupported input parameter type for ${paramName}`);
        }
    }
    classSpec.methods.push({
        name: "OnValidate",
        body: [
            `if (${(0, CsharpCodeGenImpl_1.genNonNullCheck)(currentObj)}) {`,
            ...(0, xrpa_utils_1.indent)(1, validateLines),
            `}`,
        ],
        visibility: "private",
    });
    return {
        spawnInitializerLines,
        runInitializerLines,
    };
}
function genOutputParameterAccessors(ctx, classSpec, programDef, runInitializerLines) {
    const outputs = (0, DataflowProgramDefinition_1.getDataflowOutputs)(programDef);
    const outputParamsStruct = new StructType_1.StructType(CsharpCodeGenImpl, "DataflowProgramOutputParams", CsharpCodeGenImpl_1.XRPA_NAMESPACE, undefined, (0, DataflowProgramDefinition_1.getDataflowOutputParamsStructSpec)(outputs, ctx.moduleDef));
    const outputFields = outputParamsStruct.getAllFields();
    for (const parameter of outputs) {
        if (!parameter.source) {
            continue;
        }
        const fieldName = parameter.name;
        const fieldType = outputFields[fieldName].type;
        if ((0, TypeDefinition_1.typeIsMessageData)(fieldType)) {
            const reconcilerDef = (0, DataflowProgramDefinition_1.getReconcilerDefForNode)(ctx.moduleDef, parameter.source.targetNode);
            (0, MonoBehaviourShared_1.genUnityMessageProxyDispatch)(classSpec, {
                storeDef: reconcilerDef.storeDef,
                fieldName,
                fieldType,
                proxyObj: (0, CsharpCodeGenImpl_1.privateMember)("currentObj"),
                initializerLines: runInitializerLines,
            });
        }
        else if ((0, TypeDefinition_1.typeIsStateData)(fieldType)) {
            genStateOutputParameterAccessors({
                classSpec,
                outputParamsStruct,
                fieldName,
                fieldType,
                runInitializerLines,
            });
        }
        else {
            (0, assert_1.default)(false, "Only message types are currently supported as output parameters");
        }
    }
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
    const { spawnInitializerLines, runInitializerLines } = genInputParameterAccessors(ctx, classSpec, programDef);
    genOutputParameterAccessors(ctx, classSpec, programDef, runInitializerLines);
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
