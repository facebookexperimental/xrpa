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


import { EXCLUDE_NAMESPACE, nsQualifyWithSeparator } from "./NamespaceUtils";

test("nsQualifyWithSeparator", () => {
  expect(nsQualifyWithSeparator("::", "Eigen::Vector3f", "")).toStrictEqual("Eigen::Vector3f");
  expect(nsQualifyWithSeparator("::", "Eigen::Vector3f", "TestDataStore")).toStrictEqual("Eigen::Vector3f");
  expect(nsQualifyWithSeparator("::", "Eigen::Vector3f", "Eigen")).toStrictEqual("Vector3f");
  expect(nsQualifyWithSeparator("::", "Eigen::Foo::Vector3f", "Eigen")).toStrictEqual("Foo::Vector3f");
  expect(nsQualifyWithSeparator("::", "Eigen::Vector3f", EXCLUDE_NAMESPACE)).toStrictEqual("Vector3f");
});
