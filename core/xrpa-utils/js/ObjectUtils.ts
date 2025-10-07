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


import { isFrozen, shallowCloneMutable } from "simply-immutable";

export type EmptyObjectType = Record<string, never>;

export function augment<P, O>(obj: O, props: Omit<P, keyof O>): P {
  const ret = shallowCloneMutable(obj as Record<string, unknown>);
  for (const key in props) {
    ret[key] = props[key as keyof typeof props];
  }
  return safeDeepFreeze(ret) as P;
}

export function augmentInPlace<P, O>(obj: O, props: Omit<P, keyof O>): P {
  for (const key in props) {
    (obj as Record<string, unknown>)[key] = (props as Record<string, unknown>)[key];
  }
  return obj as unknown as P;
}

export function safeDeepFreeze<T>(o: T): T {
  if (Array.isArray(o)) {
    if (!isFrozen(o)) {
      Object.freeze(o);
      for (let i = 0; i < o.length; ++i) {
        safeDeepFreeze(o[i]);
      }
    }
  } else if (typeof o === "object" && o !== null) {
    if (!isFrozen(o)) {
      Object.freeze(o);
      for (const key in o) {
        safeDeepFreeze(o[key]);
      }
    }
  }
  return o;
}

export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function objectIsEmpty(obj: Record<string, unknown>) {
  for (const key in obj) {
    return false;
  }
  return true;
}
