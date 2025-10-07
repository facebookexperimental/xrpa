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


import { FileWriter } from "@xrpa/xrpa-file-utils";
import { filterToNumberArray, filterToString } from "@xrpa/xrpa-utils";

import { ClassSpec } from "../../shared/ClassSpec";
import { OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { InterfaceTypeDefinition } from "../../shared/TypeDefinition";
import { CsIncludeAggregator, genRuntimeGuid, PRIMITIVE_INTRINSICS } from "../csharp/CsharpCodeGenImpl";
import { genMsgHandler } from "../csharp/GenDataStore";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import { getDataStoreSubsystemName } from "./GenDataStoreSubsystem";
import {
  checkForTransformMapping,
  genDataStoreObjectAccessors,
  genFieldInitializers,
  genFieldProperties,
  genFieldSetterCalls,
  genProcessUpdateBody,
  genTransformInitializers,
  genTransformUpdates,
  genUnityMessageFieldAccessors,
  genUnitySignalFieldAccessors,
  getComponentClassName,
  writeMonoBehaviour,
} from "./MonoBehaviourShared";

const proxyObj = "_xrpaObject";

function genComponentInit(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: OutputReconcilerDefinition,
  initializerLines: string[],
): string[] {
  const id = genRuntimeGuid({
    objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, includes),
    guidGen: ctx.moduleDef.guidGen,
    includes,
    idParts: filterToNumberArray(reconcilerDef.componentProps.id, 2),
  });

  return [
    `if (_dsIsInitialized) {`,
    `  return;`,
    `}`,
    `_dsIsInitialized = true;`,
    `_id = ${id};`,
    ``,
    ...genFieldInitializers(ctx.namespace, includes, reconcilerDef),
    ``,
    ...genTransformInitializers(ctx.namespace, includes, reconcilerDef),
    ``,
    `${proxyObj} = new ${reconcilerDef.type.getLocalType(ctx.namespace, includes)}(_id);`,
    `${proxyObj}.SetXrpaOwner(this);`,
    `${getDataStoreSubsystemName(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.type.getName()}.AddObject(${proxyObj});`,
    ...initializerLines,
  ];
}

function genComponentDeinit(ctx: GenDataStoreContext, reconcilerDef: OutputReconcilerDefinition): string[] {
  return [
    `if (!_dsIsInitialized) {`,
    `  return;`,
    `}`,
    `${proxyObj}.OnXrpaFieldsChanged(null);`,
    `${getDataStoreSubsystemName(ctx.storeDef)}.MaybeInstance?.DataStore.${reconcilerDef.type.getName()}.RemoveObject(_id);`,
    `${proxyObj} = null;`,
    `_dsIsInitialized = false;`,
  ];
}

function genInterfaceComponentClass(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  type: InterfaceTypeDefinition,
  outDir: string,
  baseComponentType: string,
): string {
  const rootIncludes = new CsIncludeAggregator(["UnityEngine"]);
  const classSpec = new ClassSpec({
    name: getComponentClassName(type),
    superClass: baseComponentType,
    namespace: ctx.namespace,
    includes: rootIncludes,
    decorations: [
      `[AddComponentMenu("")]`,
    ],
  });

  genDataStoreObjectAccessors(ctx, classSpec);

  classSpec.methods.push({
    name: "InitializeDS",
    body: [],
    isVirtual: true,
  });

  writeMonoBehaviour(classSpec, { fileWriter, outDir });

  return classSpec.name;
}

export function genMonoBehaviour(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  reconcilerDef: OutputReconcilerDefinition,
  outDir: string,
) {
  const baseComponentType: string = filterToString(reconcilerDef.componentProps.basetype) ?? "MonoBehaviour";

  let parentClass = `${baseComponentType}`;
  if (reconcilerDef.type.interfaceType) {
    parentClass = genInterfaceComponentClass(ctx, fileWriter, reconcilerDef.type.interfaceType, outDir, baseComponentType);
  }

  let hasTransformMapping = false;
  const fields = reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    if (checkForTransformMapping(fieldName, reconcilerDef)) {
      hasTransformMapping = true;
    }
  }

  const rootIncludes = new CsIncludeAggregator(["UnityEngine"]);
  const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, rootIncludes);
  const classSpec = new ClassSpec({
    name: getComponentClassName(reconcilerDef.type, reconcilerDef.componentProps.idName),
    superClass: parentClass,
    namespace: ctx.namespace,
    includes: rootIncludes,
    decorations: reconcilerDef.componentProps.internalOnly ? [
      `[AddComponentMenu("")]`,
    ] : undefined,
  });

  genFieldProperties(classSpec, { ctx, reconcilerDef, setterHooks: {}, proxyObj });

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
    genDataStoreObjectAccessors(ctx, classSpec);
  }

  if (hasTransformMapping) {
    classSpec.methods.push({
      name: "Update",
      body: includes => genTransformUpdates({ ctx, includes, reconcilerDef, proxyObj }),
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
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }],
    body: includes => genProcessUpdateBody({ ctx, includes, reconcilerDef, proxyObj }),
  });

  const initializerLines = [
    ...genFieldSetterCalls({ ctx, reconcilerDef, proxyObj }),
    `${proxyObj}.OnXrpaFieldsChanged(HandleXrpaFieldsChanged);`,
  ];

  genUnityMessageFieldAccessors(classSpec, {
    namespace: ctx.namespace,
    reconcilerDef,
    genMsgHandler,
    proxyObj,
    initializerLines,
  });

  genUnitySignalFieldAccessors(classSpec, {
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
    type: PRIMITIVE_INTRINSICS.bool.typename,
    initialValue: "false",
    visibility: "protected",
  });

  writeMonoBehaviour(classSpec, { fileWriter, outDir });
}
