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


export declare function pushContext(ctx: unknown): void;
export declare function getCurrentContext(): unknown;
export declare function getContext<T>(filter: (ctx: unknown) => ctx is T, errMessage: string): T;
export declare function popContext(ctx: unknown): void;
export declare function runInContext<T, C>(ctx: C, callback: (ctx: C) => T, prelude?: (ctx: C) => void): T;

