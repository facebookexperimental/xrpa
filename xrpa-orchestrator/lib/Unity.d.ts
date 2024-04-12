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


import { CoordinateSystemDef } from "./shared/CoordinateTransformer";
import { ArrayTypeSpec, TypeMap } from "./shared/TypeDefinition";
import { PackageInfo } from "./targets/unitypackage/GenPackage";
import { UnityPackageModuleDefinition } from "./targets/unitypackage/UnityPackageModuleDefinition";
export declare const UnityCoordinateSystem: CoordinateSystemDef;
export declare const UnityTypeMap: TypeMap;
export declare const UnityArrayType: ArrayTypeSpec;
export declare function UnityPackageModule(name: string, params: {
    packagesRoot: string;
    packageInfo: Omit<PackageInfo, "packageName">;
    coordinateSystem?: CoordinateSystemDef;
    typeMap?: TypeMap;
    arrayType?: ArrayTypeSpec;
}): UnityPackageModuleDefinition;

