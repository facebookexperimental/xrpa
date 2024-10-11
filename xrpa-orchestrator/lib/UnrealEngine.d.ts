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


import { ExternalProgramInterfaceContext, RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { PropertyCondition } from "./XrpaLanguage";
import { CoordinateSystemDef } from "./shared/CoordinateTransformer";
import { ArrayTypeSpec } from "./shared/TypeDefinition";
export declare const UnrealCoordinateSystem: CoordinateSystemDef;
export declare const UnrealArrayType: ArrayTypeSpec;
export interface UnrealEngineRuntimeContext extends RuntimeEnvironmentContext {
    __UnrealEngineRuntime: true;
}
export declare const IfUnrealEngine: PropertyCondition;
export declare function PluginDeps(ctx: ExternalProgramInterfaceContext, pluginDeps: [string, string][]): void;
export declare function UnrealProject(projectPath: string, projectName: string, callback: (ctx: UnrealEngineRuntimeContext) => void): Promise<void>;

