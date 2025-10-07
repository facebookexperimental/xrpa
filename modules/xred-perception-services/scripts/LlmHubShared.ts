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

import path from "path";
import os from "os";

export const apidir = path.join(__dirname, "..", "LlmHub");

// Choose environment file based on platform
export function getEnvironmentFile(): string {
  const platform = os.platform();
  if (platform === "win32") {
    return path.join(apidir, "environment-windows.yaml");
  } else {
    return path.join(apidir, "environment.yaml");
  }
}
