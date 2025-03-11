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
exports.StructWithAccessorType = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const ClassSpec_1 = require("./ClassSpec");
const StructType_1 = require("./StructType");
const TypeDefinition_1 = require("./TypeDefinition");
class StructWithAccessorType extends StructType_1.StructType {
    constructor(codegen, name, apiname, objectUuidType, parentType, fields, localTypeOverride) {
        super(codegen, name, apiname, parentType, fields, localTypeOverride);
        this.objectUuidType = objectUuidType;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genTypeDefinition(_includes) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genLocalTypeDefinition(_inNamespace, _includes) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genReadWriteValueFunctions(_classSpec) {
        // no-op
    }
    getBaseAccessorTypeName(inNamespace, includes) {
        includes?.addFile({
            filename: this.codegen.getDataStoreHeaderName(this.getApiName()),
            typename: this.getInternalType("", null),
        });
        const dsType = this.getInternalType(inNamespace, null);
        const rawType = this.codegen.nsQualify(dsType, xrpa_utils_1.EXCLUDE_NAMESPACE).slice(2);
        const fullType = this.codegen.nsJoin(this.codegen.getDataStoreHeaderNamespace(this.getApiName()), rawType);
        return this.codegen.nsQualify(fullType, inNamespace);
    }
    getReadAccessorType(inNamespace, includes) {
        return this.getBaseAccessorTypeName(inNamespace, includes) + "Reader";
    }
    getWriteAccessorType(inNamespace, includes) {
        return this.getBaseAccessorTypeName(inNamespace, includes) + "Writer";
    }
    genReadAccessorDefinition(inNamespace, includes) {
        if (this.getMetaType() === TypeDefinition_1.TypeMetaType.INTERFACE) {
            return null;
        }
        const classSpec = new ClassSpec_1.ClassSpec({
            name: this.getReadAccessorType(inNamespace, null),
            namespace: inNamespace,
            includes,
        });
        const fieldOffsetVar = this.codegen.makeObjectAccessor({
            classSpec,
            isWriteAccessor: false,
            isMessageStruct: (0, TypeDefinition_1.typeIsMessageData)(this),
            objectUuidType: this.objectUuidType.getLocalType(inNamespace, includes),
        });
        const fields = this.getStateFields();
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            this.codegen.genFieldGetter(classSpec, {
                apiname: this.apiname,
                fieldName,
                fieldType: fieldSpec.type,
                fieldToMemberVar: () => {
                    const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
                    const accessorIsStruct = (0, TypeDefinition_1.typeIsStruct)(fieldSpec.type) || (0, TypeDefinition_1.typeIsReference)(fieldSpec.type);
                    return this.codegen.genReadValue({
                        accessor,
                        accessorIsStruct,
                        fieldOffsetVar,
                        memAccessorVar: this.codegen.genDeref("", this.codegen.privateMember("memAccessor")),
                    });
                },
                convertToLocal: true,
                description: fieldSpec.description,
                isConst: false,
            });
        }
        this.genStaticAccessorFields(classSpec);
        return classSpec;
    }
    genWriteAccessorDefinition(inNamespace, includes) {
        if (this.getMetaType() === TypeDefinition_1.TypeMetaType.INTERFACE) {
            return null;
        }
        const classSpec = new ClassSpec_1.ClassSpec({
            name: this.getWriteAccessorType(inNamespace, null),
            namespace: inNamespace,
            includes,
            superClass: this.getReadAccessorType(inNamespace, null),
        });
        const fieldOffsetVar = this.codegen.makeObjectAccessor({
            classSpec,
            isWriteAccessor: true,
            isMessageStruct: (0, TypeDefinition_1.typeIsMessageData)(this),
            objectUuidType: this.objectUuidType.getLocalType(inNamespace, includes),
        });
        const fields = this.getStateFields();
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            this.codegen.genFieldSetter(classSpec, {
                fieldName,
                fieldType: fieldSpec.type,
                valueToMemberWrite: value => {
                    const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
                    const accessorIsStruct = (0, TypeDefinition_1.typeIsStruct)(fieldSpec.type) || (0, TypeDefinition_1.typeIsReference)(fieldSpec.type);
                    return this.codegen.genWriteValue({
                        accessor,
                        accessorIsStruct,
                        fieldOffsetVar,
                        memAccessorVar: this.codegen.genDeref("", this.codegen.privateMember("memAccessor")),
                        value,
                    });
                },
                convertFromLocal: true,
            });
        }
        return classSpec;
    }
    getCollectionId() {
        return -1;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genStaticAccessorFields(_classSpec) {
        // inherited
    }
}
exports.StructWithAccessorType = StructWithAccessorType;
//# sourceMappingURL=StructWithAccessorType.js.map
