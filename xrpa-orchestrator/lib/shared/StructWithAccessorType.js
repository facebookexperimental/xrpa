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
const ClassSpec_1 = require("./ClassSpec");
const Helpers_1 = require("./Helpers");
const StructType_1 = require("./StructType");
const TypeDefinition_1 = require("./TypeDefinition");
const TypeValue_1 = require("./TypeValue");
class StructWithAccessorType extends StructType_1.StructType {
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
        const rawType = this.codegen.nsQualify(dsType, Helpers_1.EXCLUDE_NAMESPACE).slice(2);
        return this.codegen.nsJoin(this.codegen.nsExtract(dsType), rawType);
    }
    getWriteAccessorType(inNamespace, includes) {
        return this.getReadAccessorType(inNamespace, includes) + "Write";
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
        this.codegen.makeObjectAccessor(classSpec);
        const fields = this.getStateFields();
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            this.codegen.genFieldGetter(classSpec, {
                apiname: this.apiname,
                fieldName,
                fieldType: fieldSpec.type,
                fieldToMemberVar: fieldName => {
                    const fieldOffsetName = `${(0, Helpers_1.upperFirst)(fieldName)}FieldOffset`;
                    const fieldOffset = this.codegen.nsJoin(this.getInternalType(inNamespace, includes), fieldOffsetName);
                    const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
                    const accessorIsStruct = (0, TypeDefinition_1.typeIsStruct)(fieldSpec.type) || (0, TypeDefinition_1.typeIsReference)(fieldSpec.type);
                    const accessorMaxBytes = fieldSpec.type.getInternalMaxBytes();
                    return this.codegen.genReadValue({
                        accessor,
                        accessorIsStruct,
                        accessorMaxBytes,
                        fieldOffset,
                        memAccessorVar: this.codegen.privateMember("memAccessor"),
                    });
                },
                convertToLocal: true,
                description: fieldSpec.description,
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
        this.codegen.makeObjectAccessor(classSpec);
        const fields = this.getStateFields();
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            this.codegen.genFieldSetter(classSpec, {
                fieldName,
                fieldType: fieldSpec.type,
                valueToMemberWrite: value => {
                    const fieldOffsetName = `${(0, Helpers_1.upperFirst)(fieldName)}FieldOffset`;
                    const fieldOffset = this.codegen.nsJoin(this.getInternalType(inNamespace, includes), fieldOffsetName);
                    const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
                    const accessorIsStruct = (0, TypeDefinition_1.typeIsStruct)(fieldSpec.type) || (0, TypeDefinition_1.typeIsReference)(fieldSpec.type);
                    const accessorMaxBytes = fieldSpec.type.getInternalMaxBytes();
                    return this.codegen.genWriteValue({
                        accessor,
                        accessorIsStruct,
                        accessorMaxBytes,
                        fieldOffset,
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
