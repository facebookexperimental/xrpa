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
const path_1 = __importDefault(require("path"));
const FileWriter_1 = require("../../shared/FileWriter");
const Helpers_1 = require("../../shared/Helpers");
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const CsharpModuleDefinition_1 = require("../csharp/CsharpModuleDefinition");
const GenDataStore_1 = require("../csharp/GenDataStore");
const GenSyntheticObject_1 = require("../csharp/GenSyntheticObject");
const GenTypesDefinitions_1 = require("../csharp/GenTypesDefinitions");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const GenIndexedMonoBehaviour_1 = require("./GenIndexedMonoBehaviour");
const GenModuleSubsystem_1 = require("./GenModuleSubsystem");
const GenMonoBehaviour_1 = require("./GenMonoBehaviour");
const GenPackage_1 = require("./GenPackage");
const GenSyntheticObjectMonoBehaviour_1 = require("./GenSyntheticObjectMonoBehaviour");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
class UnityPackageModuleDefinition extends CsharpModuleDefinition_1.CsharpModuleDefinition {
    constructor(datamap, packagesRoot, packageInfo) {
        super(datamap, packageInfo.packageName, "");
        this.packagesRoot = packagesRoot;
        this.packageInfo = packageInfo;
    }
    setCollectionAsInbound(type, reconciledTo, indexedReconciled) {
        if (indexedReconciled) {
            indexedReconciled.indexedTypeName = (0, MonoBehaviourShared_1.getComponentClassName)(type);
        }
        super.setCollectionAsInbound(type, reconciledTo, indexedReconciled);
    }
    setCollectionAsOutbound(type, componentProps) {
        if ((0, Helpers_1.filterToString)(componentProps.basetype)) {
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
        const fileWriter = new FileWriter_1.FileWriter();
        const packageRootDir = path_1.default.join(this.packagesRoot, this.name);
        // generate package directory structure and files
        const { runtimeDir } = (0, GenPackage_1.genPackage)(fileWriter, packageRootDir, this.packageInfo);
        // generate ModuleSubsystem
        (0, GenModuleSubsystem_1.genModuleSubsystem)(fileWriter, runtimeDir, this);
        for (const storeDef of this.getDataStores()) {
            // generate DS types using csharp codegen
            (0, GenTypesDefinitions_1.genTypesDefinitions)(fileWriter, runtimeDir, storeDef);
            // generate DataStore files using csharp codegen
            const ctx = {
                moduleDef: this,
                storeDef,
                namespace: this.codegen.getDataStoreName(storeDef.apiname),
            };
            (0, GenDataStore_1.genDataStore)(fileWriter, runtimeDir, ctx);
            // generate synthetic objects
            const syntheticObjects = storeDef.getSyntheticObjects();
            for (const name in syntheticObjects) {
                (0, GenSyntheticObject_1.genSyntheticObject)(ctx, fileWriter, runtimeDir, name, syntheticObjects[name]);
                (0, GenSyntheticObjectMonoBehaviour_1.genSyntheticObjectMonoBehaviour)(ctx, fileWriter, runtimeDir, name, syntheticObjects[name]);
            }
            // generate DataStore subsystem files
            (0, GenDataStoreSubsystem_1.genDataStoreSubsystem)(fileWriter, runtimeDir, this, storeDef);
            ctx.namespace = "";
            // generate Unity component classes
            for (const accessor of storeDef.getOutputReconcilers()) {
                if ((0, Helpers_1.filterToString)(accessor.componentProps.basetype)) {
                    (0, GenMonoBehaviour_1.genMonoBehaviour)(ctx, fileWriter, accessor, runtimeDir);
                }
            }
            for (const accessor of storeDef.getInputReconcilers()) {
                if (accessor.indexedReconciled) {
                    (0, GenIndexedMonoBehaviour_1.genIndexedMonoBehaviour)(ctx, fileWriter, accessor, runtimeDir);
                }
            }
        }
        fileWriter.copyFolderContents(path_1.default.join(__dirname, "../../native/cs/dataset"), path_1.default.join(this.packagesRoot, "Xrpa"), (_srcRelPath, fileExt, fileData) => {
            if (fileExt === ".cs") {
                return (0, CsharpCodeGenImpl_1.injectGeneratedTag)(fileData);
            }
            return fileData;
        });
        return fileWriter;
    }
}
exports.UnityPackageModuleDefinition = UnityPackageModuleDefinition;
//# sourceMappingURL=UnityPackageModuleDefinition.js.map
