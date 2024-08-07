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


import { BaseModuleOptions, ModuleBinding } from "./EngineBindings";
import { CoordinateSystemDef } from "./shared/CoordinateTransformer";
import { ArrayTypeSpec, TypeMap } from "./shared/TypeDefinition";
import { UepluginModuleDefinition } from "./targets/ueplugin/UepluginModuleDefinition";
export declare const UnrealCoordinateSystem: CoordinateSystemDef;
export declare const UnrealTypeMap: TypeMap;
export declare const UnrealArrayType: ArrayTypeSpec;
export declare function UepluginModule(name: string, params: {
    pluginsRoot: string;
    pluginDeps?: [string, string][];
    coordinateSystem?: CoordinateSystemDef;
    typeMap?: TypeMap;
    arrayType?: ArrayTypeSpec;
}): UepluginModuleDefinition;
interface PluginOptions {
    pluginDeps?: [string, string][];
}
export declare class UnrealProjectContext {
    readonly projectPath: string;
    plugins: UepluginModuleDefinition[];
    constructor(projectPath: string);
    addBindings<ModuleOptions extends BaseModuleOptions>(moduleToBind: ModuleBinding<ModuleOptions>, options?: ModuleOptions & PluginOptions): void;
}
export declare function UnrealProject(projectPath: string, callback: (unreal: UnrealProjectContext) => void): Promise<void>;
export {};

