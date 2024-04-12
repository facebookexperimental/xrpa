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
exports.genIndexedMonoBehaviour = void 0;
const assert_1 = __importDefault(require("assert"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpDatasetLibraryTypes_1 = require("../csharp/CsharpDatasetLibraryTypes");
const GenDataStore_1 = require("../csharp/GenDataStore");
const GenWriteReconcilerDataStore_1 = require("../csharp/GenWriteReconcilerDataStore");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
const PROXY_OBJ = "_reconciledObj";
function genComponentInit(ctx, includes, reconcilerDef) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const indexMemberName = (0, MonoBehaviourShared_1.getFieldMemberName)(reconcilerDef, reconcilerDef.indexedReconciled.fieldName);
    return [
        `if (_dsIsInitialized) {`,
        `  return;`,
        `}`,
        `_dsIsInitialized = true;`,
        `_changeBits = ${reconcilerDef.getOutboundChangeBits()};`,
        ``,
        ...(0, MonoBehaviourShared_1.genFieldInitializers)(ctx, includes, reconcilerDef, reconcilerDef.indexedReconciled.fieldName),
        ``,
        ...(0, MonoBehaviourShared_1.genTransformInitializers)(ctx, includes, reconcilerDef),
        ``,
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.getDataStoreAccessorName()}.AddIndexReconciledObject(${indexMemberName}, this);`,
    ];
}
function genComponentDeinit(ctx, reconcilerDef) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const indexMemberName = (0, MonoBehaviourShared_1.getFieldMemberName)(reconcilerDef, reconcilerDef.indexedReconciled.fieldName);
    return [
        `if (!_dsIsInitialized) {`,
        `  return;`,
        `}`,
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.MaybeInstance?.DataStore.${reconcilerDef.getDataStoreAccessorName()}.RemoveIndexReconciledObject(${indexMemberName});`,
        `_dsIsInitialized = false;`,
    ];
}
function getFieldSetterHooks(ctx, reconcilerDef) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const fieldName = reconcilerDef.indexedReconciled.fieldName;
    const indexMemberName = `_${(0, MonoBehaviourShared_1.getFieldMemberName)(reconcilerDef, fieldName)}`;
    return {
        [fieldName]: {
            preSet: [
                `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.getDataStoreAccessorName()}.RemoveIndexReconciledObject(${indexMemberName});`
            ],
            postSet: [
                `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.getDataStoreAccessorName()}.AddIndexReconciledObject(${indexMemberName}, this);`,
            ],
        }
    };
}
function genIndexedMonoBehaviour(ctx, fileWriter, reconcilerDef, outDir) {
    (0, assert_1.default)(reconcilerDef.indexedReconciled);
    const indexedFieldName = reconcilerDef.indexedReconciled.fieldName;
    const baseComponentType = (0, Helpers_1.filterToString)(reconcilerDef.componentProps.basetype) ?? "MonoBehaviour";
    (0, assert_1.default)(!reconcilerDef.type.interfaceType); // not yet supported
    let hasTransformMapping = false;
    const fields = reconcilerDef.type.getStateFields();
    for (const fieldName in fields) {
        if ((0, MonoBehaviourShared_1.checkForTransformMapping)(fieldName, reconcilerDef)) {
            hasTransformMapping = true;
        }
    }
    const rootIncludes = new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine"]);
    const readAccessor = reconcilerDef.type.getReadAccessorType(ctx.namespace, rootIncludes);
    const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, rootIncludes);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: (0, MonoBehaviourShared_1.getComponentClassName)(reconcilerDef.type, reconcilerDef.componentProps.idName),
        superClass: baseComponentType,
        interfaceName: `${CsharpDatasetLibraryTypes_1.IIndexReconciledType.getLocalType(ctx.namespace, rootIncludes)}<${readAccessor}, ${reconciledType}>`,
        namespace: ctx.namespace,
        includes: rootIncludes,
        decorations: reconcilerDef.componentProps.internalOnly ? [
            `[AddComponentMenu("")]`,
        ] : undefined,
    });
    (0, MonoBehaviourShared_1.genFieldProperties)(classSpec, { ctx, reconcilerDef, setterHooks: getFieldSetterHooks(ctx, reconcilerDef), indexedFieldName, proxyObj: PROXY_OBJ });
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
    const outboundChangeBits = reconcilerDef.getOutboundChangeBits();
    classSpec.methods.push({
        name: "SetDSReconciledObj",
        parameters: [{
                name: "reconciledObj",
                type: reconciledType,
            }],
        body: [
            `${PROXY_OBJ} = reconciledObj;`,
            ...(outboundChangeBits !== 0 ? [
                `if (${PROXY_OBJ} != null) {`,
                `  _changeBits = ${outboundChangeBits};`,
                `  ${PROXY_OBJ}.SetDirty();`,
                `}`,
            ] : []),
        ],
    });
    if (hasTransformMapping) {
        classSpec.methods.push({
            name: "Update",
            body: includes => (0, MonoBehaviourShared_1.genTransformUpdates)({ ctx, includes, reconcilerDef, proxyObj: PROXY_OBJ }),
            visibility: "private",
        });
    }
    classSpec.methods.push({
        name: "WriteDSChanges",
        body: includes => (0, GenWriteReconcilerDataStore_1.genWriteFunctionBody)({
            ctx,
            includes,
            reconcilerDef,
            fieldToMemberVar: fieldName => (0, MonoBehaviourShared_1.getFieldMemberName)(reconcilerDef, fieldName),
            canCreate: false,
            proxyObj: PROXY_OBJ,
        }),
    });
    classSpec.methods.push({
        name: "ProcessDSUpdate",
        parameters: [{
                name: "fieldsChanged",
                type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        body: includes => (0, MonoBehaviourShared_1.genProcessUpdateBody)({ ctx, includes, reconcilerDef, indexedFieldName, proxyObj: PROXY_OBJ }),
    });
    (0, MonoBehaviourShared_1.genUnityMessageFieldAccessors)(classSpec, {
        ctx,
        reconcilerDef,
        genMsgHandler: GenDataStore_1.genMsgHandler,
        proxyObj: PROXY_OBJ,
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
        name: PROXY_OBJ,
        type: reconciledType,
        visibility: "private",
    });
    classSpec.members.push({
        name: "changeBits",
        type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
        initialValue: "0",
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
exports.genIndexedMonoBehaviour = genIndexedMonoBehaviour;
//# sourceMappingURL=GenIndexedMonoBehaviour.js.map
