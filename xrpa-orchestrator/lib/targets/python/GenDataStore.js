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

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDataStore = exports.genMsgHandler = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
const GenReadReconcilerDataStore_1 = require("./GenReadReconcilerDataStore");
const GenWriteReconcilerDataStore_1 = require("./GenWriteReconcilerDataStore");
const PythonCodeGenImpl_1 = require("./PythonCodeGenImpl");
const PythonCodeGenImpl = __importStar(require("./PythonCodeGenImpl"));
const PythonDatasetLibraryTypes_1 = require("./PythonDatasetLibraryTypes");
function genMsgHandler(msg) {
    return PythonCodeGenImpl.privateMember(`${msg}_message_handler`);
}
exports.genMsgHandler = genMsgHandler;
function genReconcilerConstructorContents(ctx) {
    const lines = [];
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const className = (0, GenDataStoreShared_1.getInboundCollectionClassName)(ctx, typeDef);
        const varName = typeDef.getName();
        lines.push(`self.${varName} = ${className}(self)`, `self._register_collection(self.${varName})`);
    }
    for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const className = (0, GenDataStoreShared_1.getOutboundCollectionClassName)(ctx, typeDef);
        const varName = typeDef.getName();
        lines.push(`self.${varName} = ${className}(self)`, `self._register_collection(self.${varName})`);
    }
    return lines;
}
function genDataStoreClass(ctx, includes) {
    const className = (0, PythonCodeGenImpl_1.getDataStoreClass)(ctx.storeDef.apiname, ctx.namespace, null);
    const baseClassName = PythonDatasetLibraryTypes_1.DataStoreReconciler.getLocalType(ctx.namespace, includes);
    const messagePoolSize = ctx.storeDef.datamodel.calcMessagePoolSize();
    const lines = [
        `class ${className}(${baseClassName}):`,
        `  def __init__(self, ${PythonDatasetLibraryTypes_1.TransportStream.declareLocalParam(ctx.namespace, includes, "inbound_transport")}, ${PythonDatasetLibraryTypes_1.TransportStream.declareLocalParam(ctx.namespace, includes, "outbound_transport")}):`,
        `    super().__init__(inbound_transport, outbound_transport, ${messagePoolSize})`,
        ...(0, xrpa_utils_1.indent)(2, genReconcilerConstructorContents(ctx)),
        ``,
    ];
    return lines;
}
function genAccessorTypes(ctx, includes) {
    const ret = [];
    for (const typeDef of ctx.storeDef.datamodel.getAllTypeDefinitions()) {
        if ((0, TypeDefinition_1.typeIsStructWithAccessor)(typeDef)) {
            const readDef = typeDef.genReadAccessorDefinition(ctx.namespace, includes);
            if (readDef) {
                ret.push(readDef);
            }
            const writeDef = typeDef.genWriteAccessorDefinition(ctx.namespace, includes);
            if (writeDef) {
                ret.push(writeDef);
            }
        }
    }
    return ret;
}
function genInterfaceTypes(ctx, includes) {
    const ret = [];
    const headerFile = (0, PythonCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const typeDef of ctx.storeDef.datamodel.getTypeDefinitionsForHeader(headerFile)) {
        if ((0, TypeDefinition_1.typeIsInterface)(typeDef) && !(0, TypeDefinition_1.typeIsCollection)(typeDef)) {
            const classSpec = new ClassSpec_1.ClassSpec({
                name: typeDef.getLocalType(ctx.namespace, includes),
                superClass: PythonDatasetLibraryTypes_1.DataStoreObject.getLocalType(ctx.namespace, includes),
                interfaceName: PythonDatasetLibraryTypes_1.IDataStoreObject.getLocalType(ctx.namespace, includes),
                forceAbstract: true,
                namespace: ctx.namespace,
                includes,
            });
            classSpec.constructors.push({
                parameters: [{
                        name: "id",
                        type: ctx.moduleDef.ObjectUuid,
                    }, {
                        name: "collection",
                        type: PythonDatasetLibraryTypes_1.IObjectCollection,
                    }],
                superClassInitializers: ["id", "collection"],
                body: [],
            });
            ret.push(classSpec);
        }
    }
    return ret;
}
function genDataStore(fileWriter, outdir, ctx) {
    const headerName = (0, PythonCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    ctx = { ...ctx, namespace: (0, PythonCodeGenImpl_1.getDataStoreHeaderNamespace)(ctx.storeDef.apiname) };
    const includes = new PythonCodeGenImpl_1.PythonIncludeAggregator();
    const accessors = genAccessorTypes(ctx, includes);
    const reconciledTypes = [
        ...genInterfaceTypes(ctx, includes),
        ...(0, GenWriteReconcilerDataStore_1.genOutboundReconciledTypes)(ctx, includes),
        ...(0, GenReadReconcilerDataStore_1.genInboundReconciledTypes)(ctx, includes),
    ];
    const collections = (0, GenReadReconcilerDataStore_1.genObjectCollectionClasses)(ctx, includes);
    const lines = [
        ...(0, xrpa_utils_1.mapAndCollapse)(accessors, PythonCodeGenImpl_1.genClassDefinition),
        ``,
        `# Reconciled Types`,
        ...(0, xrpa_utils_1.mapAndCollapse)(reconciledTypes, PythonCodeGenImpl_1.genClassDefinition),
        ``,
        `# Object Collections`,
        ...(0, xrpa_utils_1.mapAndCollapse)(collections, PythonCodeGenImpl_1.genClassDefinition),
        ``,
        `# Data Store Implementation`,
        ...genDataStoreClass(ctx, includes),
        ``,
    ];
    lines.unshift(...PythonCodeGenImpl_1.HEADER, ``, ...includes.getNamespaceImports(ctx.namespace), ``);
    fileWriter.writeFile(path_1.default.join(outdir, headerName), lines);
}
exports.genDataStore = genDataStore;
//# sourceMappingURL=GenDataStore.js.map
