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
import { filterToString, filterToStringArray, indent, pushUnique, upperFirst } from "@xrpa/xrpa-utils";
import path from "path";

import { ClassSpec } from "../../shared/ClassSpec";
import { DataStoreDefinition, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { InterfaceTypeDefinition, MessageDataTypeDefinition, StructTypeDefinition, TypeDefinition, typeIsMessageData, typeIsReference, typeIsStruct } from "../../shared/TypeDefinition";
import { HEADER, PRIMITIVE_INTRINSICS, forwardDeclareClass, genClassHeaderDefinition, genClassSourceDefinition, genCommentLines, genDerefMethodCall, genMessageDispatch, genPassthroughMethodBind } from "../cpp/CppCodeGenImpl";
import * as CppCodeGenImpl from "../cpp/CppCodeGenImpl";
import { genSendMessageAccessor } from "../cpp/GenMessageAccessors";
import { FieldSetterHooks } from "../cpp/GenWriteReconcilerDataStore";
import { GenDataStoreContext, fieldGetterFuncName } from "../shared/GenDataStoreShared";
import { getBlueprintTypesHeaderName, getMessageDelegateName } from "./GenBlueprintTypes";

export enum IntrinsicProperty {
  Location = "Location",
  Rotation = "Rotation",
  Scale3D = "Scale3D",
  Parent = "Parent",
}

export function checkForTransformMapping(fieldName: string, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): boolean {
  // outbound fields only
  if (!reconcilerDef.isOutboundField(fieldName)) {
    return false;
  }
  const propertyMap = reconcilerDef.getFieldPropertyBinding(fieldName);
  if (!propertyMap) {
    return false;
  }
  if (typeof propertyMap === "string") {
    return propertyMap !== IntrinsicProperty.Parent;
  }
  for (const key in propertyMap) {
    if (propertyMap[key] !== IntrinsicProperty.Parent) {
      return true;
    }
  }
  return false;
}

const LegalBlueprintTypes = {
  int: true,
  float: true,
  bool: true,
  FString: true,
  FVector2D: true,
  FVector: true,
  FQuat: true,
  FColor: true,
  FColorLinear: true,
  FRotator: true,
};

function isLegalBlueprintType(ctx: GenDataStoreContext, typeDef: TypeDefinition) {
  if (typeDef.getLocalHeaderFile() === getBlueprintTypesHeaderName(ctx.storeDef.apiname)) {
    return true;
  }
  if (typeIsReference(typeDef)) {
    // TODO make UUID a legal blueprint type
    return false;
  }

  const localType = typeDef.getLocalType(ctx.namespace, null);
  if (localType in LegalBlueprintTypes) {
    return true;
  }
  if (localType.startsWith("TArray<")) {
    return true;
  }

  return false;
}

export function getComponentClassName(includes: IncludeAggregator | null, type: string | InterfaceTypeDefinition, id?: unknown) {
  const typeName = typeof type === "string" ? type : type.getName();
  const className = `U${filterToString(id) ?? ""}${typeName}Component`;
  includes?.addFile({ filename: `${className.slice(1)}.h` });
  return className;
}

export function getComponentHeader(type: string | InterfaceTypeDefinition, id?: unknown) {
  return `${getComponentClassName(null, type, id).slice(1)}.h`;
}

export function getFieldMemberName(reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition, fieldName: string) {
  return filterToString(reconcilerDef.fieldAccessorNameOverrides[fieldName]) ?? upperFirst(fieldName);
}

function genWriteFieldProperty(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  categoryName: string,
  fieldName: string,
  memberName: string,
  proxyObj: string,
  isOutboundField: boolean,
  setterHooks?: FieldSetterHooks,
  separateImplementation?: boolean,
}): void {
  const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
  const fieldType = fieldSpec.type;
  const typeDef = params.reconcilerDef.type;

  const pascalFieldName = upperFirst(params.fieldName);
  const canBeBlueprinted = isLegalBlueprintType(params.ctx, fieldType);
  const isBoundToIntrinsic = params.reconcilerDef.isFieldBoundToIntrinsic(params.fieldName);
  const isClearSet = params.reconcilerDef.isClearSetField(params.fieldName);
  const hasSetter = !isBoundToIntrinsic && !isClearSet;
  const isEphemeral = params.reconcilerDef.isEphemeralField(params.fieldName);
  const isSerialized = params.reconcilerDef.isSerializedField(params.fieldName);
  const overrideParams = filterToStringArray(params.reconcilerDef.fieldAccessorNameOverrides[params.fieldName], 2);
  const setterName = overrideParams?.[0] ?? `Set${pascalFieldName}`;
  const clearName = overrideParams?.[1] ?? `Clear${pascalFieldName}`;

  const decorations: string[] = [];
  if (!isBoundToIntrinsic && (isEphemeral || isSerialized) && canBeBlueprinted) {
    const propertyMeta = isEphemeral ? "BlueprintReadOnly, Transient" : `BlueprintReadWrite, BlueprintSetter = ${setterName}`;
    decorations.push(
      `UPROPERTY(EditAnywhere, ${propertyMeta}, Category = "${params.categoryName}")`,
    );
  }
  typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, params.memberName, true, decorations, "public");

  if (isClearSet) {
    classSpec.methods.push({
      name: setterName,
      decorations: [
        ...genCommentLines(fieldSpec.description),
        `UFUNCTION(BlueprintCallable, Category = "${params.categoryName}")`,
      ],
      body: [
        `if (${params.proxyObj}) { ${params.proxyObj}->set${pascalFieldName}(); }`,
      ],
      separateImplementation: params.separateImplementation,
    });
    classSpec.methods.push({
      name: clearName,
      decorations: [
        ...genCommentLines(fieldSpec.description),
        `UFUNCTION(BlueprintCallable, Category = "${params.categoryName}")`,
      ],
      body: [
        `if (${params.proxyObj}) { ${params.proxyObj}->clear${pascalFieldName}(); }`,
      ],
      separateImplementation: params.separateImplementation,
    });
  }

  if (hasSetter) {
    classSpec.methods.push({
      name: setterName,
      decorations: [
        ...((isEphemeral || !canBeBlueprinted) ? [] : [`UFUNCTION(BlueprintCallable, BlueprintInternalUseOnly)`]),
      ],
      parameters: [{
        name: "value",
        type: fieldType,
      }],
      body: [
        ...(params.setterHooks?.[params.fieldName]?.preSet ?? []),
        `${params.memberName} = value;`,
        ...(params.setterHooks?.[params.fieldName]?.postSet ?? []),
        ...(params.isOutboundField ? [
          `if (${params.proxyObj}) { ${params.proxyObj}->set${pascalFieldName}(value); }`,
        ] : []),
      ],
      separateImplementation: params.separateImplementation,
    });
  }

  if (params.reconcilerDef.isIndexedField(params.fieldName)) {
    classSpec.methods.push({
      name: fieldGetterFuncName(CppCodeGenImpl, params.reconcilerDef.type.getStateFields(), params.fieldName),
      returnType: fieldType.declareLocalReturnType(classSpec.namespace, classSpec.includes, true),
      body: [
        `return ${params.memberName};`,
      ],
      visibility: "public",
    });
  }
}

function genReadFieldProperty(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  categoryName: string,
  fieldName: string,
  memberName: string,
}): void {
  const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
  const fieldType = fieldSpec.type;
  const typeDef = params.reconcilerDef.type;

  const isBoundToIntrinsic = params.reconcilerDef.isFieldBoundToIntrinsic(params.fieldName);

  const decorations: string[] = []
  if (!isBoundToIntrinsic && isLegalBlueprintType(params.ctx, fieldType)) {
    decorations.push(`UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "${params.categoryName}")`);
  }
  typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, params.memberName, true, decorations, "public");
}

export function genFieldProperties(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  proxyObj: string,
  setterHooks?: FieldSetterHooks,
  separateImplementation?: boolean,
}): void {
  const categoryName = params.reconcilerDef.type.getName();
  const fields = params.reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
    const isIndexBoundField = params.reconcilerDef.isIndexBoundField(fieldName);
    const isOutboundField = params.reconcilerDef.isOutboundField(fieldName);
    if (isIndexBoundField || isOutboundField) {
      genWriteFieldProperty(classSpec, { ...params, categoryName, fieldName, memberName, isOutboundField });
    } else {
      genReadFieldProperty(classSpec, { ...params, categoryName, fieldName, memberName });
    }
  }
}

export function genFieldSetterCalls(params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  proxyObj: string,
}): string[] {
  const lines: string[] = [];

  const fields = params.reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
    if (params.reconcilerDef.isOutboundField(fieldName)) {
      lines.push(`${params.proxyObj}->set${upperFirst(fieldName)}(${memberName});`);
    }
  }

  return lines;
}

/********************************************************/

export function genUESendMessageAccessor(classSpec: ClassSpec, params: {
  namespace: string,
  categoryName: string,
  typeDef: StructTypeDefinition,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string,
}): void {
  genSendMessageAccessor(classSpec, {
    ...params,
    name: `Send${upperFirst(params.fieldName)}`,
    decorations: [
      params.categoryName ?
        `UFUNCTION(BlueprintCallable, Category = "${params.categoryName}")` :
        `UFUNCTION(BlueprintCallable)`,
    ],
    separateImplementation: true,
  });
}

export function genUEMessageProxyDispatch(classSpec: ClassSpec, params: {
  storeDef: DataStoreDefinition,
  categoryName: string,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string,
  proxyIsXrpaObj: boolean,
  initializerLines: string[],
  forwardDeclarations: string[],
}) {
  const msgEventType = getMessageDelegateName(params.fieldType, params.storeDef.apiname);
  const ueHandlerName = `On${upperFirst(params.fieldName)}`;
  const ueDispatchName = `dispatch${upperFirst(params.fieldName)}`;
  const proxyHandlerName = `on${upperFirst(params.fieldName)}`;
  classSpec.includes?.addFile({ filename: getBlueprintTypesHeaderName(params.storeDef.apiname) });

  classSpec.members.push({
    name: ueHandlerName,
    type: msgEventType,
    decorations: [
      params.categoryName ?
        `UPROPERTY(BlueprintAssignable, Category = "${params.categoryName}")` :
        `UPROPERTY(BlueprintAssignable)`,
    ],
  });

  const parameters = [{
    name: "msgTimestamp",
    type: PRIMITIVE_INTRINSICS.uint64.typename,
  }];

  if (params.fieldType.hasFields()) {
    const messageReadAccessor = params.fieldType.getReadAccessorType(classSpec.namespace, null);
    pushUnique(params.forwardDeclarations, forwardDeclareClass(messageReadAccessor));
    parameters.push({
      name: "message",
      type: messageReadAccessor,
    });
  }


  classSpec.methods.push({
    name: ueDispatchName,
    parameters,
    body: includes => genMessageDispatch({
      namespace: classSpec.namespace,
      includes,
      fieldName: params.fieldName,
      fieldType: params.fieldType,
      genMsgHandler: msg => `On${upperFirst(msg)}.Broadcast`,
      msgDataToParams: convertMessageTypeToParams,
      convertToReadAccessor: false,
      timestampName: "FDateTime(msgTimestamp)",
    }),
    visibility: "private",
    separateImplementation: true,
  });

  const dispatchBind = genPassthroughMethodBind(ueDispatchName, 2);
  params.initializerLines.push(
    `${genDerefMethodCall(params.proxyObj, params.proxyIsXrpaObj ? proxyHandlerName : upperFirst(proxyHandlerName), [dispatchBind])};`,
  );
}

function convertMessageTypeToParams(msgType: StructTypeDefinition) {
  const params: string[] = [];

  const fields = msgType.getStateFields();
  for (const key in fields) {
    params.push(`message.get${upperFirst(key)}()`);
  }

  return params;
}

export function genUEMessageFieldAccessors(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (msgName: string) => string,
  proxyObj: string,
  initializerLines: string[],
  forwardDeclarations: string[],
}): void {
  const typeDef = params.reconcilerDef.type;
  const categoryName = typeDef.getName();
  const typeFields = typeDef.getFieldsOfType(typeIsMessageData);
  for (const fieldName in typeFields) {
    const fieldType = typeFields[fieldName];

    if (params.reconcilerDef.isInboundField(fieldName)) {
      genUEMessageProxyDispatch(classSpec, {
        storeDef: params.ctx.storeDef,
        categoryName,
        fieldName,
        fieldType,
        proxyObj: params.proxyObj,
        proxyIsXrpaObj: true,
        initializerLines: params.initializerLines,
        forwardDeclarations: params.forwardDeclarations,
      });
    }

    if (params.reconcilerDef.isOutboundField(fieldName)) {
      genUESendMessageAccessor(classSpec, {
        ...params,
        namespace: params.ctx.namespace,
        categoryName,
        typeDef,
        fieldName,
        fieldType,
      });
    }
  }
}

/********************************************************/

export function genFieldDefaultInitializers(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
): string[] {
  const lines: string[] = [];

  const fields = reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    if (reconcilerDef.isFieldBoundToIntrinsic(fieldName)) {
      continue;
    }
    const memberName = getFieldMemberName(reconcilerDef, fieldName);
    lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(ctx.namespace, includes, fieldName, memberName));
  }

  return lines;
}

export function genFieldInitializers(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
): string[] {
  const lines: string[] = [];

  const fields = reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    if (reconcilerDef.isFieldBoundToIntrinsic(fieldName)) {
      continue;
    }

    // these types need to be initialized on BeginPlay
    const isClearSetType = reconcilerDef.isClearSetField(fieldName);
    const isInboundField = !reconcilerDef.isIndexBoundField(fieldName) && reconcilerDef.isInboundField(fieldName);
    const isEphemeral = reconcilerDef.isEphemeralField(fieldName);

    if (isClearSetType || isInboundField || isEphemeral) {
      const memberName = getFieldMemberName(reconcilerDef, fieldName);
      lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(ctx.namespace, includes, fieldName, memberName));
    }
  }

  return lines;
}

function genPropertyAssignment(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  targetVar: string,
  property: string,
  fieldType: TypeDefinition,
  prelude: string[],
): string[] {
  switch (property) {
    case IntrinsicProperty.Location:
    case IntrinsicProperty.Rotation:
    case IntrinsicProperty.Scale3D:
      pushUnique(prelude, `auto& transform = GetComponentTransform();`);
      return [`${targetVar} = transform.Get${property}();`];

    case IntrinsicProperty.Parent: {
      if (!typeIsReference(fieldType)) {
        return [];
      }
      pushUnique(prelude, `TArray<USceneComponent*> componentParents;`);
      pushUnique(prelude, `GetParentComponents(componentParents);`);
      const parentComponentClassName = getComponentClassName(includes, fieldType.toType);
      return [
        ...fieldType.resetLocalVarToDefault(ctx.namespace, includes, targetVar),
        `for (auto parent : componentParents) {`,
        `  auto componentPtr = Cast<${parentComponentClassName}>(parent);`,
        `  if (componentPtr != nullptr) {`,
        `    componentPtr->initializeDS();`,
        `    ${targetVar} = componentPtr->getXrpaId();`,
        `    break;`,
        `  }`,
        `}`,
      ];
    }
  }

  throw new Error(`Unsupported property ${property} for property mapping`);
}

export function genTransformInitializers(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
): string[] {
  const prelude: string[] = [];
  const lines: string[] = [];

  const fields = reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    // outbound fields only
    if (!reconcilerDef.isOutboundField(fieldName)) {
      continue;
    }
    const fieldType = fields[fieldName].type;
    const fieldBinding = reconcilerDef.getFieldPropertyBinding(fieldName);
    if (typeof fieldBinding === "string") {
      lines.push(...genPropertyAssignment(
        ctx,
        includes,
        getFieldMemberName(reconcilerDef, fieldName),
        fieldBinding,
        fieldType,
        prelude,
      ));
    } else if (fieldBinding && typeIsStruct(fieldType)) {
      const subfields = fieldType.getStateFields();
      for (const subfieldName in fieldBinding) {
        const subfieldType = subfields[subfieldName].type;
        if (!subfieldType) {
          continue;
        }
        lines.push(...genPropertyAssignment(
          ctx,
          includes,
          `${getFieldMemberName(reconcilerDef, fieldName)}.${subfieldName}`,
          fieldBinding[subfieldName],
          subfieldType,
          prelude,
        ));
      }
    }
  }

  return prelude.concat(lines);
}

function genPropertyOutboundUpdate(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  memberName: string,
  targetVar: string,
  fieldBinding: string,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  fieldName: string,
  prelude: string[],
  changes: string[],
  proxyObj: string,
}): string[] {
  switch (params.fieldBinding) {
    case IntrinsicProperty.Location:
    case IntrinsicProperty.Rotation:
    case IntrinsicProperty.Scale3D:
      pushUnique(params.prelude, `bool ${params.fieldName}Changed = false;`);
      pushUnique(params.prelude, `auto& transform = GetComponentTransform();`);
      pushUnique(params.prelude, `auto transform${params.fieldBinding} = transform.Get${params.fieldBinding}();`)
      pushUnique(params.changes, `if (${params.fieldName}Changed && ${params.proxyObj}) { ${params.proxyObj}->set${upperFirst(params.fieldName)}(${params.memberName}); }`);
      return [
        `if (!${params.targetVar}.Equals(transform${params.fieldBinding}, SMALL_NUMBER)) {`,
        `  ${params.targetVar} = transform${params.fieldBinding};`,
        `  ${params.fieldName}Changed = true;`,
        `}`,
      ];

    case IntrinsicProperty.Parent: {
      return [];
    }
  }

  throw new Error(`Unsupported fieldBinding ${params.fieldBinding} for property mapping`);
}

function genPropertyInboundUpdate(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  sourceVar: string,
  fieldBinding: string,
}): string[] {
  switch (params.fieldBinding) {
    case IntrinsicProperty.Location:
    case IntrinsicProperty.Rotation:
    case IntrinsicProperty.Scale3D:
      return [
        `SetRelative${params.fieldBinding}(${params.sourceVar});`,
      ];

    case IntrinsicProperty.Parent: {
      return [];
    }
  }

  throw new Error(`Unsupported fieldBinding ${params.fieldBinding} for property mapping`);
}

export function genTransformUpdates(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  proxyObj: string,
}): string[] {
  const prelude: string[] = [];
  const lines: string[] = [];
  const changes: string[] = [];

  const fields = params.reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    // outbound fields only
    if (!params.reconcilerDef.isOutboundField(fieldName)) {
      continue;
    }
    const fieldBinding = params.reconcilerDef.getFieldPropertyBinding(fieldName);
    const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
    if (typeof fieldBinding === "string") {
      lines.push(
        ...genPropertyOutboundUpdate({
          ...params,
          memberName,
          targetVar: memberName,
          fieldBinding,
          fieldName,
          prelude,
          changes,
        }),
      );
    } else if (fieldBinding) {
      for (const subfieldName in fieldBinding) {
        lines.push(
          ...genPropertyOutboundUpdate({
            ...params,
            memberName,
            targetVar: `${memberName}.${subfieldName}`,
            fieldBinding: fieldBinding[subfieldName],
            fieldName,
            prelude,
            changes,
          }),
        );
      }
    }
  }

  return prelude.concat(lines).concat(changes);
}

export function genProcessUpdateBody(params: {
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  proxyObj: string,
}): string[] {
  const lines: string[] = [];

  const fields = params.reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    if (!params.reconcilerDef.isInboundField(fieldName) || params.reconcilerDef.isIndexBoundField(fieldName)) {
      continue;
    }

    const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
    lines.push(
      `if (${params.proxyObj}->check${upperFirst(fieldName)}Changed(fieldsChanged)) {`,
      `  ${memberName} = ${params.proxyObj}->get${upperFirst(fieldName)}();`,
    );

    // handle property binding
    const fieldBinding = params.reconcilerDef.getFieldPropertyBinding(fieldName);
    if (typeof fieldBinding === "string") {
      lines.push(
        ...indent(1, genPropertyInboundUpdate({
          ...params,
          sourceVar: memberName,
          fieldBinding,
        }),
        ));
    } else if (fieldBinding) {
      for (const subfieldName in fieldBinding) {
        lines.push(
          ...indent(1, genPropertyInboundUpdate({
            ...params,
            sourceVar: `${memberName}.${subfieldName}`,
            fieldBinding: fieldBinding[subfieldName],
          }),
          ));
      }
    }

    lines.push(
      `}`,
    );
  }

  return lines;
}

export function writeSceneComponent(classSpec: ClassSpec, params: {
  fileWriter: FileWriter;
  componentName: string;
  headerName: string;
  cppIncludes: IncludeAggregator | null;
  headerIncludes: IncludeAggregator | null;
  outSrcDir: string;
  outHeaderDir: string;
  forwardDeclarations: string[];
}) {
  const cppLines = genClassSourceDefinition(classSpec, params.cppIncludes);
  cppLines.unshift(
    ...HEADER,
    `#include "${params.headerName}"`,
    ...(params.cppIncludes?.getIncludes() ?? []),
    ``,
  );
  params.fileWriter.writeFile(path.join(params.outSrcDir, `${params.headerName.slice(0, -2)}.cpp`), cppLines);

  const headerLines = genClassHeaderDefinition(classSpec);
  headerLines.unshift(
    ...HEADER,
    `#pragma once`,
    ``,
    ...(params.headerIncludes?.getIncludes(params.headerName) ?? []),
    ``,
    `#include "${params.componentName}.generated.h"`,
    ``,
    ...params.forwardDeclarations,
    ``,
  );
  params.fileWriter.writeFile(path.join(params.outHeaderDir, params.headerName), headerLines);
}
