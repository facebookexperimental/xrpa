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

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrpaNativeUnityProgram = exports.UnityProject = exports.IfUnity = exports.UnityArrayType = exports.UnityCoordinateSystem = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const path_1 = __importDefault(require("path"));
const Coordinates_1 = require("./Coordinates");
const GameEngine_1 = require("./GameEngine");
const InterfaceTypes_1 = require("./InterfaceTypes");
const ProgramInterfaceConverter_1 = require("./ProgramInterfaceConverter");
const RuntimeEnvironment_1 = require("./RuntimeEnvironment");
const CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
const DataflowProgramDefinition_1 = require("./shared/DataflowProgramDefinition");
const MonoBehaviourShared_1 = require("./targets/unitypackage/MonoBehaviourShared");
const UnityPackageModuleDefinition_1 = require("./targets/unitypackage/UnityPackageModuleDefinition");
exports.UnityCoordinateSystem = {
    up: CoordinateTransformer_1.CoordAxis.posY,
    right: CoordinateTransformer_1.CoordAxis.posX,
    forward: CoordinateTransformer_1.CoordAxis.posZ,
    spatialUnit: CoordinateTransformer_1.SpatialUnitType.meter,
    angularUnit: CoordinateTransformer_1.AngularUnitType.degree,
};
exports.UnityArrayType = {
    typename: "System.Collections.Generic.List",
    setSize: null,
    removeAll: "Clear()",
    addItem: "Add()",
};
exports.IfUnity = {
    propertyToCheck: GameEngine_1.COMPONENT_BASE_CLASS,
    expectedValue: "MonoBehaviour",
};
function runUnityContext(ctx, callback) {
    (0, GameEngine_1.GameEngineConfig)(ctx, {
        componentBaseClass: "MonoBehaviour",
        intrinsicPositionProperty: MonoBehaviourShared_1.IntrinsicProperty.position,
        intrinsicRotationProperty: MonoBehaviourShared_1.IntrinsicProperty.rotation,
        intrinsicScaleProperty: MonoBehaviourShared_1.IntrinsicProperty.lossyScale,
        intrinsicParentProperty: MonoBehaviourShared_1.IntrinsicProperty.Parent,
        intrinsicGameObjectProperty: MonoBehaviourShared_1.IntrinsicProperty.gameObject,
    });
    (0, xrpa_utils_1.runInContext)(ctx, callback, () => {
        (0, Coordinates_1.useCoordinateSystem)(exports.UnityCoordinateSystem);
        (0, RuntimeEnvironment_1.mapType)(InterfaceTypes_1.String, { typename: "string" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Vector2, { typename: "UnityEngine.Vector2" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.UnitVector2, { typename: "UnityEngine.Vector2" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Distance2, { typename: "UnityEngine.Vector2" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Scale2, { typename: "UnityEngine.Vector2" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Quaternion, { typename: "UnityEngine.Quaternion" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Vector3, { typename: "UnityEngine.Vector3" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.UnitVector3, { typename: "UnityEngine.Vector3" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Distance3, { typename: "UnityEngine.Vector3" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Scale3, { typename: "UnityEngine.Vector3" });
        (0, RuntimeEnvironment_1.mapType)(InterfaceTypes_1.ColorSRGBA, { typename: "UnityEngine.Color32" });
        (0, RuntimeEnvironment_1.mapType)(InterfaceTypes_1.ColorLinear, { typename: "UnityEngine.Color" });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.EulerAngles, {
            typename: "UnityEngine.Vector3",
            fieldMap: {
                x: "pitch",
                y: "yaw",
                z: "roll",
            },
        });
        (0, RuntimeEnvironment_1.mapArrays)(exports.UnityArrayType);
    });
}
async function UnityProject(projectPath, projectName, callback) {
    const ctx = {
        __isRuntimeEnvironmentContext: true,
        __UnityRuntime: true,
        properties: {},
        externalProgramInterfaces: {},
    };
    runUnityContext(ctx, callback);
    const packageInfos = {};
    for (const name in ctx.externalProgramInterfaces) {
        const programInterfaceCtx = ctx.externalProgramInterfaces[name];
        const programInterface = programInterfaceCtx.programInterface;
        if ((0, DataflowProgramDefinition_1.isDataflowProgramDefinition)(programInterface)) {
            continue;
        }
        const companyName = (programInterfaceCtx.properties.upperCaseCompanyName) ? programInterface.companyName.toLocaleUpperCase() : programInterface.companyName;
        packageInfos[programInterface.interfaceName] = {
            packageName: `${companyName}${programInterface.interfaceName}`,
            name: `com.${companyName.toLocaleLowerCase()}.${programInterface.interfaceName.toLocaleLowerCase()}`,
            version: [1, 0, 0],
            displayName: programInterface.interfaceName,
            description: `${programInterface.interfaceName} Bindings`,
            companyName,
            dependencies: [],
        };
    }
    const pkg = new UnityPackageModuleDefinition_1.UnityPackageModuleDefinition(projectName, (0, RuntimeEnvironment_1.getDataMap)(ctx), projectPath, packageInfos);
    for (const name in ctx.externalProgramInterfaces) {
        const programInterfaceCtx = ctx.externalProgramInterfaces[name];
        (0, ProgramInterfaceConverter_1.bindProgramInterfaceToModule)(ctx, pkg, programInterfaceCtx.programInterface, true);
    }
    await pkg.doCodeGen().finalize(path_1.default.join(projectPath, "xrpa-manifest.json"));
}
exports.UnityProject = UnityProject;
function XrpaNativeUnityProgram(packageName, outputPath, callback) {
    const ctx = {
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
    const packageInfo = {
        packageName,
        name: `com.${companyName.toLocaleLowerCase()}.${packageName.toLocaleLowerCase()}`,
        version: [1, 0, 0],
        displayName: programInterface.interfaceName,
        description: `${programInterface.interfaceName} Bindings`,
        companyName,
        dependencies: [],
    };
    const packageInfos = {
        [programInterface.interfaceName]: packageInfo,
    };
    for (const name in ctx.externalProgramInterfaces) {
        const programInterfaceCtx = ctx.externalProgramInterfaces[name];
        if ((0, DataflowProgramDefinition_1.isDataflowProgramDefinition)(programInterfaceCtx.programInterface)) {
            continue;
        }
        packageInfos[programInterfaceCtx.programInterface.interfaceName] = packageInfo;
    }
    const pkg = new UnityPackageModuleDefinition_1.UnityPackageModuleDefinition(packageName, (0, RuntimeEnvironment_1.getDataMap)(ctx), outputPath, packageInfos);
    (0, ProgramInterfaceConverter_1.bindProgramInterfaceToModule)(ctx, pkg, programInterface, false);
    for (const name in ctx.externalProgramInterfaces) {
        const programInterfaceCtx = ctx.externalProgramInterfaces[name];
        (0, ProgramInterfaceConverter_1.bindProgramInterfaceToModule)(ctx, pkg, programInterfaceCtx.programInterface, true);
    }
    return pkg;
}
exports.XrpaNativeUnityProgram = XrpaNativeUnityProgram;
//# sourceMappingURL=Unity.js.map
