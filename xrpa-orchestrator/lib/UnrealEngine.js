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
exports.UnrealProject = exports.PluginDeps = exports.UnrealArrayType = exports.UnrealCoordinateSystem = void 0;
const path_1 = __importDefault(require("path"));
const Coordinates_1 = require("./Coordinates");
const InterfaceTypes_1 = require("./InterfaceTypes");
const GameEngine_1 = require("./GameEngine");
const ProgramInterfaceConverter_1 = require("./ProgramInterfaceConverter");
const RuntimeEnvironment_1 = require("./RuntimeEnvironment");
const XrpaLanguage_1 = require("./XrpaLanguage");
const CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
const Helpers_1 = require("./shared/Helpers");
const SceneComponentShared_1 = require("./targets/ueplugin/SceneComponentShared");
const UepluginModuleDefinition_1 = require("./targets/ueplugin/UepluginModuleDefinition");
exports.UnrealCoordinateSystem = {
    up: CoordinateTransformer_1.CoordAxis.posZ,
    right: CoordinateTransformer_1.CoordAxis.posY,
    forward: CoordinateTransformer_1.CoordAxis.posX,
    spatialUnit: CoordinateTransformer_1.SpatialUnitType.centimeter,
    angularUnit: CoordinateTransformer_1.AngularUnitType.degree,
};
exports.UnrealArrayType = {
    headerFile: "Engine.h",
    typename: "TArray",
    getSize: "Num()",
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
function PluginDeps(ctx, pluginDeps) {
    ctx.properties.pluginDeps = pluginDeps;
}
exports.PluginDeps = PluginDeps;
async function UnrealProject(projectPath, projectName, callback) {
    const ctx = (0, GameEngine_1.GameEngineConfig)({
        __isRuntimeEnvironmentContext: true,
        __UnrealEngineRuntime: true,
        properties: {},
        externalProgramInterfaces: {},
    }, {
        componentBaseClass: "SceneComponent",
        intrinsicPositionProperty: SceneComponentShared_1.IntrinsicProperty.Location,
        intrinsicRotationProperty: SceneComponentShared_1.IntrinsicProperty.Rotation,
        intrinsicScaleProperty: SceneComponentShared_1.IntrinsicProperty.Scale3D,
        intrinsicParentProperty: SceneComponentShared_1.IntrinsicProperty.Parent,
        intrinsicGameObjectProperty: SceneComponentShared_1.IntrinsicProperty.Parent,
    });
    (0, XrpaLanguage_1.runInContext)(ctx, ctx => {
        (0, Coordinates_1.useCoordinateSystem)(exports.UnrealCoordinateSystem);
        (0, RuntimeEnvironment_1.mapType)(InterfaceTypes_1.String, {
            typename: "FString",
            headerFile: "<xrpa-runtime/ue/FStringHelpers.h>",
            conversionOperator: "FStringAdaptor",
        });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Vector2, FVector2D);
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.UnitVector2, FVector2D);
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Distance2, FVector2D);
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Scale2, FVector2D);
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Quaternion, {
            typename: "FQuat",
            headerFile: "Engine.h",
            fieldMap: {
                X: "x",
                Y: "y",
                Z: "z",
                W: "w",
            },
        });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Vector3, FVector);
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.UnitVector3, FVector);
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Distance3, FVector);
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.Scale3, FVector);
        (0, RuntimeEnvironment_1.mapType)(InterfaceTypes_1.ColorSRGBA, {
            typename: "FColor",
            headerFile: "Engine.h",
        });
        (0, RuntimeEnvironment_1.mapType)(InterfaceTypes_1.ColorLinear, {
            typename: "FLinearColor",
            headerFile: "Engine.h",
        });
        (0, RuntimeEnvironment_1.mapType)(Coordinates_1.EulerAngles, {
            typename: "FRotator",
            headerFile: "Engine.h",
            fieldMap: {
                Pitch: "pitch",
                Roll: "roll",
                Yaw: "yaw",
            },
        });
        (0, RuntimeEnvironment_1.mapArrays)(exports.UnrealArrayType);
        callback(ctx);
    });
    const pluginConfigs = {};
    for (const name in ctx.externalProgramInterfaces) {
        const programInterfaceCtx = ctx.externalProgramInterfaces[name];
        const programInterface = programInterfaceCtx.programInterface;
        const companyName = programInterfaceCtx.properties.upperCaseCompanyName ? programInterface.companyName.toLocaleUpperCase() : programInterface.companyName;
        pluginConfigs[programInterface.interfaceName] = {
            pluginName: `${companyName}${programInterface.interfaceName}`,
            deps: (0, Helpers_1.filterToStringPairArray)(programInterfaceCtx.properties.pluginDeps) ?? [],
        };
    }
    const pkg = new UepluginModuleDefinition_1.UepluginModuleDefinition(projectName, (0, RuntimeEnvironment_1.getDataMap)(ctx), projectPath, pluginConfigs);
    for (const name in ctx.externalProgramInterfaces) {
        (0, ProgramInterfaceConverter_1.bindProgramInterfaceToModule)(ctx, pkg, ctx.externalProgramInterfaces[name].programInterface, true);
    }
    await pkg.doCodeGen().finalize(path_1.default.join(projectPath, "xrpa-manifest.json"));
}
exports.UnrealProject = UnrealProject;
//# sourceMappingURL=UnrealEngine.js.map
