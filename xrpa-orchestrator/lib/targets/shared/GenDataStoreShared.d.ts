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


import { ClassSpec, ClassVisibility } from "../../shared/ClassSpec";
import { DataStoreDefinition, InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { TargetCodeGenImpl } from "../../shared/TargetCodeGen";
export interface GenDataStoreContext {
    moduleDef: ModuleDefinition;
    storeDef: DataStoreDefinition;
    namespace: string;
}
export declare function genFieldProperties(classSpec: ClassSpec, params: {
    codegen: TargetCodeGenImpl;
    reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition;
    fieldToMemberVar: (fieldName: string) => string;
    directionality: "inbound" | "outbound";
    canCreate?: boolean;
    canChange?: boolean;
    visibility?: ClassVisibility;
}): void;

