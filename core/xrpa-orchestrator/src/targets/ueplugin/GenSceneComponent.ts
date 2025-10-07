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
import { CppIncludeAggregator, forwardDeclareClass, genPassthroughMethodBind, genRuntimeGuid, getDataStoreHeaderName, PRIMITIVE_INTRINSICS } from "../cpp/CppCodeGenImpl";
import { genMsgHandler } from "../cpp/GenDataStore";
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
  writeSceneComponent,
} from "./SceneComponentShared";

const PROXY_OBJ = "xrpaObject_";

function genComponentInit(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator|null,
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
    `if (dsIsInitialized_) {`,
    `  return;`,
    `}`,
    `dsIsInitialized_ = true;`,
    `id_ = ${id};`,
    ``,
    ...genFieldInitializers(ctx, includes, reconcilerDef),
    ``,
    ...genTransformInitializers(ctx, includes, reconcilerDef),
    ``,
    `${PROXY_OBJ} = std::make_shared<${reconcilerDef.type.getLocalType(ctx.namespace, includes)}>(id_);`,
    `${PROXY_OBJ}->setXrpaOwner(this);`,
    `GetDataStoreSubsystem()->DataStore->${reconcilerDef.type.getName()}->addObject(${PROXY_OBJ});`,
    ...initializerLines,
  ];
}

function genComponentDeinit(ctx: GenDataStoreContext, reconcilerDef: OutputReconcilerDefinition): string[] {
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

function genDataStoreObjectAccessors(
  ctx: GenDataStoreContext,
  classSpec: ClassSpec,
) {
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

function genInterfaceComponentClass(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  type: InterfaceTypeDefinition,
  outSrcDir: string,
  outHeaderDir: string,
  pluginName: string,
  baseComponentType: string,
  headerIncludes: IncludeAggregator|null,
): string {
  const componentClassName = getComponentClassName(null, type);
  const componentName = componentClassName.slice(1);

  const classSpec = new ClassSpec({
    name: componentClassName,
    superClass: `U${baseComponentType}`,
    namespace: ctx.namespace,
    includes: new CppIncludeAggregator([
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

  writeSceneComponent(classSpec, {
    fileWriter,
    componentName,
    headerName: `${componentName}.h`,
    cppIncludes: new CppIncludeAggregator([]),
    headerIncludes: classSpec.includes,
    outSrcDir,
    outHeaderDir,
    forwardDeclarations: [],
  });

  headerIncludes?.addFile({ filename: `${componentName}.h` });

  return `${componentClassName}`;
}

export function genSceneComponent(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  reconcilerDef: OutputReconcilerDefinition,
  outSrcDir: string,
  outHeaderDir: string,
  pluginName: string,
) {
  const baseComponentType: string = filterToString(reconcilerDef.componentProps.basetype) ?? "SceneComponent";
  const headerIncludes = new CppIncludeAggregator([
    `Components/${baseComponentType}.h`,
    `CoreMinimal.h`,
  ], undefined, [
    // scene component header is not allowed to include the datastore header, as that would cause a circular dependency
    getDataStoreHeaderName(ctx.storeDef.apiname),
  ]);

  let parentClass = `U${baseComponentType}`;
  if (reconcilerDef.type.interfaceType) {
    parentClass = genInterfaceComponentClass(ctx, fileWriter, reconcilerDef.type.interfaceType, outSrcDir, outHeaderDir, pluginName, baseComponentType, headerIncludes);
  }

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

  genFieldProperties(classSpec, {ctx, reconcilerDef, proxyObj: PROXY_OBJ, separateImplementation: true});

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
    parameters: [ {
      name: "fieldsChanged",
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }],
    body: includes => genProcessUpdateBody({ctx, includes, reconcilerDef, proxyObj: PROXY_OBJ}),
    separateImplementation: true,
  });

  const initializerLines = [
    ...genFieldSetterCalls({ctx, reconcilerDef, proxyObj: PROXY_OBJ}),
    `${PROXY_OBJ}->onXrpaFieldsChanged(${genPassthroughMethodBind("handleXrpaFieldsChanged", 1)});`,
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
          ...genTransformUpdates({ctx, includes, reconcilerDef, proxyObj: PROXY_OBJ}),
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
