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


import { upperFirst } from "@xrpa/xrpa-utils";
import { ClassSpec, MethodParam } from "../../shared/ClassSpec";
import { IncludeAggregator } from "../../shared/Helpers";
import { TargetCodeGenImpl } from "../../shared/TargetCodeGen";
import { MessageDataTypeDefinition } from "../../shared/TypeDefinition";
import { CodeLiteralValue } from "../../shared/TypeValue";

export function getMessageParamName(fieldName: string): string {
  return fieldName;
}

export function getMessageParamNames(fieldType: MessageDataTypeDefinition): Record<string, string> {
  const paramNames: Record<string, string> = {};
  const msgFields = fieldType.getStateFields();
  for (const key in msgFields) {
    paramNames[key] = getMessageParamName(key);
  }
  return paramNames;
}

export function genMessageMethodParams(params: {
  namespace: string,
  includes: IncludeAggregator | null,
  fieldType: MessageDataTypeDefinition,
}): MethodParam[] {
  const methodParams: MethodParam[] = [];

  const msgFields = params.fieldType.getStateFields();
  for (const key in msgFields) {
    const fieldType = msgFields[key].type;
    methodParams.push({
      name: getMessageParamName(key),
      type: fieldType,
    });
  }

  return methodParams;
}

export function genMessageHandlerParams(params: {
  codegen: TargetCodeGenImpl;
  namespace: string;
  includes: IncludeAggregator | null;
  fieldType: MessageDataTypeDefinition;
  expandMessageFields?: boolean;
}) {
  const handlerParams = [{
    name: "msgTimestamp",
    type: params.codegen.PRIMITIVE_INTRINSICS.uint64.typename,
  }];

  if (params.fieldType.hasFields()) {
    if (params.expandMessageFields) {
      const msgFields = params.fieldType.getStateFields();
      for (const key in msgFields) {
        const fieldType = msgFields[key].type;
        handlerParams.push({
          name: getMessageParamName(key),
          type: fieldType.declareLocalParam(params.namespace, params.includes, ""),
        });
      }
    } else {
      handlerParams.push({
        name: "message",
        type: params.fieldType.getReadAccessorType(params.namespace, params.includes),
      });
    }
  }

  return handlerParams;
}

export function genMessageHandlerType(params: {
  codegen: TargetCodeGenImpl;
  namespace: string;
  includes: IncludeAggregator | null;
  fieldType: MessageDataTypeDefinition;
  expandMessageFields?: boolean;
}): string {
  const paramTypes = genMessageHandlerParams(params).map(param => param.type);
  return params.codegen.genEventHandlerType(paramTypes, params.includes);
}

export function genOnMessageAccessor(classSpec: ClassSpec, params: {
  codegen: TargetCodeGenImpl;
  fieldName: string;
  fieldType: MessageDataTypeDefinition;
  expandMessageFields?: boolean;
  genMsgHandler: (fieldName: string) => string;
}): void {
  const handlerType = genMessageHandlerType({
    codegen: params.codegen,
    namespace: classSpec.namespace,
    includes: classSpec.includes,
    fieldType: params.fieldType,
    expandMessageFields: params.expandMessageFields,
  });
  const msgHandler = params.genMsgHandler(params.fieldName);
  classSpec.methods.push({
    name: `on${upperFirst(params.fieldName)}`,
    parameters: [{
      name: "handler",
      type: handlerType,
    }],
    body: [
      `${params.codegen.genDeref("", msgHandler)} = handler` + params.codegen.STMT_TERM,
    ],
  });
  classSpec.members.push({
    name: msgHandler,
    type: handlerType,
    initialValue: new CodeLiteralValue(module.exports, params.codegen.getNullValue()),
    visibility: "private",
  });
}
