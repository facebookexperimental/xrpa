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


import { indent } from "@xrpa/xrpa-utils";

import { ClassSpec } from "../../shared/ClassSpec";
import { InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { StructType } from "../../shared/StructType";
import { CollectionTypeDefinition, MessageDataTypeDefinition, StructTypeDefinition, TypeDefinition, typeIsMessageData, typeIsStruct } from "../../shared/TypeDefinition";
import { genMessageMethodParams, genOnMessageAccessor, getMessageParamName, getMessageParamNames } from "../shared/GenMessageAccessorsShared";
import { genSignalDispatchBody } from "../shared/GenSignalAccessorsShared";
import { PRIMITIVE_INTRINSICS, genCommentLines, genGetCurrentClockTime, genMessageDispatch, identifierName } from "./PythonCodeGenImpl";
import * as PythonCodeGenImpl from "./PythonCodeGenImpl";
import { MemoryAccessor } from "./PythonDatasetLibraryTypes";

function genMessageParamInitializer(
  msgType: MessageDataTypeDefinition,
): string[] {
  const lines: string[] = [];

  const paramNames = getMessageParamNames(msgType);
  for (const key in paramNames) {
    lines.push(`message.set_${identifierName(key)}(${identifierName(paramNames[key])})`);
  }

  return lines;
}

function genMessageSize(namespace: string, includes: IncludeAggregator | null, msgType: MessageDataTypeDefinition): string {
  const dynFieldSizes: string[] = [];
  let staticSize = 0;

  const msgFields = msgType.getStateFields();
  for (const key in msgFields) {
    const fieldType = msgFields[key].type;
    const byteCount = fieldType.getRuntimeByteCount(identifierName(getMessageParamName(key)), namespace, includes);
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
  typeDef: CollectionTypeDefinition,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string | null,
}): string[] {
  const lines: string[] = [];

  if (params.proxyObj) {
    const msgParams = Object.values(getMessageParamNames(params.fieldType));
    lines.push(`${params.proxyObj}.send_${params.fieldName}(${msgParams.join(", ")})`)
  } else {
    const messageType = params.typeDef.getFieldIndex(params.fieldName);
    if (params.fieldType.hasFields()) {
      const msgWriteAccessor = params.fieldType.getWriteAccessorType(params.namespace, params.includes);
      lines.push(
        `message = ${msgWriteAccessor}(self._collection.send_message(`,
        `    self.get_xrpa_id(),`,
        `    ${messageType},`,
        `    ${genMessageSize(params.namespace, params.includes, params.fieldType)}))`,
        ...genMessageParamInitializer(params.fieldType),
      );
    } else {
      lines.push(
        `self._collection.send_message(`,
        `    self.get_xrpa_id(),`,
        `    ${messageType},`,
        `    0)`,
      );
    }
  }

  return lines;
}

function isImageStruct(type: TypeDefinition): type is StructTypeDefinition {
  if (!typeIsStruct(type)) {
    return false;
  }

  return Boolean((type as StructType).properties.isImage);
}

export function genSendMessageAccessor(classSpec: ClassSpec, params: {
  typeDef: CollectionTypeDefinition,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,
  proxyObj: string | null,
  name?: string,
}): void {
  classSpec.methods.push({
    name: params.name ?? `send_${params.fieldName}`,
    parameters: genMessageMethodParams({ ...params, namespace: classSpec.namespace, includes: classSpec.includes }),
    body: includes => genSendMessageBody({ ...params, namespace: classSpec.namespace, includes }),
  });

  const messageFields = params.fieldType.getStateFields();
  const messageFieldNames = Object.keys(messageFields);
  if (messageFieldNames.length !== 1) {
    return;
  }

  // PsyhcoPy window source helper
  const messageFieldType = messageFields[messageFieldNames[0]].type;
  if (isImageStruct(messageFieldType)) {
    const imageType = messageFieldType.getLocalType(classSpec.namespace, classSpec.includes);
    const imageFormat = messageFieldType.getStateField("format").getLocalType(classSpec.namespace, classSpec.includes);
    const imageEncoding = messageFieldType.getStateField("encoding").getLocalType(classSpec.namespace, classSpec.includes);
    const imageOrientation = messageFieldType.getStateField("orientation").getLocalType(classSpec.namespace, classSpec.includes);
    classSpec.includes?.addFile({ namespace: "io" });
    classSpec.includes?.addFile({ namespace: "typing" });

    classSpec.methods.push({
      name: `send_${params.fieldName}_pil_image`,
      parameters: [{
        name: "pil_image",
        type: "typing.Any",
      }],
      body: [
        `jpeg_data = io.BytesIO()`,
        `pil_image.save(jpeg_data, format='JPEG')`,
        `jpeg_data.seek(0)`,
        `image_data = ${imageType}(`,
        `  pil_image.width,`,
        `  pil_image.height,`,
        `  ${imageFormat}.RGB8,`,
        `  ${imageEncoding}.Jpeg,`,
        `  ${imageOrientation}.Oriented,`,
        `  1.0,`, // gain
        `  0,`, // exposureDuration
        `  ${genGetCurrentClockTime(classSpec.includes)},`,
        `  0,`, // captureFrameRate
        `  bytearray(jpeg_data.read())`,
        `)`,
        `self.send_${params.fieldName}(image_data)`,
      ],
    });

    classSpec.methods.push({
      name: `set_${params.fieldName}_source`,
      parameters: [{
        name: "source",
        type: "typing.Any",
      }],
      body: [
        `source._startOfFlip = lambda: (self.send_${params.fieldName}_pil_image(source._getFrame(buffer="back")), True)[1]`,
      ],
      decorations: genCommentLines("Helper for setting a PsychoPy window as the source of an image message."),
    });
  }
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
      `if message_type == ${msgType}:`,
      ...indent(1, genMessageDispatch({
        namespace: params.namespace,
        includes: params.includes,
        fieldName,
        fieldType,
        genMsgHandler: params.genMsgHandler,
        msgDataToParams: params.msgDataToParams,
        convertToReadAccessor: true,
      })),
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
    name: "process_ds_message",
    parameters: [{
      name: "message_type",
      type: PRIMITIVE_INTRINSICS.int32.typename,
    }, {
      name: "msgTimestamp",
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }, {
      name: "message_data",
      type: MemoryAccessor,
    }],
    body: includes => {
      return [
        ...genMessageDispatchBody({ ...params, namespace: classSpec.namespace, includes }),
        ...genSignalDispatchBody({ ...params, namespace: classSpec.namespace, includes, codegen: PythonCodeGenImpl }),
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
        codegen: PythonCodeGenImpl,
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
