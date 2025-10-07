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


import { filterToStringPairArray, runInContext } from "@xrpa/xrpa-utils";
import path from "path";

import { Distance2, Distance3, EulerAngles, Quaternion, Scale2, Scale3, UnitVector2, UnitVector3, Vector2, Vector3, useCoordinateSystem } from "./Coordinates";
import { ColorSRGBA, ColorLinear, String } from "./InterfaceTypes";
import { COMPONENT_BASE_CLASS, GameEngineConfig } from "./GameEngine";
import { bindProgramInterfaceToModule } from "./ProgramInterfaceConverter";
import { ExternalProgramInterfaceContext, RuntimeEnvironmentContext, getDataMap, mapArrays, mapType } from "./RuntimeEnvironment";
import { PropertyCondition } from "./XrpaLanguage";

import { AngularUnitType, CoordAxis, CoordinateSystemDef, SpatialUnitType } from "./shared/CoordinateTransformer";
import { ArrayTypeSpec } from "./shared/TypeDefinition";

import { IntrinsicProperty } from "./targets/ueplugin/SceneComponentShared";
import { PluginConfig, UepluginModuleDefinition } from "./targets/ueplugin/UepluginModuleDefinition";

export const UnrealCoordinateSystem: CoordinateSystemDef = {
  up: CoordAxis.posZ,
  right: CoordAxis.posY,
  forward: CoordAxis.posX,
  spatialUnit: SpatialUnitType.centimeter,
  angularUnit: AngularUnitType.degree,
};

export const UnrealArrayType: ArrayTypeSpec = {
  headerFile: "Engine.h",
  typename: "TArray",
  setSize: "SetNum()",
  removeAll: "Empty()",
  addItem: "Add()",
};

const FVector2D = {
  typename: "FVector2D",
  headerFile: "Engine.h",
  fieldMap: {
    X: "x",
    Y: "y",
  },
};

const FVector = {
  typename: "FVector",
  headerFile: "Engine.h",
  fieldMap: {
    X: "x",
    Y: "y",
    Z: "z",
  },
};

export interface UnrealEngineRuntimeContext extends RuntimeEnvironmentContext {
  __UnrealEngineRuntime: true;
}

export const IfUnrealEngine: PropertyCondition = {
  propertyToCheck: COMPONENT_BASE_CLASS,
  expectedValue: "SceneComponent",
};

export function PluginDeps(
  ctx: ExternalProgramInterfaceContext,
  pluginDeps: [string, string][],
) {
  ctx.properties.pluginDeps = pluginDeps;
}

export async function UnrealProject(projectPath: string, projectName: string, callback: (ctx: UnrealEngineRuntimeContext) => void) {
  const ctx: UnrealEngineRuntimeContext = GameEngineConfig({
    __isRuntimeEnvironmentContext: true,
    __UnrealEngineRuntime: true,
    properties: {},
    externalProgramInterfaces: {},
  }, {
    componentBaseClass: "SceneComponent",
    intrinsicPositionProperty: IntrinsicProperty.Location,
    intrinsicRotationProperty: IntrinsicProperty.Rotation,
    intrinsicScaleProperty: IntrinsicProperty.Scale3D,
    intrinsicParentProperty: IntrinsicProperty.Parent,
    intrinsicGameObjectProperty: IntrinsicProperty.Parent,
  });

  runInContext(ctx, callback, () => {
    useCoordinateSystem(UnrealCoordinateSystem);

    mapType(String, {
      typename: "FString",
      headerFile: "<xrpa-runtime/ue/FStringHelpers.h>",
      conversionOperator: "FStringAdaptor",
    });
    mapType(Vector2, FVector2D);
    mapType(UnitVector2, FVector2D);
    mapType(Distance2, FVector2D);
    mapType(Scale2, FVector2D);
    mapType(Quaternion, {
      typename: "FQuat",
      headerFile: "Engine.h",
      fieldMap: {
        X: "x",
        Y: "y",
        Z: "z",
        W: "w",
      },
    });
    mapType(Vector3, FVector);
    mapType(UnitVector3, FVector);
    mapType(Distance3, FVector);
    mapType(Scale3, FVector);
    mapType(ColorSRGBA, {
      typename: "FColor",
      headerFile: "Engine.h",
    });
    mapType(ColorLinear, {
      typename: "FLinearColor",
      headerFile: "Engine.h",
    });
    mapType(EulerAngles, {
      typename: "FRotator",
      headerFile: "Engine.h",
      fieldMap: {
        Pitch: "pitch",
        Roll: "roll",
        Yaw: "yaw",
      },
    });

    mapArrays(UnrealArrayType);
  });

  const pluginConfigs: Record<string, PluginConfig> = {};
  for (const name in ctx.externalProgramInterfaces) {
    const programInterfaceCtx = ctx.externalProgramInterfaces[name];
    const programInterface = programInterfaceCtx.programInterface;
    const companyName = programInterfaceCtx.properties.upperCaseCompanyName ? programInterface.companyName.toLocaleUpperCase() : programInterface.companyName;

    pluginConfigs[programInterface.interfaceName] = {
      pluginName: `${companyName}${programInterface.interfaceName}`,
      deps: filterToStringPairArray(programInterfaceCtx.properties.pluginDeps) ?? [],
    };
  }

  const pkg = new UepluginModuleDefinition(
    projectName,
    getDataMap(ctx),
    projectPath,
    pluginConfigs,
  );

  for (const name in ctx.externalProgramInterfaces) {
    bindProgramInterfaceToModule(ctx, pkg, ctx.externalProgramInterfaces[name].programInterface, true);
  }

  await pkg.doCodeGen().finalize(path.join(projectPath, "xrpa-manifest.json"));
}
