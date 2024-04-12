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

Object.defineProperty(exports, "__esModule", { value: true });
exports.UepluginModule = exports.UnrealArrayType = exports.UnrealTypeMap = exports.UnrealCoordinateSystem = void 0;
const CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
const DataMap_1 = require("./shared/DataMap");
const UepluginModuleDefinition_1 = require("./targets/ueplugin/UepluginModuleDefinition");
exports.UnrealCoordinateSystem = {
    up: CoordinateTransformer_1.CoordAxis.posZ,
    right: CoordinateTransformer_1.CoordAxis.posY,
    forward: CoordinateTransformer_1.CoordAxis.posX,
    spatialUnit: CoordinateTransformer_1.SpatialUnitType.centimeter,
    angularUnit: CoordinateTransformer_1.AngularUnitType.degree,
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
exports.UnrealTypeMap = {
    String: {
        typename: "FString",
        headerFile: "<dataset/ue/FStringHelpers.h>",
        conversionOperator: "FStringAdaptor",
    },
    Vector2: FVector2D,
    UnitVector2: FVector2D,
    Distance2: FVector2D,
    Scale2: FVector2D,
    Quaternion: {
        typename: "FQuat",
        headerFile: "Engine.h",
        fieldMap: {
            X: "x",
            Y: "y",
            Z: "z",
            W: "w",
        },
    },
    Vector3: FVector,
    UnitVector3: FVector,
    Distance3: FVector,
    Scale3: FVector,
    ColorSRGBA: {
        typename: "FColor",
        headerFile: "Engine.h",
    },
    ColorLinear: {
        typename: "FLinearColor",
        headerFile: "Engine.h",
    },
    EulerAngles: {
        typename: "FRotator",
        headerFile: "Engine.h",
        fieldMap: {
            Pitch: "pitch",
            Roll: "roll",
            Yaw: "yaw",
        },
    },
};
exports.UnrealArrayType = {
    headerFile: "Engine.h",
    typename: "TArray",
    getSize: "Num()",
    setSize: "SetNum()",
    removeAll: "Empty()",
    addItem: "Add()",
};
function UepluginModule(name, params) {
    const datamap = new DataMap_1.DataMapDefinition(params.coordinateSystem ?? exports.UnrealCoordinateSystem, params.typeMap ?? exports.UnrealTypeMap, [], params.arrayType ?? exports.UnrealArrayType);
    return new UepluginModuleDefinition_1.UepluginModuleDefinition(name, datamap, params.pluginsRoot, params.pluginDeps ?? []);
}
exports.UepluginModule = UepluginModule;
//# sourceMappingURL=UnrealEngine.js.map
