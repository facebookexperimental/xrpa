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
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const ClassSpec_1 = require("../../shared/ClassSpec");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const GenDataStore_1 = require("../cpp/GenDataStore");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const SceneComponentShared_1 = require("./SceneComponentShared");
const PROXY_OBJ = "xrpaObject_";
function genComponentInit(ctx, includes, reconcilerDef, initializerLines) {
    const id = (0, CppCodeGenImpl_1.genRuntimeGuid)({
        objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, includes),
        guidGen: ctx.moduleDef.guidGen,
        includes,
        idParts: (0, xrpa_utils_1.filterToNumberArray)(reconcilerDef.componentProps.id, 2),
    });
    return [
        `if (dsIsInitialized_) {`,
        `  return;`,
        `}`,
        `dsIsInitialized_ = true;`,
        `id_ = ${id};`,
        ``,
        ...(0, SceneComponentShared_1.genFieldInitializers)(ctx, includes, reconcilerDef),
        ``,
        ...(0, SceneComponentShared_1.genTransformInitializers)(ctx, includes, reconcilerDef),
        ``,
        `${PROXY_OBJ} = std::make_shared<${reconcilerDef.type.getLocalType(ctx.namespace, includes)}>(id_);`,
        `${PROXY_OBJ}->setXrpaOwner(this);`,
        `GetDataStoreSubsystem()->DataStore->${reconcilerDef.type.getName()}->addObject(${PROXY_OBJ});`,
        ...initializerLines,
    ];
}
function genComponentDeinit(ctx, reconcilerDef) {
    return [
        `if (!dsIsInitialized_) {`,
        `  return;`,
        `}`,
        `${PROXY_OBJ}->onXrpaFieldsChanged(nullptr);`,
        `GetDataStoreSubsystem()->DataStore->${reconcilerDef.type.getName()}->removeObject(id_);`,
        `${PROXY_OBJ}.reset();`,
        `dsIsInitialized_ = false;`,
    ];
}
function genDataStoreObjectAccessors(ctx, classSpec) {
    classSpec.methods.push({
        name: "getXrpaId",
        returnType: ctx.moduleDef.ObjectUuid.declareLocalReturnType(ctx.namespace, classSpec.includes, true),
        body: [
            "return id_;",
        ],
        isConst: true,
    });
    classSpec.members.push({
        name: "id",
        type: ctx.moduleDef.ObjectUuid,
        visibility: "protected",
    });
}
function genInterfaceComponentClass(ctx, fileWriter, type, outSrcDir, outHeaderDir, pluginName, baseComponentType, headerIncludes) {
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
            `UCLASS(ClassGroup = ${pluginName})`,
        ],
        classNameDecoration: `${pluginName.toUpperCase()}_API`,
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
function genSceneComponent(ctx, fileWriter, reconcilerDef, outSrcDir, outHeaderDir, pluginName) {
    const baseComponentType = (0, xrpa_utils_1.filterToString)(reconcilerDef.componentProps.basetype) ?? "SceneComponent";
    const headerIncludes = new CppCodeGenImpl_1.CppIncludeAggregator([
        `Components/${baseComponentType}.h`,
        `CoreMinimal.h`,
    ], undefined, [
        // scene component header is not allowed to include the datastore header, as that would cause a circular dependency
        (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname),
    ]);
    let parentClass = `U${baseComponentType}`;
    if (reconcilerDef.type.interfaceType) {
        parentClass = genInterfaceComponentClass(ctx, fileWriter, reconcilerDef.type.interfaceType, outSrcDir, outHeaderDir, pluginName, baseComponentType, headerIncludes);
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
    const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, cppIncludes);
    const reconciledTypePtr = reconcilerDef.type.getLocalTypePtr(ctx.namespace, cppIncludes);
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
            `UCLASS(ClassGroup = ${pluginName}${classMeta})`,
        ],
        classNameDecoration: `${pluginName.toUpperCase()}_API`,
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
    (0, SceneComponentShared_1.genFieldProperties)(classSpec, { ctx, reconcilerDef, proxyObj: PROXY_OBJ, separateImplementation: true });
    if (!reconcilerDef.type.interfaceType) {
        genDataStoreObjectAccessors(ctx, classSpec);
    }
    classSpec.members.push({
        name: PROXY_OBJ,
        type: reconciledTypePtr,
        visibility: "protected",
    });
    classSpec.methods.push({
        name: "handleXrpaFieldsChanged",
        parameters: [{
                name: "fieldsChanged",
                type: CppCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        body: includes => (0, SceneComponentShared_1.genProcessUpdateBody)({ ctx, includes, reconcilerDef, proxyObj: PROXY_OBJ }),
        separateImplementation: true,
    });
    const initializerLines = [
        ...(0, SceneComponentShared_1.genFieldSetterCalls)({ ctx, reconcilerDef, proxyObj: PROXY_OBJ }),
        `${PROXY_OBJ}->onXrpaFieldsChanged(${(0, CppCodeGenImpl_1.genPassthroughMethodBind)("handleXrpaFieldsChanged", 1)});`,
    ];
    (0, SceneComponentShared_1.genUEMessageFieldAccessors)(classSpec, {
        ctx,
        reconcilerDef,
        genMsgHandler: GenDataStore_1.genMsgHandler,
        proxyObj: PROXY_OBJ,
        initializerLines,
        forwardDeclarations,
    });
    classSpec.methods.push({
        name: "initializeDS",
        body: includes => genComponentInit(ctx, includes, reconcilerDef, initializerLines),
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
