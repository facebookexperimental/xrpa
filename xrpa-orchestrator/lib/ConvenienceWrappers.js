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
exports.CppModule = exports.StdVectorArrayType = exports.OvrCoordinateSystem = exports.withHeader = void 0;
const CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
const DataMap_1 = require("./shared/DataMap");
const CppModuleDefinition_1 = require("./targets/cpp/CppModuleDefinition");
function withHeader(headerFile, types) {
    const ret = {};
    for (const key in types) {
        ret[key] = {
            typename: types[key],
            headerFile,
        };
    }
    return ret;
}
exports.withHeader = withHeader;
exports.OvrCoordinateSystem = {
    up: CoordinateTransformer_1.CoordAxis.posY,
    right: CoordinateTransformer_1.CoordAxis.posX,
    forward: CoordinateTransformer_1.CoordAxis.negZ,
    spatialUnit: CoordinateTransformer_1.SpatialUnitType.meter,
    angularUnit: CoordinateTransformer_1.AngularUnitType.radian,
};
exports.StdVectorArrayType = {
    headerFile: "<vector>",
    typename: "std::vector",
    getSize: "size()",
    setSize: "resize()",
    removeAll: "clear()",
    addItem: "push()",
};
function CppModule(name, params) {
    const datamap = new DataMap_1.DataMapDefinition(params.coordinateSystem, params.typeMap ?? {}, params.typeBuckDeps ?? [], params.arrayType);
    return new CppModuleDefinition_1.CppModuleDefinition(name, datamap, params.libDir, {
        target: params.buckTarget,
        oncall: params.buckOnCall,
    });
}
exports.CppModule = CppModule;
//# sourceMappingURL=ConvenienceWrappers.js.map
