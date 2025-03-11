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
exports.genMonoBehaviour = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const ClassSpec_1 = require("../../shared/ClassSpec");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpDatasetLibraryTypes_1 = require("../csharp/CsharpDatasetLibraryTypes");
const GenDataStore_1 = require("../csharp/GenDataStore");
const GenWriteReconcilerDataStore_1 = require("../csharp/GenWriteReconcilerDataStore");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
function genComponentInit(ctx, includes, reconcilerDef) {
    const id = (0, CsharpCodeGenImpl_1.genRuntimeGuid)({
        objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, includes),
        guidGen: ctx.moduleDef.guidGen,
        includes,
        idParts: (0, xrpa_utils_1.filterToNumberArray)(reconcilerDef.componentProps.id, 2),
    });
    return [
        `if (_dsIsInitialized) {`,
        `  return;`,
        `}`,
        `_dsIsInitialized = true;`,
        `_id = ${id};`,
        `_hasNotifiedNeedsWrite = false;`,
        `_createWritten = false;`,
        ``,
        ...(0, MonoBehaviourShared_1.genFieldInitializers)(ctx, includes, reconcilerDef),
        ``,
        ...(0, MonoBehaviourShared_1.genTransformInitializers)(ctx, includes, reconcilerDef),
        ``,
        `_createTimestamp = ${(0, CsharpCodeGenImpl_1.genGetCurrentClockTime)()};`,
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.type.getName()}.AddObject(this);`,
    ];
}
function genComponentDeinit(ctx, reconcilerDef) {
    return [
        `if (!_dsIsInitialized) {`,
        `  return;`,
        `}`,
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.MaybeInstance?.DataStore.${reconcilerDef.type.getName()}.RemoveObject(_id);`,
        `_dsIsInitialized = false;`,
    ];
}
function genInterfaceComponentClass(ctx, fileWriter, type, outDir, baseComponentType) {
    const rootIncludes = new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine"]);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: (0, MonoBehaviourShared_1.getComponentClassName)(type),
        superClass: baseComponentType,
        interfaceName: CsharpDatasetLibraryTypes_1.IDataStoreObject.getLocalType(ctx.namespace, rootIncludes),
        namespace: ctx.namespace,
        includes: rootIncludes,
        decorations: [
            `[AddComponentMenu("")]`,
        ],
    });
    (0, MonoBehaviourShared_1.genDataStoreObjectAccessors)(ctx, classSpec);
    classSpec.methods.push({
        name: "WriteDSChanges",
        parameters: [{
                name: "accessor",
                type: CsharpDatasetLibraryTypes_1.TransportStreamAccessor,
            }],
        body: [],
        isAbstract: true,
    });
    classSpec.methods.push({
        name: "ProcessDSMessage",
        parameters: [{
                name: "messageType",
                type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "timestamp",
                type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
            }, {
                name: "messageData",
                type: CsharpDatasetLibraryTypes_1.MemoryAccessor,
            }],
        body: [],
        isAbstract: true,
    });
    classSpec.methods.push({
        name: "InitializeDS",
        body: [],
        isVirtual: true,
    });
    (0, MonoBehaviourShared_1.writeMonoBehaviour)(classSpec, { fileWriter, outDir });
    return classSpec.name;
}
function genMonoBehaviour(ctx, fileWriter, reconcilerDef, outDir) {
    const baseComponentType = (0, xrpa_utils_1.filterToString)(reconcilerDef.componentProps.basetype) ?? "MonoBehaviour";
    let parentClass = `${baseComponentType}`;
    if (reconcilerDef.type.interfaceType) {
        parentClass = genInterfaceComponentClass(ctx, fileWriter, reconcilerDef.type.interfaceType, outDir, baseComponentType);
    }
    let hasTransformMapping = false;
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if ((0, MonoBehaviourShared_1.checkForTransformMapping)(fieldName, reconcilerDef)) {
            hasTransformMapping = true;
        }
    }
    const rootIncludes = new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine"]);
    const readAccessor = reconcilerDef.type.getReadAccessorType(ctx.namespace, rootIncludes);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: (0, MonoBehaviourShared_1.getComponentClassName)(reconcilerDef.type, reconcilerDef.componentProps.idName),
        superClass: parentClass,
        interfaceName: `${CsharpDatasetLibraryTypes_1.IDataStoreObjectAccessor.getLocalType(ctx.namespace, rootIncludes)}<${readAccessor}>`,
        namespace: ctx.namespace,
        includes: rootIncludes,
        decorations: reconcilerDef.componentProps.internalOnly ? [
            `[AddComponentMenu("")]`,
        ] : undefined,
    });
    (0, MonoBehaviourShared_1.genFieldProperties)(classSpec, { ctx, reconcilerDef, setterHooks: {}, proxyObj: null });
    classSpec.methods.push({
        name: "Start",
        body: [
            `InitializeDS();`,
        ],
        visibility: "private",
    });
    classSpec.methods.push({
        name: "OnDestroy",
        body: [
            `DeinitializeDS();`,
        ],
        visibility: "private",
    });
    if (!reconcilerDef.type.interfaceType) {
        (0, MonoBehaviourShared_1.genDataStoreObjectAccessors)(ctx, classSpec);
    }
    if (hasTransformMapping) {
        classSpec.methods.push({
            name: "Update",
            body: includes => (0, MonoBehaviourShared_1.genTransformUpdates)({ ctx, includes, reconcilerDef, proxyObj: null }),
            visibility: "private",
        });
    }
    classSpec.methods.push({
        name: "WriteDSChanges",
        parameters: [{
                name: "accessor",
                type: CsharpDatasetLibraryTypes_1.TransportStreamAccessor,
            }],
        body: includes => (0, GenWriteReconcilerDataStore_1.genWriteFunctionBody)({
            ctx,
            includes,
            reconcilerDef,
            fieldToMemberVar: fieldName => (0, MonoBehaviourShared_1.getFieldMemberName)(reconcilerDef, fieldName),
            canCreate: true,
            proxyObj: null,
        }),
        isOverride: Boolean(reconcilerDef.type.interfaceType),
    });
    classSpec.methods.push({
        name: "PrepDSFullUpdate",
        returnType: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
        body: includes => (0, GenWriteReconcilerDataStore_1.genPrepFullUpdateFunctionBody)({
            ctx,
            includes,
            reconcilerDef,
            fieldToMemberVar: fieldName => (0, MonoBehaviourShared_1.getFieldMemberName)(reconcilerDef, fieldName),
            canCreate: true,
        }),
    });
    classSpec.methods.push({
        name: "ProcessDSUpdate",
        parameters: [{
                name: "value",
                type: readAccessor,
            }, {
                name: "fieldsChanged",
                type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        body: includes => (0, MonoBehaviourShared_1.genProcessUpdateBody)({ ctx, includes, reconcilerDef, proxyObj: null }),
    });
    (0, MonoBehaviourShared_1.genUnityMessageFieldAccessors)(classSpec, {
        ctx,
        reconcilerDef,
        genMsgHandler: GenDataStore_1.genMsgHandler,
        proxyObj: null,
    });
    (0, MonoBehaviourShared_1.genUnityMessageChannelDispatch)(classSpec, {
        ctx,
        reconcilerDef,
    });
    classSpec.methods.push({
        name: "InitializeDS",
        body: includes => genComponentInit(ctx, includes, reconcilerDef),
        isOverride: Boolean(reconcilerDef.type.interfaceType),
    });
    classSpec.methods.push({
        name: "DeinitializeDS",
        body: genComponentDeinit(ctx, reconcilerDef),
        visibility: "private",
    });
    classSpec.members.push({
        name: "createTimestamp",
        type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
        initialValue: "0",
        visibility: "private",
    });
    classSpec.members.push({
        name: "changeBits",
        type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
        initialValue: "0",
        visibility: "private",
    });
    classSpec.members.push({
        name: "changeByteCount",
        type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.int32.typename,
        initialValue: "0",
        visibility: "private",
    });
    classSpec.members.push({
        name: "createWritten",
        type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.bool.typename,
        initialValue: "false",
        visibility: "private",
    });
    classSpec.members.push({
        name: "dsIsInitialized",
        type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.bool.typename,
        initialValue: "false",
        visibility: "protected",
    });
    (0, MonoBehaviourShared_1.writeMonoBehaviour)(classSpec, { fileWriter, outDir });
}
exports.genMonoBehaviour = genMonoBehaviour;
//# sourceMappingURL=GenMonoBehaviour.js.map
