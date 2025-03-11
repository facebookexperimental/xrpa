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

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Future = exports.retryAsyncFunction = exports.withTimeout = exports.sleep = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
async function sleep(waitTimeInSeconds) {
    return new Promise(resolve => setTimeout(resolve, waitTimeInSeconds));
}
exports.sleep = sleep;
async function withTimeout(p, timeoutInSeconds, errorString = 'Timeout reached', abortFlag) {
    const promises = [
        p,
        new Promise((_, reject) => setTimeout(() => {
            reject(new Error(errorString));
        }, timeoutInSeconds)),
    ];
    if (abortFlag) {
        // eslint-disable-next-line no-async-promise-executor
        promises.push(new Promise(async (_, reject) => {
            try {
                const aborted = await abortFlag.promise;
                if (aborted) {
                    reject('Operation aborted');
                }
            }
            catch (e) {
                reject('Operation aborted: ' + e);
            }
        }));
    }
    return Promise.race(promises);
}
exports.withTimeout = withTimeout;
async function retryAsyncFunction(func, retryCount, delayMS) {
    let retries = 0;
    do {
        try {
            return await func();
        }
        catch (e) {
            if (retries >= retryCount) {
                throw e;
            }
            else {
                console.log(`Error processing task: ${e} on attempt ${retries}, retrying`);
                retries++;
                // sleep for delayMS ms
                await new Promise(resolve => setTimeout(resolve, delayMS));
            }
        }
        // eslint-disable-next-line no-constant-condition
    } while (true);
}
exports.retryAsyncFunction = retryAsyncFunction;
class Future {
    constructor(value) {
        this.value = value;
        this.resolve = undefined;
        this.reject = undefined;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    get() {
        if (this.error) {
            throw this.error;
        }
        if (this.value === undefined) {
            throw new Error('Future value not set');
        }
        return this.value;
    }
    set(value) {
        this.value = value;
        this.resolve(value);
    }
    setError(error) {
        this.error = error;
        this.reject(error);
    }
}
exports.Future = Future;
//# sourceMappingURL=AsyncUtils.js.map
