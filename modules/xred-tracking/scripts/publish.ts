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
import { buckBuild } from "@xrpa/xrpa-orchestrator";

import { FiducialsStandalone } from "./FiducialsModule";
import { PulsarSTOStandalone } from "./PulsarSTOModule";

const BIN_DIR = path.join(__dirname, "..", "bin");

const platform = os.platform();
const isWindows = platform === "win32";

async function releaseBuild() {
  await FiducialsStandalone.buckBuildRelease(BIN_DIR);
  await PulsarSTOStandalone.buckBuildRelease(BIN_DIR);

  const buildMode = isWindows ? "@arvr/mode/win/release" : "@arvr/mode/mac-arm/opt";
  await buckBuild({
    mode: buildMode,
    target: "//arvr/libraries/xred/xrpa/modules/xred-tracking/Fiducials:QRGenerator",
    dstPath: BIN_DIR,
  });
}

if (require.main === module) {
  releaseBuild().catch(err => {
    console.error(err);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
