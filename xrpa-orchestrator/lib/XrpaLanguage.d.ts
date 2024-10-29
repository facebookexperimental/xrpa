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
export type BindingProperties = Record<string, unknown>;
export interface WithBindingProperties {
    properties: BindingProperties;
}
export declare function InheritedProperty(property: string): string;
export declare function isInheritedProperty(property: string): boolean;
export declare function getInheritableProperties(properties: BindingProperties): BindingProperties;
export interface PropertyCondition {
    propertyToCheck: string;
    expectedValue: unknown;
}
export declare const TRUTHY = "xrpa.propertySymbol.truthy";
export declare const FALSEY = "xrpa.propertySymbol.falsey";
export declare function evalProperty<T>(properties: BindingProperties, propertyName: string): T | undefined;
export declare function setProperty<T extends WithBindingProperties>(obj: T, propertyName: string, value: unknown, condition?: PropertyCondition): T;
export declare function setProperties<T extends WithBindingProperties>(obj: T, propertiesToSet: BindingProperties, condition?: PropertyCondition): T;
export declare function setPropertiesOrCurry<T extends XrpaDataType>(propertiesToSet: BindingProperties, arg0: Thunk<T> | PropertyCondition, arg1?: Thunk<T>): T | XrpaTypeAugmenter<T>;
export interface XrpaDataType<TypeName extends string = string> {
    __XrpaDataType: true;
    typename: TypeName;
    properties: Record<string, unknown>;
}
export declare function isXrpaDataType(thing: unknown): thing is XrpaDataType;
export type XrpaTypeAugmenter<T extends XrpaDataType> = (data: Thunk<T>) => T;
export declare function ChainAugments<T extends XrpaDataType>(...augmenters: XrpaTypeAugmenter<T>[]): XrpaTypeAugmenter<T>;
export declare function Augment<T extends XrpaDataType>(dataType: Thunk<T>, ...augmenters: XrpaTypeAugmenter<T>[]): T;
export type XrpaNamedDataType<T extends XrpaDataType = XrpaDataType> = T & {
    name: string;
};
export declare function isNamedDataType(thing: unknown): thing is XrpaNamedDataType;
export declare function NameType<T extends XrpaNamedDataType>(name: string | undefined, dataType: Thunk<T>): T;
export declare function pushContext(ctx: unknown): void;
export declare function getCurrentContext(): unknown;
export declare function getContext<T>(filter: (ctx: unknown) => ctx is T, errMessage: string): T;
export declare function popContext(ctx: unknown): void;
export declare function runInContext<T, C>(ctx: C, callback: (ctx: C) => T): T;

