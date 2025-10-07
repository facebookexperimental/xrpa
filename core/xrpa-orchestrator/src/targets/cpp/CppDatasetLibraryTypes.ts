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
import * as CodeGen from "./CppCodeGenImpl";
import { XRPA_NAMESPACE } from "./CppCodeGenImpl";

export const MemoryUtils: TypeDefinition = new PrimitiveType(
  CodeGen,
  "MemoryUtils",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryUtils"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryUtils"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryUtils"), ""),
);

export const MemoryOffset: TypeDefinition = new PrimitiveType(
  CodeGen,
  "MemoryOffset",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryOffset"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryOffset"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" },
  4,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryOffset"), ""),
);

export const MemoryAccessor: TypeDefinition = new PrimitiveType(
  CodeGen,
  "MemoryAccessor",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryAccessor"), headerFile: "<xrpa-runtime/utils/MemoryAccessor.h>" },
  12,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "MemoryAccessor"), ""),
);

export const StringEmbedding = new PrimitiveType(
  CodeGen,
  "StringEmbedding",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "StringEmbedding"), headerFile: "<xrpa-runtime/utils/StringEmbedding.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "StringEmbedding"), headerFile: "<xrpa-runtime/utils/StringEmbedding.h>" },
  128, // not true but it doesn't matter
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "StringEmbedding"), ""),
);

export const HashValue = new PrimitiveType(
  CodeGen,
  "HashValue",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "HashValue"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "HashValue"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" },
  32,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "HashValue"), ""),
);

export const TransportConfig: TypeDefinition = new PrimitiveType(
  CodeGen,
  "TransportConfig",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "TransportConfig"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "TransportConfig"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "TransportConfig"), ""),
);

export const ObjectAccessorInterface = new PrimitiveType(
  CodeGen,
  "ObjectAccessorInterface",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectAccessorInterface"), headerFile: "<xrpa-runtime/utils/XrpaTypes.h>" },
  8,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectAccessorInterface"), ""),
);

export const XrpaModule: TypeDefinition = new PrimitiveType(
  CodeGen,
  "XrpaModule",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "XrpaModule"), headerFile: "<xrpa-runtime/utils/XrpaModule.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "XrpaModule"), headerFile: "<xrpa-runtime/utils/XrpaModule.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "XrpaModule"), ""),
);

///////////////////////////////////////////////////////////////////////////////
// Transport reconciler:

export const DataStoreReconciler: TypeDefinition = new PrimitiveType(
  CodeGen,
  "DataStoreReconciler",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "DataStoreReconciler"), headerFile: "<xrpa-runtime/reconciler/DataStoreReconciler.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "DataStoreReconciler"), headerFile: "<xrpa-runtime/reconciler/DataStoreReconciler.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "DataStoreReconciler"), ""),
);

///////////////////////////////////////////////////////////////////////////////
// Collections:

export const DataStoreObject = new PrimitiveType(
  CodeGen,
  "DataStoreObject",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "DataStoreObject"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" },
  8,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "DataStoreObject"), ""),
);

export const IObjectCollection: TypeDefinition = new PrimitiveType(
  CodeGen,
  "IObjectCollection",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "IObjectCollection"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "IObjectCollection"), headerFile: "<xrpa-runtime/reconciler/DataStoreInterfaces.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "IObjectCollection"), ""),
);

export const ObjectCollection: TypeDefinition = new PrimitiveType(
  CodeGen,
  "ObjectCollection",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollection"), headerFile: "<xrpa-runtime/reconciler/ObjectCollection.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollection"), headerFile: "<xrpa-runtime/reconciler/ObjectCollection.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollection"), ""),
);

export const ObjectCollectionIndex: TypeDefinition = new PrimitiveType(
  CodeGen,
  "ObjectCollectionIndex",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollectionIndex"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndex.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollectionIndex"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndex.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollectionIndex"), ""),
);

export const ObjectCollectionIndexedBinding: TypeDefinition = new PrimitiveType(
  CodeGen,
  "ObjectCollectionIndexedBinding",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndexedBinding.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), headerFile: "<xrpa-runtime/reconciler/ObjectCollectionIndexedBinding.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "ObjectCollectionIndexedBinding"), ""),
);

///////////////////////////////////////////////////////////////////////////////
// Transport:

export const TransportStreamAccessor: TypeDefinition = new PrimitiveType(
  CodeGen,
  "TransportStreamAccessor",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "TransportStreamAccessor"), headerFile: "<xrpa-runtime/transport/TransportStreamAccessor.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "TransportStreamAccessor"), headerFile: "<xrpa-runtime/transport/TransportStreamAccessor.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "TransportStreamAccessor"), ""),
);

export const TransportStream: TypeDefinition = new PrimitiveType(
  CodeGen,
  "TransportStream",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "TransportStream"), headerFile: "<xrpa-runtime/transport/TransportStream.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "TransportStream"), headerFile: "<xrpa-runtime/transport/TransportStream.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "TransportStream"), ""),
);

export const HeapMemoryTransportStream: TypeDefinition = new PrimitiveType(
  CodeGen,
  "HeapMemoryTransportStream",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "HeapMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/HeapMemoryTransportStream.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "HeapMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/HeapMemoryTransportStream.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "HeapMemoryTransportStream"), ""),
);

export const SharedMemoryTransportStream: TypeDefinition = new PrimitiveType(
  CodeGen,
  "SharedMemoryTransportStream",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SharedMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/SharedMemoryTransportStream.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SharedMemoryTransportStream"), headerFile: "<xrpa-runtime/transport/SharedMemoryTransportStream.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "SharedMemoryTransportStream"), ""),
);

///////////////////////////////////////////////////////////////////////////////
// Signals:

export const InboundSignalDataInterface: TypeDefinition = new PrimitiveType(
  CodeGen,
  "InboundSignalDataInterface",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<xrpa-runtime/signals/InboundSignalData.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "InboundSignalDataInterface"), headerFile: "<xrpa-runtime/signals/InboundSignalData.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "InboundSignalDataInterface"), ""),
);

export const InboundSignalForwarder: TypeDefinition = new PrimitiveType(
  CodeGen,
  "InboundSignalForwarder",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "InboundSignalForwarder"), headerFile: "<xrpa-runtime/signals/InboundSignalForwarder.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "InboundSignalForwarder"), headerFile: "<xrpa-runtime/signals/InboundSignalForwarder.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "InboundSignalForwarder"), ""),
);

export const OutboundSignalData: TypeDefinition = new PrimitiveType(
  CodeGen,
  "OutboundSignalData",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "OutboundSignalData"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "OutboundSignalData"), ""),
);

export const SignalProducerCallback: TypeDefinition = new PrimitiveType(
  CodeGen,
  "SignalProducerCallback",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalProducerCallback"), headerFile: "<xrpa-runtime/signals/OutboundSignalData.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "SignalProducerCallback"), ""),
);

export const SignalRingBuffer: TypeDefinition = new PrimitiveType(
  CodeGen,
  "SignalRingBuffer",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalRingBuffer"), headerFile: "<xrpa-runtime/signals/SignalRingBuffer.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalRingBuffer"), headerFile: "<xrpa-runtime/signals/SignalRingBuffer.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "SignalRingBuffer"), ""),
);

export const SignalPacket: TypeDefinition = new PrimitiveType(
  CodeGen,
  "SignalPacket",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalPacket"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalPacket"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "SignalPacket"), ""),
);

export const SignalTypeInference: TypeDefinition = new PrimitiveType(
  CodeGen,
  "SignalTypeInference",
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalTypeInference"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" },
  { typename: CodeGen.nsJoin(XRPA_NAMESPACE, "SignalTypeInference"), headerFile: "<xrpa-runtime/signals/SignalShared.h>" },
  0,
  true,
  new EmptyValue(CodeGen, CodeGen.nsJoin(XRPA_NAMESPACE, "SignalTypeInference"), ""),
);

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
