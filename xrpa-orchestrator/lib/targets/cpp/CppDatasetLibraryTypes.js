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
exports.SignalProducerCallback = exports.OutboundSignalData = exports.InboundSignalDataInterface = exports.SharedDataset = exports.OutboundTypeReconcilerInterface = exports.OutboundTypeReconciler = exports.InboundTypeReconcilerInterface = exports.DummyIndexReconciledType = exports.InboundTypeReconciler = exports.DataStoreObject = exports.HeapDataset = exports.DatasetReconciler = exports.DatasetModule = exports.DatasetInterface = exports.DatasetConfig = exports.DatasetAccessor = exports.ObjectAccessorInterface = exports.DSHashValue = exports.MemoryAccessor = void 0;
const PrimitiveType_1 = require("../../shared/PrimitiveType");
const TypeValue_1 = require("../../shared/TypeValue");
const CodeGen = __importStar(require("./CppCodeGenImpl"));
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
exports.MemoryAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "MemoryAccessor", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<dataset/utils/MemoryAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<dataset/utils/MemoryAccessor.h>" }, 0, // not actually true but this will force it to be passed by value
true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), ""));
CodeGen.registerMemoryAccessor(exports.MemoryAccessor);
exports.DSHashValue = new PrimitiveType_1.PrimitiveType(CodeGen, "DSHashValue", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue"), headerFile: "<dataset/core/DatasetTypes.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue"), headerFile: "<dataset/core/DatasetTypes.h>" }, 32, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue"), ""));
exports.ObjectAccessorInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectAccessorInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<dataset/core/DatasetTypes.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<dataset/core/DatasetTypes.h>" }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), ""));
CodeGen.registerObjectAccessorInterface(exports.ObjectAccessorInterface);
exports.DatasetAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetAccessor", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor"), headerFile: "<dataset/core/DatasetAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor"), headerFile: "<dataset/core/DatasetAccessor.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor"), ""));
exports.DatasetConfig = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetConfig", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig"), headerFile: "<dataset/core/DatasetAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig"), headerFile: "<dataset/core/DatasetAccessor.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig"), ""));
exports.DatasetInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), headerFile: "<dataset/core/DatasetInterface.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), headerFile: "<dataset/core/DatasetInterface.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), ""));
exports.DatasetModule = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetModule", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetModule"), headerFile: "<dataset/core/DatasetModule.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetModule"), headerFile: "<dataset/core/DatasetModule.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetModule"), ""));
exports.DatasetReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetReconciler", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler"), headerFile: "<dataset/reconciler/DatasetReconciler.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler"), headerFile: "<dataset/reconciler/DatasetReconciler.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler"), ""));
exports.HeapDataset = new PrimitiveType_1.PrimitiveType(CodeGen, "HeapDataset", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapDataset"), headerFile: "<dataset/heapmem/HeapDataset.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapDataset"), headerFile: "<dataset/heapmem/HeapDataset.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapDataset"), ""));
exports.DataStoreObject = new PrimitiveType_1.PrimitiveType(CodeGen, "DataStoreObject", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<dataset/reconciler/DatasetReconcilerInterfaces.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<dataset/reconciler/DatasetReconcilerInterfaces.h>" }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), ""));
exports.InboundTypeReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundTypeReconciler", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconciler"), headerFile: "<dataset/reconciler/InboundTypeReconciler.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconciler"), headerFile: "<dataset/reconciler/InboundTypeReconciler.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconciler"), ""));
exports.DummyIndexReconciledType = new PrimitiveType_1.PrimitiveType(CodeGen, "DummyIndexReconciledType", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DummyIndexReconciledType"), headerFile: "<dataset/reconciler/InboundTypeReconciler.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DummyIndexReconciledType"), headerFile: "<dataset/reconciler/InboundTypeReconciler.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DummyIndexReconciledType"), ""));
exports.InboundTypeReconcilerInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundTypeReconcilerInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconcilerInterface"), headerFile: "<dataset/reconciler/DatasetReconcilerInterfaces.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconcilerInterface"), headerFile: "<dataset/reconciler/DatasetReconcilerInterfaces.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundTypeReconcilerInterface"), ""));
exports.OutboundTypeReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "OutboundTypeReconciler", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconciler"), headerFile: "<dataset/reconciler/OutboundTypeReconciler.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconciler"), headerFile: "<dataset/reconciler/OutboundTypeReconciler.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconciler"), ""));
exports.OutboundTypeReconcilerInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "OutboundTypeReconcilerInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconcilerInterface"), headerFile: "<dataset/reconciler/DatasetReconcilerInterfaces.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconcilerInterface"), headerFile: "<dataset/reconciler/DatasetReconcilerInterfaces.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundTypeReconcilerInterface"), ""));
exports.SharedDataset = new PrimitiveType_1.PrimitiveType(CodeGen, "SharedDataset", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset"), headerFile: "<dataset/sharedmem/SharedDataset.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset"), headerFile: "<dataset/sharedmem/SharedDataset.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset"), ""));
exports.InboundSignalDataInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundSignalDataInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<dataset/reconciler/InboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<dataset/reconciler/InboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), ""));
exports.OutboundSignalData = new PrimitiveType_1.PrimitiveType(CodeGen, "OutboundSignalData", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<dataset/reconciler/OutboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<dataset/reconciler/OutboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), ""));
exports.SignalProducerCallback = new PrimitiveType_1.PrimitiveType(CodeGen, "SignalProducerCallback", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<dataset/reconciler/OutboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<dataset/reconciler/OutboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), ""));
//# sourceMappingURL=CppDatasetLibraryTypes.js.map
