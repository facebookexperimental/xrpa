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


import { FileWriter } from "@xrpa/xrpa-file-utils";
import path from "path";

import { DataflowProgramDefinition } from "../../shared/DataflowProgramDefinition";
import { GenDataflowProgramContext, genDataflowProgramClassSpec } from "../shared/GenDataflowProgramShared";
import { CsIncludeAggregator, HEADER, genClassDefinition } from "./CsharpCodeGenImpl";
import * as CsharpCodeGenImpl from "./CsharpCodeGenImpl";

export function genDataflowProgram(
  ctx: GenDataflowProgramContext,
  fileWriter: FileWriter,
  outdir: string,
  programDef: DataflowProgramDefinition,
) {
  const filename = `${programDef.interfaceName}.cs`;

  const classSpec = genDataflowProgramClassSpec(
    ctx,
    CsharpCodeGenImpl,
    programDef,
    new CsIncludeAggregator(),
  );

  const lines: string[] = [
    `namespace ${ctx.namespace} {`,
    ``,
    ...genClassDefinition(classSpec),
    ``,
    `} // namespace ${ctx.namespace}`,
    ``,
  ];

  lines.unshift(
    ...HEADER,
    ``,
    ...(classSpec.includes?.getNamespaceImports(ctx.namespace) ?? []),
    ``,
  );

  fileWriter.writeFile(path.join(outdir, filename), lines);
}
