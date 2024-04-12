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


import { ClassSpec, ClassVisibility } from "./ClassSpec";
import { UnitTransformer } from "./CoordinateTransformer";
import { IncludeAggregator } from "./Helpers";
import { InterfaceTypeDefinition, TypeDefinition } from "./TypeDefinition";
import { TypeValue } from "./TypeValue";
export interface TypeSpec {
    typename: string;
    hasInitializerConstructor?: boolean;
    fieldMap?: Record<string, string>;
    conversionOperator?: string;
    headerFile?: string;
}
export interface FieldTypeAndAccessor {
    typename: string;
    accessor: string;
    accessorIsStruct: boolean;
    accessorMaxBytes: number | null;
    fieldOffsetName: string;
}
export interface PrimitiveIntrinsics {
    string: TypeSpec;
    microseconds: TypeSpec;
    uint8: TypeSpec;
    uint64: TypeSpec;
    int: TypeSpec;
    int32: TypeSpec;
    uint32: TypeSpec;
    float32: TypeSpec;
    bool: TypeSpec;
}
export interface GuidGenSpec {
    includes: Array<{
        filename?: string;
        namespace?: string;
    }>;
    code: string;
}
export interface TargetCodeGenImpl {
    HEADER: string[];
    UNIT_TRANSFORMER: UnitTransformer;
    PRIMITIVE_INTRINSICS: PrimitiveIntrinsics;
    GET_CURRENT_CLOCK_TIME: string;
    DEFAULT_INTERFACE_PTR_TYPE: string;
    XRPA_NAMESPACE: string;
    nsQualify(qualifiedName: string, inNamespace: string): string;
    nsJoin(...names: string[]): string;
    nsExtract(qualifiedName: string, nonNamespacePartCount?: number): string;
    privateMember(memberVarName: string): string;
    genCommentLines(str?: string): string[];
    genPrimitiveValue(typename: string, value: string | boolean | number | null): string;
    genMultiValue(typename: string, hasInitializerConstructor: boolean, valueStrings: [string, string][]): string;
    genDeclaration(params: {
        typename: string;
        inNamespace: string;
        varName: string;
        initialValue: TypeValue;
        includeTerminator: boolean;
        isStatic?: boolean;
        isConst?: boolean;
    }): string;
    genPointer(ptrType: string, localType: string, includes: IncludeAggregator | null): string;
    genReadValue(params: {
        accessor: string;
        accessorIsStruct: boolean;
        accessorMaxBytes: number | null;
        fieldOffset: string;
        memAccessorVar: string;
    }): string;
    genWriteValue(params: {
        accessor: string;
        accessorIsStruct: boolean;
        accessorMaxBytes: number | null;
        fieldOffset: string;
        memAccessorVar: string;
        value: string | TypeValue;
    }): string;
    makeObjectAccessor(classSpec: ClassSpec): void;
    genClassDefinition(classSpec: ClassSpec): string[];
    genReadWriteValueFunctions(classSpec: ClassSpec, params: {
        localType: TypeDefinition | string;
        localTypeHasInitializerConstructor: boolean;
        fieldTypes: Record<string, FieldTypeAndAccessor>;
        fieldsToLocal: Record<string, TypeValue>;
        fieldsFromLocal: Record<string, TypeValue>;
        localValueParamName: string;
    }): void;
    genFieldGetter(classSpec: ClassSpec, params: {
        apiname: string;
        fieldName: string;
        fieldType: TypeDefinition;
        fieldToMemberVar: (fieldName: string) => string;
        convertToLocal: boolean;
        description: string | undefined;
        visibility?: ClassVisibility;
    }): void;
    genFieldSetter(classSpec: ClassSpec, params: {
        fieldName: string;
        fieldType: TypeDefinition;
        valueToMemberWrite: (fieldName: string) => string;
        convertFromLocal: boolean;
    }): void;
    genFieldChangedCheck(classSpec: ClassSpec, params: {
        parentType: InterfaceTypeDefinition;
        fieldName: string;
        visibility?: ClassVisibility;
    }): void;
    genEnumDefinition(enumName: string, enumValues: Record<string, number>): string[];
    genEnumDynamicConversion(targetTypename: string, value: TypeValue): string;
    genReferencePtrToID(varName: string, ptrType: string, dsIdentifierType: string): string;
    constRef(type: string, byteSize: number): string;
    reinterpretValue(fromType: string, toType: string, value: TypeValue): string;
    getDataStoreName(apiname: string): string;
    getDataStoreHeaderName(apiname: string): string;
    getTypesHeaderName(apiname: string): string;
    genRuntimeGuid(params: {
        dsIdentifierType: string;
        guidGen: GuidGenSpec;
        idParts?: number[];
        includes: IncludeAggregator | null;
    }): string;
    genDeref(ptrName: string, memberName: string): string;
    genDerefMethodCall(ptrName: string, methodName: string, params: string[]): string;
    genMethodBind(ptrName: string, methodName: string, params: string[], bindParamCount: number): string;
    getNullValue(): string;
    genNonNullCheck(ptrName: string): string;
    genCreateObject(type: string, params: string[]): string;
    genObjectPtrType(type: string): string;
}

