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


export function collapse<T>(values: T[] | T[][]): T[] {
  const ret: T[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      ret.push(...value);
    } else {
      ret.push(value);
    }
  }
  return ret;
}

export function collapseAndMap<T, U>(values: T[] | T[][], mapFunc: (val: T) => U): U[] {
  return collapse<T>(values).map(mapFunc);
}

export function mapAndCollapse<T, U>(values: T[], mapFunc: (val: T) => U[]): U[];
export function mapAndCollapse<T, U, V0>(values: T[], mapFunc: (val: T, arg0: V0) => U[], arg0: V0): U[];
export function mapAndCollapse<T, U, V0, V1>(values: T[], mapFunc: (val: T, arg0: V0, arg1: V1) => U[], arg0: V0, arg1: V1): U[];
export function mapAndCollapse(values: unknown[], mapFunc: (...args: unknown[]) => unknown, ...args: unknown[]): unknown[] {
  return collapse(values.map(v => mapFunc(v, ...args)));
}

export function arrayZip<T1, T2>(a: T1[], b: T2[]): [T1, T2][] {
  if (a.length !== b.length) {
    throw new Error("arrayZip length mismatch, got " + a.length + " vs " + b.length);
  }
  const ret: [T1, T2][] = [];
  for (let i = 0; i < a.length; i++) {
    ret.push([a[i], b[i]]);
  }
  return ret;
}

export function recordZip<T>(a: string[], b: T[]): Record<string, T> {
  if (a.length !== b.length) {
    throw new Error("recordZip length mismatch, got " + a.length + " vs " + b.length);
  }
  const ret: Record<string, T> = {};
  for (let i = 0; i < a.length; i++) {
    ret[a[i]] = b[i];
  }
  return ret;
}

export function pushUnique<T>(arr: T[], val: T): number {
  const idx = arr.indexOf(val);
  if (idx >= 0) {
    return idx;
  }
  return arr.push(val);
}
