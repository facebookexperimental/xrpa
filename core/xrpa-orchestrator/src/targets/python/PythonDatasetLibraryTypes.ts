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


import { PrimitiveType } from "../../shared/PrimitiveType";
import { TypeDefinition } from "../../shared/TypeDefinition";
import { EmptyValue } from "../../shared/TypeValue";
import * as CodeGen from "./PythonCodeGenImpl";

function PythonPrimitiveType(name: string, size = 0): TypeDefinition {
  return new PrimitiveType(
    CodeGen,
    name,
    { typename: name, headerFile: CodeGen.nsExtract(name) },
    { typename: name, headerFile: CodeGen.nsExtract(name) },
    size,
    true,
    new EmptyValue(CodeGen, name, ""),
  );
}

///////////////////////////////////////////////////////////////////////////////
// Utils:

export const MemoryUtils = PythonPrimitiveType("xrpa_runtime.utils.memory_accessor.MemoryUtils", 16);
export const MemoryOffset = PythonPrimitiveType("xrpa_runtime.utils.memory_accessor.MemoryOffset", 16);
export const MemoryAccessor = PythonPrimitiveType("xrpa_runtime.utils.memory_accessor.MemoryAccessor", 16);
export const StringEmbedding = PythonPrimitiveType("xrpa_runtime.utils.string_embedding.StringEmbedding", 16);
export const HashValue = PythonPrimitiveType("xrpa_runtime.utils.xrpa_types.HashValue", 32);
export const TransportConfig = PythonPrimitiveType("xrpa_runtime.utils.xrpa_types.TransportConfig");
export const ObjectAccessorInterface = PythonPrimitiveType("xrpa_runtime.utils.xrpa_types.ObjectAccessorInterface", 8);
export const XrpaModule = PythonPrimitiveType("xrpa_runtime.utils.xrpa_module.XrpaModule");


///////////////////////////////////////////////////////////////////////////////
// Transport reconciler:

export const DataStoreReconciler = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_reconciler.DataStoreReconciler");

///////////////////////////////////////////////////////////////////////////////
// Collections:

export const IDataStoreObject = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObject");
export const IDataStoreObjectAccessor = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.IDataStoreObjectAccessor");
export const DataStoreObject = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.DataStoreObject");
export const IObjectCollection = PythonPrimitiveType("xrpa_runtime.reconciler.data_store_interfaces.IObjectCollection");
export const ObjectCollection = PythonPrimitiveType("xrpa_runtime.reconciler.object_collection.ObjectCollection");
export const ObjectCollectionIndex = PythonPrimitiveType("xrpa_runtime.reconciler.object_collection_index.ObjectCollectionIndex");
export const ObjectCollectionIndexedBinding = PythonPrimitiveType("xrpa_runtime.reconciler.object_collection_indexed_binding.ObjectCollectionIndexedBinding");

///////////////////////////////////////////////////////////////////////////////
// Transport:

export const TransportStream = PythonPrimitiveType("xrpa_runtime.transport.transport_stream.TransportStream");
export const TransportStreamAccessor = PythonPrimitiveType("xrpa_runtime.transport.transport_stream_accessor.TransportStreamAccessor");
export const SharedMemoryTransportStream = PythonPrimitiveType("xrpa_runtime.transport.shared_memory_transport_stream.SharedMemoryTransportStream");

///////////////////////////////////////////////////////////////////////////////
// Signals:

export const InboundSignalForwarder = PythonPrimitiveType("xrpa_runtime.signals.inbound_signal_forwarder.InboundSignalForwarder");
export const SignalProducerCallback = PythonPrimitiveType("xrpa_runtime.signals.outbound_signal_data.SignalProducerCallback");
export const SignalRingBuffer = PythonPrimitiveType("xrpa_runtime.signals.signal_ring_buffer.SignalRingBuffer");
export const SignalTypeInference = PythonPrimitiveType("xrpa_runtime.signals.signal_shared.SignalTypeInference");
export const SignalPacket = PythonPrimitiveType("xrpa_runtime.signals.signal_shared.SignalPacket");
export const InboundSignalDataInterface = PythonPrimitiveType("xrpa_runtime.signals.inbound_signal_data.InboundSignalDataInterface");
export const OutboundSignalData = PythonPrimitiveType("xrpa_runtime.signals.outbound_signal_data.OutboundSignalData");


CodeGen.registerXrpaTypes({
  MemoryAccessor,
  MemoryOffset,
  MemoryUtils,
  StringEmbedding,
  ObjectAccessorInterface,
  TransportStreamAccessor,

  InboundSignalForwarder,
  SignalProducerCallback,
  SignalRingBuffer,
  SignalPacket,
  SignalTypeInference,
  InboundSignalDataInterface,
  OutboundSignalData,
});
