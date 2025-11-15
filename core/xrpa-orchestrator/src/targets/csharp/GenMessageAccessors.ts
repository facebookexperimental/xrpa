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


import { indent, upperFirst } from "@xrpa/xrpa-utils";

import { ClassSpec } from "../../shared/ClassSpec";
import { InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { MessageDataTypeDefinition, StructTypeDefinition, typeIsMessageData } from "../../shared/TypeDefinition";
import { genMessageMethodParams, genOnMessageAccessor, getMessageParamName, getMessageParamNames } from "../shared/GenMessageAccessorsShared";
import { genSignalDispatchBody } from "../shared/GenSignalAccessorsShared";
import { PRIMITIVE_INTRINSICS, genMessageDispatch } from "./CsharpCodeGenImpl";
import * as CsharpCodeGenImpl from "./CsharpCodeGenImpl";
import { MemoryAccessor } from "./CsharpDatasetLibraryTypes";

function genMessageParamInitializer(
  msgType: MessageDataTypeDefinition,
): string[] {
  const lines: string[] = [];

  const paramNames = getMessageParamNames(CsharpCodeGenImpl, msgType);
  for (const key in paramNames) {
    lines.push(`message.Set${upperFirst(key)}(${paramNames[key]});`);
  }

  return lines;
}

function genMessageSize(namespace: string, includes: IncludeAggregator | null, msgType: MessageDataTypeDefinition): string {
  const dynFieldSizes: string[] = [];
  let staticSize = 0;

  const msgFields = msgType.getStateFields();
  for (const key in msgFields) {
    const fieldType = msgFields[key].type;
    const byteCount = fieldType.getRuntimeByteCount(getMessageParamName(CsharpCodeGenImpl, key), namespace, includes);
    staticSize += byteCount[0];
    if (byteCount[1] !== null) {
      dynFieldSizes.push(byteCount[1]);
    }
  }

  dynFieldSizes.push(staticSize.toString());
  return dynFieldSizes.join(" + ");
}

function genSendMessageBody(params: {
  namespace: string,
  includes: IncludeAggregator | null,
  typeDef: StructTypeDefinition,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string | null,
}): string[] {
  const lines: string[] = [];

  if (params.proxyObj) {
    const msgParams = Object.values(getMessageParamNames(CsharpCodeGenImpl, params.fieldType));
    lines.push(`${params.proxyObj}?.Send${upperFirst(params.fieldName)}(${msgParams.join(", ")});`)
  } else {
    const messageType = params.typeDef.getFieldIndex(params.fieldName);
    if (params.fieldType.hasFields()) {
      const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.namespace, params.includes);
      lines.push(
        `${msgWriteAccessor} message = new(_collection.SendMessage(`,
        `    GetXrpaId(),`,
        `    ${messageType},`,
        `    ${genMessageSize(params.namespace, params.includes, params.fieldType)}));`,
        ...genMessageParamInitializer(params.fieldType),
      );
    } else {
      lines.push(
        `_collection.SendMessage(`,
        `    GetXrpaId(),`,
        `    ${messageType},`,
        `    0);`,
      );
    }
  }

  return lines;
}

export function genSendMessageAccessor(classSpec: ClassSpec, params: {
  typeDef: StructTypeDefinition,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string | null,
  name?: string,
}): void {
  classSpec.methods.push({
    name: params.name ?? `Send${upperFirst(params.fieldName)}`,
    parameters: genMessageMethodParams({ ...params, codegen: CsharpCodeGenImpl, namespace: classSpec.namespace, includes: classSpec.includes }),
    body: includes => genSendMessageBody({ ...params, namespace: classSpec.namespace, includes }),
  });
}

function genMessageDispatchBody(params: {
  namespace: string,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (msgName: string) => string,
  msgDataToParams: (msgType: MessageDataTypeDefinition, prelude: string[], includes: IncludeAggregator | null) => string[],
}): string[] {
  const lines: string[] = [];

  const typeDef = params.reconcilerDef.type;
  const typeFields = typeDef.getFieldsOfType(typeIsMessageData);
  for (const fieldName in typeFields) {
    if (!params.reconcilerDef.isInboundField(fieldName)) {
      continue;
    }
    const fieldType = typeFields[fieldName];
    const msgType = typeDef.getFieldIndex(fieldName);
    lines.push(
      `if (messageType == ${msgType}) {`,
      ...indent(1, genMessageDispatch({
        ...params,
        fieldName,
        fieldType,
        convertToReadAccessor: true,
      })),
      `}`,
    );
  }
  return lines;
}

export function genMessageChannelDispatch(classSpec: ClassSpec, params: {
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (msgName: string) => string,
  msgDataToParams: (msgType: MessageDataTypeDefinition, prelude: string[], includes: IncludeAggregator | null) => string[],
  isOverride?: boolean,
}): void {
  classSpec.methods.push({
    name: "ProcessDSMessage",
    parameters: [{
      name: "messageType",
      type: PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "msgTimestamp",
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }, {
      name: "messageData",
      type: MemoryAccessor,
    }],
    body: includes => {
      return [
        ...genMessageDispatchBody({ ...params, namespace: classSpec.namespace, includes }),
        ...genSignalDispatchBody({ ...params, namespace: classSpec.namespace, includes, codegen: CsharpCodeGenImpl }),
      ];
    },
    isOverride: params.isOverride,
  });
}

export function genMessageFieldAccessors(classSpec: ClassSpec, params: {
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (msgName: string) => string,
}): void {
  const typeDef = params.reconcilerDef.type;
  const typeFields = typeDef.getFieldsOfType(typeIsMessageData);
  for (const fieldName in typeFields) {
    const fieldType = typeFields[fieldName];

    if (params.reconcilerDef.isInboundField(fieldName)) {
      genOnMessageAccessor(classSpec, {
        codegen: CsharpCodeGenImpl,
        fieldName,
        fieldType,
        genMsgHandler: params.genMsgHandler,
      });
    }

    if (params.reconcilerDef.isOutboundField(fieldName)) {
      genSendMessageAccessor(classSpec, {
        ...params,
        typeDef,
        fieldName,
        fieldType,
        proxyObj: null,
      });
    }
  }
}
