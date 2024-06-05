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

import { SignalOutputDataModel } from "xred-signal-output";
import { setupSignalProcessingDataStore, SignalGraph, SignalProcessingDataModel } from "xred-signal-processing";
import { UnityPackageModule } from "xrpa-orchestrator";

async function xrpaSignalOutputPackageCodeGen(packagesRoot: string) {
  const XrpaSignalOutputPackage = UnityPackageModule("XrpaSignalOutput", {
    packagesRoot,
    packageInfo: {
      name: "com.meta.xrpa.signaloutput",
      version: [1, 0, 0],
      displayName: "SignalOutput",
      description: "Xrpa signal output interface",
      companyName: "Meta",
      dependencies: [],
    },
  });

  const SignalOutputDataStore = XrpaSignalOutputPackage.addDataStore({
    dataset: "SignalOutput",
    datamodel: SignalOutputDataModel,
  });

  SignalOutputDataStore.addInputReconciler({
    type: "SignalOutputDevice",
    indexedReconciled: {
      fieldName: "name",
      indexedTypeName: "",
    },
    componentProps: {
      basetype: "MonoBehaviour",
    },
  });

  await XrpaSignalOutputPackage.doCodeGen().finalize(path.join(packagesRoot, "..", "js", "XrpaSignalOutput.manifest.gen.json"));
}

async function xrpaSignalProcessingPackageCodeGen(packagesRoot: string, effects: Record<string, SignalGraph>) {
  const XrpaSignalProcessingPackage = UnityPackageModule("XrpaSignalProcessing", {
    packagesRoot,
    packageInfo: {
      name: "com.meta.xrpa.signalprocessing",
      version: [1, 0, 0],
      displayName: "SignalProcessing",
      description: "Xrpa signal processing interface",
      companyName: "Meta",
      dependencies: [],
    },
  });

  const SignalProcessingDataStore = XrpaSignalProcessingPackage.addDataStore({
    dataset: "SignalProcessing",
    datamodel: SignalProcessingDataModel,
  });

  setupSignalProcessingDataStore(SignalProcessingDataStore);

  // add the effects as synthetic objects
  for (const name in effects) {
    SignalProcessingDataStore.addSyntheticObject(name, effects[name]);
  }

  await XrpaSignalProcessingPackage.doCodeGen().finalize(path.join(packagesRoot, "..", "js", "XrpaSignalProcessing.manifest.gen.json"));
}

export async function xrpaUnityCodeGen(packagesRoot: string, effects: Record<string, SignalGraph>) {
  await xrpaSignalOutputPackageCodeGen(packagesRoot);
  await xrpaSignalProcessingPackageCodeGen(packagesRoot, effects);
}
