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
const DataflowProgramDefinition_1 = require("../../shared/DataflowProgramDefinition");
const Helpers_1 = require("../../shared/Helpers");
const StructType_1 = require("../../shared/StructType");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const CppCodeGenImpl = __importStar(require("../cpp/CppCodeGenImpl"));
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const SceneComponentShared_1 = require("./SceneComponentShared");
function genParameterAccessors(ctx, classSpec, programDef, cppIncludes) {
    const initializerLines = [];
    const spawnInitializerLines = [];
    const runInitializerLines = [];
    const currentObj = (0, CppCodeGenImpl_1.privateMember)("currentObj");
    const paramsStruct = new StructType_1.StructType(CppCodeGenImpl, "DataflowProgramParams", CppCodeGenImpl_1.XRPA_NAMESPACE, undefined, (0, DataflowProgramDefinition_1.getDataflowInputStructSpec)((0, DataflowProgramDefinition_1.getDataflowInputs)(programDef), ctx.moduleDef));
    const fields = paramsStruct.getAllFields();
    for (const paramName in fields) {
        const memberName = (0, Helpers_1.upperFirst)(paramName);
        const fieldType = fields[paramName].type;
        const setterName = `Set${memberName}`;
        const objSetterName = `set${(0, Helpers_1.upperFirst)(paramName)}`;
        const decorations = [
            `UPROPERTY(EditAnywhere, BlueprintReadWrite, BlueprintSetter = ${setterName})`
        ];
        paramsStruct.declareLocalFieldClassMember(classSpec, paramName, memberName, true, decorations, "public");
        initializerLines.push(...paramsStruct.resetLocalFieldVarToDefault(ctx.namespace, cppIncludes, paramName, memberName));
        spawnInitializerLines.push(`${(0, CppCodeGenImpl_1.genDerefMethodCall)("ret", objSetterName, [memberName])};`);
        runInitializerLines.push(`${(0, CppCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, [memberName])};`);
        classSpec.methods.push({
            name: setterName,
            parameters: [{
                    name: paramName,
                    type: fieldType,
                }],
            body: () => [
                // set the local member value
                `${memberName} = ${paramName};`,
                `if (${(0, CppCodeGenImpl_1.genNonNullCheck)(currentObj)}) {`,
                `  ${(0, CppCodeGenImpl_1.genDerefMethodCall)(currentObj, objSetterName, [paramName])};`,
                `}`,
            ],
            separateImplementation: true,
        });
    }
    return {
        initializerLines,
        spawnInitializerLines,
        runInitializerLines,
    };
}
function genDataflowProgramSpawner(ctx, fileWriter, outSrcDir, outHeaderDir, programDef, pluginName) {
    const storeDefs = programDef.programInterfaceNames.map(storeName => ctx.moduleDef.getDataStore(storeName));
    const dataStoreSubsystemTypes = storeDefs.map(storeDef => `U${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(storeDef)}`);
    const storeAccessors = storeDefs.map(storeDef => `GetWorld()->GetSubsystem<${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(storeDef)}>()`);
    const headerIncludes = new CppCodeGenImpl_1.CppIncludeAggregator([
        `Components/SceneComponent.h`,
        `CoreMinimal.h`,
        `<memory>`,
    ], undefined, programDef.programInterfaceNames.map(CppCodeGenImpl_1.getDataStoreHeaderName));
    const componentClassName = (0, SceneComponentShared_1.getComponentClassName)(null, programDef.interfaceName);
    const componentName = componentClassName.slice(1);
    const headerName = (0, SceneComponentShared_1.getComponentHeader)(programDef.interfaceName);
    const cppIncludes = new CppCodeGenImpl_1.CppIncludeAggregator([
        ...programDef.programInterfaceNames.map(CppCodeGenImpl_1.getDataStoreHeaderName),
        ...storeDefs.map(storeDef => `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(storeDef)}.h`),
    ]);
    const programClass = (0, CppCodeGenImpl_1.nsJoin)(ctx.namespace, programDef.interfaceName);
    const forwardDeclarations = [
        (0, CppCodeGenImpl_1.forwardDeclareClass)(programClass),
        ...dataStoreSubsystemTypes.map(CppCodeGenImpl_1.forwardDeclareClass),
    ];
    const classSpec = new ClassSpec_1.ClassSpec({
        name: componentClassName,
        superClass: "USceneComponent",
        namespace: "",
        includes: headerIncludes,
        decorations: [
            `UCLASS(ClassGroup = ${pluginName}, meta = (BlueprintSpawnableComponent))`,
        ],
        classNameDecoration: `${pluginName.toUpperCase()}_API`,
        classEarlyInject: ["GENERATED_BODY()"],
    });
    classSpec.members.push({
        name: "AutoRun",
        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.bool.typename,
        initialValue: false,
        visibility: "public",
        decorations: ["UPROPERTY(EditAnywhere, BlueprintReadWrite)"]
    });
    const { initializerLines, spawnInitializerLines, runInitializerLines } = genParameterAccessors(ctx, classSpec, programDef, cppIncludes);
    classSpec.constructors.push({
        body: initializerLines,
        separateImplementation: true,
    });
    classSpec.members.push({
        name: "currentObj",
        type: (0, CppCodeGenImpl_1.genObjectPtrType)(programClass),
        visibility: "private",
    });
    classSpec.methods.push({
        name: "BeginPlay",
        body: [
            `Super::BeginPlay();`,
            `if (AutoRun) {`,
            `  Run();`,
            `}`,
        ],
        visibility: "protected",
        isVirtual: true,
        isOverride: true,
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "EndPlay",
        parameters: [{
                name: "EndPlayReason",
                type: "const EEndPlayReason::Type",
            }],
        body: [
            `Stop();`,
            `Super::EndPlay(EndPlayReason);`,
        ],
        visibility: "protected",
        isVirtual: true,
        isOverride: true,
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "Run",
        body: () => {
            return [
                `Stop();`,
                `${(0, CppCodeGenImpl_1.privateMember)("currentObj")} = ${(0, CppCodeGenImpl_1.genCreateObject)(programClass, storeAccessors)};`,
                ...runInitializerLines,
            ];
        },
        visibility: "public",
        decorations: ["UFUNCTION(BlueprintCallable)"],
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "Stop",
        body: () => {
            return [
                `if (${(0, CppCodeGenImpl_1.genNonNullCheck)((0, CppCodeGenImpl_1.privateMember)("currentObj"))}) {`,
                `  ${(0, CppCodeGenImpl_1.genDerefMethodCall)((0, CppCodeGenImpl_1.privateMember)("currentObj"), "terminate", [])};`,
                `}`,
                `${(0, CppCodeGenImpl_1.privateMember)("currentObj")} = ${(0, CppCodeGenImpl_1.getNullValue)()};`,
            ];
        },
        visibility: "public",
        decorations: ["UFUNCTION(BlueprintCallable)"],
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "Spawn",
        returnType: (0, CppCodeGenImpl_1.genObjectPtrType)(programClass),
        body: () => {
            return [
                `auto ret = ${(0, CppCodeGenImpl_1.genCreateObject)(programClass, storeAccessors)};`,
                ...spawnInitializerLines,
                "return ret;",
            ];
        },
        visibility: "public",
        separateImplementation: true,
    });
    (0, SceneComponentShared_1.writeSceneComponent)(classSpec, {
        fileWriter,
        componentName,
        headerName,
        cppIncludes,
        headerIncludes,
        outSrcDir,
        outHeaderDir,
        forwardDeclarations,
    });
}
exports.genDataflowProgramSpawner = genDataflowProgramSpawner;
//# sourceMappingURL=GenDataflowProgramSpawner.js.map