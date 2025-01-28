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
exports.InterfaceType = void 0;
const StructWithAccessorType_1 = require("./StructWithAccessorType");
const TypeDefinition_1 = require("./TypeDefinition");
class InterfaceType extends StructWithAccessorType_1.StructWithAccessorType {
    constructor(codegen, interfaceName, apiname, objectUuidType, fields, parentType = undefined) {
        super(codegen, interfaceName, apiname, objectUuidType, parentType, fields);
        this.collections = [];
        this.ptrType = codegen.DEFAULT_INTERFACE_PTR_TYPE;
        if (this.getMetaType() === TypeDefinition_1.TypeMetaType.INTERFACE) {
            this.localType.headerFile = codegen.getDataStoreHeaderName(apiname);
        }
        else {
            this.localType.headerFile = undefined;
        }
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.INTERFACE;
    }
    getLocalTypePtr(inNamespace, includes) {
        const localType = this.getLocalType(inNamespace, includes);
        return this.codegen.genPointer(this.ptrType, localType, includes);
    }
    registerCollection(collection) {
        this.collections.push(collection);
    }
    getCompatibleTypeList(inNamespace, includes) {
        return this.collections.map(typeDef => {
            return {
                collectionName: typeDef.getName(),
                typeName: typeDef.getLocalType(inNamespace, includes),
            };
        }).sort((a, b) => a.collectionName.localeCompare(b.collectionName));
    }
    isBarePtr() {
        return this.ptrType === "bare";
    }
    setToBarePtr(localType) {
        this.ptrType = "bare";
        this.localType = localType ?? this.localType;
    }
    getPtrType() {
        return this.ptrType;
    }
    genStaticAccessorFields(classSpec) {
        const lines = super.genStaticAccessorFields(classSpec);
        const fields = this.getStateFields();
        for (const name in fields) {
            this.codegen.genFieldChangedCheck(classSpec, { parentType: this, fieldName: name });
        }
        return lines;
    }
}
exports.InterfaceType = InterfaceType;
//# sourceMappingURL=InterfaceType.js.map
