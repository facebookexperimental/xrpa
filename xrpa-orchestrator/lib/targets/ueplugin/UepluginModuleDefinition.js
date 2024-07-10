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
exports.UepluginModuleDefinition = void 0;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const FileWriter_1 = require("../../shared/FileWriter");
const Helpers_1 = require("../../shared/Helpers");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const CppModuleDefinition_1 = require("../cpp/CppModuleDefinition");
const GenDataStore_1 = require("../cpp/GenDataStore");
const GenSyntheticObject_1 = require("../cpp/GenSyntheticObject");
const GenTypesHeader_1 = require("../cpp/GenTypesHeader");
const GenBlueprintTypes_1 = require("./GenBlueprintTypes");
const GenModuleSubsystem_1 = require("./GenModuleSubsystem");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const GenPlugin_1 = require("./GenPlugin");
const GenIndexedSceneComponent_1 = require("./GenIndexedSceneComponent");
const GenSceneComponent_1 = require("./GenSceneComponent");
const GenSyntheticObjectSceneComponent_1 = require("./GenSyntheticObjectSceneComponent");
const SceneComponentShared_1 = require("./SceneComponentShared");
const UeTypeDefinitions_1 = require("./UeTypeDefinitions");
class UepluginModuleDefinition extends CppModuleDefinition_1.CppModuleDefinition {
    constructor(name, datamap, pluginsRoot, pluginDeps) {
        super(name, datamap, "", undefined, {
            includes: [
                { filename: "Engine.h" },
            ],
            code: "FGuid::NewGuid()",
        });
        this.pluginsRoot = pluginsRoot;
        this.pluginDeps = pluginDeps;
    }
    createEnum(name, apiname, enumValues, localTypeOverride) {
        (0, assert_1.default)(!localTypeOverride, `localTypeOverride must be undefined for UE enums`);
        return new UeTypeDefinitions_1.EnumTypeUe(this.codegen, name, apiname, enumValues);
    }
    createStruct(name, apiname, fields, localTypeOverride) {
        return new UeTypeDefinitions_1.StructTypeUe(this.codegen, name, apiname, undefined, fields, localTypeOverride);
    }
    setCollectionAsInbound(type, reconciledTo, indexes) {
        for (const index of (indexes ?? [])) {
            if (index.boundClassName === "") {
                index.boundClassName = (0, SceneComponentShared_1.getComponentClassName)(null, type);
            }
        }
        super.setCollectionAsInbound(type, reconciledTo, indexes);
    }
    setCollectionAsOutbound(type, componentProps) {
        if ((0, Helpers_1.filterToString)(componentProps.basetype)?.endsWith("Component")) {
            type.setToBarePtr({
                typename: (0, SceneComponentShared_1.getComponentClassName)(null, type, componentProps.idName),
                headerFile: (0, SceneComponentShared_1.getComponentHeader)(type, componentProps.idName),
            });
            if (type.interfaceType) {
                type.interfaceType.setToBarePtr({
                    typename: (0, SceneComponentShared_1.getComponentClassName)(null, type.interfaceType),
                    headerFile: (0, SceneComponentShared_1.getComponentHeader)(type.interfaceType, undefined),
                });
            }
        }
        else {
            super.setCollectionAsOutbound(type, componentProps);
        }
    }
    doCodeGen() {
        const fileWriter = new FileWriter_1.FileWriter();
        const pluginRootDir = path_1.default.join(this.pluginsRoot, this.name);
        // generate plugin directory structure and files
        const data = (0, GenPlugin_1.genPlugin)(fileWriter, pluginRootDir, this.name, this.pluginDeps);
        // generate ModuleSubsystem
        (0, GenModuleSubsystem_1.genModuleSubsystem)(fileWriter, data.privateSrcDir, this);
        for (const storeDef of this.getDataStores()) {
            // generate DS types using cpp codegen
            (0, GenTypesHeader_1.genTypesHeader)(fileWriter, data.privateSrcDir, storeDef);
            // generate DataStore files using cpp codegen
            const ctx = {
                moduleDef: this,
                storeDef,
                namespace: this.codegen.getDataStoreName(storeDef.apiname),
            };
            (0, GenDataStore_1.genDataStore)(fileWriter, data.privateSrcDir, ctx);
            // generate synthetic objects
            const syntheticObjects = storeDef.getSyntheticObjects();
            for (const name in syntheticObjects) {
                (0, GenSyntheticObject_1.genSyntheticObject)(ctx, fileWriter, data.publicSrcDir, name, syntheticObjects[name]);
                (0, GenSyntheticObjectSceneComponent_1.genSyntheticObjectSceneComponent)(ctx, fileWriter, data.privateSrcDir, data.publicSrcDir, name, syntheticObjects[name]);
            }
            // generate DataStore subsystem files
            (0, GenDataStoreSubsystem_1.genDataStoreSubsystem)(fileWriter, data.privateSrcDir, this, storeDef);
            // generate Blueprint-compatible versions of DS types, where needed
            ctx.namespace = "";
            (0, GenBlueprintTypes_1.genBlueprintTypes)(fileWriter, data.privateSrcDir, data.publicSrcDir, ctx);
            // generate UE reconciler classes
            for (const accessor of storeDef.getOutputReconcilers()) {
                if ((0, Helpers_1.filterToString)(accessor.componentProps.basetype)?.endsWith("Component")) {
                    (0, GenSceneComponent_1.genSceneComponent)(ctx, fileWriter, accessor, data.privateSrcDir, data.publicSrcDir);
                }
            }
            for (const accessor of storeDef.getInputReconcilers()) {
                if (accessor.hasIndexedBinding()) {
                    (0, GenIndexedSceneComponent_1.genIndexedSceneComponent)(ctx, fileWriter, accessor, data.privateSrcDir, data.publicSrcDir);
                }
            }
        }
        fileWriter.copyFolderContents(path_1.default.join(__dirname, "../../native/cpp/dataset"), path_1.default.join(data.publicSrcDir, "dataset"), (srcRelPath, fileExt, fileData) => {
            if (srcRelPath.startsWith("external_utils/")) {
                return null;
            }
            if (fileExt === ".cpp" || fileExt === ".h") {
                return (0, CppCodeGenImpl_1.injectGeneratedTag)(fileData);
            }
            return fileData;
        });
        fileWriter.copyFolderContents(path_1.default.join(__dirname, "../../native/ue/dataset"), path_1.default.join(data.publicSrcDir, "dataset"), (_srcRelPath, fileExt, fileData) => {
            if (fileExt === ".cpp" || fileExt === ".h") {
                return (0, CppCodeGenImpl_1.injectGeneratedTag)(fileData);
            }
            return fileData;
        });
        return fileWriter;
    }
}
exports.UepluginModuleDefinition = UepluginModuleDefinition;
//# sourceMappingURL=UepluginModuleDefinition.js.map
