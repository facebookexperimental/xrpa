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
const GenDataStore_1 = require("../csharp/GenDataStore");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
const proxyObj = "_xrpaObject";
function genComponentInit(ctx, includes, reconcilerDef, initializerLines) {
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
        ``,
        ...(0, MonoBehaviourShared_1.genFieldInitializers)(ctx.namespace, includes, reconcilerDef),
        ``,
        ...(0, MonoBehaviourShared_1.genTransformInitializers)(ctx.namespace, includes, reconcilerDef),
        ``,
        `${proxyObj} = new ${reconcilerDef.type.getLocalType(ctx.namespace, includes)}(_id);`,
        `${proxyObj}.SetXrpaOwner(this);`,
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.type.getName()}.AddObject(${proxyObj});`,
        ...initializerLines,
    ];
}
function genComponentDeinit(ctx, reconcilerDef) {
    return [
        `if (!_dsIsInitialized) {`,
        `  return;`,
        `}`,
        `${proxyObj}.OnXrpaFieldsChanged(null);`,
        `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.MaybeInstance?.DataStore.${reconcilerDef.type.getName()}.RemoveObject(_id);`,
        `${proxyObj} = null;`,
        `_dsIsInitialized = false;`,
    ];
}
function genInterfaceComponentClass(ctx, fileWriter, type, outDir, baseComponentType) {
    const rootIncludes = new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine"]);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: (0, MonoBehaviourShared_1.getComponentClassName)(type),
        superClass: baseComponentType,
        namespace: ctx.namespace,
        includes: rootIncludes,
        decorations: [
            `[AddComponentMenu("")]`,
        ],
    });
    (0, MonoBehaviourShared_1.genDataStoreObjectAccessors)(ctx, classSpec);
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
    const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, rootIncludes);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: (0, MonoBehaviourShared_1.getComponentClassName)(reconcilerDef.type, reconcilerDef.componentProps.idName),
        superClass: parentClass,
        namespace: ctx.namespace,
        includes: rootIncludes,
        decorations: reconcilerDef.componentProps.internalOnly ? [
            `[AddComponentMenu("")]`,
        ] : undefined,
    });
    (0, MonoBehaviourShared_1.genFieldProperties)(classSpec, { ctx, reconcilerDef, setterHooks: {}, proxyObj });
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
            body: includes => (0, MonoBehaviourShared_1.genTransformUpdates)({ ctx, includes, reconcilerDef, proxyObj }),
            visibility: "private",
        });
    }
    classSpec.members.push({
        name: proxyObj,
        type: reconciledType,
        visibility: "protected",
    });
    classSpec.methods.push({
        name: "HandleXrpaFieldsChanged",
        parameters: [{
                name: "fieldsChanged",
                type: CsharpCodeGenImpl_1.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        body: includes => (0, MonoBehaviourShared_1.genProcessUpdateBody)({ ctx, includes, reconcilerDef, proxyObj }),
    });
    const initializerLines = [
        ...(0, MonoBehaviourShared_1.genFieldSetterCalls)({ ctx, reconcilerDef, proxyObj }),
        `${proxyObj}.OnXrpaFieldsChanged(HandleXrpaFieldsChanged);`,
    ];
    (0, MonoBehaviourShared_1.genUnityMessageFieldAccessors)(classSpec, {
        namespace: ctx.namespace,
        reconcilerDef,
        genMsgHandler: GenDataStore_1.genMsgHandler,
        proxyObj,
        initializerLines,
    });
    (0, MonoBehaviourShared_1.genUnitySignalFieldAccessors)(classSpec, {
        namespace: ctx.namespace,
        reconcilerDef,
        proxyObj,
        initializerLines,
    });
    classSpec.methods.push({
        name: "InitializeDS",
        body: includes => genComponentInit(ctx, includes, reconcilerDef, initializerLines),
        isOverride: Boolean(reconcilerDef.type.interfaceType),
    });
    classSpec.methods.push({
        name: "DeinitializeDS",
        body: genComponentDeinit(ctx, reconcilerDef),
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
