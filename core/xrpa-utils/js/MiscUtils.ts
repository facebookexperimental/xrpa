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


export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];
export type StringValued<T> = KeysMatching<T, string>;
export type BooleanValued<T> = KeysMatching<T, boolean>;
export type StringKey<T> = string & keyof T;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function absurd(v: never) {
  // this function intentionally left blank
}

export function throwBadValue(val: unknown, expected: string) {
  throw new Error(`expected ${expected}, found ${val} (${typeof val})`);
}

function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== "string") {
    throwBadValue(val, "string type");
  }
}

export function assertIsKeyOf(val: unknown, enumOrLookup: Record<string, unknown>): asserts val is string {
  assertIsString(val);
  const keys = Object.keys(enumOrLookup);
  if (!keys.includes(val)) {
    throwBadValue(val, keys.join("|"));
  }
}

export function filterToString(val: unknown): string | undefined {
  return typeof val === "string" ? val : undefined;
}

export function filterToStringArray(val: unknown, minLength = 0): string[] | undefined {
  if (!Array.isArray(val)) {
    return undefined;
  }
  if (val.length < minLength) {
    return undefined;
  }
  for (const v of val) {
    if (typeof v !== "string") {
      return undefined;
    }
  }
  return val;
}

export function filterToStringPairArray(val: unknown, minLength = 0): [string, string][] | undefined {
  if (!Array.isArray(val)) {
    return undefined;
  }
  if (val.length < minLength) {
    return undefined;
  }
  const ret: [string, string][] = [];
  for (const v of val) {
    const tuple = filterToStringArray(v, 2) as [string, string] | undefined;
    if (tuple) {
      ret.push(tuple);
    }
  }
  return ret;
}

export function filterToNumber(val: unknown): number | undefined {
  return typeof val === "number" ? val : undefined;
}

export function filterToNumberArray(val: unknown, minLength = 0): number[] | undefined {
  if (!Array.isArray(val)) {
    return undefined;
  }
  if (val.length < minLength) {
    return undefined;
  }
  for (const v of val) {
    if (typeof v !== "number") {
      return undefined;
    }
  }
  return val;
}

export function isExcluded(
  key: string,
  includeList: string[] | null | undefined,
  excludeList: string[] | null | undefined,
): boolean {
  if (includeList && !includeList.includes(key)) {
    return true;
  }
  if (excludeList && excludeList.includes(key)) {
    return true
  }
  return false;
}
