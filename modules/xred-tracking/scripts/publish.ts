/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import os from "os";
import path from "path";
import process from "process";
import { buckBuild } from "@xrpa/xrpa-orchestrator";
import { publish } from "xrpa-internal-scripts";

import { FiducialsStandalone } from "./FiducialsModule";
import { PulsarSTOStandalone } from "./PulsarSTOModule";

const OSS_PATH = path.join(__dirname, "..", "..", "..", "..", "..", "..", "libraries", "xred", "oss", "xrpa");

const platform = os.platform();
const isWindows = platform === "win32";

async function runPublish() {
  const buildMode = isWindows ? "@arvr/mode/win/release" : "@arvr/mode/mac-arm/opt";

  await publish({
    inputPath: path.join(__dirname, ".."),
    outputPath: path.join(OSS_PATH, "xred-tracking"),
  });

  await FiducialsStandalone.buckBuildRelease(path.join(OSS_PATH, "xred-tracking", "bin"));
  await PulsarSTOStandalone.buckBuildRelease(path.join(OSS_PATH, "xred-tracking", "bin"));

  await buckBuild({
    mode: buildMode,
    target: "//arvr/libraries/xred/xrpa/modules/xred-tracking/Fiducials:QRGenerator",
    dstPath: path.join(OSS_PATH, "xred-tracking", "bin"),
  });
}

if (require.main === module) {
  runPublish().catch(err => {
    console.error(err);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
