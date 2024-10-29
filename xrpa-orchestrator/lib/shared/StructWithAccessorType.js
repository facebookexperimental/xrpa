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
const TypeValue_1 = require("./TypeValue");
class StructWithAccessorType extends StructType_1.StructType {
    constructor(codegen, name, apiname, dsIdentifierType, parentType, fields, localTypeOverride) {
        super(codegen, name, apiname, parentType, fields, localTypeOverride);
        this.dsIdentifierType = dsIdentifierType;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genLocalTypeDefinition(_inNamespace, _includes) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genReadWriteValueFunctions(_classSpec) {
        // no-op
    }
    getReadAccessorType(inNamespace, includes) {
        includes?.addFile({
            filename: this.codegen.getDataStoreHeaderName(this.getApiName()),
            typename: this.getInternalType("", null),
        });
        const dsType = this.getInternalType(inNamespace, null);
        const rawType = this.codegen.nsQualify(dsType, xrpa_utils_1.EXCLUDE_NAMESPACE).slice(2);
        return this.codegen.nsJoin(this.codegen.nsExtract(dsType), rawType);
    }
    getWriteAccessorType(inNamespace, includes) {
        return this.getReadAccessorType(inNamespace, includes) + "Write";
    }
    genReadAccessorDefinition(inNamespace, includes) {
        if (this.getMetaType() === TypeDefinition_1.TypeMetaType.INTERFACE) {
            return null;
        }
        const isMessageStruct = (0, TypeDefinition_1.typeIsMessageData)(this);
        const classSpec = new ClassSpec_1.ClassSpec({
            name: this.getReadAccessorType(inNamespace, null),
            namespace: inNamespace,
            includes,
        });
        this.codegen.makeObjectAccessor(classSpec, false, this.dsIdentifierType.getLocalType(inNamespace, includes));
        const fields = this.getStateFields();
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            this.codegen.genFieldGetter(classSpec, {
                apiname: this.apiname,
                fieldName,
                fieldType: fieldSpec.type,
                fieldToMemberVar: fieldName => {
                    const fieldOffset = this.codegen.nsJoin(this.getInternalType(inNamespace, includes), `${(0, xrpa_utils_1.upperFirst)(fieldName)}FieldOffset`);
                    const fieldSize = this.codegen.nsJoin(this.getInternalType(inNamespace, includes), `${(0, xrpa_utils_1.upperFirst)(fieldName)}FieldSize`);
                    const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
                    const accessorIsStruct = (0, TypeDefinition_1.typeIsStruct)(fieldSpec.type) || (0, TypeDefinition_1.typeIsReference)(fieldSpec.type);
                    const accessorMaxBytes = fieldSpec.type.getInternalMaxBytes();
                    return this.codegen.genReadValue({
                        accessor,
                        accessorIsStruct,
                        accessorMaxBytes,
                        fieldOffset: isMessageStruct ? fieldOffset : this.codegen.genDerefMethodCall("", "advanceReadPos", [fieldSize]),
                        memAccessorVar: this.codegen.privateMember("memAccessor"),
                    });
                },
                convertToLocal: true,
                description: fieldSpec.description,
                isConst: isMessageStruct,
            });
        }
        this.genStaticAccessorFields(classSpec);
        return classSpec;
    }
    genWriteAccessorDefinition(inNamespace, includes) {
        if (this.getMetaType() === TypeDefinition_1.TypeMetaType.INTERFACE) {
            return null;
        }
        const isMessageStruct = (0, TypeDefinition_1.typeIsMessageData)(this);
        const classSpec = new ClassSpec_1.ClassSpec({
            name: this.getWriteAccessorType(inNamespace, null),
            namespace: inNamespace,
            includes,
            superClass: this.getReadAccessorType(inNamespace, null),
        });
        this.codegen.makeObjectAccessor(classSpec, !isMessageStruct, this.dsIdentifierType.getLocalType(inNamespace, includes));
        const fields = this.getStateFields();
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            this.codegen.genFieldSetter(classSpec, {
                fieldName,
                fieldType: fieldSpec.type,
                valueToMemberWrite: value => {
                    const fieldOffset = this.codegen.nsJoin(this.getInternalType(inNamespace, includes), `${(0, xrpa_utils_1.upperFirst)(fieldName)}FieldOffset`);
                    const fieldSize = this.codegen.nsJoin(this.getInternalType(inNamespace, includes), `${(0, xrpa_utils_1.upperFirst)(fieldName)}FieldSize`);
                    const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
                    const accessorIsStruct = (0, TypeDefinition_1.typeIsStruct)(fieldSpec.type) || (0, TypeDefinition_1.typeIsReference)(fieldSpec.type);
                    const accessorMaxBytes = fieldSpec.type.getInternalMaxBytes();
                    return this.codegen.genWriteValue({
                        accessor,
                        accessorIsStruct,
                        accessorMaxBytes,
                        fieldOffset: isMessageStruct ? fieldOffset : this.codegen.genDerefMethodCall("", "advanceWritePos", [fieldSize]),
                        memAccessorVar: this.codegen.privateMember("memAccessor"),
                        value,
                    });
                },
                convertFromLocal: true,
            });
        }
        return classSpec;
    }
    getDSType() {
        return -1;
    }
    genStaticAccessorFields(classSpec) {
        classSpec.members.push({
            name: "DS_TYPE",
            type: this.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            initialValue: new TypeValue_1.PrimitiveValue(this.codegen, this.codegen.PRIMITIVE_INTRINSICS.int32.typename, this.getDSType()),
            isStatic: true,
            isConst: true,
        });
        classSpec.members.push({
            name: "DS_SIZE",
            type: this.codegen.PRIMITIVE_INTRINSICS.int32.typename,
            initialValue: new TypeValue_1.PrimitiveValue(this.codegen, this.codegen.PRIMITIVE_INTRINSICS.int32.typename, this.getTypeSize()),
            isStatic: true,
            isConst: true,
        });
    }
}
exports.StructWithAccessorType = StructWithAccessorType;
//# sourceMappingURL=StructWithAccessorType.js.map
