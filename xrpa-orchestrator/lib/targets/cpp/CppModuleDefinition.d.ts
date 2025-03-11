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
import { DataMapDefinition } from "../../shared/DataMap";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { GuidGenSpec } from "../../shared/TargetCodeGen";
import { StructTypeDefinition } from "../../shared/TypeDefinition";
export interface ModuleBuckConfig {
    target: string;
    oncall: string;
}
export declare class CppModuleDefinition extends ModuleDefinition {
    readonly genOutputDir: string;
    readonly buckDef?: ModuleBuckConfig | undefined;
    readonly libDir: string;
    readonly runtimeDir: string;
    constructor(name: string, datamap: DataMapDefinition, genOutputDir: string, buckDef?: ModuleBuckConfig | undefined, guidGen?: GuidGenSpec);
    protected createObjectUuid(): StructTypeDefinition;
    doCodeGen(): FileWriter;
    private genBuckFile;
}

