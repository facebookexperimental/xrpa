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


/* eslint-disable @typescript-eslint/no-explicit-any */

export async function sleep(waitTimeInMilliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, waitTimeInMilliseconds));
}

export async function withTimeout<T>(p: Promise<T>, timeoutInMilliseconds: number, errorString = 'Timeout reached', abortFlag?: Future<boolean>): Promise<T> {
  const promises = [
    p,
    new Promise<T>((_, reject) => setTimeout(() => {
      reject(new Error(errorString));
    }, timeoutInMilliseconds)),
  ];

  if (abortFlag) {
    // eslint-disable-next-line no-async-promise-executor
    promises.push(new Promise<T>(async (_, reject) => {
      try {
        const aborted = await abortFlag.promise;
        if (aborted) {
          reject('Operation aborted');
        }
      } catch (e) {
        reject('Operation aborted: ' + e);
      }
    }));
  }

  return Promise.race(promises);
}

export async function retryAsyncFunction<T> (func: () => Promise<T>, retryCount: number, delayMS: number) {
  let retries = 0;
  do {
    try {
      return await func();
    } catch (e) {
      if (retries >= retryCount) {
        throw e;
      } else {
        console.log(`Error processing task: ${e} on attempt ${retries}, retrying`);
        retries++;
        // sleep for delayMS ms
        await new Promise(resolve => setTimeout(resolve, delayMS));
      }
    }
  // eslint-disable-next-line no-constant-condition
  } while (true);
}

export class Future<T> {
  private error: any;
  private resolve: (value: T) => void = undefined as any;
  private reject: (error: any) => void = undefined as any;

  public promise: Promise<T>;

  constructor(private value?: T) {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  get(): T {
    if (this.error) {
      throw this.error;
    }
    if (this.value === undefined) {
      throw new Error('Future value not set');
    }
    return this.value;
  }

  set(value: T) {
    this.value = value;
    this.resolve(value);
  }

  setError(error: any) {
    this.error = error;
    this.reject(error);
  }
}
