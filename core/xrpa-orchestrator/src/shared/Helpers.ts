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


import fs from "fs-extra";
import path from "path";

let runtimeSrcRootPath = path.join(__dirname, "../runtime");
if (!fs.pathExistsSync(runtimeSrcRootPath)) {
  runtimeSrcRootPath = path.join(__dirname, "../../../runtime");
}

export function getRuntimeSrcPath(target: string) {
  if (target === "python") {
    return path.join(runtimeSrcRootPath, target, "xrpa_runtime");
  }
  return path.join(runtimeSrcRootPath, target, "xrpa-runtime");
}

export interface IncludeAggregator {
  addFile(params: {
    filename?: string;
    namespace?: string;
    typename?: string;
  }): void;
  getIncludes(excludeFile?: string): string[];
  getNamespaceImports(excludeNamespace?: string): string[];
}
