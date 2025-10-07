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


import { Thunk, resolveThunk } from "@xrpa/xrpa-utils";
import { arrayPushImmutable, replaceImmutable } from "simply-immutable";

////////////////////////////////////////////////////////////////////////////////
// Binding properties

export type BindingProperties = Record<string, unknown>;

export interface WithBindingProperties {
  properties: BindingProperties;
}

const INHERIT_TAG = "<inherit>";

export function InheritedProperty(property: string): string {
  return `${property}${INHERIT_TAG}`;
}

export function isInheritedProperty(property: string): boolean {
  return property.endsWith(INHERIT_TAG);
}

export function getInheritableProperties(properties: BindingProperties): BindingProperties {
  const ret: BindingProperties = {};
  for (const key in properties) {
    if (key.endsWith(INHERIT_TAG)) {
      ret[key] = properties[key];
    }
  }
  return ret;
}

export interface PropertyCondition {
  propertyToCheck: string;
  expectedValue: unknown;
}

export const TRUTHY = "xrpa.propertySymbol.truthy";
export const FALSEY = "xrpa.propertySymbol.falsey";

interface ConditionalPropertyValue {
  __isConditionalPropertyValue: true;
  conditionals: Array<PropertyCondition & { value: unknown }>;
  defaultValue: unknown;
}

function isConditionalPropertyValue(thing: unknown): thing is ConditionalPropertyValue {
  return thing != null && (thing as ConditionalPropertyValue).__isConditionalPropertyValue === true;
}

export function evalProperty<T>(properties: BindingProperties, propertyName: string): T|undefined {
  const propValue = properties[propertyName];

  if (!isConditionalPropertyValue(propValue)) {
    return propValue as T|undefined;
  }

  for (const condition of propValue.conditionals) {
    const propertyToCheck = properties[condition.propertyToCheck];
    if (condition.expectedValue === TRUTHY && propertyToCheck) {
      return condition.value as T|undefined;
    } else if (condition.expectedValue === FALSEY && !propertyToCheck) {
      return condition.value as T|undefined;
    } else if (propertyToCheck === condition.expectedValue) {
      return condition.value as T|undefined;
    }
  }
  return propValue.defaultValue as T|undefined;
}

export function setProperty<T extends WithBindingProperties>(
  obj: T,
  propertyName: string,
  value: unknown,
  condition?: PropertyCondition,
): T {
  if (!condition) {
    return replaceImmutable<T>(obj, ["properties", propertyName], value);
  }

  if (!isConditionalPropertyValue(obj.properties[propertyName])) {
    obj = replaceImmutable<T>(obj, ["properties", propertyName], {
      __isConditionalPropertyValue: true,
      conditionals: [],
      defaultValue: obj.properties[propertyName],
    });
  }

  return arrayPushImmutable<T>(obj, ["properties", propertyName, "conditionals"], {
    ...condition,
    value,
  });
}

export function setProperties<T extends WithBindingProperties>(
  obj: T,
  propertiesToSet: BindingProperties,
  condition?: PropertyCondition,
): T {
  for (const key in propertiesToSet) {
    obj = setProperty(obj, key, propertiesToSet[key], condition);
  }
  return obj;
}

export function setPropertiesOrCurry<T extends XrpaDataType>(propertiesToSet: BindingProperties, arg0: Thunk<T>|PropertyCondition, arg1?: Thunk<T>): T|XrpaTypeAugmenter<T> {
  arg0 = resolveThunk(arg0);
  if (isXrpaDataType(arg0)) {
    return setProperties(arg0, propertiesToSet);
  }
  if (!arg1) {
    const condition = arg0;
    return (dataType: Thunk<T>) => setProperties(resolveThunk(dataType), propertiesToSet, condition);
  }
  return setProperties(resolveThunk(arg1), propertiesToSet, arg0);
}

////////////////////////////////////////////////////////////////////////////////
// Base data type

// notes:
// - data types are POD instead of classes so they can be cloned easily and to
//   avoid problems stemming from multiple versions of Xrpa being loaded at once
// - the __XrpaDataType property is used in lieu of instanceof to identify data types
// - this system is designed to be augmented via plugins, so no central place is able
//   to define the contents of the properties object; these types and functions are
//   structured to facilitate that

export interface XrpaDataType<TypeName extends string = string> {
  __XrpaDataType: true;
  typename: TypeName;
  properties: Record<string, unknown>;
}

export function isXrpaDataType(thing: unknown): thing is XrpaDataType {
  return thing != null && (thing as XrpaDataType).__XrpaDataType === true;
}

////////////////////////////////////////////////////////////////////////////////
// Augmentation functions

export type XrpaTypeAugmenter<T extends XrpaDataType> = (data: Thunk<T>) => T;

export function ChainAugments<T extends XrpaDataType>(...augmenters: XrpaTypeAugmenter<T>[]): XrpaTypeAugmenter<T> {
  return (data: Thunk<T>) => {
    for (const augmenter of augmenters) {
      data = augmenter(data);
    }
    return resolveThunk(data);
  };
}

export function Augment<T extends XrpaDataType>(dataType: Thunk<T>, ...augmenters: XrpaTypeAugmenter<T>[]): T {
  return ChainAugments(...augmenters)(dataType);
}

export type XrpaNamedDataType<T extends XrpaDataType = XrpaDataType> = T & { name: string };

export function isNamedDataType(thing: unknown): thing is XrpaNamedDataType {
  return isXrpaDataType(thing) && typeof (thing as XrpaNamedDataType).name === "string";
}

export function NameType<T extends XrpaNamedDataType>(name: string|undefined, dataType: Thunk<T>): T {
  dataType = resolveThunk(dataType);
  if (name === undefined) {
    return dataType;
  }
  return replaceImmutable<T>(dataType, ["name"], name);
}
