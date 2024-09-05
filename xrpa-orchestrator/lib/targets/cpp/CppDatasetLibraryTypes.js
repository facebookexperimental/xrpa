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
exports.SignalProducerCallback = exports.OutboundSignalData = exports.InboundSignalDataInterface = exports.SharedDataset = exports.HeapDataset = exports.ObjectCollectionIndexedBinding = exports.ObjectCollectionIndex = exports.ObjectCollection = exports.CollectionInterface = exports.DataStoreObject = exports.DatasetReconciler = exports.DatasetModule = exports.DatasetInterface = exports.DatasetConfig = exports.DatasetAccessor = exports.ObjectAccessorInterface = exports.DSHashValue = exports.MemoryAccessor = void 0;
const PrimitiveType_1 = require("../../shared/PrimitiveType");
const TypeValue_1 = require("../../shared/TypeValue");
const CodeGen = __importStar(require("./CppCodeGenImpl"));
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
exports.MemoryAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "MemoryAccessor", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, 0, // not actually true but this will force it to be passed by value
true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), ""));
CodeGen.registerMemoryAccessor(exports.MemoryAccessor);
exports.DSHashValue = new PrimitiveType_1.PrimitiveType(CodeGen, "DSHashValue", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue"), headerFile: "<xrpa-runtime/core/DatasetTypes.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue"), headerFile: "<xrpa-runtime/core/DatasetTypes.h>" }, 32, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DSHashValue"), ""));
exports.ObjectAccessorInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectAccessorInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<xrpa-runtime/core/DatasetTypes.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<xrpa-runtime/core/DatasetTypes.h>" }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), ""));
CodeGen.registerObjectAccessorInterface(exports.ObjectAccessorInterface);
exports.DatasetAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetAccessor", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor"), headerFile: "<xrpa-runtime/core/DatasetAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor"), headerFile: "<xrpa-runtime/core/DatasetAccessor.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetAccessor"), ""));
exports.DatasetConfig = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetConfig", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig"), headerFile: "<xrpa-runtime/core/DatasetAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig"), headerFile: "<xrpa-runtime/core/DatasetAccessor.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetConfig"), ""));
exports.DatasetInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), headerFile: "<xrpa-runtime/core/DatasetInterface.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), headerFile: "<xrpa-runtime/core/DatasetInterface.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetInterface"), ""));
exports.DatasetModule = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetModule", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetModule"), headerFile: "<xrpa-runtime/core/DatasetModule.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetModule"), headerFile: "<xrpa-runtime/core/DatasetModule.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetModule"), ""));
///////////////////////////////////////////////////////////////////////////////
// Transport reconciler:
exports.DatasetReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "DatasetReconciler", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler"), headerFile: "<xrpa-runtime/reconciler/DatasetReconciler.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler"), headerFile: "<xrpa-runtime/reconciler/DatasetReconciler.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DatasetReconciler"), ""));
///////////////////////////////////////////////////////////////////////////////
// Collections:
exports.DataStoreObject = new PrimitiveType_1.PrimitiveType(CodeGen, "DataStoreObject", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<xrpa-runtime/reconciler/DatasetReconcilerInterfaces.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<xrpa-runtime/reconciler/DatasetReconcilerInterfaces.h>" }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), ""));
exports.CollectionInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "CollectionInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "CollectionInterface"), headerFile: "<xrpa-runtime/reconciler/DatasetReconcilerInterfaces.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "CollectionInterface"), headerFile: "<xrpa-runtime/reconciler/DatasetReconcilerInterfaces.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "CollectionInterface"), ""));
exports.ObjectCollection = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectCollection", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollection"), headerFile: "<xrpa-runtime/reconciler/ObjectCollection.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollection"), headerFile: "<xrpa-runtime/reconciler/ObjectCollection.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollection"), ""));
exports.ObjectCollectionIndex = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectCollectionIndex", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndex"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndex.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndex"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndex.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndex"), ""));
exports.ObjectCollectionIndexedBinding = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectCollectionIndexedBinding", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndexedBinding.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndexedBinding.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), ""));
///////////////////////////////////////////////////////////////////////////////
// Transport:
exports.HeapDataset = new PrimitiveType_1.PrimitiveType(CodeGen, "HeapDataset", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapDataset"), headerFile: "<xrpa-runtime/heapmem/HeapDataset.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapDataset"), headerFile: "<xrpa-runtime/heapmem/HeapDataset.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapDataset"), ""));
exports.SharedDataset = new PrimitiveType_1.PrimitiveType(CodeGen, "SharedDataset", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset"), headerFile: "<xrpa-runtime/sharedmem/SharedDataset.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset"), headerFile: "<xrpa-runtime/sharedmem/SharedDataset.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedDataset"), ""));
///////////////////////////////////////////////////////////////////////////////
// Signals:
exports.InboundSignalDataInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundSignalDataInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<xrpa-runtime/signals/InboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<xrpa-runtime/signals/InboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), ""));
exports.OutboundSignalData = new PrimitiveType_1.PrimitiveType(CodeGen, "OutboundSignalData", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), ""));
exports.SignalProducerCallback = new PrimitiveType_1.PrimitiveType(CodeGen, "SignalProducerCallback", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), ""));
//# sourceMappingURL=CppDatasetLibraryTypes.js.map
