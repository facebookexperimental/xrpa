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
import process from "process";

import { AriaStandalone } from "./AriaStandalone";
import { CameraStandalone } from "./CameraStandalone";

const BIN_PATH = path.join(__dirname, "..", "bin");

async function runPublish() {
  await AriaStandalone.buckBuildRelease(BIN_PATH);
  await CameraStandalone.buckBuildRelease(BIN_PATH);
}

if (require.main === module) {
  runPublish().catch(err => {
    console.error(err);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
