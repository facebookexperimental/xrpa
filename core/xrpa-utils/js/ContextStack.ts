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


import assert from "assert";

function getContextStack(): unknown[] {
  // the context stack is stored in a global variable so it can be accessed across copies of xrpa-orchestrator
  const globalStore = (global as Record<string, unknown>)
  globalStore["__XrpaContextStack"] = globalStore["__XrpaContextStack"] || [];
  return globalStore["__XrpaContextStack"] as unknown[];
}

export function pushContext(ctx: unknown): void {
  getContextStack().push(ctx);
}

export function getCurrentContext(): unknown {
  const contextStack = getContextStack();
  assert(contextStack.length > 0, "context stack is empty");
  return contextStack[contextStack.length - 1];
}

export function getContext<T>(filter: (ctx: unknown) => ctx is T, errMessage: string): T {
  const contextStack = getContextStack();
  for (let i = contextStack.length - 1; i >= 0; --i) {
    const ctx = contextStack[i];
    if (filter(ctx)) {
      return ctx;
    }
  }
  assert(false, errMessage);
}

export function popContext(ctx: unknown): void {
  const contextStack = getContextStack();
  assert(contextStack.length > 0, "context stack is empty");
  assert(contextStack[contextStack.length - 1] === ctx, "context stack is not empty");
  contextStack.pop();
}

export function runInContext<T, C>(ctx: C, callback: (ctx: C) => T, prelude?: (ctx: C) => void): T {
  pushContext(ctx);
  try {
    if (prelude) {
      prelude(ctx);
    }
    return callback(ctx);
  } finally {
    popContext(ctx);
  }
}
