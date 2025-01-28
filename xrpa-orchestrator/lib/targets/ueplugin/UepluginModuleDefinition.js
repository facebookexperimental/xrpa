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
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const Helpers_1 = require("../../shared/Helpers");
const CppCodeGenImpl_1 = require("../cpp/CppCodeGenImpl");
const CppModuleDefinition_1 = require("../cpp/CppModuleDefinition");
const GenDataflowProgram_1 = require("../cpp/GenDataflowProgram");
const GenDataStore_1 = require("../cpp/GenDataStore");
const GenTypesHeader_1 = require("../cpp/GenTypesHeader");
const GenBlueprintTypes_1 = require("./GenBlueprintTypes");
const GenDataflowProgramSpawner_1 = require("./GenDataflowProgramSpawner");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const GenPlugin_1 = require("./GenPlugin");
const GenIndexedSceneComponent_1 = require("./GenIndexedSceneComponent");
const GenSceneComponent_1 = require("./GenSceneComponent");
const GenTransportSubsystem_1 = require("./GenTransportSubsystem");
const SceneComponentShared_1 = require("./SceneComponentShared");
const UeTypeDefinitions_1 = require("./UeTypeDefinitions");
class UepluginModuleDefinition extends CppModuleDefinition_1.CppModuleDefinition {
    constructor(name, datamap, projectRoot, pluginsConfig) {
        super(name, datamap, "", undefined, {
            includes: [
                { filename: "Engine.h" },
            ],
            code: "FGuid::NewGuid()",
        });
        this.projectRoot = projectRoot;
        this.pluginsConfig = pluginsConfig;
    }
    createEnum(name, apiname, enumValues, localTypeOverride) {
        (0, assert_1.default)(!localTypeOverride, `localTypeOverride must be undefined for UE enums`);
        return new UeTypeDefinitions_1.EnumTypeUe(this.codegen, name, apiname, enumValues);
    }
    createStruct(name, apiname, fields, localTypeOverride) {
        return new UeTypeDefinitions_1.StructTypeUe(this.codegen, name, apiname, undefined, fields, localTypeOverride);
    }
    setCollectionAsInbound(type, componentProps, reconciledTo, indexes) {
        for (const index of (indexes ?? [])) {
            if (index.boundClassName === "") {
                index.boundClassName = (0, SceneComponentShared_1.getComponentClassName)(null, type);
            }
        }
        super.setCollectionAsInbound(type, componentProps, reconciledTo, indexes);
    }
    setCollectionAsOutbound(type, componentProps) {
        if ((0, xrpa_utils_1.filterToString)(componentProps.basetype)?.endsWith("Component")) {
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
        const fileWriter = new xrpa_utils_1.FileWriter();
        const pluginsDir = path_1.default.join(this.projectRoot, "Plugins");
        for (const storeDef of this.getDataStores()) {
            const pluginConfig = this.pluginsConfig[storeDef.apiname];
            const pluginRootDir = path_1.default.join(pluginsDir, pluginConfig.pluginName);
            // generate plugin directory structure and files
            const data = (0, GenPlugin_1.genPlugin)(fileWriter, pluginRootDir, pluginConfig.pluginName, pluginConfig.deps);
            // generate TransportSubsytem
            (0, GenTransportSubsystem_1.genTransportSubsystem)(fileWriter, data.privateSrcDir, storeDef, pluginConfig.pluginName);
            // generate DS types using cpp codegen
            (0, GenTypesHeader_1.genTypesHeader)(fileWriter, data.privateSrcDir, storeDef);
            // generate DataStore files using cpp codegen
            const ctx = {
                moduleDef: this,
                storeDef,
                namespace: this.codegen.getDataStoreHeaderNamespace(storeDef.apiname),
            };
            (0, GenDataStore_1.genDataStore)(fileWriter, data.privateSrcDir, ctx);
            // generate DataStore subsystem files
            (0, GenDataStoreSubsystem_1.genDataStoreSubsystem)(fileWriter, data.privateSrcDir, storeDef, pluginConfig.pluginName);
            // generate Blueprint-compatible versions of DS types, where needed
            ctx.namespace = "";
            (0, GenBlueprintTypes_1.genBlueprintTypes)(fileWriter, data.privateSrcDir, data.publicSrcDir, ctx);
            // generate UE reconciler classes
            for (const accessor of storeDef.getOutputReconcilers()) {
                if ((0, xrpa_utils_1.filterToString)(accessor.componentProps.basetype)?.endsWith("Component")) {
                    (0, GenSceneComponent_1.genSceneComponent)(ctx, fileWriter, accessor, data.privateSrcDir, data.publicSrcDir, pluginConfig.pluginName);
                }
            }
            for (const accessor of storeDef.getInputReconcilers()) {
                if (accessor.hasIndexedBinding()) {
                    (0, GenIndexedSceneComponent_1.genIndexedSceneComponent)(ctx, fileWriter, accessor, data.privateSrcDir, data.publicSrcDir, pluginConfig.pluginName);
                }
            }
            // copy over the Xrpa runtime files
            fileWriter.copyFolderContents((0, Helpers_1.getRuntimeSrcPath)("cpp"), path_1.default.join(data.publicSrcDir, "xrpa-runtime"), (srcRelPath, fileExt, fileData) => {
                if (srcRelPath.startsWith("external_utils/")) {
                    return null;
                }
                if (srcRelPath.endsWith("BUCK")) {
                    return null;
                }
                if (fileExt === ".cpp" || fileExt === ".h") {
                    return (0, CppCodeGenImpl_1.injectGeneratedTag)(fileData);
                }
                return fileData;
            });
            fileWriter.copyFolderContents((0, Helpers_1.getRuntimeSrcPath)("ue"), path_1.default.join(data.publicSrcDir, "xrpa-runtime"), (_srcRelPath, fileExt, fileData) => {
                if (fileExt === ".cpp" || fileExt === ".h") {
                    return (0, CppCodeGenImpl_1.injectGeneratedTag)(fileData);
                }
                return fileData;
            });
        }
        // generate dataflow programs
        const dataflowPrograms = this.getDataflowPrograms();
        if (dataflowPrograms.length) {
            const srcDir = path_1.default.join(this.projectRoot, "Source", this.name);
            const privateSrcDir = path_1.default.join(srcDir, "Private", "XrpaDataflow");
            const publicSrcDir = path_1.default.join(srcDir, "Public", "XrpaDataflow");
            for (const dataflowDef of dataflowPrograms) {
                (0, GenDataflowProgram_1.genDataflowProgram)({
                    namespace: "XrpaDataflow",
                    moduleDef: this,
                }, fileWriter, publicSrcDir, dataflowDef);
                (0, GenDataflowProgramSpawner_1.genDataflowProgramSpawner)({
                    namespace: "XrpaDataflow",
                    moduleDef: this,
                }, fileWriter, privateSrcDir, publicSrcDir, dataflowDef, this.name);
            }
        }
        return fileWriter;
    }
}
exports.UepluginModuleDefinition = UepluginModuleDefinition;
//# sourceMappingURL=UepluginModuleDefinition.js.map
