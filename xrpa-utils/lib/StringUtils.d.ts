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


export declare function indent(count: number, lines: string | string[] | string[][]): string[];
export declare function indentMatch(str1: string, str2: string): boolean;
export declare function trimTrailingEmptyLines(lines: string[]): string[];
export declare function removeSuperfluousEmptyLines(lines: string[]): string[];
export declare function deoverlapStringLines(str1: string, str2: string, maxCompareLines?: number): string;
export declare function upperFirst(str: string): string;
export declare function lowerFirst(str: string): string;
export declare function appendAligned(str: string, suffix: string, alignment: number): string;
export declare function removeLastTrailingComma(strs: string[]): string[];
export declare function genCommentLinesWithCommentMarker(commentMarker: string, str?: string): string[];
export declare function normalizeIdentifier(name: string): string[];

