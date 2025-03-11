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


import { Thunk } from "@xrpa/xrpa-utils";
import { XrpaProgramParam } from "./ProgramInterface";
import { BindingProperties, PropertyCondition, XrpaDataType, XrpaNamedDataType, XrpaTypeAugmenter } from "./XrpaLanguage";
import { BuiltinType } from "./shared/BuiltinTypes";
import { UserDefaultValue } from "./shared/TypeDefinition";
export declare const FIELD_DESCRIPTION = "xrpa.description";
export declare const FIELD_DEFAULT = "xrpa.defaultValue";
export declare const MESSAGE_RATE = "xrpa.messageRate";
export declare const IS_IMAGE_TYPE = "xrpa.isImageType";
export declare function Description<T extends XrpaDataType>(description: string | undefined, dataType: Thunk<T>): T;
export declare function getFieldDescription(dataType: XrpaDataType): string | undefined;
export declare function getFieldDefaultValue(dataType: XrpaDataType): UserDefaultValue;
export declare function PrimaryKey<T extends XrpaDataType>(dataType: Thunk<T>): T;
export declare function PrimaryKey<T extends XrpaDataType>(condition: PropertyCondition): XrpaTypeAugmenter<T>;
export declare function PrimaryKey<T extends XrpaDataType>(condition: PropertyCondition, dataType: Thunk<T>): T;
export declare function isFieldPrimaryKey(dataType: XrpaDataType): boolean;
export declare function IndexKey<T extends XrpaDataType>(dataType: Thunk<T>): T;
export declare function IndexKey<T extends XrpaDataType>(condition: PropertyCondition): XrpaTypeAugmenter<T>;
export declare function IndexKey<T extends XrpaDataType>(condition: PropertyCondition, dataType: Thunk<T>): T;
export declare function isFieldIndexKey(dataType: XrpaDataType): boolean;
export declare function GenericImpl(dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function GenericImpl(condition: PropertyCondition): XrpaTypeAugmenter<XrpaCollectionType>;
export declare function GenericImpl(condition: PropertyCondition, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function getUseGenericImplementation(dataType: XrpaCollectionType): boolean;
export declare function Boolean(defaultValue?: boolean, description?: string): XrpaDataType<BuiltinType.Boolean>;
export declare function Count(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Count>;
export declare function BitField(description?: string): XrpaDataType<BuiltinType.BitField>;
export declare function Scalar(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Scalar>;
export declare function Timestamp(description?: string): XrpaDataType<BuiltinType.Timestamp>;
export declare function String(defaultValue?: string, description?: string): XrpaDataType<BuiltinType.String>;
export declare function Float3(defaultValue?: [number, number, number], description?: string): XrpaDataType<BuiltinType.Float3>;
export declare function ColorSRGBA(description?: string): XrpaDataType<BuiltinType.ColorSRGBA>;
export declare function ColorLinear(description?: string): XrpaDataType<BuiltinType.ColorLinear>;
export declare function Signal(description?: string): XrpaDataType<BuiltinType.Signal>;
export declare function isBuiltinDataType(dataType: XrpaDataType): dataType is XrpaDataType<BuiltinType>;
export interface XrpaEnumType extends XrpaDataType<"Enum"> {
    name: string;
    enumValues: string[];
}
export declare function isEnumDataType(thing: unknown): thing is XrpaEnumType;
export declare function Enum(name: string, enumValues: string[], description?: string): XrpaEnumType;
export interface XrpaFixedArrayType extends XrpaDataType<"FixedArray"> {
    innerType: XrpaDataType;
    arraySize: number;
}
export declare function isFixedArrayDataType(thing: unknown): thing is XrpaFixedArrayType;
export declare function FixedArray(innerType: Thunk<XrpaDataType>, arraySize: number, description?: string): XrpaFixedArrayType;
export interface XrpaByteArrayType extends XrpaDataType<"ByteArray"> {
    expectedSize: number;
}
export declare function isByteArrayDataType(thing: unknown): thing is XrpaByteArrayType;
export declare function ByteArray(expectedSize?: number, description?: string): XrpaByteArrayType;
export interface XrpaStructFields {
    [key: string]: Thunk<XrpaDataType>;
}
export interface XrpaStructType<T extends XrpaStructFields = XrpaStructFields> extends XrpaDataType<"Struct"> {
    name: string;
    fields: Record<keyof T, XrpaDataType>;
}
export declare function isStructDataType(thing: unknown): thing is XrpaStructType;
export declare function Struct<T extends XrpaStructFields>(fieldDefs: T): XrpaStructType;
export declare function Struct<T extends XrpaStructFields>(name: string | undefined, fieldDefs: T): XrpaStructType;
type XrpaStruct = XrpaStructFields | XrpaStructType;
export interface ImageParams {
    expectedWidth: number;
    expectedHeight: number;
    expectedBytesPerPixel: number;
    description?: string;
}
export declare function Image(params: ImageParams): XrpaStructType;
export declare function Image(name: string | undefined, params: ImageParams): XrpaStructType;
export interface XrpaMessageType extends XrpaDataType<"Message"> {
    name: string;
    fieldsStruct: XrpaStructType;
}
export declare function isMessageDataType(thing: unknown): thing is XrpaMessageType;
export declare function Message(fields?: XrpaStruct): XrpaMessageType;
export declare function Message(name: string | undefined, fields?: XrpaStruct): XrpaMessageType;
export declare function MessageRate(expectedRatePerSecond: number, dataType: Thunk<XrpaMessageType>): XrpaMessageType;
export declare function MessageRate(expectedRatePerSecond: number, condition: PropertyCondition): XrpaTypeAugmenter<XrpaMessageType>;
export declare function MessageRate(expectedRatePerSecond: number, condition: PropertyCondition, dataType: Thunk<XrpaMessageType>): XrpaMessageType;
export interface XrpaInterfaceType extends XrpaDataType<"Interface"> {
    name: string;
    fieldsStruct: XrpaStructType;
}
export declare function isInterfaceDataType(thing: unknown): thing is XrpaInterfaceType;
export declare function Interface(name: string | undefined, fields?: XrpaStruct): XrpaInterfaceType;
export interface CollectionConfig {
    fields: XrpaStruct;
    maxCount: number;
    interfaceType?: XrpaInterfaceType;
}
export interface XrpaCollectionType extends XrpaDataType<"Collection"> {
    name: string;
    fieldsStruct: XrpaStructType;
    maxCount: number;
    interfaceType: XrpaInterfaceType | undefined;
}
export declare function isCollectionDataType(thing: unknown): thing is XrpaCollectionType;
export declare function Collection(fields?: CollectionConfig): XrpaCollectionType;
export declare function Collection(name: string | undefined, fields?: CollectionConfig): XrpaCollectionType;
export declare function hasFieldsStruct(dataType: XrpaDataType): dataType is XrpaCollectionType | XrpaInterfaceType | XrpaMessageType;
export interface XrpaReferenceType extends XrpaDataType<"Reference"> {
    targetType: XrpaInterfaceType | XrpaCollectionType;
}
export declare function isReferenceDataType(thing: unknown): thing is XrpaReferenceType;
export declare function ReferenceTo(targetType: XrpaInterfaceType | XrpaCollectionType | XrpaProgramParam<XrpaCollectionType>, description?: string): XrpaReferenceType;
export interface TypeTreeVisitor {
    allTypes?: (dataType: XrpaDataType, fieldPath: string[], parentProperties: BindingProperties, isSubStruct: boolean) => XrpaDataType;
    preRecursion?: (dataType: XrpaNamedDataType, fieldPath: string[], isSubStruct: boolean) => XrpaNamedDataType;
    postRecursion?: (dataType: XrpaNamedDataType, fieldPath: string[], isSubStruct: boolean) => XrpaNamedDataType;
}
export declare function walkTypeTree<T extends XrpaDataType>(visitor: TypeTreeVisitor, fieldPath: string[], dataType: T, parentProperties: BindingProperties, isSubStruct?: boolean): T;
export declare function propagateInheritableProperties(dataType: XrpaDataType, parentProperties: BindingProperties): XrpaDataType;
export {};

