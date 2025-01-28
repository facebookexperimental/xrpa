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
exports.SharedMemoryTransportStream = exports.HeapMemoryTransportStream = exports.TransportStreamAccessor = exports.TransportStream = exports.ObjectCollectionIndexedBinding = exports.IIndexBoundType = exports.ObjectCollectionIndex = exports.ObjectCollection = exports.IObjectCollection = exports.DataStoreObject = exports.IDataStoreObjectAccessor = exports.IDataStoreObject = exports.DataStoreReconciler = exports.ObjectAccessorInterface = exports.TransportConfig = exports.HashValue = exports.MemoryAccessor = void 0;
const PrimitiveType_1 = require("../../shared/PrimitiveType");
const TypeValue_1 = require("../../shared/TypeValue");
const CodeGen = __importStar(require("./CsharpCodeGenImpl"));
const CsharpCodeGenImpl_1 = require("./CsharpCodeGenImpl");
function CsPrimitiveType(name, size = 0) {
    return new PrimitiveType_1.PrimitiveType(CodeGen, name, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, name) }, { typename: CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, name) }, size, true, new TypeValue_1.EmptyValue(CodeGen, CodeGen.nsJoin(CsharpCodeGenImpl_1.XRPA_NAMESPACE, name), ""));
}
///////////////////////////////////////////////////////////////////////////////
// Utils:
exports.MemoryAccessor = CsPrimitiveType("MemoryAccessor", 16);
exports.HashValue = CsPrimitiveType("HashValue", 32);
exports.TransportConfig = CsPrimitiveType("TransportConfig");
exports.ObjectAccessorInterface = CsPrimitiveType("ObjectAccessorInterface", 8);
///////////////////////////////////////////////////////////////////////////////
// Transport reconciler:
exports.DataStoreReconciler = CsPrimitiveType("DataStoreReconciler");
///////////////////////////////////////////////////////////////////////////////
// Collections:
exports.IDataStoreObject = CsPrimitiveType("IDataStoreObject");
exports.IDataStoreObjectAccessor = CsPrimitiveType("IDataStoreObjectAccessor");
exports.DataStoreObject = CsPrimitiveType("DataStoreObject");
exports.IObjectCollection = CsPrimitiveType("IObjectCollection");
exports.ObjectCollection = CsPrimitiveType("ObjectCollection");
exports.ObjectCollectionIndex = CsPrimitiveType("ObjectCollectionIndex");
exports.IIndexBoundType = CsPrimitiveType("IIndexBoundType");
exports.ObjectCollectionIndexedBinding = CsPrimitiveType("ObjectCollectionIndexedBinding");
///////////////////////////////////////////////////////////////////////////////
// Transport:
exports.TransportStream = CsPrimitiveType("TransportStream");
exports.TransportStreamAccessor = CsPrimitiveType("TransportStreamAccessor");
exports.HeapMemoryTransportStream = CsPrimitiveType("HeapMemoryTransportStream");
exports.SharedMemoryTransportStream = CsPrimitiveType("SharedMemoryTransportStream");
CodeGen.registerXrpaTypes({
    MemoryAccessor: exports.MemoryAccessor,
    ObjectAccessorInterface: exports.ObjectAccessorInterface,
    TransportStreamAccessor: exports.TransportStreamAccessor,
});
//# sourceMappingURL=CsharpDatasetLibraryTypes.js.map
