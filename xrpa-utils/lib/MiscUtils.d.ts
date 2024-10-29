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


export declare function absurd(v: never): void;
export declare function throwBadValue(val: unknown, expected: string): void;
export declare function assertIsKeyOf(val: unknown, enumOrLookup: Record<string, unknown>): asserts val is string;
export declare function filterToString(val: unknown): string | undefined;
export declare function filterToStringArray(val: unknown, minLength?: number): string[] | undefined;
export declare function filterToStringPairArray(val: unknown, minLength?: number): [string, string][] | undefined;
export declare function filterToNumber(val: unknown): number | undefined;
export declare function filterToNumberArray(val: unknown, minLength?: number): number[] | undefined;
export declare function isExcluded(key: string, includeList: string[] | null | undefined, excludeList: string[] | null | undefined): boolean;
export type Thunk<T> = T | (() => T);
export type AsyncThunk<T> = Thunk<T> | Promise<T> | (() => Promise<T>);
export declare function resolveThunk<T>(value: Thunk<T>): T;
export declare function chainThunk<IN, OUT>(value: Thunk<IN>, next: (value: IN) => OUT): Thunk<OUT>;
export declare function resolveAsyncThunk<T>(value: AsyncThunk<T>): Promise<T>;
export declare function chainAsyncThunk<IN, OUT>(value: AsyncThunk<IN>, next: (value: IN) => OUT): AsyncThunk<OUT>;

