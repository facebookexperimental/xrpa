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

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnityPackageModuleDefinition = void 0;
const xrpa_file_utils_1 = require("@xrpa/xrpa-file-utils");
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("../../shared/Helpers");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpModuleDefinition_1 = require("../csharp/CsharpModuleDefinition");
const GenDataflowProgram_1 = require("../csharp/GenDataflowProgram");
const GenDataStore_1 = require("../csharp/GenDataStore");
const GenTypesDefinitions_1 = require("../csharp/GenTypesDefinitions");
const GenDataflowProgramSpawner_1 = require("./GenDataflowProgramSpawner");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const GenIndexedMonoBehaviour_1 = require("./GenIndexedMonoBehaviour");
const GenMonoBehaviour_1 = require("./GenMonoBehaviour");
const GenPackage_1 = require("./GenPackage");
const GenTransportSubsystem_1 = require("./GenTransportSubsystem");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
class UnityPackageModuleDefinition extends CsharpModuleDefinition_1.CsharpModuleDefinition {
    constructor(name, datamap, projectRoot, packageInfos) {
        super(datamap, name, "");
        this.projectRoot = projectRoot;
        this.packageInfos = packageInfos;
    }
    setCollectionAsInbound(type, componentProps, reconciledTo, indexes) {
        if (componentProps.generateSpawner && (0, xrpa_utils_1.filterToString)(componentProps.basetype)) {
            type.setToBarePtr({
                typename: (0, MonoBehaviourShared_1.getComponentClassName)(type),
            });
            if (type.interfaceType) {
                type.interfaceType.setToBarePtr({
                    typename: (0, MonoBehaviourShared_1.getComponentClassName)(type.interfaceType),
                });
            }
        }
        else {
            for (const index of (indexes ?? [])) {
                if (index.boundClassName === "") {
                    index.boundClassName = (0, MonoBehaviourShared_1.getComponentClassName)(type);
                }
            }
            super.setCollectionAsInbound(type, componentProps, reconciledTo, indexes);
        }
    }
    setCollectionAsOutbound(type, componentProps) {
        if ((0, xrpa_utils_1.filterToString)(componentProps.basetype)) {
            type.setToBarePtr({
                typename: (0, MonoBehaviourShared_1.getComponentClassName)(type, componentProps.idName),
            });
            if (type.interfaceType) {
                type.interfaceType.setToBarePtr({
                    typename: (0, MonoBehaviourShared_1.getComponentClassName)(type.interfaceType),
                });
            }
        }
        else {
            super.setCollectionAsOutbound(type, componentProps);
        }
    }
    doCodeGen() {
        const fileWriter = new xrpa_file_utils_1.FileWriter();
        const packagesDir = path_1.default.join(this.projectRoot, "Packages");
        const runtimeDirs = {};
        for (const key in this.packageInfos) {
            const packageInfo = this.packageInfos[key];
            const packageRootDir = path_1.default.join(packagesDir, packageInfo.packageName);
            // generate package directory structure and files
            const { runtimeDir } = (0, GenPackage_1.genPackage)(fileWriter, packageRootDir, packageInfo);
            runtimeDirs[key] = runtimeDir;
        }
        for (const storeDef of this.getDataStores()) {
            const runtimeDir = runtimeDirs[storeDef.apiname];
            // generate TransportSubsystem
            (0, GenTransportSubsystem_1.genTransportSubsystem)(fileWriter, runtimeDir, storeDef);
            // generate DS types using csharp codegen
            (0, GenTypesDefinitions_1.genTypesDefinitions)(fileWriter, runtimeDir, storeDef);
            // generate DataStore files using csharp codegen
            const ctx = {
                moduleDef: this,
                storeDef,
                namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
            };
            (0, GenDataStore_1.genDataStore)(fileWriter, runtimeDir, ctx);
            // generate DataStore subsystem files
            (0, GenDataStoreSubsystem_1.genDataStoreSubsystem)(fileWriter, runtimeDir, storeDef);
            ctx.namespace = "";
            // generate Unity component classes
            for (const accessor of storeDef.getOutputReconcilers()) {
                if ((0, xrpa_utils_1.filterToString)(accessor.componentProps.basetype)) {
                    (0, GenMonoBehaviour_1.genMonoBehaviour)(ctx, fileWriter, accessor, runtimeDir);
                }
            }
            for (const accessor of storeDef.getInputReconcilers()) {
                if (accessor.componentProps.generateSpawner && (0, xrpa_utils_1.filterToString)(accessor.componentProps.basetype)) {
                    (0, GenIndexedMonoBehaviour_1.genSpawnedMonoBehaviour)(ctx, fileWriter, accessor, runtimeDir);
                }
                else if (accessor.hasIndexedBinding()) {
                    (0, GenIndexedMonoBehaviour_1.genIndexedMonoBehaviour)(ctx, fileWriter, accessor, runtimeDir);
                }
            }
        }
        // create the Xrpa runtime package
        fileWriter.copyFolderContents((0, Helpers_1.getRuntimeSrcPath)("cs"), path_1.default.join(packagesDir, "Xrpa"), (_srcRelPath, fileExt, fileData) => {
            if (fileExt === ".cs") {
                return (0, CsharpCodeGenImpl_1.injectGeneratedTag)(fileData);
            }
            return fileData;
        });
        // generate dataflow programs
        const dataflowPrograms = this.getDataflowPrograms();
        if (dataflowPrograms.length) {
            const dataflowRootDir = path_1.default.join(this.projectRoot, "Assets", "XrpaDataflow");
            for (const dataflowDef of dataflowPrograms) {
                (0, GenDataflowProgram_1.genDataflowProgram)({
                    namespace: "XrpaDataflow",
                    moduleDef: this,
                }, fileWriter, dataflowRootDir, dataflowDef);
                (0, GenDataflowProgramSpawner_1.genDataflowProgramSpawner)({
                    namespace: "XrpaDataflow",
                    moduleDef: this,
                }, fileWriter, dataflowRootDir, dataflowDef);
            }
        }
        return fileWriter;
    }
}
exports.UnityPackageModuleDefinition = UnityPackageModuleDefinition;
//# sourceMappingURL=UnityPackageModuleDefinition.js.map
