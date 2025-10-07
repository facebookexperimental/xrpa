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

import {
  bindExternalProgram,
  OvrCoordinateSystem,
  runInCondaEnvironment,
  useCoordinateSystem,
  XrpaPythonApplication,
} from "@xrpa/xrpa-orchestrator";

import { XredSignalOutputInterface } from "@xrpa/xred-signal-output";

const outdir = path.join(__dirname, "..");

const PythonSignalGen = XrpaPythonApplication("PythonSignalGen", outdir, () => {
  useCoordinateSystem(OvrCoordinateSystem);
  bindExternalProgram(XredSignalOutputInterface);
});

async function main() {
  const filesToWrite = PythonSignalGen.doCodeGen();
  await filesToWrite.finalize(path.join(outdir, "manifest.gen.json"));

  await runInCondaEnvironment(
    path.join(outdir, "environment.yaml"),
    path.join(outdir, "main.py"),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
