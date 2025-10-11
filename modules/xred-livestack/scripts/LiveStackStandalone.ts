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
    UnityCoordinateSystem,
  XrpaPythonStandalone,
  setProgramInterface,
  useCoordinateSystem,
} from "@xrpa/xrpa-orchestrator";

import { XredLiveStackInterface } from "../js/LiveStackInterface";

const apidir = path.join(__dirname, "..", "LiveStack");

const LiveStackModule = XrpaPythonStandalone("LiveStack", {
  codegenDir: apidir,
  condaEnvFile: path.join(apidir, "environment.yaml"),
  pythonEntryPoint: path.join(apidir, "main.py"),
}, () => {
    // LiveStack uses Unity coordinate system (left-handed, Y-up)
    // Data received from websocket is already in Unity coordinates
  useCoordinateSystem(UnityCoordinateSystem);

  setProgramInterface(XredLiveStackInterface);
});

if (require.main === module) {
  LiveStackModule.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
