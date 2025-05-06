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


import { ClassSpec } from "../../shared/ClassSpec";
import { InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { MessageDataTypeDefinition, StructTypeDefinition } from "../../shared/TypeDefinition";
export declare function genSendMessageAccessor(classSpec: ClassSpec, params: {
    typeDef: StructTypeDefinition;
    fieldName: string;
    fieldType: MessageDataTypeDefinition;
    separateImplementation?: boolean;
    referencesNeedConversion: boolean;
    proxyObj: string | null;
    name?: string;
    decorations?: string[];
}): void;
export declare function genMessageFieldAccessors(classSpec: ClassSpec, params: {
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    genMsgHandler: (fieldName: string) => string;
}): void;
/*********************************************************************/
export declare function genMessageChannelDispatch(classSpec: ClassSpec, params: {
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    genMsgHandler: (fieldName: string) => string;
    msgDataToParams: (msgType: MessageDataTypeDefinition, prelude: string[], includes: IncludeAggregator | null) => string[];
    separateImplementation?: boolean;
}): void;

