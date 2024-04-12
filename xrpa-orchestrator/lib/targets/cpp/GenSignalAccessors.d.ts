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
import { CollectionTypeDefinition, SignalDataTypeDefinition } from "../../shared/TypeDefinition";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
export declare function genSignalDispatchBody(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
}): string[];
export declare function genOnSignalAccessor(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    typeDef: CollectionTypeDefinition;
    fieldName: string;
    fieldType: SignalDataTypeDefinition;
}): void;
export declare function genSendSignalAccessor(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    typeDef: CollectionTypeDefinition;
    fieldName: string;
    fieldType: SignalDataTypeDefinition;
    separateImplementation?: boolean;
    referencesNeedConversion: boolean;
    proxyObj: string | null;
    name?: string;
    decorations?: string[];
    tickLines: string[];
}): void;
export declare function genSignalFieldAccessors(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    proxyObj: string | null;
}): void;

