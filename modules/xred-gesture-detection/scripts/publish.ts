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
import { publish } from "xrpa-internal-scripts";

const OSS_PATH = path.join(__dirname, "..", "..", "..", "..", "..", "..", "libraries", "xred", "oss", "xrpa");
const platform = os.platform();
const isWindows = platform === "win32";

function getPlatformConfig() {
  return {
    environmentFile: path.join(__dirname, "..", "Gesture", "environment.yaml"),
    outputExecutable: isWindows
      ? path.join(OSS_PATH, "xred-gesture-detection", "bin", "Gesture.exe")
      : path.join(OSS_PATH, "xred-gesture-detection", "bin", "Gesture"),
  };
}

async function runPublish() {
  const config = getPlatformConfig();

  await publish({
    inputPath: path.join(__dirname, ".."),
    outputPath: path.join(OSS_PATH, "xred-gesture-detection"),
  });

  await buildCondaApplication(
    config.environmentFile,
    path.join(__dirname, "..", "Gesture", "main.py"),
    config.outputExecutable,
  );
}

if (require.main === module) {
  runPublish().catch(err => {
    console.error(err);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
