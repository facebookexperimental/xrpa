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
exports.CollectionType = void 0;
const InterfaceType_1 = require("./InterfaceType");
const TypeDefinition_1 = require("./TypeDefinition");
class CollectionType extends InterfaceType_1.InterfaceType {
    constructor(codegen, collectionName, apiname, fields, dsType, maxCount, interfaceType) {
        super(codegen, collectionName, apiname, fields, interfaceType);
        this.dsType = dsType;
        this.maxCount = maxCount;
        this.interfaceType = interfaceType;
        if (interfaceType) {
            interfaceType.registerCollection(this);
        }
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.COLLECTION;
    }
    getHashData() {
        return {
            ...super.getHashData(),
            dsType: this.dsType,
        };
    }
    getAllFields() {
        return {
            ...(this.interfaceType?.getAllFields() ?? {}),
            ...super.getAllFields(),
        };
    }
    getCompatibleTypeList(inNamespace, includes) {
        return [this.getLocalTypePtr(inNamespace, includes)];
    }
    getDSType() {
        return this.dsType;
    }
    getDSTypeID(inNamespace, includes) {
        return this.codegen.nsJoin(this.getReadAccessorType(inNamespace, includes), "DS_TYPE");
    }
}
exports.CollectionType = CollectionType;
//# sourceMappingURL=CollectionType.js.map
