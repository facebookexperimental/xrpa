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
import { filterToString } from "@xrpa/xrpa-utils";
import assert from "assert";

import { ClassSpec } from "../../shared/ClassSpec";
import { InputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { CsIncludeAggregator, PRIMITIVE_INTRINSICS, privateMember } from "../csharp/CsharpCodeGenImpl";
import { IIndexBoundType } from "../csharp/CsharpDatasetLibraryTypes";
import { genMsgHandler } from "../csharp/GenDataStore";
import { FieldSetterHooks } from "../csharp/GenWriteReconcilerDataStore";
import { getDataStoreSubsystemName } from "./GenDataStoreSubsystem";
import {
  checkForTransformMapping,
  genFieldInitializers,
  genFieldProperties,
  genFieldSetterCalls,
  genProcessUpdateBody,
  genTransformInitializers,
  genTransformUpdates,
  genUnityMessageFieldAccessors,
  genUnitySignalFieldAccessors,
  getComponentClassName,
  getFieldMemberName,
  writeMonoBehaviour,
} from "./MonoBehaviourShared";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import { genIndexedBindingCalls } from "../csharp/GenReadReconcilerDataStore";
import { genCollectionEntitySpawner } from "./GenCollectionEntitySpawner";

function genComponentInit(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition,
  proxyObj: string | null,
): string[] {
  const bindingCalls = genIndexedBindingCalls(
    ctx,
    reconcilerDef,
    `${getDataStoreSubsystemName(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.type.getName()}`,
    "this",
    getFieldMemberName,
  );

  return [
    `if (_dsIsInitialized) {`,
    `  return;`,
    `}`,
    `_dsIsInitialized = true;`,
    ...(proxyObj ? [] : [
      `_hasNotifiedNeedsWrite = false;`,
    ]),
    ``,
    ...genFieldInitializers(ctx.namespace, includes, reconcilerDef),
    ``,
    ...genTransformInitializers(ctx.namespace, includes, reconcilerDef),
    ``,
    ...Object.values(bindingCalls).map(bindings => bindings.addBinding),
  ];
}

function genComponentDeinit(ctx: GenDataStoreContext, reconcilerDef: InputReconcilerDefinition): string[] {
  const bindingCalls = genIndexedBindingCalls(
    ctx,
    reconcilerDef,
    `${getDataStoreSubsystemName(ctx.storeDef)}.MaybeInstance?.DataStore.${reconcilerDef.type.getName()}`,
    "this",
    getFieldMemberName,
  );

  return [
    `if (!_dsIsInitialized) {`,
    `  return;`,
    `}`,
    ...Object.values(bindingCalls).map(bindings => bindings.removeBinding),
    `_dsIsInitialized = false;`,
  ];
}

function getFieldSetterHooks(ctx: GenDataStoreContext, reconcilerDef: InputReconcilerDefinition): FieldSetterHooks {
  const bindingCalls = genIndexedBindingCalls(
    ctx,
    reconcilerDef,
    `${getDataStoreSubsystemName(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.type.getName()}`,
    "this",
    (reconcilerDef: InputReconcilerDefinition, fieldName: string) => {
      return privateMember(getFieldMemberName(reconcilerDef, fieldName));
    },
  );

  const ret: FieldSetterHooks = {};
  for (const fieldName in bindingCalls) {
    ret[fieldName] = {
      preSet: [bindingCalls[fieldName].removeBinding],
      postSet: [bindingCalls[fieldName].addBinding],
    }
  }
  return ret;
}

function genInboundMonoBehaviour(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  reconcilerDef: InputReconcilerDefinition,
  outDir: string,
  proxyObj: string,
  isSpawned: boolean,
) {

  const baseComponentType: string = filterToString(reconcilerDef.componentProps.basetype) ?? "MonoBehaviour";
  assert(!reconcilerDef.type.interfaceType); // not yet supported

  let hasTransformMapping = false;
  const fields = reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    if (checkForTransformMapping(fieldName, reconcilerDef)) {
      hasTransformMapping = true;
    }
  }

  const rootIncludes = new CsIncludeAggregator(["UnityEngine"]);
  const readAccessor = reconcilerDef.type.getReadAccessorType(ctx.namespace, rootIncludes);
  const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, rootIncludes);
  const classSpec = new ClassSpec({
    name: getComponentClassName(reconcilerDef.type, reconcilerDef.componentProps.idName),
    superClass: baseComponentType,
    interfaceName: !isSpawned ?
      `${IIndexBoundType.getLocalType(ctx.namespace, rootIncludes)}<${readAccessor}, ${reconciledType}>` :
      undefined,
    namespace: ctx.namespace,
    includes: rootIncludes,
    decorations: reconcilerDef.componentProps.internalOnly ? [
      `[AddComponentMenu("")]`,
    ] : undefined,
  });

  genFieldProperties(classSpec, { ctx, reconcilerDef, setterHooks: getFieldSetterHooks(ctx, reconcilerDef), proxyObj });

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
    `HandleXrpaFieldsChanged(${reconcilerDef.getInboundChangeBits()});`,
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

  if (!isSpawned) {
    classSpec.members.push({
      name: `OnXrpaBindingGained`,
      type: `event System.Action<int>`,
    });

    classSpec.members.push({
      name: `OnXrpaBindingLost`,
      type: `event System.Action<int>`,
    });

    classSpec.methods.push({
      name: "AddXrpaBinding",
      parameters: [{
        name: "reconciledObj",
        type: reconciledType,
      }],
      returnType: PRIMITIVE_INTRINSICS.bool.typename,
      body: [
        `if (${proxyObj} != null) {`,
        `  return false;`,
        `}`,
        `${proxyObj} = reconciledObj;`,
        ...initializerLines,
        `OnXrpaBindingGained?.Invoke(0);`,
        `return true;`,
      ],
    });

    classSpec.methods.push({
      name: "RemoveXrpaBinding",
      parameters: [{
        name: "reconciledObj",
        type: reconciledType,
      }],
      body: [
        `if (${proxyObj} == reconciledObj) {`,
        `  ${proxyObj}.OnXrpaFieldsChanged(null);`,
        `  ${proxyObj} = null;`,
        `  OnXrpaBindingLost?.Invoke(0);`,
        `}`,
      ],
    });
  } else {
    initializerLines.push(`${proxyObj}.OnXrpaDelete(HandleXrpaDelete);`);
    classSpec.methods.push({
      name: "SetXrpaObject",
      parameters: [{
        name: "obj",
        type: reconciledType,
      }],
      body: [
        `${proxyObj} = obj;`,
        `${proxyObj}.SetXrpaOwner(this);`,
        ...initializerLines,
      ],
    });

    classSpec.methods.push({
      name: "HandleXrpaDelete",
      body: [
        `${proxyObj}.OnXrpaFieldsChanged(null);`,
        `${proxyObj}.OnXrpaDelete(null);`,
        `${proxyObj} = null;`,
        `Destroy(gameObject);`,
      ],
    })
  }

  if (hasTransformMapping) {
    classSpec.methods.push({
      name: "Update",
      body: includes => genTransformUpdates({ ctx, includes, reconcilerDef, proxyObj }),
      visibility: "private",
    });
  }

  classSpec.methods.push({
    name: "InitializeDS",
    body: includes => genComponentInit(ctx, includes, reconcilerDef, proxyObj),
    isOverride: Boolean(reconcilerDef.type.interfaceType),
  });

  classSpec.methods.push({
    name: "DeinitializeDS",
    body: genComponentDeinit(ctx, reconcilerDef),
    visibility: "private",
  });

  classSpec.members.push({
    name: proxyObj,
    type: reconciledType,
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


export function genIndexedMonoBehaviour(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  reconcilerDef: InputReconcilerDefinition,
  outDir: string,
) {
  genInboundMonoBehaviour(ctx, fileWriter, reconcilerDef, outDir, "_reconciledObj", false);
}


export function genSpawnedMonoBehaviour(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  reconcilerDef: InputReconcilerDefinition,
  outDir: string,
) {
  genInboundMonoBehaviour(ctx, fileWriter, reconcilerDef, outDir, "_xrpaObject", true);
  genCollectionEntitySpawner(ctx, fileWriter, reconcilerDef, outDir);
}
