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
  XrpaPythonStandalone,
  runInCondaEnvironment,
  setProgramInterface,
} from "@xrpa/xrpa-orchestrator";

import { XredLlmHubInterface } from "../js/LlmHubInterface";
import { apidir, getEnvironmentFile } from "./LlmHubShared";

const LlmHubModule = XrpaPythonStandalone("LlmHub", apidir, () => {
  setProgramInterface(XredLlmHubInterface);
});

export async function doCodegen() {
  const filesToWrite = LlmHubModule.doCodeGen();
  await filesToWrite.finalize(path.join(apidir, "manifest.gen.json"));
}

export async function doRun() {
  await runInCondaEnvironment(
    getEnvironmentFile(),
    path.join(apidir, "main.py"),
  );
}

export async function runStandalone() {
  await doCodegen();
  await doRun();
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--codegen-only')) {
    doCodegen().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else if (args.includes('--run-only')) {
    doRun().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else {
    runStandalone().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  }
}
