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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedDataset = exports.IOutboundReconciledType = exports.OutboundTypeReconcilerInterface = exports.OutboundTypeReconciler = exports.IInboundReconciledType = exports.InboundTypeReconcilerInterface = exports.DummyIndexReconciledType = exports.IIndexReconciledType = exports.InboundTypeReconciler = exports.DataStoreObject = exports.IReconciledType = exports.DatasetReconciler = exports.DatasetInterface = exports.DatasetConfig = exports.DatasetAccessor = exports.ObjectAccessorInterface = exports.DSHashValue = exports.MemoryAccessor = void 0;
const PrimitiveType_1 = require("../../shared/PrimitiveType");
const TypeValue_1 = require("../../shared/TypeValue");
const CodeGen = __importStar(require("./CsharpCodeGenImpl"));
const CsharpCodeGenImpl_1 = require("./CsharpCodeGenImpl");
exports.MemoryAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "MemoryAccessor", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor") }, 16, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), ""));
CodeGen.registerMemoryAccessor(exports.MemoryAccessor);
exports.DSHashValue = new PrimitiveType_1.PrimitiveType(CodeGen, "DSHashValue", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue") }, 32, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue"), ""));
exports.ObjectAccessorInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectAccessorInterface", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface") }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), ""));
CodeGen.registerObjectAccessorInterface(exports.ObjectAccessorInterface);
exports.DatasetAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetAccessor", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor"), ""));
exports.DatasetConfig = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetConfig", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig"), ""));
exports.DatasetInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetInterface", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), ""));
exports.DatasetReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetReconciler", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler"), ""));
exports.IReconciledType = new PrimitiveType_1.PrimitiveType(CodeGen, "IReconciledType", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IReconciledType"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IReconciledType"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IReconciledType"), ""));
exports.DataStoreObject = new PrimitiveType_1.PrimitiveType(CodeGen, "DataStoreObject", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject") }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), ""));
exports.InboundTypeReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundTypeReconciler", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconciler") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconciler") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconciler"), ""));
exports.IIndexReconciledType = new PrimitiveType_1.PrimitiveType(CodeGen, "IIndexReconciledType", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IIndexReconciledType") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IIndexReconciledType") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IIndexReconciledType"), ""));
exports.DummyIndexReconciledType = new PrimitiveType_1.PrimitiveType(CodeGen, "DummyIndexReconciledType", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DummyIndexReconciledType") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DummyIndexReconciledType") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "DummyIndexReconciledType"), ""));
exports.InboundTypeReconcilerInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundTypeReconcilerInterface", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconcilerInterface") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconcilerInterface") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconcilerInterface"), ""));
exports.IInboundReconciledType = new PrimitiveType_1.PrimitiveType(CodeGen, "IInboundReconciledType", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IInboundReconciledType"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IInboundReconciledType"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IInboundReconciledType"), ""));
exports.OutboundTypeReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "OutboundTypeReconciler", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconciler") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconciler") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconciler"), ""));
exports.OutboundTypeReconcilerInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "OutboundTypeReconcilerInterface", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconcilerInterface") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconcilerInterface") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconcilerInterface"), ""));
exports.IOutboundReconciledType = new PrimitiveType_1.PrimitiveType(CodeGen, "IOutboundReconciledType", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IOutboundReconciledType"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IOutboundReconciledType"), headerFile: CsharpCodeGenImpl_1.XRPA_NAMESPACE }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "IOutboundReconciledType"), ""));
exports.SharedDataset = new PrimitiveType_1.PrimitiveType(CodeGen, "SharedDataset", { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset") }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset") }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset"), ""));
//# sourceMappingURL=CsharpDatasetLibraryTypes.js.map
