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


import { ClassSpec, MethodParam } from "../../shared/ClassSpec";
import { IncludeAggregator } from "../../shared/Helpers";
import { TargetCodeGenImpl } from "../../shared/TargetCodeGen";
import { MessageDataTypeDefinition } from "../../shared/TypeDefinition";
export declare function getMessageParamName(fieldName: string): string;
export declare function getMessageParamNames(fieldType: MessageDataTypeDefinition): Record<string, string>;
export declare function genMessageMethodParams(params: {
    namespace: string;
    includes: IncludeAggregator | null;
    fieldType: MessageDataTypeDefinition;
}): MethodParam[];
export declare function genMessageHandlerParams(params: {
    codegen: TargetCodeGenImpl;
    namespace: string;
    includes: IncludeAggregator | null;
    fieldType: MessageDataTypeDefinition;
    expandMessageFields?: boolean;
}): {
    name: string;
    type: string;
}[];
export declare function genMessageHandlerType(params: {
    codegen: TargetCodeGenImpl;
    namespace: string;
    includes: IncludeAggregator | null;
    fieldType: MessageDataTypeDefinition;
    expandMessageFields?: boolean;
}): string;
export declare function genOnMessageAccessor(classSpec: ClassSpec, params: {
    codegen: TargetCodeGenImpl;
    fieldName: string;
    fieldType: MessageDataTypeDefinition;
    expandMessageFields?: boolean;
    genMsgHandler: (fieldName: string) => string;
}): void;

