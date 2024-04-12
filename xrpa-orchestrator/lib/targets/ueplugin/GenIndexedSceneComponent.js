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
exports.genIndexedSceneComponent = void 0;
const assert_1 = __importDefault(require("assert"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const GenDataStore_1 = require("../cpp/GenDataStore");
const GenWriteReconcilerDataStore_1 = require("../cpp/GenWriteReconcilerDataStore");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const SceneComponentShared_1 = require("./SceneComponentShared");
const PROXY_OBJ = "reconciledObj_";
function genComponentInit(ctx, includes, reconcilerDef) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const indexMemberName = (0, SceneComponentShared_1.getFieldMemberName)(reconcilerDef, reconcilerDef.indexedReconciled.fieldName);
    return [
        `if (dsIsInitialized_) {`,
        `  return;`,
        `}`,
        `dsIsInitialized_ = true;`,
        `changeBits_ = ${reconcilerDef.getOutboundChangeBits()};`,
        ``,
        ...(0, SceneComponentShared_1.genFieldInitializers)(ctx, includes, reconcilerDef, reconcilerDef.indexedReconciled.fieldName),
        ``,
        ...(0, SceneComponentShared_1.genTransformInitializers)(ctx, includes, reconcilerDef),
        ``,
        `GetDataStoreSubsystem()->DataStore->${reconcilerDef.getDataStoreAccessorName()}->addIndexReconciledObject(${indexMemberName}, this);`,
    ];
}
function genComponentDeinit(ctx, reconcilerDef) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const indexMemberName = (0, SceneComponentShared_1.getFieldMemberName)(reconcilerDef, reconcilerDef.indexedReconciled.fieldName);
    return [
        `if (!dsIsInitialized_) {`,
        `  return;`,
        `}`,
        `GetDataStoreSubsystem()->DataStore->${reconcilerDef.getDataStoreAccessorName()}->removeIndexReconciledObject(${indexMemberName});`,
        `dsIsInitialized_ = false;`,
    ];
}
function getFieldSetterHooks(ctx, reconcilerDef) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const fieldName = reconcilerDef.indexedReconciled.fieldName;
    const indexMemberName = (0, SceneComponentShared_1.getFieldMemberName)(reconcilerDef, fieldName);
    return {
        [fieldName]: {
            preSet: [
                `GetDataStoreSubsystem()->DataStore->${reconcilerDef.getDataStoreAccessorName()}->removeIndexReconciledObject(${indexMemberName});`
            ],
            postSet: [
                `GetDataStoreSubsystem()->DataStore->${reconcilerDef.getDataStoreAccessorName()}->addIndexReconciledObject(${indexMemberName}, this);`,
            ],
        }
    };
}
function genIndexedSceneComponent(ctx, fileWriter, reconcilerDef, outSrcDir, outHeaderDir) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const baseComponentType = (0, Helpers_1.filterToString)(reconcilerDef.componentProps.basetype) ?? "SceneComponent";
    const headerIncludes = new CppCodeGenImpl_1.CppIncludeAggregator([
        `Components/${baseComponentType}.h`,
        `CoreMinimal.h`,
        `<memory>`,
    ], undefined, [
        // scene component header is not allowed to include the datastore header, as that would cause a circular dependency
        (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname),
    ]);
    const parentClass = `U${baseComponentType}`;
    (0, assert_1.default)(!reconcilerDef.type.interfaceType); // not yet supported
    const componentClassName = (0, SceneComponentShared_1.getComponentClassName)(null, reconcilerDef.type, reconcilerDef.componentProps.idName);
    const componentName = componentClassName.slice(1);
    const headerName = (0, SceneComponentShared_1.getComponentHeader)(reconcilerDef.type, reconcilerDef.componentProps.idName);
    let hasTransformMapping = false;
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if ((0, SceneComponentShared_1.checkForTransformMapping)(fieldName, reconcilerDef)) {
            hasTransformMapping = true;
        }
    }
    const cppIncludes = new CppCodeGenImpl_1.CppIncludeAggregator([
        (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname),
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.h`,
    ]);
    const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, cppIncludes);
    const reconciledTypePtr = reconcilerDef.type.getLocalTypePtr(ctx.namespace, cppIncludes);
    const indexedFieldName = reconcilerDef.indexedReconciled.fieldName;
    const outboundChangeBits = reconcilerDef.getOutboundChangeBits();
    const setterHooks = getFieldSetterHooks(ctx, reconcilerDef);
    const forwardDeclarations = [
        (0, CppCodeGenImpl_1.forwardDeclareClass)(reconciledType),
        (0, CppCodeGenImpl_1.forwardDeclareClass)(`U${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}`),
    ];
    const classMeta = reconcilerDef.componentProps.internalOnly ? "" : ", meta = (BlueprintSpawnableComponent)";
    const classSpec = new ClassSpec_1.ClassSpec({
        name: componentClassName,
        superClass: parentClass,
        namespace: ctx.namespace,
        includes: headerIncludes,
        decorations: [
            `UCLASS(ClassGroup = ${ctx.moduleDef.name}${classMeta})`,
        ],
        classNameDecoration: `${ctx.moduleDef.name.toUpperCase()}_API`,
        classEarlyInject: ["GENERATED_BODY()"],
    });
    classSpec.constructors.push({
        body: includes => {
            return [
                ...(hasTransformMapping ? [
                    `bWantsOnUpdateTransform = ${hasTransformMapping};`,
                ] : []),
                ...(0, SceneComponentShared_1.genFieldDefaultInitializers)(ctx, includes, reconcilerDef),
            ];
        },
        separateImplementation: true,
    });
    (0, SceneComponentShared_1.genFieldProperties)(classSpec, { ctx, reconcilerDef, setterHooks, indexedFieldName, proxyObj: PROXY_OBJ, separateImplementation: true });
    classSpec.methods.push({
        name: "setDSReconciledObj",
        parameters: [{
                name: "reconciledObj",
                type: `const ${reconciledTypePtr}&`,
            }],
        body: [
            `${PROXY_OBJ} = reconciledObj;`,
            ...((outboundChangeBits !== 0 ? [
                `if (${PROXY_OBJ}) {`,
                `  changeBits_ = ${outboundChangeBits};`,
                `  ${PROXY_OBJ}->setDirty();`,
                `}`,
            ] : [])),
        ],
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "writeDSChanges",
        body: includes => (0, GenWriteReconcilerDataStore_1.genWriteFunctionBody)({
            ctx,
            includes,
            reconcilerDef,
            fieldToMemberVar: fieldName => (0, SceneComponentShared_1.getFieldMemberName)(reconcilerDef, fieldName),
            canCreate: false,
            proxyObj: PROXY_OBJ,
        }),
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "processDSUpdate",
        parameters: [{
                name: "fieldsChanged",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        body: includes => (0, SceneComponentShared_1.genProcessUpdateBody)({ ctx, includes, reconcilerDef, indexedFieldName, proxyObj: PROXY_OBJ }),
        isVirtual: true,
        separateImplementation: true,
    });
    (0, SceneComponentShared_1.genUEMessageFieldAccessors)(classSpec, {
        ctx,
        reconcilerDef,
        genMsgHandler: GenDataStore_1.genMsgHandler,
        proxyObj: PROXY_OBJ,
    });
    (0, SceneComponentShared_1.genUEMessageChannelDispatch)(classSpec, { ctx, reconcilerDef });
    classSpec.methods.push({
        name: "initializeDS",
        body: includes => genComponentInit(ctx, includes, reconcilerDef),
        isVirtual: Boolean(reconcilerDef.type.interfaceType),
        isOverride: Boolean(reconcilerDef.type.interfaceType),
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "deinitializeDS",
        body: genComponentDeinit(ctx, reconcilerDef),
        visibility: "protected",
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "BeginPlay",
        body: [
            `Super::BeginPlay();`,
            `initializeDS();`,
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
            `deinitializeDS();`,
            `Super::EndPlay(EndPlayReason);`,
        ],
        visibility: "protected",
        isVirtual: true,
        isOverride: true,
        separateImplementation: true,
    });
    if (hasTransformMapping) {
        classSpec.methods.push({
            name: "OnUpdateTransform",
            parameters: [{
                    name: "UpdateTransformFlags",
                    type: "EUpdateTransformFlags",
                }, {
                    name: "Teleport",
                    type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
                    defaultValue: "ETeleportType::None",
                }],
            body: includes => {
                return [
                    `Super::OnUpdateTransform(UpdateTransformFlags, Teleport);`,
                    ``,
                    ...(0, SceneComponentShared_1.genTransformUpdates)({ ctx, includes, reconcilerDef, proxyObj: PROXY_OBJ }),
                ];
            },
            visibility: "protected",
            isVirtual: true,
            isOverride: true,
            separateImplementation: true,
        });
    }
    classSpec.methods.push({
        name: "GetDataStoreSubsystem",
        returnType: `U${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}*`,
        body: [
            `return GetWorld()->GetSubsystem<U${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}>();`,
        ],
        visibility: "protected",
        separateImplementation: true,
    });
    classSpec.members.push({
        name: PROXY_OBJ,
        type: reconciledTypePtr,
        visibility: "protected",
    });
    classSpec.members.push({
        name: "changeBits",
        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
        initialValue: "0",
        visibility: "protected",
    });
    classSpec.members.push({
        name: "dsIsInitialized",
        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.bool.typename,
        initialValue: "false",
        visibility: "protected",
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
exports.genIndexedSceneComponent = genIndexedSceneComponent;
//# sourceMappingURL=GenIndexedSceneComponent.js.map
