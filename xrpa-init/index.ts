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
import { XredSignalOutput } from "@xrpa/xred-signal-output";
import { SignalGraph, XredSignalProcessing } from "@xrpa/xred-signal-processing";
import { UnityProject } from "@xrpa/xrpa-orchestrator";

import { TestEffect } from "./TestEffect";

const UnityEffects: Record<string, SignalGraph> = {
  // Put your effects here, for them to show up as Unity components
  TestEffect: TestEffect(),
};

UnityProject(path.join(__dirname, ".."), unity => {
  unity.addBindings(XredSignalOutput);
  unity.addBindings(XredSignalProcessing, { effects: UnityEffects });
}).catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
