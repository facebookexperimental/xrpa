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

import { ClassSpec, MethodParam } from "../../shared/ClassSpec";
import { DataStoreDefinition, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { InterfaceTypeDefinition, MessageDataTypeDefinition, SignalDataTypeDefinition, StructTypeDefinition, TypeDefinition, typeIsMessageData, typeIsReference, typeIsSignalData, typeIsStruct } from "../../shared/TypeDefinition";
import { HEADER, genClassDefinition, genDerefMethodCall, genMessageDispatch, privateMember } from "../csharp/CsharpCodeGenImpl";
import * as CsharpCodeGenImpl from "../csharp/CsharpCodeGenImpl";
import { genSendMessageAccessor } from "../csharp/GenMessageAccessors";
import { FieldSetterHooks } from "../csharp/GenWriteReconcilerDataStore";
import { GenDataStoreContext, fieldGetterFuncName } from "../shared/GenDataStoreShared";
import { InboundSignalDataInterface, SignalPacket } from "../csharp/CsharpDatasetLibraryTypes";
import { CodeLiteralValue } from "../../shared/TypeValue";
import { genMessageHandlerParams, genMessageHandlerType, getMessageParamNames } from "../shared/GenMessageAccessorsShared";

export enum IntrinsicProperty {
  position = "position",
  rotation = "rotation",
  lossyScale = "lossyScale",
  Parent = "Parent",
  gameObject = "gameObject",
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
    return propertyMap !== IntrinsicProperty.Parent && propertyMap !== IntrinsicProperty.gameObject;
  }
  for (const key in propertyMap) {
    if (propertyMap[key] !== IntrinsicProperty.Parent && propertyMap[key] !== IntrinsicProperty.gameObject) {
      return true;
    }
  }
  return false;
}

export function getComponentClassName(type: string | InterfaceTypeDefinition, id?: unknown) {
  const typeName = typeof type === "string" ? type : type.getName();
  return `${filterToString(id) ?? ""}${typeName}Component`;
}

export function getFieldMemberName(reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition, fieldName: string) {
  return filterToString(reconcilerDef.fieldAccessorNameOverrides[fieldName]) ?? upperFirst(fieldName);
}

function genWriteFieldProperty(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  fieldName: string,
  memberName: string,
  proxyObj: string,
  isOutboundField: boolean,
  setterHooks?: FieldSetterHooks,
  validateLines: string[],
}): void {
  const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
  const fieldType = fieldSpec.type;
  const typeDef = params.reconcilerDef.type;

  const isBoundToIntrinsic = params.reconcilerDef.isFieldBoundToIntrinsic(params.fieldName);
  const isClearSet = params.reconcilerDef.isClearSetField(params.fieldName);
  const hasSetter = !isBoundToIntrinsic && !isClearSet;
  const isSerialized = params.reconcilerDef.isSerializedField(params.fieldName);
  const pascalFieldName = upperFirst(params.fieldName);

  const decorations: string[] = [];
  if (isSerialized) {
    decorations.push("[SerializeField]");
  }

  typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, privateMember(params.memberName), true, decorations, "private");

  if (isClearSet) {
    const overrideParams = filterToStringArray(params.reconcilerDef.fieldAccessorNameOverrides[params.fieldName], 2);
    const setterName = overrideParams?.[0] ?? `Set${pascalFieldName}`;
    const clearName = overrideParams?.[1] ?? `Clear${pascalFieldName}`;
    classSpec.methods.push({
      name: setterName,
      body: [
        `if (${params.proxyObj} != null) { ${params.proxyObj}.Set${pascalFieldName}(); }`,
      ],
    });
    classSpec.methods.push({
      name: clearName,
      body: [
        `if (${params.proxyObj} != null) { ${params.proxyObj}.Clear${pascalFieldName}(); }`,
      ],
    });
  }

  classSpec.members.push({
    name: params.memberName,
    type: fieldType,
    getter: privateMember(params.memberName),
    setter: !hasSetter ? [] : [
      ...(params.setterHooks?.[params.fieldName]?.preSet ?? []),
      `${privateMember(params.memberName)} = value;`,
      ...(params.setterHooks?.[params.fieldName]?.postSet ?? []),
      ...(params.isOutboundField ? [
        `if (${params.proxyObj} != null) { ${params.proxyObj}.Set${pascalFieldName}(value); }`,
      ] : []),
    ],
  });

  if (isSerialized && hasSetter && params.isOutboundField) {
    params.validateLines.push(
      `if (${params.proxyObj} != null) { ${params.proxyObj}.Set${pascalFieldName}(${privateMember(params.memberName)}); }`,
    );
  }

  if (params.reconcilerDef.isIndexedField(params.fieldName)) {
    classSpec.methods.push({
      name: fieldGetterFuncName(CsharpCodeGenImpl, params.reconcilerDef.type.getStateFields(), params.fieldName),
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
  fieldName: string,
  memberName: string,
}): void {
  const fieldSpec = params.reconcilerDef.getFieldSpec(params.fieldName);
  const fieldType = fieldSpec.type;
  const typeDef = params.reconcilerDef.type;

  typeDef.declareLocalFieldClassMember(classSpec, params.fieldName, privateMember(params.memberName), true, [], "private");

  classSpec.members.push({
    name: params.memberName,
    type: fieldType,
    getter: privateMember(params.memberName),
  });
}

export function genFieldProperties(classSpec: ClassSpec, params: {
  ctx: GenDataStoreContext,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  proxyObj: string,
  setterHooks?: FieldSetterHooks,
}): void {
  const validateLines: string[] = [];

  const fields = params.reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    const memberName = getFieldMemberName(params.reconcilerDef, fieldName);
    const isIndexBoundField = params.reconcilerDef.isIndexBoundField(fieldName);
    const isOutboundField = params.reconcilerDef.isOutboundField(fieldName);
    if (isIndexBoundField || isOutboundField) {
      genWriteFieldProperty(classSpec, { ...params, fieldName, memberName, isOutboundField, validateLines });
    } else {
      genReadFieldProperty(classSpec, { ...params, fieldName, memberName });
    }
  }

  if (validateLines.length > 0) {
    classSpec.methods.push({
      name: "OnValidate",
      body: validateLines,
      visibility: "private",
    });

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
      lines.push(`${params.proxyObj}.Set${upperFirst(fieldName)}(${privateMember(memberName)});`);
    }
  }

  return lines;
}

/********************************************************/

export function genUnitySendMessageAccessor(classSpec: ClassSpec, params: {
  namespace: string,
  typeDef: StructTypeDefinition,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string,
}): void {
  genSendMessageAccessor(classSpec, {
    ...params,
    name: `Send${upperFirst(params.fieldName)}`,
  });
}

export function genUnityMessageProxyDispatch(classSpec: ClassSpec, params: {
  storeDef: DataStoreDefinition,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string,
  initializerLines: string[],
  dispatchMessageReader: boolean,
}) {
  const msgEventType = genMessageHandlerType({
    codegen: CsharpCodeGenImpl,
    namespace: classSpec.namespace,
    includes: classSpec.includes,
    fieldType: params.fieldType,
    expandMessageFields: true,
  });

  const unityHandlerName = `On${upperFirst(params.fieldName)}`;
  const unityDispatchName = `Dispatch${upperFirst(params.fieldName)}`;
  const proxyHandlerName = `On${upperFirst(params.fieldName)}`;

  classSpec.members.push({
    name: unityHandlerName,
    type: `event ${msgEventType}`,
  });

  const parameters = genMessageHandlerParams({
    codegen: CsharpCodeGenImpl,
    namespace: classSpec.namespace,
    includes: classSpec.includes,
    fieldType: params.fieldType,
    expandMessageFields: !params.dispatchMessageReader,
  });

  classSpec.methods.push({
    name: unityDispatchName,
    parameters,
    body: includes => genMessageDispatch({
      namespace: classSpec.namespace,
      includes,
      fieldName: params.fieldName,
      fieldType: params.fieldType,
      genMsgHandler: msg => `On${upperFirst(msg)}?.Invoke`,
      msgDataToParams: params.dispatchMessageReader ? convertMessageTypeToParams : (() => Object.values(getMessageParamNames(CsharpCodeGenImpl, params.fieldType))),
      convertToReadAccessor: false,
    }),
    visibility: "private",
  });

  params.initializerLines.push(
    `${genDerefMethodCall(params.proxyObj, proxyHandlerName, [unityDispatchName])};`,
  );
}

function convertMessageTypeToParams(
  msgType: MessageDataTypeDefinition,
) {
  const params: string[] = [];

  const fields = msgType.getStateFields();
  for (const key in fields) {
    params.push(`message.Get${upperFirst(key)}()`);
  }

  return params;
}

export function genUnityMessageFieldAccessors(classSpec: ClassSpec, params: {
  namespace: string,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (msgName: string) => string,
  proxyObj: string,
  initializerLines: string[],
}): void {
  const typeDef = params.reconcilerDef.type;
  const typeFields = typeDef.getFieldsOfType(typeIsMessageData);
  for (const fieldName in typeFields) {
    const fieldType = typeFields[fieldName];

    if (params.reconcilerDef.isInboundField(fieldName)) {
      genUnityMessageProxyDispatch(classSpec, {
        ...params,
        storeDef: params.reconcilerDef.storeDef,
        fieldName,
        fieldType,
        proxyObj: params.proxyObj,
        initializerLines: params.initializerLines,
        dispatchMessageReader: true,
      });
    }

    if (params.reconcilerDef.isOutboundField(fieldName)) {
      genUnitySendMessageAccessor(classSpec, {
        ...params,
        typeDef,
        fieldName,
        fieldType,
      });
    }
  }
}

/********************************************************/

function genUnityOnSignalAccessor(classSpec: ClassSpec, params: {
  fieldName: string,
  fieldType: SignalDataTypeDefinition,
  proxyObj: string,
  initializerLines: string[],
}): void {
  const signalHandler = CsharpCodeGenImpl.privateMember(`${params.fieldName}SignalHandler`);
  const inboundSignalDataInterface = InboundSignalDataInterface.getLocalType(classSpec.namespace, classSpec.includes);

  classSpec.methods.push({
    name: `On${upperFirst(params.fieldName)}`,
    parameters: [{
      name: "handler",
      type: CsharpCodeGenImpl.genSharedPointer(inboundSignalDataInterface),
    }],
    body: [
      `${signalHandler} = handler;`,
      `if (${params.proxyObj} != null) {`,
      `  ${params.proxyObj}.On${upperFirst(params.fieldName)}(${signalHandler});`,
      `}`,
    ],
  });

  classSpec.members.push({
    name: signalHandler,
    type: inboundSignalDataInterface,
    initialValue: new CodeLiteralValue(CsharpCodeGenImpl, CsharpCodeGenImpl.getNullValue()),
    visibility: "private",
  });

  params.initializerLines.push(
    `${genDerefMethodCall(params.proxyObj, `On${upperFirst(params.fieldName)}`, [signalHandler])};`,
  );
}

function genProxyCall(classSpec: ClassSpec, params: {
  proxyObj: string,
  name: string;
  returnType?: string;
  noDiscard?: boolean;
  parameters?: Array<MethodParam>;
  templateParams?: Array<string>;
  whereClauses?: Array<string>;
}) {
  classSpec.methods.push({
    name: params.name,
    templateParams: params.templateParams,
    whereClauses: params.whereClauses,
    returnType: params.returnType,
    parameters: params.parameters,
    body: () => {
      const proxyMethod = CsharpCodeGenImpl.applyTemplateParams(params.name, ...params.templateParams ?? []);
      const methodCall = CsharpCodeGenImpl.genMethodCall(params.proxyObj, proxyMethod, params.parameters?.map(p => p.name) ?? []);
      if (params.returnType) {
        return [
          `return ${methodCall};`,
        ];
      } else {
        return [
          `${methodCall};`,
        ];
      }
    },
  });
}

function genUnitySendSignalAccessor(classSpec: ClassSpec, params: {
  typeDef: StructTypeDefinition,
  fieldName: string,
  fieldType: SignalDataTypeDefinition,
  proxyObj: string,
}): void {
  let SignalProducerCallback = CsharpCodeGenImpl.getXrpaTypes().SignalProducerCallback.getLocalType(classSpec.namespace, classSpec.includes);
  SignalProducerCallback = CsharpCodeGenImpl.applyTemplateParams(SignalProducerCallback, "SampleType");
  let SignalRingBuffer = CsharpCodeGenImpl.getXrpaTypes().SignalRingBuffer.getLocalType(classSpec.namespace, classSpec.includes);
  SignalRingBuffer = CsharpCodeGenImpl.applyTemplateParams(SignalRingBuffer, "SampleType");
  const InboundSignalForwarder = CsharpCodeGenImpl.getXrpaTypes().InboundSignalForwarder.getLocalType(classSpec.namespace, classSpec.includes);

  genProxyCall(classSpec, {
    proxyObj: params.proxyObj,
    name: `Set${upperFirst(params.fieldName)}Callback`,
    templateParams: ["SampleType"],
    whereClauses: ["SampleType : unmanaged"],
    parameters: [{
      name: "signalCallback",
      type: SignalProducerCallback,
    }, {
      name: "numChannels",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "framesPerSecond",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "framesPerPacket",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }],
  });

  genProxyCall(classSpec, {
    proxyObj: params.proxyObj,
    name: `Set${upperFirst(params.fieldName)}RingBuffer`,
    templateParams: ["SampleType"],
    whereClauses: ["SampleType : unmanaged"],
    parameters: [{
      name: "signalRingBuffer",
      type: CsharpCodeGenImpl.genPointer(SignalRingBuffer),
    }, {
      name: "numChannels",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "framesPerSecond",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "framesPerPacket",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }],
  });

  genProxyCall(classSpec, {
    proxyObj: params.proxyObj,
    name: `Set${upperFirst(params.fieldName)}Forwarder`,
    templateParams: ["SampleType"],
    whereClauses: ["SampleType : unmanaged"],
    parameters: [{
      name: "signalForwarder",
      type: CsharpCodeGenImpl.genSharedPointer(InboundSignalForwarder),
    }],
  });

  genProxyCall(classSpec, {
    proxyObj: params.proxyObj,
    name: `Send${upperFirst(params.fieldName)}`,
    templateParams: ["SampleType"],
    whereClauses: ["SampleType : unmanaged"],
    returnType: SignalPacket.getLocalType(classSpec.namespace, classSpec.includes),
    parameters: [{
      name: "frameCount",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "numChannels",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "framesPerSecond",
      type: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.int32.typename,
    }],
  });
}

export function genUnitySignalFieldAccessors(classSpec: ClassSpec, params: {
  namespace: string,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  proxyObj: string,
  initializerLines: string[],
}): void {
  const typeDef = params.reconcilerDef.type;
  const typeFields = typeDef.getFieldsOfType(typeIsSignalData);
  for (const fieldName in typeFields) {
    const fieldType = typeFields[fieldName];

    if (params.reconcilerDef.isInboundField(fieldName)) {
      genUnityOnSignalAccessor(classSpec, {
        ...params,
        fieldName,
        fieldType,
        proxyObj: params.proxyObj,
        initializerLines: params.initializerLines,
      });
    }

    if (params.reconcilerDef.isOutboundField(fieldName)) {
      genUnitySendSignalAccessor(classSpec, {
        ...params,
        typeDef,
        fieldName,
        fieldType,
      });
    }
  }
}

/********************************************************/

export function genFieldDefaultInitializers(
  namespace: string,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
): string[] {
  const lines: string[] = [];

  const fields = reconcilerDef.type.getStateFields();
  for (const fieldName in fields) {
    if (reconcilerDef.isSerializedField(fieldName)) {
      continue;
    }
    const memberName = "_" + getFieldMemberName(reconcilerDef, fieldName);
    lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(namespace, includes, fieldName, memberName));
  }

  return lines;
}

export function genFieldInitializers(
  namespace: string,
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
      const memberName = "_" + getFieldMemberName(reconcilerDef, fieldName);
      lines.push(...reconcilerDef.type.resetLocalFieldVarToDefault(namespace, includes, fieldName, memberName));
    }
  }

  return lines;
}

function genPropertyAssignment(
  namespace: string,
  includes: IncludeAggregator | null,
  targetVar: string,
  property: string,
  fieldType: TypeDefinition,
): string[] {
  switch (property) {
    case IntrinsicProperty.position:
    case IntrinsicProperty.rotation:
    case IntrinsicProperty.lossyScale:
      return [`${targetVar} = transform.${property};`];

    case IntrinsicProperty.Parent: {
      if (!typeIsReference(fieldType)) {
        return [];
      }
      const targetComponentClassName = getComponentClassName(fieldType.toType);
      return [
        ...fieldType.resetLocalVarToDefault(namespace, includes, targetVar),
        `for (var parentObj = transform.parent; parentObj != null; parentObj = parentObj.transform.parent) {`,
        `  var componentObj = parentObj.GetComponent<${targetComponentClassName}>();`,
        `  if (componentObj != null) {`,
        `    componentObj.InitializeDS();`,
        `    ${targetVar} = componentObj.GetXrpaId();`,
        `    break;`,
        `  }`,
        `}`,
      ];
    }

    case IntrinsicProperty.gameObject: {
      if (!typeIsReference(fieldType)) {
        return [];
      }
      const targetComponentClassName = getComponentClassName(fieldType.toType);
      return [
        ...fieldType.resetLocalVarToDefault(namespace, includes, targetVar),
        `{`,
        `  var componentObj = gameObject.GetComponent<${targetComponentClassName}>();`,
        `  if (componentObj != null) {`,
        `    componentObj.InitializeDS();`,
        `    ${targetVar} = componentObj.GetXrpaId();`,
        `  }`,
        `}`,
      ];
    }
  }

  throw new Error(`Unsupported property ${property} for property mapping`);
}

export function genTransformInitializers(
  namespace: string,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
): string[] {
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
        namespace,
        includes,
        "_" + getFieldMemberName(reconcilerDef, fieldName),
        fieldBinding,
        fieldType,
      ));
    } else if (fieldBinding && typeIsStruct(fieldType)) {
      const subfields = fieldType.getStateFields();
      for (const subfieldName in fieldBinding) {
        const subfieldType = subfields[subfieldName].type;
        if (!subfieldType) {
          continue;
        }
        lines.push(...genPropertyAssignment(
          namespace,
          includes,
          `_${getFieldMemberName(reconcilerDef, fieldName)}.${subfieldName}`,
          fieldBinding[subfieldName],
          subfieldType,
        ));
      }
    }
  }

  return lines;
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
    case IntrinsicProperty.position:
    case IntrinsicProperty.rotation:
    case IntrinsicProperty.lossyScale:
      pushUnique(params.prelude, `bool ${params.fieldName}Changed = false;`);
      pushUnique(params.changes, `if (${params.fieldName}Changed && ${params.proxyObj} != null) { ${params.proxyObj}.Set${upperFirst(params.fieldName)}(${privateMember(params.memberName)}); }`);
      return [
        `if (${params.targetVar} != transform.${params.fieldBinding}) {`,
        `  ${params.targetVar} = transform.${params.fieldBinding};`,
        `  ${params.fieldName}Changed = true;`,
        `}`,
      ];

    case IntrinsicProperty.Parent: {
      return [];
    }

    case IntrinsicProperty.gameObject: {
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
    case IntrinsicProperty.position:
    case IntrinsicProperty.rotation:
    case IntrinsicProperty.lossyScale:
      return [
        `transform.local${upperFirst(params.fieldBinding)} = ${params.sourceVar};`,
      ];

    case IntrinsicProperty.Parent: {
      return [];
    }

    case IntrinsicProperty.gameObject: {
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
          targetVar: privateMember(memberName),
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
            targetVar: `${privateMember(memberName)}.${subfieldName}`,
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
    const checkName = `Check${upperFirst(fieldName)}Changed`;
    lines.push(
      `if (${params.proxyObj}.${checkName}(fieldsChanged)) {`,
      `  ${privateMember(memberName)} = ${params.proxyObj}.Get${upperFirst(fieldName)}();`,
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

export function genDataStoreObjectAccessors(
  ctx: GenDataStoreContext,
  classSpec: ClassSpec,
) {
  classSpec.methods.push({
    name: "GetXrpaId",
    returnType: ctx.moduleDef.ObjectUuid.declareLocalReturnType(ctx.namespace, classSpec.includes, true),
    body: [
      `return _id;`,
    ]
  });

  classSpec.members.push({
    name: "id",
    type: ctx.moduleDef.ObjectUuid,
    visibility: "protected",
  });
}

export function writeMonoBehaviour(classSpec: ClassSpec, params: {
  fileWriter: FileWriter;
  outDir: string;
}) {
  const lines = genClassDefinition(classSpec);
  lines.unshift(
    ...HEADER,
    `#pragma warning disable CS0414`, // disable unused private member warning
    ``,
    ...(classSpec.includes?.getNamespaceImports() ?? []),
    ``,
  );
  params.fileWriter.writeFile(path.join(params.outDir, classSpec.name + ".cs"), lines);
}
