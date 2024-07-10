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

Object.defineProperty(exports, "__esModule", { value: true });
exports.genSceneComponent = void 0;
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("../cpp/CppDatasetLibraryTypes");
const GenDataStore_1 = require("../cpp/GenDataStore");
const GenWriteReconcilerDataStore_1 = require("../cpp/GenWriteReconcilerDataStore");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const SceneComponentShared_1 = require("./SceneComponentShared");
function genComponentInit(ctx, includes, reconcilerDef) {
    const id = (0, CppCodeGenImpl_1.genRuntimeGuid)({
        dsIdentifierType: ctx.moduleDef.DSIdentifier.getLocalType(ctx.namespace, includes),
        guidGen: ctx.moduleDef.guidGen,
        includes,
        idParts: (0, Helpers_1.filterToNumberArray)(reconcilerDef.componentProps.id, 2),
    });
    const bitMask = reconcilerDef.getOutboundChangeBits();
    return [
        `if (dsIsInitialized_) {`,
        `  return;`,
        `}`,
        `dsIsInitialized_ = true;`,
        `id_ = ${id};`,
        `changeBits_ = ${bitMask};`,
        ``,
        ...(0, SceneComponentShared_1.genFieldInitializers)(ctx, includes, reconcilerDef),
        ``,
        ...(0, SceneComponentShared_1.genTransformInitializers)(ctx, includes, reconcilerDef),
        ``,
        `createTimestamp_ = ${CppCodeGenImpl_1.GET_CURRENT_CLOCK_TIME};`,
        `GetDataStoreSubsystem()->DataStore->${reconcilerDef.getDataStoreAccessorName()}->addObject(this);`,
    ];
}
function genComponentDeinit(ctx, reconcilerDef) {
    return [
        `if (!dsIsInitialized_) {`,
        `  return;`,
        `}`,
        `GetDataStoreSubsystem()->DataStore->${reconcilerDef.getDataStoreAccessorName()}->removeObject(id_);`,
        `dsIsInitialized_ = false;`,
    ];
}
function genDataStoreObjectAccessors(ctx, classSpec) {
    classSpec.methods.push({
        name: "getXrpaId",
        returnType: ctx.moduleDef.DSIdentifier.declareLocalReturnType(ctx.namespace, classSpec.includes, true),
        body: [
            "return id_;",
        ],
        isConst: true,
    });
    classSpec.members.push({
        name: "id",
        type: ctx.moduleDef.DSIdentifier,
        visibility: "protected",
    });
    classSpec.methods.push({
        name: "setXrpaCollection",
        parameters: [{
                name: "collection",
                type: CppDatasetLibraryTypes_1.CollectionInterface.getLocalType(ctx.namespace, classSpec.includes) + "*",
            }],
        body: [
            `collection_ = collection;`,
        ],
    });
    classSpec.methods.push({
        name: "getCollectionId",
        returnType: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
        body: [
            `return collection_ == nullptr ? -1 : collection_->getId();`,
        ],
    });
    classSpec.members.push({
        name: "collection",
        type: CppDatasetLibraryTypes_1.CollectionInterface.getLocalType(ctx.namespace, classSpec.includes) + "*",
        initialValue: "nullptr",
        visibility: "protected",
    });
}
function genInterfaceComponentClass(ctx, fileWriter, type, outSrcDir, outHeaderDir, baseComponentType, headerIncludes) {
    const componentClassName = (0, SceneComponentShared_1.getComponentClassName)(null, type);
    const componentName = componentClassName.slice(1);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: componentClassName,
        superClass: `U${baseComponentType}`,
        namespace: ctx.namespace,
        includes: new CppCodeGenImpl_1.CppIncludeAggregator([
            `Components/${baseComponentType}.h`,
            `CoreMinimal.h`,
        ]),
        decorations: [
            `UCLASS(ClassGroup = ${ctx.moduleDef.name})`,
        ],
        classNameDecoration: `${ctx.moduleDef.name.toUpperCase()}_API`,
        classEarlyInject: ["GENERATED_BODY()"],
    });
    classSpec.constructors.push({
        separateImplementation: true,
    });
    genDataStoreObjectAccessors(ctx, classSpec);
    classSpec.methods.push({
        name: "initializeDS",
        body: [],
        isVirtual: true,
    });
    (0, SceneComponentShared_1.writeSceneComponent)(classSpec, {
        fileWriter,
        componentName,
        headerName: `${componentName}.h`,
        cppIncludes: new CppCodeGenImpl_1.CppIncludeAggregator([]),
        headerIncludes: classSpec.includes,
        outSrcDir,
        outHeaderDir,
        forwardDeclarations: [],
    });
    headerIncludes?.addFile({ filename: `${componentName}.h` });
    return `${componentClassName}`;
}
function genSceneComponent(ctx, fileWriter, reconcilerDef, outSrcDir, outHeaderDir) {
    const baseComponentType = (0, Helpers_1.filterToString)(reconcilerDef.componentProps.basetype) ?? "SceneComponent";
    const headerIncludes = new CppCodeGenImpl_1.CppIncludeAggregator([
        `Components/${baseComponentType}.h`,
        `CoreMinimal.h`,
    ], undefined, [
        // scene component header is not allowed to include the datastore header, as that would cause a circular dependency
        (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname),
    ]);
    let parentClass = `U${baseComponentType}`;
    if (reconcilerDef.type.interfaceType) {
        parentClass = genInterfaceComponentClass(ctx, fileWriter, reconcilerDef.type.interfaceType, outSrcDir, outHeaderDir, baseComponentType, headerIncludes);
    }
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
    const readAccessorType = reconcilerDef.type.getReadAccessorType(ctx.namespace, cppIncludes);
    const forwardDeclarations = [
        (0, CppCodeGenImpl_1.forwardDeclareClass)(readAccessorType),
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
    (0, SceneComponentShared_1.genFieldProperties)(classSpec, { ctx, reconcilerDef, setterHooks: {}, proxyObj: null, separateImplementation: true });
    if (!reconcilerDef.type.interfaceType) {
        genDataStoreObjectAccessors(ctx, classSpec);
    }
    classSpec.methods.push({
        name: "writeDSChanges",
        parameters: [{
                name: "accessor",
                type: CppDatasetLibraryTypes_1.DatasetAccessor.getLocalType(ctx.namespace, classSpec.includes) + "*",
            }],
        body: includes => (0, GenWriteReconcilerDataStore_1.genWriteFunctionBody)({
            ctx,
            includes,
            reconcilerDef,
            fieldToMemberVar: fieldName => (0, SceneComponentShared_1.getFieldMemberName)(reconcilerDef, fieldName),
            canCreate: true,
            proxyObj: null,
        }),
        separateImplementation: true,
    });
    classSpec.methods.push({
        name: "processDSUpdate",
        parameters: [{
                name: "value",
                type: `const ${readAccessorType}&`,
            }, {
                name: "fieldsChanged",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        body: includes => (0, SceneComponentShared_1.genProcessUpdateBody)({ ctx, includes, reconcilerDef, proxyObj: null }),
        isVirtual: true,
        separateImplementation: true,
    });
    (0, SceneComponentShared_1.genUEMessageFieldAccessors)(classSpec, {
        ctx,
        reconcilerDef,
        genMsgHandler: GenDataStore_1.genMsgHandler,
        proxyObj: null,
    });
    (0, SceneComponentShared_1.genUEMessageChannelDispatch)(classSpec, {
        ctx,
        reconcilerDef,
    });
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
                    type: "ETeleportType",
                    defaultValue: "ETeleportType::None",
                }],
            body: includes => {
                return [
                    `Super::OnUpdateTransform(UpdateTransformFlags, Teleport);`,
                    ``,
                    ...(0, SceneComponentShared_1.genTransformUpdates)({ ctx, includes, reconcilerDef, proxyObj: null }),
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
        name: "createTimestamp",
        type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
        initialValue: "0",
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
exports.genSceneComponent = genSceneComponent;
//# sourceMappingURL=GenSceneComponent.js.map
