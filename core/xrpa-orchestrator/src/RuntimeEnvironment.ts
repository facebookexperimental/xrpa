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

import { getCoordinateSystem } from "./Coordinates";
import { ProgramInterface } from "./ProgramInterface";
import { WithBindingProperties, XrpaDataType, isNamedDataType } from "./XrpaLanguage";

import { BuiltinType } from "./shared/BuiltinTypes";
import { DataMapDefinition } from "./shared/DataMap";
import { TypeSpec } from "./shared/TargetCodeGen";
import { ArrayTypeSpec } from "./shared/TypeDefinition";

const TYPE_MAP = "xrpa.nativeProgram.typeMap";
const INTERFACE_TYPE_MAPS = "xrpa.nativeProgram.interfaceTypeMaps";
const LOCAL_ARRAY_TYPE = "xrpa.nativeProgram.localArrayType";

export interface ExternalProgramInterfaceContext extends WithBindingProperties {
  programInterface: ProgramInterface;
}

export interface ExternalProgramCallerContext {
  externalProgramInterfaces: Record<string, ExternalProgramInterfaceContext>;
}

export function isExternalProgramCallerContext(ctx: unknown): ctx is ExternalProgramCallerContext {
  return typeof ctx === "object" && ctx !== null && "externalProgramInterfaces" in ctx;
}

export function getExternalProgramCallerContext(): ExternalProgramCallerContext {
  return getContext(isExternalProgramCallerContext, "Call is only valid within a context which can bind external programs");
}

export interface RuntimeEnvironmentContext extends ExternalProgramCallerContext, WithBindingProperties {
  __isRuntimeEnvironmentContext: true;
}

export function isRuntimeEnvironmentContext(ctx: unknown): ctx is RuntimeEnvironmentContext {
  return typeof ctx === "object" && ctx !== null && "__isRuntimeEnvironmentContext" in ctx;
}

export function getRuntimeEnvironmentContext(): RuntimeEnvironmentContext {
  return getContext(isRuntimeEnvironmentContext, "Call is only valid within a runtime environment");
}

function mapTypeInternal(typeMap: Record<string, TypeSpec>, dataType: string | Thunk<XrpaDataType>, mapped: TypeSpec) {
  if (typeof dataType === "string") {
    typeMap[dataType] = mapped;
    return;
  }

  dataType = resolveThunk(dataType);
  if (dataType.typename in BuiltinType) {
    typeMap[dataType.typename] = mapped;
    return;
  }

  if (isNamedDataType(dataType) && dataType.name) {
    typeMap[dataType.name] = mapped;
    return;
  }

  throw new Error(`Cannot map type ${dataType.typename}`);
}

export function mapType(dataType: string | Thunk<XrpaDataType>, mapped: TypeSpec) {
  const ctx = getRuntimeEnvironmentContext();
  let typeMap = ctx.properties[TYPE_MAP] as Record<string, TypeSpec> | undefined;
  if (!typeMap) {
    typeMap = ctx.properties[TYPE_MAP] = {} as Record<string, TypeSpec>;
  }

  mapTypeInternal(typeMap, dataType, mapped);
}

export function mapInterfaceType(programInterface: ProgramInterface, dataType: string | Thunk<XrpaDataType>, mapped: TypeSpec) {
  const ctx = getRuntimeEnvironmentContext();
  let typeMaps = ctx.properties[INTERFACE_TYPE_MAPS] as Record<string, Record<string, TypeSpec>> | undefined;
  if (!typeMaps) {
    typeMaps = ctx.properties[INTERFACE_TYPE_MAPS] = {} as Record<string, Record<string, TypeSpec>>;
  }

  let typeMap = typeMaps[programInterface.interfaceName];
  if (!typeMap) {
    typeMap = typeMaps[programInterface.interfaceName] = {} as Record<string, TypeSpec>;
  }

  mapTypeInternal(typeMap, dataType, mapped);
}

export function getInterfaceTypeMap(ctx: RuntimeEnvironmentContext, programInterface: ProgramInterface): Record<string, TypeSpec> {
  const typeMaps = ctx.properties[INTERFACE_TYPE_MAPS] as Record<string, Record<string, TypeSpec>> | undefined;
  return (typeMaps?.[programInterface.interfaceName]) ?? {};
}

export function mapArrays(localArrayType: ArrayTypeSpec) {
  const ctx = getRuntimeEnvironmentContext();
  ctx.properties[LOCAL_ARRAY_TYPE] = localArrayType;
}

export function getDataMap(ctx: RuntimeEnvironmentContext): DataMapDefinition {
  const typeMap = ctx.properties[TYPE_MAP] as Record<string, TypeSpec> | undefined;
  return {
    coordinateSystem: getCoordinateSystem(ctx),
    typeMap: typeMap ?? {},
    typeBuckDeps: [],
    localArrayType: ctx.properties[LOCAL_ARRAY_TYPE] as ArrayTypeSpec | undefined,
  };
}

export function bindExternalProgram(programInterface: ProgramInterface): ExternalProgramInterfaceContext {
  const ctx = getExternalProgramCallerContext();

  // recurse into dependent external program interfaces; do this first to maintain depenency order
  if (isExternalProgramCallerContext(programInterface)) {
    for (const key in programInterface.externalProgramInterfaces) {
      bindExternalProgram(programInterface.externalProgramInterfaces[key].programInterface);
    }
  }

  if (!(programInterface.interfaceName in ctx.externalProgramInterfaces)) {
    ctx.externalProgramInterfaces[programInterface.interfaceName] = {
      programInterface,
      properties: {},
    };
  }

  return ctx.externalProgramInterfaces[programInterface.interfaceName];
}
