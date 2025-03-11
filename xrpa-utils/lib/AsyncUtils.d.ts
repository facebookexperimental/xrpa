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


export declare function sleep(waitTimeInSeconds: number): Promise<unknown>;
export declare function withTimeout<T>(p: Promise<T>, timeoutInSeconds: number, errorString?: string, abortFlag?: Future<boolean>): Promise<T>;
export declare function retryAsyncFunction<T>(func: () => Promise<T>, retryCount: number, delayMS: number): Promise<T>;
export declare class Future<T> {
    private value?;
    private error;
    private resolve;
    private reject;
    promise: Promise<T>;
    constructor(value?: T | undefined);
    get(): T;
    set(value: T): void;
    setError(error: any): void;
}

