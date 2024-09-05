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
export declare const EXCLUDE_NAMESPACE = "EXCLUDE_NAMESPACE";
export declare function getRuntimeSrcPath(target: string): string;
export interface IncludeAggregator {
    addFile(params: {
        filename?: string;
        namespace?: string;
        typename?: string;
    }): void;
    getIncludes(excludeFile?: string): string[];
    getNamespaceImports(excludeNamespace?: string): string[];
}
export type EmptyObjectType = Record<string, never>;
export declare function collapse<T>(values: T[] | T[][]): T[];
export declare function collapseAndMap<T, U>(values: T[] | T[][], mapFunc: (val: T) => U): U[];
export declare function mapAndCollapse<T, U>(values: T[], mapFunc: (val: T) => U[]): U[];
export declare function mapAndCollapse<T, U, V0>(values: T[], mapFunc: (val: T, arg0: V0) => U[], arg0: V0): U[];
export declare function mapAndCollapse<T, U, V0, V1>(values: T[], mapFunc: (val: T, arg0: V0, arg1: V1) => U[], arg0: V0, arg1: V1): U[];
export declare function augment<P, O>(obj: O, props: Omit<P, keyof O>): P;
export declare function augmentInPlace<P, O>(obj: O, props: Omit<P, keyof O>): P;
export declare function safeDeepFreeze<T>(o: T): T;
export declare function indent(count: number, lines: string | string[] | string[][]): string[];
export declare function indentMatch(str1: string, str2: string): boolean;
export declare function trimTrailingEmptyLines(lines: string[]): string[];
export declare function removeSuperfluousEmptyLines(lines: string[]): string[];
export declare function upperFirst(str: string): string;
export declare function lowerFirst(str: string): string;
export declare function appendAligned(str: string, suffix: string, alignment: number): string;
export declare function clone<T>(obj: T): T;
export declare class HashValue {
    readonly values: string[];
    constructor(str: string | Buffer);
}
export declare function hashCheck(a: string | Buffer, b: string | Buffer): boolean;
export declare function objectIsEmpty(obj: Record<string, unknown>): boolean;
export declare function arrayZip<T1, T2>(a: T1[], b: T2[]): [T1, T2][];
export declare function recordZip<T>(a: string[], b: T[]): Record<string, T>;
export declare function absurd(v: never): void;
export declare function throwBadValue(val: unknown, expected: string): void;
export declare function assertIsKeyOf(val: unknown, enumOrLookup: Record<string, unknown>): asserts val is string;
export declare function filterToString(val: unknown): string | undefined;
export declare function filterToStringArray(val: unknown, minLength?: number): string[] | undefined;
export declare function filterToStringPairArray(val: unknown, minLength?: number): [string, string][] | undefined;
export declare function filterToNumber(val: unknown): number | undefined;
export declare function filterToNumberArray(val: unknown, minLength?: number): number[] | undefined;
export declare function isExcluded(key: string, includeList: string[] | null | undefined, excludeList: string[] | null | undefined): boolean;
export declare function pushUnique<T>(arr: T[], val: T): number;
export declare function runProcess(params: {
    filename: string;
    args?: string[];
    cwd?: string;
    onLineReceived?: (line: string) => void;
}): Promise<string>;
export declare function buckRun(mode: string, target: string): Promise<void>;
export declare function buckRunPackage(mode: string, target: string, standaloneExeFilename: string): Promise<string>;
export declare function buckRootDir(): Promise<string>;
export declare function buckBuild(params: {
    mode: string;
    target: string;
    dstPath: string;
}): Promise<void>;
export declare function removeLastTrailingComma(strs: string[]): string[];
export declare function genCommentLinesWithCommentMarker(commentMarker: string, str?: string): string[];
export declare function nsQualifyWithSeparator(nsSep: string, qualifiedName: string, inNamespace: string): string;
export declare function nsJoinWithSeparator(nsSep: string, names: string[]): string;
export declare function nsExtractWithSeparator(nsSep: string, qualifiedName: string, nonNamespacePartCount?: number): string;
export declare function isDirectory(pathname: string): Promise<boolean>;
export declare function recursiveDirScan(fullpath: string, filenames: string[]): Promise<void>;
export type Thunk<T> = T | (() => T);
export type AsyncThunk<T> = Thunk<T> | Promise<T> | (() => Promise<T>);
export declare function resolveThunk<T>(value: Thunk<T>): T;
export declare function chainThunk<IN, OUT>(value: Thunk<IN>, next: (value: IN) => OUT): Thunk<OUT>;
export declare function resolveAsyncThunk<T>(value: AsyncThunk<T>): Promise<T>;
export declare function chainAsyncThunk<IN, OUT>(value: AsyncThunk<IN>, next: (value: IN) => OUT): AsyncThunk<OUT>;

