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


import fs from "fs-extra";
import path from "path";

import { recursiveDirScan, runProcess } from "./FileUtils";

const BUCK = "buck2";

export async function buckRootDir() {
  return await runProcess({ filename: BUCK, args: ["root"] });
}

export function normalizeBuckMode(mode: string): string {
  if (mode.startsWith("@")) {
    mode = mode.slice(1);
  }
  if (!mode.startsWith("fbsource//")) {
    mode = `fbsource//${mode}`;
  }
  return mode;
}

async function buckBuildAndPrep(params: {
  mode: string;
  target: string;
  resourceFilenames?: string[];
}) {
  const buckMode = normalizeBuckMode(params.mode);
  try {
    const buckRoot = await runProcess({ filename: BUCK, args: ["root"] });
    console.log(`${BUCK} build @${buckMode} ${params.target}`);
    const buildOutput = await runProcess({
      filename: BUCK,
      args: ["build", `@${buckMode}`, params.target, "--show-json-output"],
      onLineReceived: line => console.log(line),
    });

    const buildOutputJson = JSON.parse(buildOutput);
    let outputPath = path.join(buckRoot, buildOutputJson[Object.keys(buildOutputJson)[0]]);

    // strip off filename if outputPath is not a directory
    if ((await fs.stat(outputPath)).isFile()) {
      outputPath = path.dirname(outputPath);
    }

    // copy resources to the output dir
    if (params.resourceFilenames) {
      for (const filename of params.resourceFilenames) {
        await fs.copyFile(filename, path.join(outputPath, path.basename(filename)));
      }
    }

    return outputPath;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function buckRun(params: {
  mode: string;
  target: string;
  resourceFilenames?: string[];
  exeFilename?: string;
}) {
  try {
    const targetName = params.target.split(":").pop() ?? "";
    let platformSuffix = "";
    if (process.platform === "win32") {
      platformSuffix = ".exe";
    } else if (process.platform === "darwin") {
      // On macOS, don't add a suffix as the executable is likely not in a .app bundle
      platformSuffix = "";
    }
    const exeFilename = params.exeFilename ?? (targetName + platformSuffix);
    const outputPath = await buckBuildAndPrep(params);
    const exePath = path.join(outputPath, exeFilename);

    console.log(exePath);
    return await runProcess({
      filename: exePath,
      onLineReceived: line => console.log(line),
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function fileIsExecutable(filename: string) {
  if (fs.statSync(filename).mode & 0o100) {
    return true;
  }
  if (process.platform === "win32") {
    return filename.endsWith(".exe") || filename.endsWith(".dll");
  }
  if (process.platform === "darwin") {
    return filename.endsWith(".app") || filename.endsWith(".dylib");
  }
  return false;
}

export async function buckBuild(params: {
  mode: string;
  target: string;
  resourceFilenames?: string[];
  dstPath?: string;
}) {
  try {
    const outputPath = await buckBuildAndPrep(params);

    if (!params.dstPath) {
      return;
    }

    // copy executables and dlls to dstPath
    const filenames: string[] = [];
    await recursiveDirScan(outputPath, filenames);
    for (const filename of filenames) {
      if (fileIsExecutable(filename)) {
        const dstFilename = path.join(params.dstPath, filename.slice(outputPath.length + 1));
        await fs.ensureDir(path.dirname(dstFilename));
        await fs.copyFile(filename, dstFilename);
      }
    }

    // copy resources to dstPath
    if (params.resourceFilenames) {
      for (const filename of params.resourceFilenames) {
        await fs.copyFile(filename, path.join(params.dstPath, path.basename(filename)));
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}
