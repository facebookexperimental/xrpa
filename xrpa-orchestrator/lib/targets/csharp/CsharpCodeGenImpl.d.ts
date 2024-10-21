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


/// <reference types="node" />
import { ClassSpec } from "../../shared/ClassSpec";
import { UnitTransformer } from "../../shared/CoordinateTransformer";
import { IncludeAggregator } from "../../shared/Helpers";
import { FieldTypeAndAccessor, GuidGenSpec, PrimitiveIntrinsics } from "../../shared/TargetCodeGen";
import { InterfaceTypeDefinition, TypeDefinition } from "../../shared/TypeDefinition";
import { TypeValue } from "../../shared/TypeValue";
interface DependentXrpaTypes {
    DatasetAccessor: TypeDefinition;
    MemoryAccessor: TypeDefinition;
    ObjectAccessorInterface: TypeDefinition;
}
export declare function registerXrpaTypes(types: DependentXrpaTypes): void;
export declare const XRPA_NAMESPACE = "Xrpa";
export declare const HEADER: string[];
export declare const UNIT_TRANSFORMER: UnitTransformer;
export declare const PRIMITIVE_INTRINSICS: PrimitiveIntrinsics;
export declare const GET_CURRENT_CLOCK_TIME: string;
export declare const DEFAULT_INTERFACE_PTR_TYPE = "bare";
export declare class CsIncludeAggregator implements IncludeAggregator {
    private importNamespaces;
    constructor(namespaces?: string[]);
    addFile(params: {
        filename?: string;
        namespace?: string;
        typename?: string;
    }): void;
    getIncludes(): string[];
    getNamespaceImports(excludeNamespace?: string): string[];
}
export declare function genCommentLines(str?: string): string[];
export declare function nsQualify(qualifiedName: string, inNamespace: string): string;
export declare function nsJoin(...names: string[]): string;
export declare function nsExtract(qualifiedName: string, nonNamespacePartCount?: number): string;
export declare function constRef(type: string, _byteSize: number): string;
export declare function privateMember(memberVarName: string): string;
export declare function methodMember(methodName: string): string;
export declare function genPrimitiveValue(typename: string, value: string | boolean | number | null): string;
export declare function genMultiValue(typename: string, hasInitializerConstructor: boolean, valueStrings: [string, string][]): string;
export declare function genDeclaration(params: {
    typename: string;
    inNamespace: string;
    varName: string;
    initialValue: TypeValue;
    includeTerminator: boolean;
    isStatic?: boolean;
    isConst?: boolean;
}): string;
export declare function genPointer(ptrType: string, localType: string): string;
export declare function reinterpretValue(_fromType: string, _toType: string, value: TypeValue): string;
export declare function getDataStoreName(apiname: string): string;
export declare function getDataStoreHeaderName(apiname: string): string;
export declare function getTypesHeaderName(apiname: string): string;
export declare function makeObjectAccessor(classSpec: ClassSpec, isWriteAccessor: boolean, dsIdentifierType: string): void;
export declare function genClassDefinition(classSpec: ClassSpec): string[];
export declare function genReadValue(params: {
    accessor: string;
    accessorIsStruct: boolean;
    accessorMaxBytes: number | null;
    fieldOffset: string;
    memAccessorVar: string;
}): string;
export declare function genWriteValue(params: {
    accessor: string;
    accessorIsStruct: boolean;
    accessorMaxBytes: number | null;
    fieldOffset: string;
    memAccessorVar: string;
    value: string | TypeValue;
}): string;
export declare function genReadWriteValueFunctions(classSpec: ClassSpec, params: {
    localType: TypeDefinition;
    localTypeHasInitializerConstructor: boolean;
    fieldTypes: Record<string, FieldTypeAndAccessor>;
    fieldsToLocal: Record<string, TypeValue>;
    fieldsFromLocal: Record<string, TypeValue>;
    localValueParamName: string;
}): void;
export declare function genEnumDefinition(enumName: string, enumValues: Record<string, number>): string[];
export declare function genEnumDynamicConversion(targetTypename: string, value: TypeValue): string;
export declare function getNullValue(): string;
export declare function genReferencePtrToID(varName: string, _ptrType: string, dsIdentifierType: string): string;
export declare function genFieldGetter(classSpec: ClassSpec, params: {
    apiname: string;
    fieldName: string;
    fieldType: TypeDefinition;
    fieldToMemberVar: (fieldName: string) => string;
    convertToLocal: boolean;
    description: string | undefined;
    visibility?: "public" | "private";
    isConst: boolean;
}): void;
export declare function genFieldSetter(classSpec: ClassSpec, params: {
    fieldName: string;
    fieldType: TypeDefinition;
    valueToMemberWrite: (fieldName: string) => string;
    convertFromLocal: boolean;
}): void;
export declare function genFieldChangedCheck(classSpec: ClassSpec, params: {
    parentType: InterfaceTypeDefinition;
    fieldName: string;
    visibility?: "public" | "private";
}): void;
export declare function injectGeneratedTag(fileData: Buffer): Buffer;
export declare function genRuntimeGuid(params: {
    dsIdentifierType: string;
    guidGen: GuidGenSpec;
    idParts?: number[];
    includes: IncludeAggregator | null;
}): string;
export declare function genDeref(ptrName: string, memberName: string): string;
export declare function genDerefMethodCall(ptrName: string, methodName: string, params: string[]): string;
export declare function genMethodBind(ptrName: string, methodName: string, params: string[], bindParamCount: number): string;
export declare function genNonNullCheck(ptrName: string): string;
export declare function genCreateObject(type: string, params: string[]): string;
export declare function genObjectPtrType(type: string): string;
export declare function refParam(varName: string): string;
export {};

