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


export declare function collapse<T>(values: T[] | T[][]): T[];
export declare function collapseAndMap<T, U>(values: T[] | T[][], mapFunc: (val: T) => U): U[];
export declare function mapAndCollapse<T, U>(values: T[], mapFunc: (val: T) => U[]): U[];
export declare function mapAndCollapse<T, U, V0>(values: T[], mapFunc: (val: T, arg0: V0) => U[], arg0: V0): U[];
export declare function mapAndCollapse<T, U, V0, V1>(values: T[], mapFunc: (val: T, arg0: V0, arg1: V1) => U[], arg0: V0, arg1: V1): U[];
export declare function arrayZip<T1, T2>(a: T1[], b: T2[]): [T1, T2][];
export declare function recordZip<T>(a: string[], b: T[]): Record<string, T>;
export declare function pushUnique<T>(arr: T[], val: T): number;

