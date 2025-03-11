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


export type KeysMatching<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];
export type StringValued<T> = KeysMatching<T, string>;
export type BooleanValued<T> = KeysMatching<T, boolean>;
export type StringKey<T> = string & keyof T;
export declare function absurd(v: never): void;
export declare function throwBadValue(val: unknown, expected: string): void;
export declare function assertIsKeyOf(val: unknown, enumOrLookup: Record<string, unknown>): asserts val is string;
export declare function filterToString(val: unknown): string | undefined;
export declare function filterToStringArray(val: unknown, minLength?: number): string[] | undefined;
export declare function filterToStringPairArray(val: unknown, minLength?: number): [string, string][] | undefined;
export declare function filterToNumber(val: unknown): number | undefined;
export declare function filterToNumberArray(val: unknown, minLength?: number): number[] | undefined;
export declare function isExcluded(key: string, includeList: string[] | null | undefined, excludeList: string[] | null | undefined): boolean;

