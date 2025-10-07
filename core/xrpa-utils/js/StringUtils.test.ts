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


import { deoverlapStringLines, normalizeIdentifier } from "./StringUtils";

test("normalizeIdentifier", () => {
  expect(normalizeIdentifier("")).toStrictEqual([]);
  expect(normalizeIdentifier("myVar")).toStrictEqual(["my", "var"]);
  expect(normalizeIdentifier("myFirstID")).toStrictEqual(["my", "first", "id"]);
  expect(normalizeIdentifier("foo_bar")).toStrictEqual(["foo", "bar"]);
  expect(normalizeIdentifier("set_FooBar")).toStrictEqual(["set", "foo", "bar"]);
  expect(normalizeIdentifier("_id_one")).toStrictEqual(["id", "one"]);
});

test("deoverlapStringLines", () => {
  expect(deoverlapStringLines("", "")).toStrictEqual("");
  expect(deoverlapStringLines("a\nb\nc", "a\nb\nc\n")).toStrictEqual("a\nb\nc\n");
  expect(deoverlapStringLines("a\nb\nc\n", "a\nb\nc\n")).toStrictEqual("a\nb\nc\n");
  expect(deoverlapStringLines("a\nb\nc\n", "a\nb\nc\nd\n")).toStrictEqual("a\nb\nc\nd\n");
  expect(deoverlapStringLines("a\nb\nc\n", "b\nc\nd\n")).toStrictEqual("a\nb\nc\nd\n");
  expect(deoverlapStringLines("a\nb\nc\n", "c\nd\n")).toStrictEqual("a\nb\nc\nd\n");
  expect(deoverlapStringLines("a\nb\nc\n", "d\n")).toStrictEqual("a\nb\nc\nd\n");
});
