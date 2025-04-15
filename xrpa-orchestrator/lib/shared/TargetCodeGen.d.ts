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
import { MessageDataTypeDefinition, StructTypeDefinition, TypeDefinition, TypeSize } from "./TypeDefinition";
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
    typeSize: TypeSize;
}
export interface PrimitiveIntrinsics {
    string: TypeSpec;
    microseconds: TypeSpec;
    nanoseconds: TypeSpec;
    uint8: TypeSpec;
    uint64: TypeSpec;
    int: TypeSpec;
    int32: TypeSpec;
    uint32: TypeSpec;
    float32: TypeSpec;
    bool: TypeSpec;
    arrayFloat3: TypeSpec;
    bytearray: TypeSpec;
    TRUE: string;
    FALSE: string;
}
export interface GuidGenSpec {
    includes: Array<{
        filename?: string;
        namespace?: string;
    }>;
    code: string;
}
export interface CoreXrpaTypes {
    MemoryAccessor: TypeDefinition;
    MemoryOffset: TypeDefinition;
    ObjectAccessorInterface: TypeDefinition;
    TransportStreamAccessor: TypeDefinition;
    InboundSignalForwarder: TypeDefinition;
}
export interface TargetCodeGenImpl {
    HEADER: string[];
    UNIT_TRANSFORMER: UnitTransformer;
    PRIMITIVE_INTRINSICS: PrimitiveIntrinsics;
    XRPA_NAMESPACE: string;
    getXrpaTypes(): CoreXrpaTypes;
    nsQualify(qualifiedName: string, inNamespace: string): string;
    nsJoin(...names: string[]): string;
    nsExtract(qualifiedName: string, nonNamespacePartCount?: number): string;
    privateMember(memberVarName: string): string;
    methodMember(methodName: string): string;
    genCommentLines(str?: string): string[];
    genGetCurrentClockTime(includes: IncludeAggregator | null, inNanoseconds?: boolean): string;
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
    genPointer(localType: string, includes: IncludeAggregator | null): string;
    genReadValue(params: {
        accessor: string;
        accessorIsStruct: boolean;
        fieldOffsetVar: string;
        memAccessorVar: string;
    }): string;
    genWriteValue(params: {
        accessor: string;
        accessorIsStruct: boolean;
        fieldOffsetVar: string;
        memAccessorVar: string;
        value: string | TypeValue;
    }): string;
    genDynSizeOfValue(params: {
        accessor: string;
        accessorIsStruct: boolean;
        value: string | TypeValue;
        inNamespace: string;
        includes: IncludeAggregator | null;
    }): string;
    makeObjectAccessor(params: {
        classSpec: ClassSpec;
        isWriteAccessor: boolean;
        isMessageStruct: boolean;
        objectUuidType: string;
    }): string;
    genEventHandlerType(paramTypes: string[]): string;
    genEventHandlerCall(handler: string, paramValues: string[], handlerCanBeNull: boolean): string;
    genMessageHandlerType(params: {
        namespace: string;
        includes: IncludeAggregator | null;
        fieldType: MessageDataTypeDefinition;
    }): string;
    genOnMessageAccessor(classSpec: ClassSpec, params: {
        namespace: string;
        fieldName: string;
        fieldType: MessageDataTypeDefinition;
        genMsgHandler: (msgName: string) => string;
    }): void;
    genMessageDispatch(params: {
        namespace: string;
        includes: IncludeAggregator | null;
        fieldName: string;
        fieldType: MessageDataTypeDefinition;
        genMsgHandler: (fieldName: string) => string;
        msgDataToParams: (msgType: MessageDataTypeDefinition, prelude: string[], includes: IncludeAggregator | null) => string[];
        convertToReadAccessor: boolean;
        timestampName?: string;
    }): string[];
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
        isConst: boolean;
    }): void;
    genFieldSetter(classSpec: ClassSpec, params: {
        fieldName: string;
        fieldType: TypeDefinition;
        valueToMemberWrite: (fieldName: string) => string;
        convertFromLocal: boolean;
    }): void;
    genFieldChangedCheck(classSpec: ClassSpec, params: {
        parentType: StructTypeDefinition;
        fieldName: string;
        visibility?: ClassVisibility;
    }): void;
    genEnumDefinition(enumName: string, enumValues: Record<string, number>, includes: IncludeAggregator | null): string[];
    genEnumDynamicConversion(targetTypename: string, value: TypeValue): string;
    genReferencePtrToID(varName: string, objectUuidType: string): string;
    constRef(type: string, byteSize: number): string;
    reinterpretValue(fromType: string, toType: string, value: TypeValue): string;
    getDataStoreName(apiname: string): string;
    getDataStoreHeaderName(apiname: string): string;
    getDataStoreHeaderNamespace(apiname: string): string;
    getDataStoreClass(apiname: string, inNamespace: string, includes: IncludeAggregator | null): string;
    getTypesHeaderName(apiname: string): string;
    getTypesHeaderNamespace(apiname: string): string;
    genRuntimeGuid(params: {
        objectUuidType: string;
        guidGen: GuidGenSpec;
        idParts?: number[];
        includes: IncludeAggregator | null;
    }): string;
    genDeref(ptrName: string, memberName: string): string;
    genDerefMethodCall(ptrName: string, methodName: string, params: string[]): string;
    genMethodCall(varName: string, methodName: string, params: string[]): string;
    genMethodBind(ptrName: string, methodName: string, params: Record<string, string[]>, ignoreParamCount: number): string;
    genPassthroughMethodBind(methodName: string, paramCount: number): string;
    getNullValue(): string;
    genNonNullCheck(ptrName: string): string;
    genCreateObject(type: string, params: string[]): string;
    genObjectPtrType(type: string): string;
    genConvertBoolToInt(value: TypeValue): string;
    genConvertIntToBool(value: TypeValue): string;
    applyTemplateParams(typename: string, ...templateParams: string[]): string;
    ifAnyBitIsSet(value: string, bitsValue: number, code: string[]): string[];
    ifAllBitsAreSet(value: string, bitsValue: number, code: string[]): string[];
    declareVar(varName: string, typename: string, initialValue: TypeValue): string;
}

