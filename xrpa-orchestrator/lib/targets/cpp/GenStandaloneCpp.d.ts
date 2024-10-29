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
import { IncludeAggregator } from "../../shared/Helpers";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { DataStoreDefinition } from "../../shared/DataStore";
export declare function genDatasetInitializer(storeDef: DataStoreDefinition, namespace: string, includes: IncludeAggregator): string[];
export declare function genDatasetDeinitializer(storeDef: DataStoreDefinition): string[];
export declare function genStandaloneCpp(fileWriter: FileWriter, outdir: string, moduleDef: ModuleDefinition): void;
export declare function genStandaloneBuck(fileWriter: FileWriter, outdir: string, runtimeDir: string, buckTarget: string, moduleDef: ModuleDefinition, oncall: string): void;

