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


import { Thunk } from "@xrpa/xrpa-utils";
import { ProgramInterface } from "./ProgramInterface";
import { RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { XrpaDataType } from "./XrpaLanguage";
import { ModuleDefinition } from "./shared/ModuleDefinition";
export interface NativeProgramContext extends RuntimeEnvironmentContext {
    __isNativeProgramContext: true;
    programInterfaces: Array<ProgramInterface>;
}
export declare function isNativeProgramContext(ctx: unknown): ctx is NativeProgramContext;
export declare function getNativeProgramContext(): NativeProgramContext;
type SettingsType = "Boolean" | "Count" | "Scalar" | "String" | "Angle" | "Distance" | "Float3";
export declare function addSetting(name: string, dataType: Thunk<XrpaDataType<SettingsType>>): void;
export declare function setProgramInterface(programInterface: ProgramInterface | Array<ProgramInterface>): void;
export declare function applyNativeProgramContext(ctx: NativeProgramContext, moduleDef: ModuleDefinition): void;
export {};

