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
import { CoordinateSystemDef } from "./shared/CoordinateTransformer";
import { ArrayTypeSpec, TypeMap } from "./shared/TypeDefinition";
import { CppModuleDefinition, ModuleBuckConfig } from "./targets/cpp/CppModuleDefinition";
import { PythonApplication } from "./targets/python/PythonApplication";
import { PythonModuleDefinition } from "./targets/python/PythonModuleDefinition";
export declare function withHeader<T extends Record<string, string>>(headerFile: string, types: T): TypeMap;
export declare const OvrCoordinateSystem: CoordinateSystemDef;
export declare const StdVectorArrayType: ArrayTypeSpec;
interface BuckConfig extends ModuleBuckConfig {
    deps?: string[];
}
export declare function useBuck(config: BuckConfig): void;
export declare function addBuckDependency(dep: string): void;
export declare function XrpaNativeCppProgram(name: string, outputDir: string, callback: (ctx: NativeProgramContext) => void): CppModuleDefinition;
export declare function XrpaNativePythonProgram(name: string, outputDir: string, callback: (ctx: NativeProgramContext) => void): PythonModuleDefinition;
export declare function XrpaPythonApplication(name: string, outputDir: string, callback: (ctx: NativeProgramContext) => void): PythonApplication;
export {};

