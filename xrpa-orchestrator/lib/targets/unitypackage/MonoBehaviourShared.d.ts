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


import { FileWriter } from "@xrpa/xrpa-utils";
import { ClassSpec } from "../../shared/ClassSpec";
import { InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { InterfaceTypeDefinition, MessageDataTypeDefinition } from "../../shared/TypeDefinition";
import { FieldSetterHooks } from "../csharp/GenWriteReconcilerDataStore";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
export declare enum IntrinsicProperty {
    position = "position",
    rotation = "rotation",
    lossyScale = "lossyScale",
    Parent = "Parent",
    gameObject = "gameObject"
}
export declare function checkForTransformMapping(fieldName: string, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): boolean;
export declare function getComponentClassName(type: string | InterfaceTypeDefinition, id?: unknown): string;
export declare function getMessageDelegateName(ctx: GenDataStoreContext, includes: IncludeAggregator | null, msgType: MessageDataTypeDefinition): string;
export declare function getFieldMemberName(reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition, fieldName: string): string;
export declare function genFieldProperties(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    setterHooks: FieldSetterHooks;
    proxyObj: string | null;
}): void;
export declare function genUnityMessageChannelDispatch(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
}): void;
export declare function genUnityMessageFieldAccessors(classSpec: ClassSpec, params: {
    ctx: GenDataStoreContext;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    genMsgHandler: (msgName: string) => string;
    proxyObj: string | null;
}): void;
/********************************************************/
export declare function genFieldDefaultInitializers(ctx: GenDataStoreContext, includes: IncludeAggregator | null, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): string[];
export declare function genFieldInitializers(ctx: GenDataStoreContext, includes: IncludeAggregator | null, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): string[];
export declare function genTransformInitializers(ctx: GenDataStoreContext, includes: IncludeAggregator | null, reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition): string[];
export declare function genTransformUpdates(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    proxyObj: string | null;
}): string[];
export declare function genProcessUpdateBody(params: {
    ctx: GenDataStoreContext;
    includes: IncludeAggregator | null;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    proxyObj: string | null;
}): string[];
export declare function genDataStoreObjectAccessors(ctx: GenDataStoreContext, classSpec: ClassSpec): void;
export declare function writeMonoBehaviour(classSpec: ClassSpec, params: {
    fileWriter: FileWriter;
    outDir: string;
}): void;

