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


import { runInContext } from "@xrpa/xrpa-utils";
import path from "path";

import { Distance2, Distance3, EulerAngles, Quaternion, Scale2, Scale3, UnitVector2, UnitVector3, Vector2, Vector3, useCoordinateSystem } from "./Coordinates";
import { COMPONENT_BASE_CLASS, GameEngineConfig } from "./GameEngine";
import { ColorLinear, ColorSRGBA, String } from "./InterfaceTypes";
import { NativeProgramContext } from "./NativeProgram";
import { bindProgramInterfaceToModule } from "./ProgramInterfaceConverter";
import { RuntimeEnvironmentContext, getDataMap, mapArrays, mapType } from "./RuntimeEnvironment";
import { PropertyCondition } from "./XrpaLanguage";

import { AngularUnitType, CoordAxis, CoordinateSystemDef, SpatialUnitType } from "./shared/CoordinateTransformer";
import { isDataflowProgramDefinition } from "./shared/DataflowProgramDefinition";
import { ArrayTypeSpec } from "./shared/TypeDefinition";

import { IntrinsicProperty } from "./targets/unitypackage/MonoBehaviourShared";
import { UnityPackageModuleDefinition } from "./targets/unitypackage/UnityPackageModuleDefinition";
import { PackageInfo } from "./targets/unitypackage/GenPackage";
import { mapImageTypes } from "./ConvenienceWrappers";

export const UnityCoordinateSystem: CoordinateSystemDef = {
  up: CoordAxis.posY,
  right: CoordAxis.posX,
  forward: CoordAxis.posZ,
  spatialUnit: SpatialUnitType.meter,
  angularUnit: AngularUnitType.degree,
};

export const UnityArrayType: ArrayTypeSpec = {
  typename: "System.Collections.Generic.List",
  setSize: null,
  removeAll: "Clear()",
  addItem: "Add()",
};

export interface UnityRuntimeContext extends RuntimeEnvironmentContext {
  __UnityRuntime: true;
}

export type UnityProgramContext = UnityRuntimeContext & NativeProgramContext;

export const IfUnity: PropertyCondition = {
  propertyToCheck: COMPONENT_BASE_CLASS,
  expectedValue: "MonoBehaviour",
};

function mapCsImageTypes<T extends UnityRuntimeContext>(ctx: T) {
  mapImageTypes(ctx, {
    Image: { typename: "Xrpa.Image" },
    ImageFormat: { typename: "Xrpa.ImageFormat" },
    ImageEncoding: { typename: "Xrpa.ImageEncoding" },
    ImageOrientation: { typename: "Xrpa.ImageOrientation" },
  });
}

function runUnityContext<T extends UnityRuntimeContext>(ctx: T, callback: (ctx: T) => void) {
  GameEngineConfig(ctx, {
    componentBaseClass: "MonoBehaviour",
    intrinsicPositionProperty: IntrinsicProperty.position,
    intrinsicRotationProperty: IntrinsicProperty.rotation,
    intrinsicScaleProperty: IntrinsicProperty.lossyScale,
    intrinsicParentProperty: IntrinsicProperty.Parent,
    intrinsicGameObjectProperty: IntrinsicProperty.gameObject,
  });


  runInContext(ctx, callback, () => {
    useCoordinateSystem(UnityCoordinateSystem);

    mapType(String, { typename: "string" });
    mapType(Vector2, { typename: "UnityEngine.Vector2" });
    mapType(UnitVector2, { typename: "UnityEngine.Vector2" });
    mapType(Distance2, { typename: "UnityEngine.Vector2" });
    mapType(Scale2, { typename: "UnityEngine.Vector2" });
    mapType(Quaternion, { typename: "UnityEngine.Quaternion" });
    mapType(Vector3, { typename: "UnityEngine.Vector3" });
    mapType(UnitVector3, { typename: "UnityEngine.Vector3" });
    mapType(Distance3, { typename: "UnityEngine.Vector3" });
    mapType(Scale3, { typename: "UnityEngine.Vector3" });
    mapType(ColorSRGBA, { typename: "UnityEngine.Color32" });
    mapType(ColorLinear, { typename: "UnityEngine.Color" });
    mapType(EulerAngles, {
      typename: "UnityEngine.Vector3",
      fieldMap: {
        x: "pitch",
        y: "yaw",
        z: "roll",
      },
    });

    mapArrays(UnityArrayType);

  });

  runInContext(ctx, mapCsImageTypes);
}

export async function UnityProject(projectPath: string, projectName: string, callback: (ctx: UnityRuntimeContext) => void) {
  const ctx: UnityRuntimeContext = {
    __isRuntimeEnvironmentContext: true,
    __UnityRuntime: true,
    properties: {},
    externalProgramInterfaces: {},
  };
  runUnityContext(ctx, callback);

  const packageInfos: Record<string, PackageInfo> = {};
  for (const name in ctx.externalProgramInterfaces) {
    const programInterfaceCtx = ctx.externalProgramInterfaces[name];
    const programInterface = programInterfaceCtx.programInterface;
    if (isDataflowProgramDefinition(programInterface)) {
      continue;
    }

    const companyName = (programInterfaceCtx.properties.upperCaseCompanyName) ? programInterface.companyName.toLocaleUpperCase() : programInterface.companyName;
    packageInfos[programInterface.interfaceName] = {
      packageName: `${companyName}${programInterface.interfaceName}`,
      name: `com.${companyName.toLocaleLowerCase()}.${programInterface.interfaceName.toLocaleLowerCase()}`,
      version: programInterface.version,
      displayName: programInterface.interfaceName,
      description: `${programInterface.interfaceName} Bindings`,
      companyName,
      dependencies: [],
    };
  }

  const pkg = new UnityPackageModuleDefinition(projectName, getDataMap(ctx), projectPath, packageInfos);

  for (const name in ctx.externalProgramInterfaces) {
    const programInterfaceCtx = ctx.externalProgramInterfaces[name];
    bindProgramInterfaceToModule(ctx, pkg, programInterfaceCtx.programInterface, true);
  }

  await pkg.doCodeGen().finalize(path.join(projectPath, "xrpa-manifest.json"));
}

export function XrpaNativeUnityProgram(packageName: string, outputPath: string, callback: (ctx: UnityRuntimeContext) => void) {
  const ctx: UnityProgramContext = {
    __isNativeProgramContext: true,
    __isRuntimeEnvironmentContext: true,
    __UnityRuntime: true,
    properties: {},
    programInterfaces: [],
    externalProgramInterfaces: {},
  };
  runUnityContext(ctx, callback);

  const programInterface = ctx.programInterfaces[0];
  if (!programInterface) {
    throw new Error("No program interface defined");
  }
  if (ctx.programInterfaces.length > 1) {
    throw new Error("Only one program interface is supported for Unity native programs");
  }

  const companyName = programInterface.companyName;
  const packageInfo: PackageInfo = {
    packageName,
    name: `com.${companyName.toLocaleLowerCase()}.${packageName.toLocaleLowerCase()}`,
    version: [1, 0, 0],
    displayName: programInterface.interfaceName,
    description: `${programInterface.interfaceName} Bindings`,
    companyName,
    dependencies: [],
  };

  const packageInfos: Record<string, PackageInfo> = {
    [programInterface.interfaceName]: packageInfo,
  };
  for (const name in ctx.externalProgramInterfaces) {
    const programInterfaceCtx = ctx.externalProgramInterfaces[name];
    if (isDataflowProgramDefinition(programInterfaceCtx.programInterface)) {
      continue;
    }
    packageInfos[programInterfaceCtx.programInterface.interfaceName] = packageInfo;
  }

  const pkg = new UnityPackageModuleDefinition(packageName, getDataMap(ctx), outputPath, packageInfos);

  bindProgramInterfaceToModule(ctx, pkg, programInterface, false);
  for (const name in ctx.externalProgramInterfaces) {
    const programInterfaceCtx = ctx.externalProgramInterfaces[name];
    bindProgramInterfaceToModule(ctx, pkg, programInterfaceCtx.programInterface, true);
  }

  return pkg;
}
