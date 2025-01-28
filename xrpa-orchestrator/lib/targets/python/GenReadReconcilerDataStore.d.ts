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
import { CollectionTypeDefinition } from "../../shared/TypeDefinition";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
export declare function genProcessUpdateFunctionBodyForConcreteReconciledType(ctx: GenDataStoreContext, includes: IncludeAggregator | null, typeDef: CollectionTypeDefinition, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): string[];
export declare function genInboundReconciledTypes(ctx: GenDataStoreContext, includesIn: IncludeAggregator): ClassSpec[];
export declare function genObjectCollectionClasses(ctx: GenDataStoreContext, includesIn: IncludeAggregator): ClassSpec[];
export declare function genIndexedBindingCalls<T extends InputReconcilerDefinition | OutputReconcilerDefinition>(ctx: GenDataStoreContext, reconcilerDef: T, dataStorePtr: string, boundObjPtr: string, getFieldMemberName: (reconcilerDef: T, fieldName: string) => string): Record<string, {
    addBinding: string;
    removeBinding: string;
}>;

