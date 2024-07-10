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


import { DataMapDefinition } from "../../shared/DataMap";
import { ComponentProperties, IndexConfiguration } from "../../shared/DataStore";
import { FileWriter } from "../../shared/FileWriter";
import { TypeSpec } from "../../shared/TargetCodeGen";
import { CollectionTypeDefinition, StructSpec, StructTypeDefinition, TypeDefinition } from "../../shared/TypeDefinition";
import { CppModuleDefinition } from "../cpp/CppModuleDefinition";
export declare class UepluginModuleDefinition extends CppModuleDefinition {
    readonly pluginsRoot: string;
    readonly pluginDeps: [string, string][];
    constructor(name: string, datamap: DataMapDefinition, pluginsRoot: string, pluginDeps: [string, string][]);
    createEnum(name: string, apiname: string, enumValues: Record<string, number>, localTypeOverride: TypeSpec | undefined): TypeDefinition;
    createStruct(name: string, apiname: string, fields: StructSpec, localTypeOverride: TypeSpec | undefined): StructTypeDefinition;
    setCollectionAsInbound(type: CollectionTypeDefinition, reconciledTo: TypeSpec | undefined, indexes: Array<IndexConfiguration> | undefined): void;
    setCollectionAsOutbound(type: CollectionTypeDefinition, componentProps: ComponentProperties): void;
    doCodeGen(): FileWriter;
}

