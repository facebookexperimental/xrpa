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

Object.defineProperty(exports, "__esModule", { value: true });
exports.typeIsStateData = exports.typeIsEnum = exports.typeIsReference = exports.typeIsCollection = exports.typeIsInterface = exports.typeIsSignalData = exports.typeIsMessageData = exports.typeIsStructWithAccessor = exports.typeIsStruct = exports.typeIsClearSet = exports.TypeMetaType = void 0;
var TypeMetaType;
(function (TypeMetaType) {
    TypeMetaType[TypeMetaType["GET_SET"] = 0] = "GET_SET";
    TypeMetaType[TypeMetaType["CLEAR_SET"] = 1] = "CLEAR_SET";
    TypeMetaType[TypeMetaType["TYPE_REFERENCE"] = 2] = "TYPE_REFERENCE";
    TypeMetaType[TypeMetaType["STRUCT"] = 3] = "STRUCT";
    TypeMetaType[TypeMetaType["MESSAGE_DATA"] = 4] = "MESSAGE_DATA";
    TypeMetaType[TypeMetaType["SIGNAL_DATA"] = 5] = "SIGNAL_DATA";
    TypeMetaType[TypeMetaType["INTERFACE"] = 6] = "INTERFACE";
    TypeMetaType[TypeMetaType["COLLECTION"] = 7] = "COLLECTION";
})(TypeMetaType = exports.TypeMetaType || (exports.TypeMetaType = {}));
function typeIsClearSet(typeDef) {
    const mt = typeDef.getMetaType();
    return mt === TypeMetaType.CLEAR_SET;
}
exports.typeIsClearSet = typeIsClearSet;
function typeIsStruct(typeDef) {
    const mt = typeDef?.getMetaType();
    return mt === TypeMetaType.STRUCT || mt === TypeMetaType.MESSAGE_DATA || mt === TypeMetaType.INTERFACE || mt === TypeMetaType.COLLECTION;
}
exports.typeIsStruct = typeIsStruct;
function typeIsStructWithAccessor(typeDef) {
    const mt = typeDef?.getMetaType();
    return mt === TypeMetaType.MESSAGE_DATA || mt === TypeMetaType.INTERFACE || mt === TypeMetaType.COLLECTION;
}
exports.typeIsStructWithAccessor = typeIsStructWithAccessor;
function typeIsMessageData(typeDef) {
    const mt = typeDef?.getMetaType();
    return mt === TypeMetaType.MESSAGE_DATA;
}
exports.typeIsMessageData = typeIsMessageData;
function typeIsSignalData(typeDef) {
    const mt = typeDef?.getMetaType();
    return mt === TypeMetaType.SIGNAL_DATA;
}
exports.typeIsSignalData = typeIsSignalData;
function typeIsInterface(typeDef) {
    const mt = typeDef?.getMetaType();
    return mt === TypeMetaType.INTERFACE || mt === TypeMetaType.COLLECTION;
}
exports.typeIsInterface = typeIsInterface;
function typeIsCollection(typeDef) {
    const mt = typeDef?.getMetaType();
    return mt === TypeMetaType.COLLECTION;
}
exports.typeIsCollection = typeIsCollection;
function typeIsReference(typeDef) {
    const mt = typeDef?.getMetaType();
    return mt === TypeMetaType.TYPE_REFERENCE;
}
exports.typeIsReference = typeIsReference;
function typeIsEnum(typeDef) {
    return Boolean(typeDef && typeof typeDef === "object" && typeDef.enumValues);
}
exports.typeIsEnum = typeIsEnum;
function typeIsStateData(typeDef) {
    return !typeIsMessageData(typeDef) && !typeIsSignalData(typeDef);
}
exports.typeIsStateData = typeIsStateData;
//# sourceMappingURL=TypeDefinition.js.map
