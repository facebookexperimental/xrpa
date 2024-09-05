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


import { DataStoreDefinition } from "../../shared/DataStore";
import { FileWriter } from "../../shared/FileWriter";
import { IncludeAggregator } from "../../shared/Helpers";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
export declare function getModuleHeaderName(moduleDef: ModuleDefinition): string;
export declare function getDatasetVarName(storeDef: DataStoreDefinition): string;
export declare function genDatasetDeclaration(storeDef: DataStoreDefinition, namespace: string, includes: IncludeAggregator, semicolonTerminate: boolean): string;
export declare function genDatasetDeclarations(moduleDef: ModuleDefinition, namespace: string, includes: IncludeAggregator, semicolonTerminate: boolean): string[];
export declare function genModuleClass(fileWriter: FileWriter, libDir: string, moduleDef: ModuleDefinition): void;

