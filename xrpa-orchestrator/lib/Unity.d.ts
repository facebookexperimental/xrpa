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


import { NativeProgramContext } from "./NativeProgram";
import { RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { PropertyCondition } from "./XrpaLanguage";
import { CoordinateSystemDef } from "./shared/CoordinateTransformer";
import { ArrayTypeSpec } from "./shared/TypeDefinition";
import { UnityPackageModuleDefinition } from "./targets/unitypackage/UnityPackageModuleDefinition";
export declare const UnityCoordinateSystem: CoordinateSystemDef;
export declare const UnityArrayType: ArrayTypeSpec;
export interface UnityRuntimeContext extends RuntimeEnvironmentContext {
    __UnityRuntime: true;
}
export type UnityProgramContext = UnityRuntimeContext & NativeProgramContext;
export declare const IfUnity: PropertyCondition;
export declare function UnityProject(projectPath: string, projectName: string, callback: (ctx: UnityRuntimeContext) => void): Promise<void>;
export declare function XrpaNativeUnityProgram(packageName: string, outputPath: string, callback: (ctx: UnityRuntimeContext) => void): UnityPackageModuleDefinition;

