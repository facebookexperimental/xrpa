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

import os from "os";
import path from "path";
import process from "process";
import { buildCondaApplication } from "@xrpa/xrpa-orchestrator";
import { ImageSelectorStandalone } from "./ImageSelectorStandalone";

const platform = os.platform();
const isWindows = platform === "win32";

const BIN_DIR = path.join(__dirname, "..", "bin");

function getPlatformConfig() {
  return {
    environmentFile: isWindows
      ? path.join(__dirname, "..", "LlmHub", "environment-windows.yaml")
      : path.join(__dirname, "..", "LlmHub", "environment.yaml"),
    outputExecutable: isWindows
      ? path.join(BIN_DIR, "LlmHub.exe")
      : path.join(BIN_DIR, "LlmHub"),
  };
}

async function releaseBuild() {
  const config = getPlatformConfig();

  await ImageSelectorStandalone.buckBuildRelease(BIN_DIR);

  await buildCondaApplication(
    config.environmentFile,
    path.join(__dirname, "..", "LlmHub", "main.py"),
    config.outputExecutable,
    {
      collectAll: ["mlx", "mlx_lm"],
    },
  );
}

if (require.main === module) {
  releaseBuild().catch(err => {
    console.error(err);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
