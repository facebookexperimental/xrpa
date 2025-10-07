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
import * as CodeGen from "./CsharpCodeGenImpl";
import { XRPA_NAMESPACE } from "./CsharpCodeGenImpl";

function CsPrimitiveType(name: string, size = 0): TypeDefinition {
  return new PrimitiveType(
    CodeGen,
    name,
    { typename: CodeGen.nsJoin(XRPA_NAMESPACE, name) },
    { typename: CodeGen.nsJoin(XRPA_NAMESPACE, name) },
    size,
    true,
    new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, name), ""),
  );
}

///////////////////////////////////////////////////////////////////////////////
// Utils:

export const MemoryUtils = CsPrimitiveType("MemoryUtils", 0);
export const MemoryOffset = CsPrimitiveType("MemoryOffset", 4);
export const MemoryAccessor = CsPrimitiveType("MemoryAccessor", 16);
export const StringEmbedding = CsPrimitiveType("StringEmbedding", 128);
export const HashValue = CsPrimitiveType("HashValue", 32);
export const TransportConfig = CsPrimitiveType("TransportConfig");
export const ObjectAccessorInterface = CsPrimitiveType("ObjectAccessorInterface", 8);


///////////////////////////////////////////////////////////////////////////////
// Transport reconciler:

export const DataStoreReconciler = CsPrimitiveType("DataStoreReconciler");

///////////////////////////////////////////////////////////////////////////////
// Collections:

export const IDataStoreObject = CsPrimitiveType("IDataStoreObject");
export const IDataStoreObjectAccessor = CsPrimitiveType("IDataStoreObjectAccessor");
export const DataStoreObject = CsPrimitiveType("DataStoreObject");
export const IObjectCollection = CsPrimitiveType("IObjectCollection");
export const ObjectCollection = CsPrimitiveType("ObjectCollection");
export const ObjectCollectionIndex = CsPrimitiveType("ObjectCollectionIndex");
export const IIndexBoundType = CsPrimitiveType("IIndexBoundType");
export const ObjectCollectionIndexedBinding = CsPrimitiveType("ObjectCollectionIndexedBinding");

///////////////////////////////////////////////////////////////////////////////
// Transport:

export const TransportStream = CsPrimitiveType("TransportStream");
export const TransportStreamAccessor = CsPrimitiveType("TransportStreamAccessor");
export const HeapMemoryTransportStream = CsPrimitiveType("HeapMemoryTransportStream");
export const SharedMemoryTransportStream = CsPrimitiveType("SharedMemoryTransportStream");

///////////////////////////////////////////////////////////////////////////////
// Signals:

export const InboundSignalForwarder = CsPrimitiveType("InboundSignalForwarder");
export const SignalProducerCallback = CsPrimitiveType("SignalProducerCallback");
export const SignalRingBuffer = CsPrimitiveType("SignalRingBuffer");
export const SignalPacket = CsPrimitiveType("SignalPacket");
export const SignalTypeInference = CsPrimitiveType("SignalTypeInference");
export const InboundSignalDataInterface = CsPrimitiveType("InboundSignalDataInterface");
export const OutboundSignalData = CsPrimitiveType("OutboundSignalData");


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
