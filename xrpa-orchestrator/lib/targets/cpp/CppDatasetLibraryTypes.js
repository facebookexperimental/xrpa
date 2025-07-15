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
exports.SignalTypeInference = exports.SignalPacket = exports.SignalRingBuffer = exports.SignalProducerCallback = exports.OutboundSignalData = exports.InboundSignalForwarder = exports.InboundSignalDataInterface = exports.SharedMemoryTransportStream = exports.HeapMemoryTransportStream = exports.TransportStream = exports.TransportStreamAccessor = exports.ObjectCollectionIndexedBinding = exports.ObjectCollectionIndex = exports.ObjectCollection = exports.IObjectCollection = exports.DataStoreObject = exports.DataStoreReconciler = exports.XrpaModule = exports.ObjectAccessorInterface = exports.TransportConfig = exports.HashValue = exports.StringEmbedding = exports.MemoryAccessor = exports.MemoryOffset = exports.MemoryUtils = void 0;
const PrimitiveType_1 = require("../../shared/PrimitiveType");
const TypeValue_1 = require("../../shared/TypeValue");
const CodeGen = __importStar(require("./CppCodeGenImpl"));
const CppCodeGenImpl_1 = require("./CppCodeGenImpl");
exports.MemoryUtils = new PrimitiveType_1.PrimitiveType(CodeGen, "MemoryUtils", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryUtils"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryUtils"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryUtils"), ""));
exports.MemoryOffset = new PrimitiveType_1.PrimitiveType(CodeGen, "MemoryOffset", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryOffset"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryOffset"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, 4, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryOffset"), ""));
exports.MemoryAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "MemoryAccessor", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" }, 12, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "MemoryAccessor"), ""));
exports.StringEmbedding = new PrimitiveType_1.PrimitiveType(CodeGen, "StringEmbedding", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "StringEmbedding"), headerFile: "<xrpa-runtime/utils/StringEmbedding.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "StringEmbedding"), headerFile: "<xrpa-runtime/utils/StringEmbedding.h>" }, 128, // not true but it doesn't matter
true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "StringEmbedding"), ""));
exports.HashValue = new PrimitiveType_1.PrimitiveType(CodeGen, "HashValue", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HashValue"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HashValue"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" }, 32, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HashValue"), ""));
exports.TransportConfig = new PrimitiveType_1.PrimitiveType(CodeGen, "TransportConfig", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportConfig"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportConfig"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportConfig"), ""));
exports.ObjectAccessorInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectAccessorInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectAccessorInterface"), ""));
exports.XrpaModule = new PrimitiveType_1.PrimitiveType(CodeGen, "XrpaModule", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "XrpaModule"), headerFile: "<xrpa-runtime/utils/XrpaModule.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "XrpaModule"), headerFile: "<xrpa-runtime/utils/XrpaModule.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "XrpaModule"), ""));
///////////////////////////////////////////////////////////////////////////////
// Transport reconciler:
exports.DataStoreReconciler = new PrimitiveType_1.PrimitiveType(CodeGen, "DataStoreReconciler", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreReconciler"), headerFile: "<xrpa-runtime/reconciler/DataStoreReconciler.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreReconciler"), headerFile: "<xrpa-runtime/reconciler/DataStoreReconciler.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreReconciler"), ""));
///////////////////////////////////////////////////////////////////////////////
// Collections:
exports.DataStoreObject = new PrimitiveType_1.PrimitiveType(CodeGen, "DataStoreObject", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" }, 8, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "DataStoreObject"), ""));
exports.IObjectCollection = new PrimitiveType_1.PrimitiveType(CodeGen, "IObjectCollection", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "IObjectCollection"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "IObjectCollection"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "IObjectCollection"), ""));
exports.ObjectCollection = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectCollection", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollection"), headerFile: "<xrpa-runtime/reconciler/ObjectCollection.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollection"), headerFile: "<xrpa-runtime/reconciler/ObjectCollection.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollection"), ""));
exports.ObjectCollectionIndex = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectCollectionIndex", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndex"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndex.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndex"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndex.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndex"), ""));
exports.ObjectCollectionIndexedBinding = new PrimitiveType_1.PrimitiveType(CodeGen, "ObjectCollectionIndexedBinding", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndexedBinding.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndexedBinding.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), ""));
///////////////////////////////////////////////////////////////////////////////
// Transport:
exports.TransportStreamAccessor = new PrimitiveType_1.PrimitiveType(CodeGen, "TransportStreamAccessor", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportStreamAccessor"), headerFile: "<xrpa-runtime/transport/TransportStreamAccessor.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportStreamAccessor"), headerFile: "<xrpa-runtime/transport/TransportStreamAccessor.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportStreamAccessor"), ""));
exports.TransportStream = new PrimitiveType_1.PrimitiveType(CodeGen, "TransportStream", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportStream"), headerFile: "<xrpa-runtime/transport/TransportStream.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportStream"), headerFile: "<xrpa-runtime/transport/TransportStream.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "TransportStream"), ""));
exports.HeapMemoryTransportStream = new PrimitiveType_1.PrimitiveType(CodeGen, "HeapMemoryTransportStream", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/HeapMemoryTransportStream.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/HeapMemoryTransportStream.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "HeapMemoryTransportStream"), ""));
exports.SharedMemoryTransportStream = new PrimitiveType_1.PrimitiveType(CodeGen, "SharedMemoryTransportStream", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/SharedMemoryTransportStream.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/SharedMemoryTransportStream.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SharedMemoryTransportStream"), ""));
///////////////////////////////////////////////////////////////////////////////
// Signals:
exports.InboundSignalDataInterface = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundSignalDataInterface", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<xrpa-runtime/signals/InboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<xrpa-runtime/signals/InboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalDataInterface"), ""));
exports.InboundSignalForwarder = new PrimitiveType_1.PrimitiveType(CodeGen, "InboundSignalForwarder", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalForwarder"), headerFile: "<xrpa-runtime/signals/InboundSignalForwarder.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalForwarder"), headerFile: "<xrpa-runtime/signals/InboundSignalForwarder.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "InboundSignalForwarder"), ""));
exports.OutboundSignalData = new PrimitiveType_1.PrimitiveType(CodeGen, "OutboundSignalData", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "OutboundSignalData"), ""));
exports.SignalProducerCallback = new PrimitiveType_1.PrimitiveType(CodeGen, "SignalProducerCallback", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalProducerCallback"), ""));
exports.SignalRingBuffer = new PrimitiveType_1.PrimitiveType(CodeGen, "SignalRingBuffer", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalRingBuffer"), headerFile: "<xrpa-runtime/signals/SignalRingBuffer.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalRingBuffer"), headerFile: "<xrpa-runtime/signals/SignalRingBuffer.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalRingBuffer"), ""));
exports.SignalPacket = new PrimitiveType_1.PrimitiveType(CodeGen, "SignalPacket", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalPacket"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalPacket"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalPacket"), ""));
exports.SignalTypeInference = new PrimitiveType_1.PrimitiveType(CodeGen, "SignalTypeInference", { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalTypeInference"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" }, { typename: CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalTypeInference"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" }, 0, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CppCodeGenImpl_1.XRPA_NAMESPACE, "SignalTypeInference"), ""));
CodeGen.registerXrpaTypes({
    MemoryAccessor: exports.MemoryAccessor,
    MemoryOffset: exports.MemoryOffset,
    MemoryUtils: exports.MemoryUtils,
    StringEmbedding: exports.StringEmbedding,
    ObjectAccessorInterface: exports.ObjectAccessorInterface,
    TransportStreamAccessor: exports.TransportStreamAccessor,
    InboundSignalForwarder: exports.InboundSignalForwarder,
    SignalProducerCallback: exports.SignalProducerCallback,
    SignalRingBuffer: exports.SignalRingBuffer,
    SignalPacket: exports.SignalPacket,
    SignalTypeInference: exports.SignalTypeInference,
    InboundSignalDataInterface: exports.InboundSignalDataInterface,
    OutboundSignalData: exports.OutboundSignalData,
});
//# sourceMappingURL=CppDatasetLibraryTypes.js.map
