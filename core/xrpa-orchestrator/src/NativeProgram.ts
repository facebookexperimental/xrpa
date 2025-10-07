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


import { getContext, Thunk, resolveThunk } from "@xrpa/xrpa-utils";

import { ProgramInterface } from "./ProgramInterface";
import { bindProgramInterfaceToModule, convertDataTypeToUserTypeSpec } from "./ProgramInterfaceConverter";
import { RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { XrpaDataType } from "./XrpaLanguage";

import { ModuleDefinition } from "./shared/ModuleDefinition";

const MODULE_SETTINGS = "xrpa.nativeProgram.settings";

export interface NativeProgramContext extends RuntimeEnvironmentContext {
  __isNativeProgramContext: true;
  programInterfaces: Array<ProgramInterface>;
}

export function isNativeProgramContext(ctx: unknown): ctx is NativeProgramContext {
  return typeof ctx === "object" && ctx !== null && "__isNativeProgramContext" in ctx;
}

export function getNativeProgramContext(): NativeProgramContext {
  return getContext(isNativeProgramContext, "Call must be made within a native program");
}

type SettingsType =
  | "Boolean"
  | "Count"
  | "Scalar"
  | "String"
  | "Angle"
  | "Distance"
  | "Float3"
  ;

export function addSetting(name: string, dataType: Thunk<XrpaDataType<SettingsType>>) {
  const ctx = getNativeProgramContext();
  let settings = ctx.properties[MODULE_SETTINGS] as Record<string, XrpaDataType> | undefined;
  if (!settings) {
    settings = ctx.properties[MODULE_SETTINGS] = {} as Record<string, XrpaDataType>;
  }
  if (name in settings) {
    throw new Error(`Setting ${name} already exists`);
  }
  settings[name] = resolveThunk(dataType);
}

export function setProgramInterface(programInterface: ProgramInterface | Array<ProgramInterface>) {
  const ctx = getNativeProgramContext();
  if (Array.isArray(programInterface)) {
    ctx.programInterfaces.push(...programInterface);
  } else {
    ctx.programInterfaces.push(programInterface);
  }
}

//////////////////////////////////////////////////////////////////////////////

export function applyNativeProgramContext(ctx: NativeProgramContext, moduleDef: ModuleDefinition) {
  for (const programInterface of ctx.programInterfaces) {
    bindProgramInterfaceToModule(ctx, moduleDef, programInterface, false);
  }
  for (const name in ctx.externalProgramInterfaces) {
    bindProgramInterfaceToModule(ctx, moduleDef, ctx.externalProgramInterfaces[name].programInterface, true);
  }

  const settings = (ctx.properties[MODULE_SETTINGS] ?? {}) as Record<string, XrpaDataType>;
  for (const name in settings) {
    moduleDef.addSetting(name, convertDataTypeToUserTypeSpec(settings[name], null));
  }
}
