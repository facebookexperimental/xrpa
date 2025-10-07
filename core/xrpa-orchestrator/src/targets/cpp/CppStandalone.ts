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


import { buckBuild, buckRootDir, buckRun, FileWriter } from "@xrpa/xrpa-file-utils";
import path from "path";

import { CodeGen } from "../../shared/CodeGen";
import { CppModuleDefinition } from "./CppModuleDefinition";
import { genStandaloneBuck, genStandaloneCpp } from "./GenStandaloneCpp";

export class CppStandalone implements CodeGen {
  private resourceFilenames: string[] = [];
  private codeGenDeps: CodeGen[] = [];

  constructor(
    readonly moduleDef: CppModuleDefinition,
    readonly standaloneDir: string,
    readonly manifestFilename: string,
  ) { }

  public doCodeGen(): FileWriter {
    const fileWriter = this.moduleDef.doCodeGen();
    for (const codeGen of this.codeGenDeps) {
      fileWriter.merge(codeGen.doCodeGen());
    }

    // generate standalone wrapper files
    genStandaloneCpp(fileWriter, this.standaloneDir, this.moduleDef);

    if (this.moduleDef.buckDef) {
      // generate buck file
      genStandaloneBuck(fileWriter, this.standaloneDir, this.moduleDef.runtimeDir, this.moduleDef.buckDef, this.moduleDef);
    }

    return fileWriter;
  }

  public addCodeGenDependency(codeGen: CodeGen): void {
    this.codeGenDeps.push(codeGen);
  }

  public addResourceFile(filename: string): void {
    this.resourceFilenames.push(filename);
  }

  public async getStandaloneTarget(): Promise<string> {
    const buckRoot = await buckRootDir();
    const standaloneRelPath = path.relative(buckRoot, this.standaloneDir);
    return `//${standaloneRelPath.replace(/\\/g, "/")}:${this.moduleDef.name}`;
  }

  public getBuckMode(optLevel: "debug" | "release"): string {
    const buckDef = this.moduleDef.buckDef;
    if (!buckDef) {
      throw new Error("Buck is not configured for this module");
    }

    let buckMode: string | undefined;
    if (process.platform == "win32") {
      buckMode = buckDef.modes.windows?.[optLevel];
    } else if (process.platform == "darwin") {
      buckMode = buckDef.modes.macos?.[optLevel];
    }

    if (!buckMode) {
      throw new Error("There is no buck mode configured for the current platform");
    }

    return buckMode;
  }

  public isSupportedPlatform(): boolean {
    const buckDef = this.moduleDef.buckDef;
    if (!buckDef) {
      return false;
    }
    if (process.platform == "win32") {
      return Boolean(buckDef.modes.windows);
    } else if (process.platform == "darwin") {
      return Boolean(buckDef.modes.macos);
    }
    return false;
  }

  public async smartExecute(): Promise<void> {
    const args = process.argv.slice(2);
    if (args.includes('--codegen')) {
      await this.doCodeGen().finalize(this.manifestFilename);
    }

    if (!this.isSupportedPlatform()) {
      return;
    }

    if (args.includes('--run')) {
      await buckRun({
        mode: this.getBuckMode("debug"),
        target: await this.getStandaloneTarget(),
        resourceFilenames: this.resourceFilenames,
      });
    } else if (args.includes('--build')) {
      await buckBuild({
        mode: this.getBuckMode("debug"),
        target: await this.getStandaloneTarget(),
        resourceFilenames: this.resourceFilenames,
      });
    }
  }

  public async buckRunDebug(): Promise<void> {
    await this.doCodeGen().finalize(this.manifestFilename);

    await buckRun({
      mode: this.getBuckMode("debug"),
      target: await this.getStandaloneTarget(),
      resourceFilenames: this.resourceFilenames,
    });
  }

  public async buckBuildRelease(dstPath: string): Promise<void> {
    await this.doCodeGen().finalize(this.manifestFilename);

    let mode = "";
    try {
      mode = this.getBuckMode("release");
    } catch (e) {
      // ignore, it is just not supported on this platform
      return;
    }

    await buckBuild({
      mode,
      target: await this.getStandaloneTarget(),
      dstPath,
      resourceFilenames: this.resourceFilenames,
    });
  }
}
