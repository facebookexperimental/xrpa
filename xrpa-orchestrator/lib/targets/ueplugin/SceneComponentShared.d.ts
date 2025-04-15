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
import { ClassSpec } from "../../shared/ClassSpec";
import { DataStoreDefinition, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { InterfaceTypeDefinition, MessageDataTypeDefinition } from "../../shared/TypeDefinition";
import { FieldSetterHooks } from "../cpp/GenWriteReconcilerDataStore";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
export declare enum IntrinsicProperty {
    Location = "Location",
    Rotation = "Rotation",
    Scale3D = "Scale3D",
    Parent = "Parent"
}
export declare function checkForTransformMapping(fieldName: string, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): boolean;
export declare function getComponentClassName(includes: IncludeAggregator | null, type: string | InterfaceTypeDefinition, id?: unknown): string;
export declare function getComponentHeader(type: string | InterfaceTypeDefinition, id?: unknown): string;
export declare function getFieldMemberName(reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition, fieldName: string): string;
export declare function genFieldProperties(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    proxyObj: string;
    setterHooks?: FieldSetterHooks;
    separateImplementation?: boolean;
}): void;
export declare function genFieldSetterCalls(params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    proxyObj: string;
}): string[];
export declare function genUEMessageProxyDispatch(classSpec: ClassSpec, params: {
    storeDef: DataStoreDefinition;
    categoryName: string;
    fieldName: string;
    fieldType: MessageDataTypeDefinition;
    proxyObj: string;
    proxyIsXrpaObj: boolean;
    initializerLines: string[];
    forwardDeclarations: string[];
}): void;
export declare function genUEMessageFieldAccessors(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    genMsgHandler: (msgName: string) => string;
    proxyObj: string;
    initializerLines: string[];
    forwardDeclarations: string[];
}): void;
/********************************************************/
export declare function genFieldDefaultInitializers(ctx: GenDataStoreContext, includes: IncludeAggregator | null, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): string[];
export declare function genFieldInitializers(ctx: GenDataStoreContext, includes: IncludeAggregator | null, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): string[];
export declare function genTransformInitializers(ctx: GenDataStoreContext, includes: IncludeAggregator | null, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): string[];
export declare function genTransformUpdates(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    proxyObj: string;
}): string[];
export declare function genProcessUpdateBody(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    proxyObj: string;
}): string[];
export declare function writeSceneComponent(classSpec: ClassSpec, params: {
    fileWriter: FileWriter;
    componentName: string;
    headerName: string;
    cppIncludes: IncludeAggregator | null;
    headerIncludes: IncludeAggregator | null;
    outSrcDir: string;
    outHeaderDir: string;
    forwardDeclarations: string[];
}): void;

