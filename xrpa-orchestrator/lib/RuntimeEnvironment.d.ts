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
import { WithBindingProperties, XrpaDataType } from "./XrpaLanguage";
import { DataMapDefinition } from "./shared/DataMap";
import { Thunk } from "./shared/Helpers";
import { TypeSpec } from "./shared/TargetCodeGen";
import { ArrayTypeSpec } from "./shared/TypeDefinition";
export interface ExternalProgramInterfaceContext extends WithBindingProperties {
    programInterface: ProgramInterface;
}
export interface ExternalProgramCallerContext {
    externalProgramInterfaces: Record<string, ExternalProgramInterfaceContext>;
}
export declare function isExternalProgramCallerContext(ctx: unknown): ctx is ExternalProgramCallerContext;
export declare function getExternalProgramCallerContext(): ExternalProgramCallerContext;
export interface RuntimeEnvironmentContext extends ExternalProgramCallerContext, WithBindingProperties {
    __isRuntimeEnvironmentContext: true;
}
export declare function isRuntimeEnvironmentContext(ctx: unknown): ctx is RuntimeEnvironmentContext;
export declare function getRuntimeEnvironmentContext(): RuntimeEnvironmentContext;
export declare function mapType(dataType: string | Thunk<XrpaDataType>, mapped: TypeSpec): void;
export declare function mapInterfaceType(programInterface: ProgramInterface, dataType: string | Thunk<XrpaDataType>, mapped: TypeSpec): void;
export declare function getInterfaceTypeMap(ctx: RuntimeEnvironmentContext, programInterface: ProgramInterface): Record<string, TypeSpec>;
export declare function mapArrays(localArrayType: ArrayTypeSpec): void;
export declare function getDataMap(ctx: RuntimeEnvironmentContext): DataMapDefinition;
export declare function bindExternalProgram(programInterface: ProgramInterface): ExternalProgramInterfaceContext;

