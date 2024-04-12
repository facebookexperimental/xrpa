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


import { DataMapDefinition } from "../../shared/DataMap";
import { ComponentProperties, IndexedReconciledParams } from "../../shared/DataStore";
import { FileWriter } from "../../shared/FileWriter";
import { TypeSpec } from "../../shared/TargetCodeGen";
import { CollectionTypeDefinition } from "../../shared/TypeDefinition";
import { CsharpModuleDefinition } from "../csharp/CsharpModuleDefinition";
import { PackageInfo } from "./GenPackage";
export declare class UnityPackageModuleDefinition extends CsharpModuleDefinition {
    readonly packagesRoot: string;
    readonly packageInfo: PackageInfo;
    constructor(datamap: DataMapDefinition, packagesRoot: string, packageInfo: PackageInfo);
    setCollectionAsInbound(type: CollectionTypeDefinition, reconciledTo: TypeSpec | undefined, indexedReconciled: IndexedReconciledParams | undefined): void;
    setCollectionAsOutbound(type: CollectionTypeDefinition, componentProps: ComponentProperties): void;
    doCodeGen(): FileWriter;
}

