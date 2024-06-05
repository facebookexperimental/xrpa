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

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xrpaUnityCodeGen = void 0;
const path_1 = __importDefault(require("path"));
const xred_signal_output_1 = require("xred-signal-output");
const xred_signal_processing_1 = require("xred-signal-processing");
const xrpa_orchestrator_1 = require("xrpa-orchestrator");
async function xrpaSignalOutputPackageCodeGen(packagesRoot) {
    const XrpaSignalOutputPackage = (0, xrpa_orchestrator_1.UnityPackageModule)("XrpaSignalOutput", {
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
        datamodel: xred_signal_output_1.SignalOutputDataModel,
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
    await XrpaSignalOutputPackage.doCodeGen().finalize(path_1.default.join(packagesRoot, "..", "js", "XrpaSignalOutput.manifest.gen.json"));
}
async function xrpaSignalProcessingPackageCodeGen(packagesRoot, effects) {
    const XrpaSignalProcessingPackage = (0, xrpa_orchestrator_1.UnityPackageModule)("XrpaSignalProcessing", {
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
        datamodel: xred_signal_processing_1.SignalProcessingDataModel,
    });
    (0, xred_signal_processing_1.setupSignalProcessingDataStore)(SignalProcessingDataStore);
    // add the effects as synthetic objects
    for (const name in effects) {
        SignalProcessingDataStore.addSyntheticObject(name, effects[name]);
    }
    await XrpaSignalProcessingPackage.doCodeGen().finalize(path_1.default.join(packagesRoot, "..", "js", "XrpaSignalProcessing.manifest.gen.json"));
}
async function xrpaUnityCodeGen(packagesRoot, effects) {
    await xrpaSignalOutputPackageCodeGen(packagesRoot);
    await xrpaSignalProcessingPackageCodeGen(packagesRoot, effects);
}
exports.xrpaUnityCodeGen = xrpaUnityCodeGen;
//# sourceMappingURL=index.js.map
