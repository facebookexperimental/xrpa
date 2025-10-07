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
import { CppIncludeAggregator, forwardDeclareClass, genPassthroughMethodBind, getDataStoreHeaderName, PRIMITIVE_INTRINSICS } from "../cpp/CppCodeGenImpl";
import { genMsgHandler } from "../cpp/GenDataStore";
import { FieldSetterHooks } from "../cpp/GenWriteReconcilerDataStore";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import { getDataStoreSubsystemName } from "./GenDataStoreSubsystem";
import {
  checkForTransformMapping,
  genFieldDefaultInitializers,
  genFieldInitializers,
  genFieldProperties,
  genFieldSetterCalls,
  genProcessUpdateBody,
  genTransformInitializers,
  genTransformUpdates,
  genUEMessageFieldAccessors,
  getComponentClassName,
  getComponentHeader,
  getFieldMemberName,
  writeSceneComponent,
} from "./SceneComponentShared";
import { genIndexedBindingCalls } from "../cpp/GenReadReconcilerDataStore";
import { getMessageDelegateName } from "./GenBlueprintTypes";

const PROXY_OBJ = "reconciledObj_";

function genComponentInit(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition,
): string[] {
  const bindingCalls = genIndexedBindingCalls(
    ctx,
    reconcilerDef,
    `GetDataStoreSubsystem()->DataStore->${reconcilerDef.type.getName()}`,
    "this",
    getFieldMemberName,
  );

  return [
    `if (dsIsInitialized_) {`,
    `  return;`,
    `}`,
    `dsIsInitialized_ = true;`,
    ``,
    ...genFieldInitializers(ctx, includes, reconcilerDef),
    ``,
    ...genTransformInitializers(ctx, includes, reconcilerDef),
    ``,
    ...Object.values(bindingCalls).map(bindings => bindings.addBinding),
  ];
}

function genComponentDeinit(ctx: GenDataStoreContext, reconcilerDef: InputReconcilerDefinition): string[] {
  const bindingCalls = genIndexedBindingCalls(
    ctx,
    reconcilerDef,
    `GetDataStoreSubsystem()->DataStore->${reconcilerDef.type.getName()}`,
    "this",
    getFieldMemberName,
  );

  return [
    `if (!dsIsInitialized_) {`,
    `  return;`,
    `}`,
    ...Object.values(bindingCalls).map(bindings => bindings.removeBinding),
    `dsIsInitialized_ = false;`,
  ];
}

function getFieldSetterHooks(ctx: GenDataStoreContext, reconcilerDef: InputReconcilerDefinition): FieldSetterHooks {
  const bindingCalls = genIndexedBindingCalls(
    ctx,
    reconcilerDef,
    `GetDataStoreSubsystem()->DataStore->${reconcilerDef.type.getName()}`,
    "this",
    getFieldMemberName,
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

export function genIndexedSceneComponent(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  reconcilerDef: InputReconcilerDefinition,
  outSrcDir: string,
  outHeaderDir: string,
  pluginName: string,
) {
  const baseComponentType: string = filterToString(reconcilerDef.componentProps.basetype) ?? "SceneComponent";
  const headerIncludes = new CppIncludeAggregator([
    `Components/${baseComponentType}.h`,
    `CoreMinimal.h`,
    `<memory>`,
  ], undefined, [
    // scene component header is not allowed to include the datastore header, as that would cause a circular dependency
    getDataStoreHeaderName(ctx.storeDef.apiname),
  ]);

  const parentClass = `U${baseComponentType}`;
  assert(!reconcilerDef.type.interfaceType); // not yet supported

  const componentClassName = getComponentClassName(null, reconcilerDef.type, reconcilerDef.componentProps.idName);
  const componentName = componentClassName.slice(1);
  const headerName = getComponentHeader(reconcilerDef.type, reconcilerDef.componentProps.idName);

  let hasTransformMapping = false;
  const fields = reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    if (checkForTransformMapping(fieldName, reconcilerDef)) {
      hasTransformMapping = true;
    }
  }

  const cppIncludes = new CppIncludeAggregator([
    getDataStoreHeaderName(ctx.storeDef.apiname),
    `${getDataStoreSubsystemName(ctx.storeDef)}.h`,
  ]);

  const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, cppIncludes);
  const reconciledTypePtr = reconcilerDef.type.getLocalTypePtr(ctx.namespace, cppIncludes);
  const setterHooks = getFieldSetterHooks(ctx, reconcilerDef);

  const forwardDeclarations = [
    forwardDeclareClass(reconciledType),
    forwardDeclareClass(`U${getDataStoreSubsystemName(ctx.storeDef)}`),
  ];

  const classMeta = reconcilerDef.componentProps.internalOnly ? "" : ", meta = (BlueprintSpawnableComponent)";
  const classSpec = new ClassSpec({
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
        ...genFieldDefaultInitializers(ctx, includes, reconcilerDef),
      ];
    },
    separateImplementation: true,
  });

  genFieldProperties(classSpec, { ctx, reconcilerDef, setterHooks, proxyObj: PROXY_OBJ, separateImplementation: true });

  classSpec.members.push({
    name: `OnXrpaBindingGained`,
    type: getMessageDelegateName(null, reconcilerDef.type.getApiName()),
    decorations: [`UPROPERTY(BlueprintAssignable, Category = "${reconcilerDef.type.getName()}")`],
  });

  classSpec.members.push({
    name: `OnXrpaBindingLost`,
    type: getMessageDelegateName(null, reconcilerDef.type.getApiName()),
    decorations: [`UPROPERTY(BlueprintAssignable, Category = "${reconcilerDef.type.getName()}")`],
  });

  classSpec.methods.push({
    name: "handleXrpaFieldsChanged",
    parameters: [{
      name: "fieldsChanged",
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }],
    body: includes => genProcessUpdateBody({ ctx, includes, reconcilerDef, proxyObj: PROXY_OBJ }),
    separateImplementation: true,
  });

  const initializerLines = [
    ...genFieldSetterCalls({ ctx, reconcilerDef, proxyObj: PROXY_OBJ }),
    `${PROXY_OBJ}->onXrpaFieldsChanged(${genPassthroughMethodBind("handleXrpaFieldsChanged", 1)});`,
    `handleXrpaFieldsChanged(${reconcilerDef.getInboundChangeBits()});`,
  ];

  genUEMessageFieldAccessors(classSpec, {
    ctx,
    reconcilerDef,
    genMsgHandler,
    proxyObj: PROXY_OBJ,
    initializerLines,
    forwardDeclarations,
  });

  classSpec.methods.push({
    name: "addXrpaBinding",
    parameters: [{
      name: "reconciledObj",
      type: `const ${reconciledTypePtr}&`,
    }],
    returnType: PRIMITIVE_INTRINSICS.bool.typename,
    body: [
      `if (${PROXY_OBJ} != nullptr) {`,
      `  return false;`,
      `}`,
      `${PROXY_OBJ} = reconciledObj;`,
      ...initializerLines,
      `OnXrpaBindingGained.Broadcast(0);`,
      `return true;`,
    ],
    separateImplementation: true,
  });

  classSpec.methods.push({
    name: "removeXrpaBinding",
    parameters: [{
      name: "reconciledObj",
      type: `const ${reconciledTypePtr}&`,
    }],
    body: [
      `if (${PROXY_OBJ} == reconciledObj) {`,
      `  ${PROXY_OBJ}->onXrpaFieldsChanged(nullptr);`,
      `  ${PROXY_OBJ} = nullptr;`,
      `  OnXrpaBindingLost.Broadcast(0);`,
      `}`,
    ],
    separateImplementation: true,
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
        type: PRIMITIVE_INTRINSICS.int32.typename,
        defaultValue: "ETeleportType::None",
      }],
      body: includes => {
        return [
          `Super::OnUpdateTransform(UpdateTransformFlags, Teleport);`,
          ``,
          ...genTransformUpdates({ ctx, includes, reconcilerDef, proxyObj: PROXY_OBJ }),
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
    returnType: `U${getDataStoreSubsystemName(ctx.storeDef)}*`,
    body: [
      `return GetWorld()->GetSubsystem<U${getDataStoreSubsystemName(ctx.storeDef)}>();`,
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
    name: "dsIsInitialized",
    type: PRIMITIVE_INTRINSICS.bool.typename,
    initialValue: "false",
    visibility: "protected",
  });

  writeSceneComponent(classSpec, {
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
