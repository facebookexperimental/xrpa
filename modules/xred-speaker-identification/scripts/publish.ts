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

import * as fs from "fs-extra";
import os from "os";
import path from "path";
import process from "process";
import { buildCondaApplication } from "@xrpa/xrpa-orchestrator";

const platform = os.platform();
const isWindows = platform === "win32";

async function productionBuild() {
  await fs.remove(path.join(__dirname, "..", "bin"));

  await buildCondaApplication(
    path.join(__dirname, "..", "SpeakerID", "environment.yaml"),
    path.join(__dirname, "..", "SpeakerID", "main.py"),
    isWindows
      ? path.join(__dirname, "..", "bin", "SpeakerID.exe")
      : path.join(__dirname, "..", "bin", "SpeakerID"),
    {
      collectAll: ["speechbrain", "torchaudio", "silero_vad"],
      hiddenImports: ["torchaudio._extension", "torchaudio.lib._torchaudio_sox"],
    },
  );
}

if (require.main === module) {
  productionBuild().catch(err => {
    console.error(err);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
