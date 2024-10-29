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
exports.genDataStore = exports.genMsgHandler = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
const CppDatasetLibraryTypes_1 = require("./CppDatasetLibraryTypes");
const GenReadReconcilerDataStore_1 = require("./GenReadReconcilerDataStore");
const GenTypesHeader_1 = require("./GenTypesHeader");
const GenWriteReconcilerDataStore_1 = require("./GenWriteReconcilerDataStore");
const GenDataStoreShared_1 = require("../shared/GenDataStoreShared");
function genMsgHandler(fieldName) {
    return `${fieldName}MessageHandler_`;
}
exports.genMsgHandler = genMsgHandler;
function getHeaderIncludes(ctx, includes) {
    includes.addFile({
        filename: "<functional>",
        namespace: "std",
    });
    includes.addFile({
        filename: "<memory>",
        namespace: "std",
    });
}
function genReconcilerConstructorContents(ctx) {
    const lines = [];
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const className = (0, GenDataStoreShared_1.getInboundCollectionClassName)(ctx, typeDef);
        const varName = reconcilerDef.getDataStoreAccessorName();
        lines.push(`${varName} = std::make_shared<${className}>(this);`, `registerCollection(${varName});`);
    }
    for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const className = (0, GenDataStoreShared_1.getOutboundCollectionClassName)(ctx, typeDef);
        const varName = reconcilerDef.getDataStoreAccessorName();
        lines.push(`${varName} = std::make_shared<${className}>(this);`, `registerCollection(${varName});`);
    }
    return lines;
}
function genGetObjectConditional(ctx, includes) {
    const lines = [];
    let iffer = "if";
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const varName = reconcilerDef.getDataStoreAccessorName();
        lines.push(`${iffer} constexpr (std::is_same_v<Ts, ${typeDef.getLocalTypePtr(ctx.namespace, includes)}>) {`, `  ret = ${varName}->getObject(id);`);
        iffer = "} else if";
    }
    for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const varName = reconcilerDef.getDataStoreAccessorName();
        lines.push(`${iffer} constexpr (std::is_same_v<Ts, ${typeDef.getLocalTypePtr(ctx.namespace, includes)}>) {`, `  ret = ${varName}->getObject(id);`);
        iffer = "} else if";
    }
    lines.push(`}`);
    return lines;
}
function genDataStoreClass(ctx, includes) {
    const className = (0, CppCodeGenImpl_1.getDataStoreName)(ctx.storeDef.apiname);
    const baseClassName = CppDatasetLibraryTypes_1.DatasetReconciler.getLocalType(ctx.namespace, includes);
    const hashName = (0, GenTypesHeader_1.getDataStoreSchemaHashName)(ctx.storeDef.apiname);
    const messagePoolSize = ctx.storeDef.datamodel.calcMessagePoolSize();
    const lines = [
        `class ${className} : public ${baseClassName} {`,
        ` public:`,
        `  ${className}(std::weak_ptr<${CppDatasetLibraryTypes_1.DatasetInterface.getLocalType(ctx.namespace, includes)}> inboundDataset, std::weak_ptr<${CppDatasetLibraryTypes_1.DatasetInterface.getLocalType(ctx.namespace, includes)}> outboundDataset)`,
        `      : ${baseClassName}(inboundDataset, outboundDataset, ${hashName}, ${messagePoolSize}) {`,
        ...(0, xrpa_utils_1.indent)(2, genReconcilerConstructorContents(ctx)),
        `  }`,
        ``,
    ];
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const className = (0, GenDataStoreShared_1.getInboundCollectionClassName)(ctx, typeDef);
        const varName = reconcilerDef.getDataStoreAccessorName();
        lines.push(...(0, xrpa_utils_1.indent)(1, [
            `std::shared_ptr<${className}> ${varName};`,
        ]));
    }
    for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
        const typeDef = reconcilerDef.type;
        const className = (0, GenDataStoreShared_1.getOutboundCollectionClassName)(ctx, typeDef);
        const varName = reconcilerDef.getDataStoreAccessorName();
        lines.push(...(0, xrpa_utils_1.indent)(1, [
            `std::shared_ptr<${className}> ${varName};`,
        ]));
    }
    lines.push(...(0, xrpa_utils_1.indent)(1, [
        ``,
        `template <typename R, typename... Ts>`,
        `[[nodiscard]] R getObjectByID(${ctx.moduleDef.DSIdentifier.declareLocalParam(ctx.namespace, includes, "id")}) const {`,
        `  R ret = nullptr;`,
        `  (`,
        `      [&]() {`,
        `        if (ret != nullptr) {`,
        `          return;`,
        `        }`,
        ...(0, xrpa_utils_1.indent)(4, genGetObjectConditional(ctx, includes)),
        `      }(),`,
        `      ...);`,
        `  return ret;`,
        `}`,
        ``,
    ]));
    lines.push(`};`);
    return lines;
}
function genExternalForwardDeclarations(ctx) {
    const lines = [];
    for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
        for (const indexConfig of reconcilerDef.indexConfigs) {
            if (indexConfig.boundClassName) {
                lines.push((0, CppCodeGenImpl_1.forwardDeclareClass)(indexConfig.boundClassName));
            }
        }
    }
    lines.push(``);
    return lines;
}
function genForwardDeclarations(ctx) {
    const lines = [];
    const headerFile = (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const typeDef of ctx.storeDef.datamodel.getTypeDefinitionsForHeader(headerFile)) {
        if ((0, TypeDefinition_1.typeIsInterface)(typeDef)) {
            lines.push((0, CppCodeGenImpl_1.forwardDeclareClass)(typeDef.getLocalType(ctx.namespace, null)));
        }
    }
    lines.push(``);
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
    const headerFile = (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    for (const typeDef of ctx.storeDef.datamodel.getTypeDefinitionsForHeader(headerFile)) {
        if ((0, TypeDefinition_1.typeIsInterface)(typeDef) && !(0, TypeDefinition_1.typeIsCollection)(typeDef)) {
            const classSpec = new ClassSpec_1.ClassSpec({
                name: typeDef.getLocalType(ctx.namespace, includes),
                superClass: CppDatasetLibraryTypes_1.DataStoreObject.getLocalType(ctx.namespace, includes),
                namespace: ctx.namespace,
                includes,
            });
            classSpec.constructors.push({
                parameters: [{
                        name: "id",
                        type: ctx.moduleDef.DSIdentifier,
                    }, {
                        name: "collection",
                        type: CppDatasetLibraryTypes_1.CollectionInterface.getLocalType(ctx.namespace, classSpec.includes) + "*",
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
    const headerName = (0, CppCodeGenImpl_1.getDataStoreHeaderName)(ctx.storeDef.apiname);
    const includes = new CppCodeGenImpl_1.CppIncludeAggregator();
    getHeaderIncludes(ctx, includes);
    const accessors = genAccessorTypes(ctx, includes);
    const reconciledTypes = [
        ...genInterfaceTypes(ctx, includes),
        ...(0, GenWriteReconcilerDataStore_1.genOutboundReconciledTypes)(ctx, includes),
        ...(0, GenReadReconcilerDataStore_1.genInboundReconciledTypes)(ctx, includes),
    ];
    const collections = (0, GenReadReconcilerDataStore_1.genObjectCollectionClasses)(ctx, includes);
    const lines = [
        ...genExternalForwardDeclarations(ctx),
        ``,
        `namespace ${ctx.namespace} {`,
        ``,
        (0, CppCodeGenImpl_1.forwardDeclareClass)((0, CppCodeGenImpl_1.getDataStoreName)(ctx.storeDef.apiname)),
        ...genForwardDeclarations(ctx),
        ``,
        ...(0, xrpa_utils_1.mapAndCollapse)(accessors, CppCodeGenImpl_1.genClassHeaderDefinition),
        ``,
        `// Reconciled Types`,
        ...(0, xrpa_utils_1.mapAndCollapse)(reconciledTypes, CppCodeGenImpl_1.genClassHeaderDefinition),
        ``,
        `// Object Collections`,
        ...(0, xrpa_utils_1.mapAndCollapse)(collections, CppCodeGenImpl_1.genClassHeaderDefinition),
        ``,
        `// Data Store Implementation`,
        ...genDataStoreClass(ctx, includes),
        ``,
        ...(0, xrpa_utils_1.mapAndCollapse)(accessors, CppCodeGenImpl_1.genClassSourceDefinition, includes, true),
        ...(0, xrpa_utils_1.mapAndCollapse)(reconciledTypes, CppCodeGenImpl_1.genClassSourceDefinition, includes, true),
        ...(0, xrpa_utils_1.mapAndCollapse)(collections, CppCodeGenImpl_1.genClassSourceDefinition, includes, true),
        `} // namespace ${ctx.namespace}`,
        ``,
    ];
    lines.unshift(...CppCodeGenImpl_1.HEADER, `#pragma once`, ``, ...includes.getIncludes(headerName), ``);
    fileWriter.writeFile(path_1.default.join(outdir, headerName), lines);
}
exports.genDataStore = genDataStore;
//# sourceMappingURL=GenDataStore.js.map
