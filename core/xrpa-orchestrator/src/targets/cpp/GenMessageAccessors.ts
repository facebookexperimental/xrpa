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
import { genMessageDispatch, PRIMITIVE_INTRINSICS } from "./CppCodeGenImpl";
import * as CppCodeGenImpl from "./CppCodeGenImpl";
import { MemoryAccessor } from "./CppDatasetLibraryTypes";

function genMessageParamInitializer(
  msgType: MessageDataTypeDefinition,
): string[] {
  const lines: string[] = [];

  const paramNames = getMessageParamNames(msgType);
  for (const key in paramNames) {
    lines.push(`message.set${upperFirst(key)}(${paramNames[key]});`);
  }

  return lines;
}

function genMessageSize(namespace: string, includes: IncludeAggregator | null, msgType: MessageDataTypeDefinition): string {
  const dynFieldSizes: string[] = [];
  let staticSize = 0;

  const msgFields = msgType.getStateFields();
  for (const key in msgFields) {
    const fieldType = msgFields[key].type;
    const byteCount = fieldType.getRuntimeByteCount(getMessageParamName(key), namespace, includes);
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
    const msgParams = Object.values(getMessageParamNames(params.fieldType));
    lines.push(`if (${params.proxyObj}) { ${params.proxyObj}->send${upperFirst(params.fieldName)}(${msgParams.join(", ")}); }`);
  } else {
    const messageType = params.typeDef.getFieldIndex(params.fieldName);
    if (params.fieldType.hasFields()) {
      const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.namespace, params.includes);
      lines.push(
        `auto message = ${msgWriteAccessor}(collection_->sendMessage(`,
        `    getXrpaId(),`,
        `    ${messageType},`,
        `    ${genMessageSize(params.namespace, params.includes, params.fieldType)}));`,
        ...genMessageParamInitializer(params.fieldType),
      );
    } else {
      lines.push(
        `collection_->sendMessage(`,
        `    getXrpaId(),`,
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
  separateImplementation?: boolean,
  proxyObj: string | null,
  name?: string,
  decorations?: string[],
}): void {
  classSpec.methods.push({
    name: params.name ?? `send${upperFirst(params.fieldName)}`,
    decorations: params.decorations,
    parameters: genMessageMethodParams({ ...params, namespace: classSpec.namespace, includes: classSpec.includes }),
    body: includes => genSendMessageBody({ ...params, namespace: classSpec.namespace, includes }),
    separateImplementation: params.separateImplementation,
  });
}

function genMessageDispatchBody(params: {
  namespace: string,
  includes: IncludeAggregator | null,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (fieldName: string) => string,
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
        namespace: params.namespace,
        includes: params.includes,
        fieldName,
        fieldType,
        genMsgHandler: params.genMsgHandler,
        msgDataToParams: params.msgDataToParams,
        convertToReadAccessor: true,
      })),
      `}`,
    );
  }

  return lines;
}

export function genMessageFieldAccessors(classSpec: ClassSpec, params: {
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (fieldName: string) => string,
}): void {
  const typeDef = params.reconcilerDef.type;
  const typeFields = typeDef.getFieldsOfType(typeIsMessageData);
  for (const fieldName in typeFields) {
    const fieldType = typeFields[fieldName];

    if (params.reconcilerDef.isInboundField(fieldName)) {
      genOnMessageAccessor(classSpec, {
        ...params,
        codegen: CppCodeGenImpl,
        fieldName,
        fieldType,
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

/*********************************************************************/

export function genMessageChannelDispatch(classSpec: ClassSpec, params: {
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
  genMsgHandler: (fieldName: string) => string,
  msgDataToParams: (msgType: MessageDataTypeDefinition, prelude: string[], includes: IncludeAggregator | null) => string[],
  separateImplementation?: boolean,
}): void {
  classSpec.methods.push({
    name: "processDSMessage",
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
        ...genSignalDispatchBody({ ...params, namespace: classSpec.namespace, includes, codegen: CppCodeGenImpl }),
      ];
    },
    separateImplementation: params.separateImplementation,
  });
}
