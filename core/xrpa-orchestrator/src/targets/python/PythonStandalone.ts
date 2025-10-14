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


import { FileWriter, stripDebugAsserts } from "@xrpa/xrpa-file-utils";
import path from "path";

import { runInCondaEnvironment } from "../../ConvenienceWrappers";
import { CodeGen } from "../../shared/CodeGen";
import { PythonModuleDefinition } from "./PythonModuleDefinition";
import { genApplicationInterfaceClass } from "./GenProgramInterfacesClass";

export class PythonStandalone implements CodeGen {
  private codeGenDeps: CodeGen[] = [];

  constructor(
    readonly moduleDef: PythonModuleDefinition,
    readonly condaEnvironmentPath: string,
    readonly entryPointPath: string,
    readonly backgroundTick = false,
  ) {}

  public doCodeGen(): FileWriter {
    const fileWriter = this.moduleDef.doCodeGen();
    for (const codeGen of this.codeGenDeps) {
      fileWriter.merge(codeGen.doCodeGen());
    }

    genApplicationInterfaceClass(fileWriter, this.moduleDef.libDir, this.moduleDef, this.backgroundTick);

    return fileWriter;
  }

  public addCodeGenDependency(codeGen: CodeGen): void {
    this.codeGenDeps.push(codeGen);
  }

  public async smartExecute(): Promise<void> {
    const args = process.argv.slice(2);
    const isRelease = args.includes('--release');

    if (args.includes('--codegen')) {
      await this.doCodeGen().finalize(path.join(this.moduleDef.genOutputDir, "manifest.gen.json"));

      if (isRelease) {
        const outputDir = path.dirname(path.join(this.moduleDef.genOutputDir, "manifest.gen.json"));
        await stripDebugAsserts(outputDir);
      }
    }
    if (args.includes('--run')) {
      await runInCondaEnvironment(
        this.condaEnvironmentPath,
        this.entryPointPath,
      );
    }
  }
}
