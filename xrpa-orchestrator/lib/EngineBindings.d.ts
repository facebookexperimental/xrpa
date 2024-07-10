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


import { ModuleDefinition } from "./shared/ModuleDefinition";
export interface GameEngineBindingConfig {
    componentBaseClass: string;
    intrinsicPositionProperty: string;
    intrinsicRotationProperty: string;
    intrinsicParentProperty: string;
    intrinsicGameObjectProperty: string;
}
export type EmptyObjectType = Record<string, never>;
export type BindingConfig = GameEngineBindingConfig | EmptyObjectType;
export declare function isModuleBindingConfig(binding: BindingConfig | undefined): binding is GameEngineBindingConfig;
export declare function isCallerBindingConfig(binding: BindingConfig | undefined): binding is BindingConfig;
export declare function isGameEngineBindingConfig(binding: BindingConfig | undefined): binding is GameEngineBindingConfig;
export interface BaseModuleOptions {
    upperCaseCompanyName?: boolean;
}
export interface ModuleBinding<ModuleOptions extends BaseModuleOptions> {
    name: string;
    companyName: string;
    setupDataStore(moduleDef: ModuleDefinition, binding?: BindingConfig, options?: ModuleOptions): void;
}

