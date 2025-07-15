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
exports.OutboundSignalData = exports.InboundSignalDataInterface = exports.SignalPacket = exports.SignalTypeInference = exports.SignalRingBuffer = exports.SignalProducerCallback = exports.InboundSignalForwarder = exports.SharedMemoryTransportStream = exports.TransportStreamAccessor = exports.TransportStream = exports.ObjectCollectionIndexedBinding = exports.ObjectCollectionIndex = exports.ObjectCollection = exports.IObjectCollection = exports.DataStoreObject = exports.IDataStoreObjectAccessor = exports.IDataStoreObject = exports.DataStoreReconciler = exports.XrpaModule = exports.ObjectAccessorInterface = exports.TransportConfig = exports.HashValue = exports.StringEmbedding = exports.MemoryAccessor = exports.MemoryOffset = exports.MemoryUtils = void 0;
const PrimitiveType_1 = require("../../shared/PrimitiveType");
const TypeValue_1 = require("../../shared/TypeValue");
const CodeGen = __importStar(require("./PythonCodeGenImpl"));
function PythonPrimitiveType(name, size = 0) {
    return new PrimitiveType_1.PrimitiveType(CodeGen, name, { typename: name, headerFile: CodeGen.nsExtract(name) }, { typename: name, headerFile: CodeGen.nsExtract(name) }, size, true, new TypeValue_1.EmptyValue(CodeGen, name, ""));
}
///////////////////////////////////////////////////////////////////////////////
// Utils:
exports.MemoryUtils = PythonPrimitiveType("xrpa_runtime.utils.memory_accessor.MemoryUtils", 16);
exports.MemoryOffset = PythonPrimitiveType("xrpa_runtime.utils.memory_accessor.MemoryOffset", 16);
exports.MemoryAccessor = PythonPrimitiveType("xrpa_runtime.utils.memory_accessor.MemoryAccessor", 16);
exports.StringEmbedding = PythonPrimitiveType("xrpa_runtime.utils.string_embedding.StringEmbedding", 16);
exports.HashValue = PythonPrimitiveType("xrpa_runtime.utils.xrpa_types.HashValue", 32);
exports.TransportConfig = PythonPrimitiveType("xrpa_runtime.utils.xrpa_types.TransportConfig");
exports.ObjectAccessorInterface = PythonPrimitiveType("xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface", 8);
exports.XrpaModule = PythonPrimitiveType("xrpa_runtime.utils.xrpa_module.XrpaModule");
///////////////////////////////////////////////////////////////////////////////
// Transport reconciler:
exports.DataStoreReconciler = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler");
///////////////////////////////////////////////////////////////////////////////
// Collections:
exports.IDataStoreObject = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObject");
exports.IDataStoreObjectAccessor = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor");
exports.DataStoreObject = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject");
exports.IObjectCollection = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection");
exports.ObjectCollection = PythonPrimitiveType("xrpa_runtime.reconciler.object_collection.ObjectCollection");
exports.ObjectCollectionIndex = PythonPrimitiveType("xrpa_runtime.reconciler.object_collection_index.ObjectCollectionIndex");
exports.ObjectCollectionIndexedBinding = PythonPrimitiveType("xrpa_runtime.reconciler.object_collection_indexed_binding.ObjectCollectionIndexedBinding");
///////////////////////////////////////////////////////////////////////////////
// Transport:
exports.TransportStream = PythonPrimitiveType("xrpa_runtime.transport.transport_stream.TransportStream");
exports.TransportStreamAccessor = PythonPrimitiveType("xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor");
exports.SharedMemoryTransportStream = PythonPrimitiveType("xrpa_runtime.transport.shared_memory_transport_stream.SharedMemoryTransportStream");
///////////////////////////////////////////////////////////////////////////////
// Signals:
exports.InboundSignalForwarder = PythonPrimitiveType("xrpa_runtime.signals.inbound_signal_forwarder.InboundSignalForwarder");
exports.SignalProducerCallback = PythonPrimitiveType("xrpa_runtime.signals.outbound_signal_data.SignalProducerCallback");
exports.SignalRingBuffer = PythonPrimitiveType("xrpa_runtime.signals.signal_ring_buffer.SignalRingBuffer");
exports.SignalTypeInference = PythonPrimitiveType("xrpa_runtime.signals.signal_shared.SignalTypeInference");
exports.SignalPacket = PythonPrimitiveType("xrpa_runtime.signals.signal_shared.SignalPacket");
exports.InboundSignalDataInterface = PythonPrimitiveType("xrpa_runtime.signals.inbound_signal_data.InboundSignalDataInterface");
exports.OutboundSignalData = PythonPrimitiveType("xrpa_runtime.signals.outbound_signal_data.OutboundSignalData");
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
//# sourceMappingURL=PythonDatasetLibraryTypes.js.map
