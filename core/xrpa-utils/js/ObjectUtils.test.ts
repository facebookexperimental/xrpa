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


import { augment, safeDeepFreeze } from "./ObjectUtils";

test("safeDeepFreeze", () => {
  const obj = safeDeepFreeze({
    a: 1,
    b: {
      c: 2,
      d: [3, 4],
    },
    toString: () => "toString",
  });

  expect(obj.a).toBe(1);
  expect(obj.b.c).toBe(2);
  expect(obj.b.d[0]).toBe(3);
  expect(obj.b.d[1]).toBe(4);
  expect(obj.toString()).toBe("toString");

  expect(() => {
    obj.a = 2;
  }).toThrow();

  expect(() => {
    obj.b.c = 3;
  }).toThrow();

  expect(() => {
    obj.b.d[0] = 4;
  }).toThrow();
});


test("augment", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = augment({
    a: 1,
    b: {
      c: 2,
      d: [3, 4],
    },
    toString: () => "toString",
  }, {
    e: 5,
  });

  expect(obj.a).toBe(1);
  expect(obj.b.c).toBe(2);
  expect(obj.b.d[0]).toBe(3);
  expect(obj.b.d[1]).toBe(4);
  expect(obj.toString()).toBe("toString");
  expect(obj.e).toBe(5);

  expect(() => {
    obj.a = 2;
  }).toThrow();

  expect(() => {
    obj.b.c = 3;
  }).toThrow();

  expect(() => {
    obj.b.d[0] = 4;
  }).toThrow();

  expect(() => {
    obj.e = 6;
  }).toThrow();
});
