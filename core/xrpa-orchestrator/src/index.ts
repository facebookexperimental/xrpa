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


export { buckBuild, buckRun, FileWriter, runProcess } from "@xrpa/xrpa-file-utils";

export { BuiltinType, isBuiltinType } from "./shared/BuiltinTypes";
export { CodeGen } from "./shared/CodeGen";
export { AngularUnitType, CoordAxis, CoordinateSystemDef, SpatialUnitType } from "./shared/CoordinateTransformer";
export { DataMapDefinition } from "./shared/DataMap";
export { DataModelDefinition, UserStructSpec } from "./shared/DataModel";
export { DataStoreDefinition } from "./shared/DataStore";
export { ModuleDefinition } from "./shared/ModuleDefinition";
export * from "./shared/TypeDefinition";

export { CppModuleDefinition } from "./targets/cpp/CppModuleDefinition";
export { CppStandalone } from "./targets/cpp/CppStandalone";

export { UepluginModuleDefinition } from "./targets/ueplugin/UepluginModuleDefinition";

export { UnityPackageModuleDefinition } from "./targets/unitypackage/UnityPackageModuleDefinition";

// V2 DSL:
export * from "./XrpaLanguage";
export * from "./ProgramInterface";
export * from "./InterfaceTypes";
export * from "./RuntimeEnvironment";

export * from "./Coordinates";
export * from "./GameEngine";

export * from "./NativeProgram";
export * from "./DataflowProgram";

export * from "./Unity";
export * from "./UnrealEngine";

export * from "./ConvenienceWrappers";
export * from "./Eigen";
