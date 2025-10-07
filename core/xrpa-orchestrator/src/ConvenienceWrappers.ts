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


import { pushUnique, runInContext } from "@xrpa/xrpa-utils";
import { runProcess } from "@xrpa/xrpa-file-utils";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto"

import { IS_IMAGE_TYPE } from "./InterfaceTypes";
import { NativeProgramContext, applyNativeProgramContext, getNativeProgramContext } from "./NativeProgram";
import { ProgramInterface } from "./ProgramInterface";
import { getDataMap, mapArrays, mapInterfaceType } from "./RuntimeEnvironment";

import { AngularUnitType, CoordAxis, CoordinateSystemDef, SpatialUnitType } from "./shared/CoordinateTransformer";
import { ArrayTypeSpec, TypeMap } from "./shared/TypeDefinition";

import { CppModuleDefinition, ModuleBuckConfig } from "./targets/cpp/CppModuleDefinition";
import { PythonApplication } from "./targets/python/PythonApplication";
import { PythonModuleDefinition } from "./targets/python/PythonModuleDefinition";
import { PythonStandalone } from "./targets/python/PythonStandalone";

export function withHeader<T extends Record<string, string>>(headerFile: string, types: T): TypeMap {
  const ret: TypeMap = {};
  for (const key in types) {
    ret[key] = {
      typename: types[key],
      headerFile,
    };
  }
  return ret;
}

export const OvrCoordinateSystem: CoordinateSystemDef = {
  up: CoordAxis.posY,
  right: CoordAxis.posX,
  forward: CoordAxis.negZ,
  spatialUnit: SpatialUnitType.meter,
  angularUnit: AngularUnitType.radian,
};

export const StdVectorArrayType: ArrayTypeSpec = {
  headerFile: "<vector>",
  typename: "std::vector",
  setSize: "resize()",
  removeAll: "clear()",
  addItem: "push()",
};

export const PythonListType: ArrayTypeSpec = {
  typename: "typing.List",
  setSize: null,
  removeAll: "clear()",
  addItem: "append()",
};

//////////////////////////////////////////////////////////////////////////////

const BUCK_CONFIG = "xrpa.cpp.buckConfig";

interface BuckConfig extends ModuleBuckConfig {
  deps?: string[];
}

export function useBuck(config: BuckConfig) {
  const ctx = getNativeProgramContext();
  ctx.properties[BUCK_CONFIG] = config;
}

function getBuckConfig(ctx: NativeProgramContext) {
  return ctx.properties[BUCK_CONFIG] as BuckConfig | undefined;
}

export function addBuckDependency(dep: string) {
  const ctx = getNativeProgramContext();
  const buckConfig = getBuckConfig(ctx);
  if (buckConfig) {
    if (buckConfig.deps) {
      pushUnique(buckConfig.deps, dep);
    } else {
      buckConfig.deps = [dep];
    }
  }
}

function mapCppInterfaceImageTypes(programInterface: ProgramInterface, usingBuck: boolean) {
  let hasImageTypes = false;
  for (const name in programInterface.namedTypes) {
    const type = programInterface.namedTypes[name];
    if (type.properties[IS_IMAGE_TYPE] === true) {
      mapInterfaceType(programInterface, type.name, {
        typename: "ImageTypes::Image",
        headerFile: "<ImageTypes.h>",
      });
      hasImageTypes = true;
    }
  }

  if (hasImageTypes) {
    mapInterfaceType(programInterface, "ImageFormat", {
      typename: "ImageTypes::Format",
      headerFile: "<ImageTypes.h>",
    });
    mapInterfaceType(programInterface, "ImageEncoding", {
      typename: "ImageTypes::Encoding",
      headerFile: "<ImageTypes.h>",
    });
    mapInterfaceType(programInterface, "ImageOrientation", {
      typename: "ImageTypes::Orientation",
      headerFile: "<ImageTypes.h>",
    });

    if (usingBuck) {
      addBuckDependency("//arvr/libraries/xred/xrpa/modules/Shared/image:ImageTypes");
    }
  }
}

function mapCppImageTypes() {
  const ctx = getNativeProgramContext();
  const usingBuck = getBuckConfig(ctx) != undefined;

  for (const programInterface of ctx.programInterfaces) {
    mapCppInterfaceImageTypes(programInterface, usingBuck);
  }

  for (const key in ctx.externalProgramInterfaces) {
    const programInterface = ctx.externalProgramInterfaces[key].programInterface;
    mapCppInterfaceImageTypes(programInterface, usingBuck);
  }
}

export function XrpaNativeCppProgram(name: string, outputDir: string, callback: (ctx: NativeProgramContext) => void) {
  const ctx: NativeProgramContext = {
    __isRuntimeEnvironmentContext: true,
    __isNativeProgramContext: true,
    programInterfaces: [],
    externalProgramInterfaces: {},
    properties: {},
  };

  runInContext(ctx, callback, () => {
    mapArrays(StdVectorArrayType);
  });

  runInContext(ctx, mapCppImageTypes);

  const buckConfig = getBuckConfig(ctx);

  const datamap = getDataMap(ctx);
  datamap.typeBuckDeps = buckConfig?.deps ?? [];

  const ret = new CppModuleDefinition(name, datamap, outputDir, buckConfig);
  applyNativeProgramContext(ctx, ret);
  return ret;
}

export function XrpaNativePythonProgram(name: string, outputDir: string, callback: (ctx: NativeProgramContext) => void) {
  const ctx: NativeProgramContext = {
    __isRuntimeEnvironmentContext: true,
    __isNativeProgramContext: true,
    programInterfaces: [],
    externalProgramInterfaces: {},
    properties: {},
  };

  runInContext(ctx, callback, () => {
    mapArrays(PythonListType);
  });

  const datamap = getDataMap(ctx);

  const ret = new PythonModuleDefinition(name, datamap, outputDir);
  applyNativeProgramContext(ctx, ret);
  return ret;
}

export function XrpaPythonApplication(
  name: string,
  params: {
    codegenDir: string;
    condaEnvFile: string;
    pythonEntryPoint: string;
  },
  callback: (ctx: NativeProgramContext) => void,
) {
  return new PythonApplication(
    XrpaNativePythonProgram(name, params.codegenDir, callback),
    params.condaEnvFile,
    params.pythonEntryPoint,
  );
}

export function XrpaPythonStandalone(
  name: string,
  params: {
    codegenDir: string;
    condaEnvFile: string;
    pythonEntryPoint: string;
  },
  callback: (ctx: NativeProgramContext) => void,
) {
  return new PythonStandalone(
    XrpaNativePythonProgram(name, params.codegenDir, callback),
    params.condaEnvFile,
    params.pythonEntryPoint,
  );
}

async function runInCondaEnvironmentInternal(yamlPath: string, cwd: string, args: string[]) {
  const yamlContent = await fs.readFile(yamlPath, "utf8");
  const envName = yamlContent.split("\n")[0].split(" ")[1];

  const yamlHash = crypto.createHash("sha256").update(yamlContent).digest("hex");
  const hashFilename = crypto.createHash("md5").update(yamlPath).digest("hex");
  const hashFilePath = path.join(os.tmpdir(), `${hashFilename}.txt`);

  let shouldRecreate = false;

  const envList = JSON.parse(await runProcess({
    filename: "conda",
    args: ["env", "list", "--json"],
  }));
  const found = envList.envs.some((env: string) =>
    env.endsWith(envName) || path.basename(env) === envName
  );

  if (found) {
    try {
      const existingHash = await fs.readFile(hashFilePath, "utf8");
      if (existingHash !== yamlHash) {
        console.log(`Conda environment ${envName} exists but yaml file has changed. Recreating...`);
        shouldRecreate = true;
      }
    } catch (error) {
      shouldRecreate = true;
    }
  }

  if (!found || shouldRecreate) {
    if (shouldRecreate) {
      console.log(`Removing existing conda environment ${envName}...`);
      await runProcess({
        filename: "conda",
        args: ["env", "remove", "-n", envName, "-y"],
      });
    } else {
      console.log(`Creating conda environment from ${yamlPath}...`);
    }

    await runProcess({
      filename: "conda",
      args: ["env", "create", "-f", yamlPath],
    });

    await fs.writeFile(hashFilePath, yamlHash);
  }

  await runProcess({
    filename: "conda",
    args: ["run", "--live-stream", "-n", envName, ...args],
    cwd,
    pipeStdout: true,
  });
}

export async function runInCondaEnvironment(yamlPath: string, filename: string) {
  await runInCondaEnvironmentInternal(yamlPath, path.dirname(filename), ["python", "-u", filename]);
}

export async function buildCondaApplication(yamlPath: string, filename: string, outname: string, options?: {
  hiddenImports?: string[];
  collectAll?: string[];
}) {
  const params = [
    "--onefile", filename,
    "--name", path.basename(outname),
    "--distpath", path.dirname(outname),
    "--specpath", path.join(os.tmpdir(), path.basename(outname)),
    "--workpath", path.join(os.tmpdir(), path.basename(outname), "build"),
  ];

  for (const imp of (options?.hiddenImports ?? [])) {
    params.push("--hidden-import", imp);
  }
  for (const mod of (options?.collectAll ?? [])) {
    params.push("--collect-all", mod);
  }

  await runInCondaEnvironmentInternal(yamlPath, path.dirname(filename), ["pip", "install", "pyinstaller"]);
  await runInCondaEnvironmentInternal(yamlPath, path.dirname(filename), [
    "pyinstaller",
    ...params,
  ]);
}
