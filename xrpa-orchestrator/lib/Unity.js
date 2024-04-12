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
exports.UnityPackageModule = exports.UnityArrayType = exports.UnityTypeMap = exports.UnityCoordinateSystem = void 0;
const CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
const DataMap_1 = require("./shared/DataMap");
const UnityPackageModuleDefinition_1 = require("./targets/unitypackage/UnityPackageModuleDefinition");
exports.UnityCoordinateSystem = {
    up: CoordinateTransformer_1.CoordAxis.posY,
    right: CoordinateTransformer_1.CoordAxis.posX,
    forward: CoordinateTransformer_1.CoordAxis.posZ,
    spatialUnit: CoordinateTransformer_1.SpatialUnitType.meter,
    angularUnit: CoordinateTransformer_1.AngularUnitType.degree,
};
exports.UnityTypeMap = {
    String: { typename: "string" },
    Vector2: { typename: "UnityEngine.Vector2" },
    UnitVector2: { typename: "UnityEngine.Vector2" },
    Distance2: { typename: "UnityEngine.Vector2" },
    Scale2: { typename: "UnityEngine.Vector2" },
    Quaternion: { typename: "UnityEngine.Quaternion" },
    Vector3: { typename: "UnityEngine.Vector3" },
    UnitVector3: { typename: "UnityEngine.Vector3" },
    Distance3: { typename: "UnityEngine.Vector3" },
    Scale3: { typename: "UnityEngine.Vector3" },
    ColorSRGBA: { typename: "UnityEngine.Color32" },
    ColorLinear: { typename: "UnityEngine.Color" },
    EulerAngles: {
        typename: "UnityEngine.Vector3",
        fieldMap: {
            x: "pitch",
            y: "yaw",
            z: "roll",
        },
    },
};
exports.UnityArrayType = {
    typename: "System.Collections.Generic.List",
    getSize: "Count",
    setSize: null,
    removeAll: "Clear()",
    addItem: "Add()",
};
function UnityPackageModule(name, params) {
    const datamap = new DataMap_1.DataMapDefinition(params.coordinateSystem ?? exports.UnityCoordinateSystem, params.typeMap ?? exports.UnityTypeMap, [], params.arrayType ?? exports.UnityArrayType);
    return new UnityPackageModuleDefinition_1.UnityPackageModuleDefinition(datamap, params.packagesRoot, {
        packageName: name,
        ...params.packageInfo,
    });
}
exports.UnityPackageModule = UnityPackageModule;
//# sourceMappingURL=Unity.js.map
