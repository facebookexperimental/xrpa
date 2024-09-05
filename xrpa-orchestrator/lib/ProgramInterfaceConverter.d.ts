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


import { ProgramInterface } from "./ProgramInterface";
import { RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { XrpaDataType } from "./XrpaLanguage";
import { DataModelDefinition } from "./shared/DataModel";
import { ModuleDefinition, UserTypeSpec } from "./shared/ModuleDefinition";
import { FieldTypeSpec } from "./shared/TypeDefinition";
export declare function getTypeName(dataType: XrpaDataType): string;
export declare function convertDataTypeToUserTypeSpec(dataType: XrpaDataType, datamodel: DataModelDefinition | null): UserTypeSpec | FieldTypeSpec;
export declare function bindProgramInterfaceToModule(ctx: RuntimeEnvironmentContext, moduleDef: ModuleDefinition, programInterface: ProgramInterface, isExternalInterface: boolean): void;

