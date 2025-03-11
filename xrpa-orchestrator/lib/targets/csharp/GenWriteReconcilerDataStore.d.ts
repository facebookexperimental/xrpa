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
import { FieldAccessorNames, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { CollectionTypeDefinition, TypeDefinition } from "../../shared/TypeDefinition";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
export type FieldSetterHooks = Record<string, {
    preSet: string[];
    postSet: string[];
} | undefined>;
export declare function genFieldSetDirty(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    typeDef: CollectionTypeDefinition;
    fieldName: string;
    fieldVar: string;
    proxyObj: string | null;
}): string[];
export declare function genClearSetSetterFunctionBody(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    fieldName: string;
    fieldType: TypeDefinition;
    fieldVar: string;
    typeDef: CollectionTypeDefinition;
    setterHooks: FieldSetterHooks;
    needsSetDirty: boolean;
    proxyObj: string | null;
}): string[];
export declare function genClearSetClearFunctionBody(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    fieldName: string;
    fieldType: TypeDefinition;
    fieldVar: string;
    typeDef: CollectionTypeDefinition;
    setterHooks: FieldSetterHooks;
    needsSetDirty: boolean;
    proxyObj: string | null;
}): string[];
export declare function genWriteFieldAccessors(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    fieldToMemberVar: (fieldName: string) => string;
    fieldAccessorNameOverrides: FieldAccessorNames;
    directionality: "inbound" | "outbound";
    gettersOnly?: boolean;
    setterHooks?: FieldSetterHooks;
    proxyObj: string | null;
}): void;
export declare function genWriteFunctionBody(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    fieldToMemberVar: (fieldName: string) => string;
    canCreate?: boolean;
    proxyObj: string | null;
}): string[];
export declare function genPrepFullUpdateFunctionBody(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    fieldToMemberVar: (fieldName: string) => string;
    canCreate?: boolean;
}): string[];
export declare function defaultFieldToMemberVar(fieldName: string): string;
export declare function genOutboundReconciledTypes(ctx: GenDataStoreContext, includesIn: IncludeAggregator | null): ClassSpec[];

