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


import { Thunk, resolveThunk, safeDeepFreeze } from "@xrpa/xrpa-utils";
import assert from "assert";
import { replaceImmutable, updateImmutable } from "simply-immutable";

import { XrpaProgramParam, isXrpaProgramParam } from "./ProgramInterface";
import {
  BindingProperties,
  NameType,
  PropertyCondition,
  XrpaDataType,
  XrpaNamedDataType,
  XrpaTypeAugmenter,
  evalProperty,
  getInheritableProperties,
  isNamedDataType,
  isXrpaDataType,
  setPropertiesOrCurry,
  setProperty,
} from "./XrpaLanguage";

import { BuiltinType } from "./shared/BuiltinTypes";
import { UserDefaultValue } from "./shared/TypeDefinition";

export const FIELD_DESCRIPTION = "xrpa.description";
export const FIELD_DEFAULT = "xrpa.defaultValue";
const PRIMARY_KEY = "xrpa.primaryKey";
const INDEX_KEY = "xrpa.indexKey";
export const MESSAGE_RATE = "xrpa.messageRate";
export const IS_IMAGE_TYPE = "xrpa.isImageType";

export function Description<T extends XrpaDataType>(description: string | undefined, dataType: Thunk<T>): T {
  dataType = resolveThunk(dataType);
  if (description === undefined) {
    return dataType;
  }
  return setProperty(dataType, FIELD_DESCRIPTION, description);
}

export function getFieldDescription(dataType: XrpaDataType): string | undefined {
  return dataType.properties[FIELD_DESCRIPTION] as string | undefined;
}

export function getFieldDefaultValue(dataType: XrpaDataType): UserDefaultValue {
  return dataType.properties[FIELD_DEFAULT] as UserDefaultValue;
}

export function PrimaryKey<T extends XrpaDataType>(dataType: Thunk<T>): T;
export function PrimaryKey<T extends XrpaDataType>(condition: PropertyCondition): XrpaTypeAugmenter<T>;
export function PrimaryKey<T extends XrpaDataType>(condition: PropertyCondition, dataType: Thunk<T>): T;
export function PrimaryKey<T extends XrpaDataType>(arg0: Thunk<T> | PropertyCondition, arg1?: Thunk<T>): T | XrpaTypeAugmenter<T> {
  return setPropertiesOrCurry({
    [PRIMARY_KEY]: true,
    [INDEX_KEY]: true,
  }, arg0, arg1);
}

export function isFieldPrimaryKey(dataType: XrpaDataType): boolean {
  return evalProperty(dataType.properties, PRIMARY_KEY) === true;
}

export function IndexKey<T extends XrpaDataType>(dataType: Thunk<T>): T;
export function IndexKey<T extends XrpaDataType>(condition: PropertyCondition): XrpaTypeAugmenter<T>;
export function IndexKey<T extends XrpaDataType>(condition: PropertyCondition, dataType: Thunk<T>): T;
export function IndexKey<T extends XrpaDataType>(arg0: Thunk<T> | PropertyCondition, arg1?: Thunk<T>): T | XrpaTypeAugmenter<T> {
  return setPropertiesOrCurry({ [INDEX_KEY]: true }, arg0, arg1);
}

export function isFieldIndexKey(dataType: XrpaDataType): boolean {
  return evalProperty(dataType.properties, INDEX_KEY) === true;
}

////////////////////////////////////////////////////////////////////////////////
// Primitive data types

export function LateBindingType(defaultValue?: boolean, description?: string): XrpaDataType<"LateBindingType"> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "LateBindingType",
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Boolean(defaultValue?: boolean, description?: string): XrpaDataType<BuiltinType.Boolean> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Boolean,
    properties: {
      [FIELD_DEFAULT]: defaultValue,
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Count(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Count> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Count,
    properties: {
      [FIELD_DEFAULT]: defaultValue,
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function BitField(description?: string): XrpaDataType<BuiltinType.BitField> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.BitField,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Scalar(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Scalar> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Scalar,
    properties: {
      [FIELD_DEFAULT]: defaultValue,
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Timestamp(description?: string): XrpaDataType<BuiltinType.Timestamp> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Timestamp,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function HiResTimestamp(description?: string): XrpaDataType<BuiltinType.HiResTimestamp> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.HiResTimestamp,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function String(defaultValue?: string, description?: string): XrpaDataType<BuiltinType.String> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.String,
    properties: {
      [FIELD_DEFAULT]: defaultValue,
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Float3(defaultValue?: [number, number, number], description?: string): XrpaDataType<BuiltinType.Float3> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Float3,
    properties: {
      [FIELD_DEFAULT]: defaultValue,
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function ColorSRGBA(description?: string): XrpaDataType<BuiltinType.ColorSRGBA> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.ColorSRGBA,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function ColorLinear(description?: string): XrpaDataType<BuiltinType.ColorLinear> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.ColorLinear,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Signal(description?: string): XrpaDataType<BuiltinType.Signal> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Signal,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function isBuiltinDataType(dataType: XrpaDataType): dataType is XrpaDataType<BuiltinType> {
  return dataType.typename in BuiltinType;
}

////////////////////////////////////////////////////////////////////////////////
// Extended data types

export interface XrpaEnumType extends XrpaDataType<"Enum"> {
  name: string;
  enumValues: string[];
}

export function isEnumDataType(thing: unknown): thing is XrpaEnumType {
  return isXrpaDataType(thing) && thing.typename === "Enum";
}

export function Enum(name: string, enumValues: string[], description?: string): XrpaEnumType {
  assert(enumValues.length > 0, "Enum must have at least one value");
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "Enum",
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
    name,
    enumValues,
  });
}

export interface XrpaFixedArrayType extends XrpaDataType<"FixedArray"> {
  innerType: XrpaDataType;
  arraySize: number;
}

export function isFixedArrayDataType(thing: unknown): thing is XrpaFixedArrayType {
  return isXrpaDataType(thing) && thing.typename === "FixedArray";
}

export function FixedArray(innerType: Thunk<XrpaDataType>, arraySize: number, description?: string): XrpaFixedArrayType {
  assert(arraySize > 0, "FixedArray count must be greater than 0");
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "FixedArray",
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
    innerType: resolveThunk(innerType),
    arraySize,
  });
}

export interface XrpaByteArrayType extends XrpaDataType<"ByteArray"> {
  expectedSize: number;
}

export function isByteArrayDataType(thing: unknown): thing is XrpaByteArrayType {
  return isXrpaDataType(thing) && thing.typename === "ByteArray";
}

export function ByteArray(expectedSize = 256, description?: string): XrpaByteArrayType {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "ByteArray",
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
    expectedSize,
  });
}

////////////////////////////////////////////////////////////////////////////////
// Structure data type

export interface XrpaStructFields {
  [key: string]: Thunk<XrpaDataType>;
}

export interface XrpaStructType<T extends XrpaStructFields = XrpaStructFields> extends XrpaDataType<"Struct"> {
  name: string;
  fields: Record<keyof T, XrpaDataType>;
}

export function isStructDataType(thing: unknown): thing is XrpaStructType {
  return isXrpaDataType(thing) && thing.typename === "Struct";
}

function extractNameAndValue<T>(arg0: string | T | undefined, arg1: T | undefined): [string | undefined, T | undefined] {
  const name = (typeof arg0 !== "string") ? undefined : arg0;
  const value = (typeof arg0 === "string" || arg0 === undefined) ? arg1 : arg0;
  return [name, value];
}

export function Struct<T extends XrpaStructFields>(fieldDefs: T): XrpaStructType;
export function Struct<T extends XrpaStructFields>(name: string | undefined, fieldDefs: T): XrpaStructType;
export function Struct<T extends XrpaStructFields>(arg0: string | T | undefined, arg1?: T): XrpaStructType {
  const [name, fieldDefs] = extractNameAndValue(arg0, arg1);

  const fields: Record<string, XrpaDataType> = {};
  for (const key in fieldDefs) {
    fields[key] = resolveThunk(fieldDefs[key]);

    const typename = fields[key].typename;
    if (typename === "Collection" || typename === "Interface") {
      // TODO this might be better checked when fully realizing the types, as then we would have a full name-path to the field.
      // As it is, we have the call stack, but it takes some effort to find the right line in the stack because of the nesting.
      throw new Error(`Struct field "${key}" cannot be a Collection or Interface, use a Reference instead`);
    }
  }

  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "Struct",
    properties: {},
    name: name ?? "",
    fields,
  });
}

type XrpaStruct = XrpaStructFields | XrpaStructType;

function resolveStruct(name: string | undefined, thing: XrpaStruct | undefined): XrpaStructType {
  if (thing === undefined) {
    return Struct(name, {});
  }
  return isXrpaDataType(thing) ? NameType(name, thing) : Struct(name, thing);
}

////////////////////////////////////////////////////////////////////////////////
// Image data type

export interface ImageParams {
  expectedWidth: number;
  expectedHeight: number;
  expectedBytesPerPixel: number;
  description?: string;
}

export function Image(params: ImageParams): XrpaStructType;
export function Image(name: string | undefined, params: ImageParams): XrpaStructType;
export function Image(arg0: string | ImageParams | undefined, arg1?: ImageParams): XrpaStructType {
  const [name, params] = extractNameAndValue(arg0, arg1);
  assert(params);

  const ret = setProperty(Struct(name, {
    width: Count(params.expectedWidth, "Image width"),
    height: Count(params.expectedHeight, "Image height"),
    format: Enum("ImageFormat", ["RGB8", "BGR8", "RGBA8", "Y8"]),
    encoding: Enum("ImageEncoding", ["Raw", "Jpeg"]),
    orientation: Enum("ImageOrientation", ["Oriented", "RotatedCW", "RotatedCCW", "Rotated180"]),
    gain: Scalar(1.0, "Image gain"),
    exposureDuration: HiResTimestamp("Image exposure duration, if available"),
    timestamp: HiResTimestamp("Capture timestamp, if available"),
    captureFrameRate: Scalar(0.0, "Capture frame rate, if available"),
    data: ByteArray(Math.ceil(params.expectedWidth * params.expectedHeight * params.expectedBytesPerPixel), "Image data"),
  }), IS_IMAGE_TYPE, true);

  if (params.description) {
    return Description(params.description, ret);
  }

  return ret;
}

////////////////////////////////////////////////////////////////////////////////
// Message data type

export interface XrpaMessageType extends XrpaDataType<"Message"> {
  name: string;
  fieldsStruct: XrpaStructType;
}

export function isMessageDataType(thing: unknown): thing is XrpaMessageType {
  return isXrpaDataType(thing) && thing.typename === "Message";
}

export function Message(fields?: XrpaStruct): XrpaMessageType;
export function Message(name: string | undefined, fields?: XrpaStruct): XrpaMessageType;
export function Message(arg0?: string | XrpaStruct | undefined, arg1?: XrpaStruct): XrpaMessageType {
  const [name, fields] = extractNameAndValue(arg0, arg1);

  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "Message",
    properties: {},
    name: name ?? "",
    fieldsStruct: resolveStruct(name, fields),
  });
}

export function MessageRate(expectedRatePerSecond: number, dataType: Thunk<XrpaMessageType>): XrpaMessageType;
export function MessageRate(expectedRatePerSecond: number, condition: PropertyCondition): XrpaTypeAugmenter<XrpaMessageType>;
export function MessageRate(expectedRatePerSecond: number, condition: PropertyCondition, dataType: Thunk<XrpaMessageType>): XrpaMessageType;
export function MessageRate(expectedRatePerSecond: number, arg0: Thunk<XrpaMessageType> | PropertyCondition, arg1?: Thunk<XrpaMessageType>): XrpaMessageType | XrpaTypeAugmenter<XrpaMessageType> {
  return setPropertiesOrCurry({ [MESSAGE_RATE]: expectedRatePerSecond }, arg0, arg1);
}


////////////////////////////////////////////////////////////////////////////////
// Interface data type

// TODO Get rid of this at some point, in favor of references to an array of collections.
// The only other thing interfaces provide is simply struct-extension, which is easy enough to do.
// For runtime, I think this gets a little weird for Unity and Unreal reference fields, but that should be solvable. Union types maybe?

export interface XrpaInterfaceType extends XrpaDataType<"Interface"> {
  name: string;
  fieldsStruct: XrpaStructType;
}

export function isInterfaceDataType(thing: unknown): thing is XrpaInterfaceType {
  return isXrpaDataType(thing) && thing.typename === "Interface";
}

export function Interface(name: string | undefined, fields?: XrpaStruct): XrpaInterfaceType {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "Interface",
    properties: {},
    name: name ?? "",
    fieldsStruct: resolveStruct(name, fields),
  });
}

////////////////////////////////////////////////////////////////////////////////
// Collection data type

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

export function isCollectionDataType(thing: unknown): thing is XrpaCollectionType {
  return isXrpaDataType(thing) && thing.typename === "Collection";
}

export function Collection(fields?: CollectionConfig): XrpaCollectionType;
export function Collection(name: string | undefined, fields?: CollectionConfig): XrpaCollectionType;
export function Collection(arg0?: string | CollectionConfig | undefined, arg1?: CollectionConfig): XrpaCollectionType {
  const [name, config] = extractNameAndValue(arg0, arg1);

  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "Collection",
    properties: {},
    name: name ?? "",
    fieldsStruct: resolveStruct(name, config?.fields),
    maxCount: config?.maxCount ?? 16,
    interfaceType: config?.interfaceType,
  });
}

export function hasFieldsStruct(dataType: XrpaDataType): dataType is XrpaCollectionType | XrpaInterfaceType | XrpaMessageType {
  return isCollectionDataType(dataType) || isInterfaceDataType(dataType) || isMessageDataType(dataType);
}

////////////////////////////////////////////////////////////////////////////////
// Reference data type

export interface XrpaReferenceType extends XrpaDataType<"Reference"> {
  targetType: XrpaInterfaceType | XrpaCollectionType;
}

export function isReferenceDataType(thing: unknown): thing is XrpaReferenceType {
  return isXrpaDataType(thing) && thing.typename === "Reference";
}

export function ReferenceTo(
  targetType: XrpaInterfaceType | XrpaCollectionType | XrpaProgramParam<XrpaCollectionType>,
  description?: string,
): XrpaReferenceType {
  if (isXrpaProgramParam(targetType)) {
    targetType = targetType.dataType;
  }
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: "Reference",
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
    targetType,
  });
}

////////////////////////////////////////////////////////////////////////////////
// Type tree visitor w/ modification

export interface TypeTreeVisitor {
  allTypes?: (dataType: XrpaDataType, fieldPath: string[], parentProperties: BindingProperties, isSubStruct: boolean) => XrpaDataType;
  preRecursion?: (dataType: XrpaNamedDataType, fieldPath: string[], isSubStruct: boolean) => XrpaNamedDataType;
  postRecursion?: (dataType: XrpaNamedDataType, fieldPath: string[], isSubStruct: boolean) => XrpaNamedDataType;
}

export function walkTypeTree<T extends XrpaDataType>(
  visitor: TypeTreeVisitor,
  fieldPath: string[],
  dataType: T,
  parentProperties: BindingProperties,
  isSubStruct = false,
): T {
  if (visitor.allTypes) {
    dataType = visitor.allTypes(dataType, fieldPath, parentProperties, isSubStruct) as T & XrpaNamedDataType;
  }

  // stop recursion at builtin (non-named) types
  if (!isNamedDataType(dataType)) {
    return dataType;
  }

  if (visitor.preRecursion) {
    dataType = visitor.preRecursion(dataType, fieldPath, isSubStruct) as T & XrpaNamedDataType;
  }

  // recurse into struct fields
  if (isStructDataType(dataType)) {
    const newFields: Record<string, XrpaDataType> = {};
    for (const key in dataType.fields) {
      newFields[key] = walkTypeTree(visitor, [...fieldPath, key], dataType.fields[key], dataType.properties);
    }
    dataType = updateImmutable<T & XrpaNamedDataType>(dataType, ["fields"], newFields);
  }

  if (isCollectionDataType(dataType)) {
    if (dataType.interfaceType) {
      dataType = replaceImmutable<T & XrpaNamedDataType>(dataType, ["interfaceType"], walkTypeTree(visitor, fieldPath, dataType.interfaceType, dataType.properties, true));
    }
  }

  // recurse into substructs
  if (hasFieldsStruct(dataType)) {
    const newFieldsStruct = walkTypeTree(visitor, [...fieldPath, dataType.name], dataType.fieldsStruct, dataType.properties, true);
    dataType = replaceImmutable<T & XrpaNamedDataType>(dataType, ["fieldsStruct"], newFieldsStruct);
  }

  if (visitor.postRecursion) {
    dataType = visitor.postRecursion(dataType as T & XrpaNamedDataType, fieldPath, isSubStruct) as T & XrpaNamedDataType;
  }

  return dataType;
}

const PropertyPropagator: TypeTreeVisitor = {
  allTypes(dataType: XrpaDataType, _fieldPath: string[], parentProperties: BindingProperties): XrpaDataType {
    return replaceImmutable(dataType, ["properties"], updateImmutable(getInheritableProperties(parentProperties), dataType.properties));
  }
};

export function propagateInheritableProperties(dataType: XrpaDataType, parentProperties: BindingProperties): XrpaDataType {
  return walkTypeTree(PropertyPropagator, [], dataType, parentProperties);
}
