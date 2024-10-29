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
exports.getFieldMappings = exports.genSemanticConversion = exports.performSemanticConversion = exports.buildCoordTransformer = exports.DEFAULT_COORDINATE_SYSTEM = exports.AngularUnitType = exports.SpatialUnitType = exports.UnitType = exports.CoordAxis = void 0;
// NOTE: this file is agnostic to output language and can be reused for C#, Python, etc.
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const TypeValue_1 = require("./TypeValue");
var CoordAxis;
(function (CoordAxis) {
    CoordAxis["posX"] = "X";
    CoordAxis["negX"] = "-X";
    CoordAxis["posY"] = "Y";
    CoordAxis["negY"] = "-Y";
    CoordAxis["posZ"] = "Z";
    CoordAxis["negZ"] = "-Z";
})(CoordAxis = exports.CoordAxis || (exports.CoordAxis = {}));
var UnitType;
(function (UnitType) {
    UnitType["angular"] = "angular";
    UnitType["spatial"] = "spatial";
})(UnitType = exports.UnitType || (exports.UnitType = {}));
var SpatialUnitType;
(function (SpatialUnitType) {
    SpatialUnitType["centimeter"] = "centimeter";
    SpatialUnitType["meter"] = "meter";
})(SpatialUnitType = exports.SpatialUnitType || (exports.SpatialUnitType = {}));
var AngularUnitType;
(function (AngularUnitType) {
    AngularUnitType["degree"] = "degree";
    AngularUnitType["radian"] = "radian";
})(AngularUnitType = exports.AngularUnitType || (exports.AngularUnitType = {}));
exports.DEFAULT_COORDINATE_SYSTEM = {
    up: CoordAxis.posY,
    right: CoordAxis.posX,
    forward: CoordAxis.negZ,
    spatialUnit: SpatialUnitType.meter,
    angularUnit: AngularUnitType.radian,
};
const AXIS_LOOKUP = {
    [CoordAxis.posX]: { idx: 0, sign: 1 },
    [CoordAxis.negX]: { idx: 0, sign: -1 },
    [CoordAxis.posY]: { idx: 1, sign: 1 },
    [CoordAxis.negY]: { idx: 1, sign: -1 },
    [CoordAxis.posZ]: { idx: 2, sign: 1 },
    [CoordAxis.negZ]: { idx: 2, sign: -1 },
};
function remapAxis(map, from, to) {
    const src = AXIS_LOOKUP[from];
    const dst = AXIS_LOOKUP[to];
    map[dst.idx] = { idx: src.idx, sign: src.sign * dst.sign };
}
function vectorFromAxis(axis) {
    const a = AXIS_LOOKUP[axis];
    const ret = [0, 0, 0];
    ret[a.idx] = a.sign;
    return ret;
}
function crossProduct(a, b) {
    const ret = [0, 0, 0];
    ret[0] = a[1] * b[2] - a[2] * b[1];
    ret[1] = a[2] * b[0] - a[0] * b[2];
    ret[2] = a[0] * b[1] - a[1] * b[0];
    return ret;
}
function dotProduct(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function calcHandedness(coord) {
    const rhUp = crossProduct(vectorFromAxis(coord.right), vectorFromAxis(coord.forward));
    return dotProduct(rhUp, vectorFromAxis(coord.up));
}
function buildCoordTransformer(from, to, unitTransformer) {
    const transformer = {
        multiplier: {
            angular: unitTransformer.angular[from.angularUnit]?.[to.angularUnit] ?? ["", 1],
            spatial: unitTransformer.spatial[from.spatialUnit]?.[to.spatialUnit] ?? ["", 1],
            none: ["", 1],
        },
        axisMap: [
            { idx: 0, sign: 1 },
            { idx: 1, sign: 1 },
            { idx: 2, sign: 1 },
        ],
        handednessFlip: calcHandedness(from) !== calcHandedness(to),
    };
    remapAxis(transformer.axisMap, from.up, to.up);
    remapAxis(transformer.axisMap, from.right, to.right);
    remapAxis(transformer.axisMap, from.forward, to.forward);
    return transformer;
}
exports.buildCoordTransformer = buildCoordTransformer;
function remapCoordinates(typeConfig, elemCount, fromFieldOrder, toFieldOrder, transformer) {
    const multiplier = transformer.multiplier[typeConfig.units ?? "none"] ?? "";
    const dstElems = [];
    for (let i = 0; i < elemCount; ++i) {
        dstElems.push({ idx: i, neg: false, multiplier });
    }
    if (typeConfig.isCoords) {
        const srcElems = (0, xrpa_utils_1.clone)(dstElems);
        for (let i = 0; i < 3; ++i) {
            dstElems[i] = srcElems[transformer.axisMap[i].idx];
            if (transformer.axisMap[i].sign < 0 && !typeConfig.isScalar) {
                dstElems[i].neg = !dstElems[i].neg;
            }
        }
        if (typeConfig.flipSignWithHandedness && transformer.handednessFlip) {
            for (let i = 0; i < 3; ++i) {
                dstElems[i].neg = !dstElems[i].neg;
            }
        }
    }
    else if (typeConfig.coordMatrixDims) {
        const cols = typeConfig.coordMatrixDims[0];
        const rows = typeConfig.coordMatrixDims[1];
        // swizzle columns
        let srcElems = (0, xrpa_utils_1.clone)(dstElems);
        for (let i = 0; i < 3; ++i) {
            const { idx, sign } = transformer.axisMap[i];
            for (let j = 0; j < rows; ++j) {
                dstElems[i * rows + j] = srcElems[idx * rows + j];
                if (sign < 0) {
                    dstElems[i * rows + j].neg = !dstElems[i * rows + j].neg;
                }
            }
        }
        // swizzle elements within columns
        srcElems = (0, xrpa_utils_1.clone)(dstElems);
        for (let i = 0; i < cols; ++i) {
            for (let j = 0; j < 3; ++j) {
                const { idx, sign } = transformer.axisMap[j];
                dstElems[i * rows + j] = srcElems[i * rows + idx];
                if (sign < 0) {
                    dstElems[i * rows + j].neg = !dstElems[i * rows + j].neg;
                }
            }
        }
        if (cols > 3) {
            // apply spatial multiplier to col[3]
            for (let j = 0; j < 3; ++j) {
                dstElems[3 * rows + j].multiplier = transformer.multiplier.spatial;
            }
        }
    }
    (0, assert_1.default)(fromFieldOrder.length === toFieldOrder.length);
    (0, assert_1.default)(fromFieldOrder.length === elemCount);
    const srcElems = (0, xrpa_utils_1.clone)(dstElems);
    for (let i = 0; i < toFieldOrder.length; ++i) {
        const srcIdx = fromFieldOrder.indexOf(toFieldOrder[i]);
        if (srcIdx < 0) {
            throw new Error(`Field ${toFieldOrder[i]} not found in [${fromFieldOrder.join(", ")}]`);
        }
        dstElems[i] = srcElems[srcIdx];
    }
    return dstElems;
}
function performSemanticConversion(params) {
    const elems = remapCoordinates(params.coordTypeConfig, params.valElems.length, params.valFieldOrder, params.returnFieldOrder, params.transform);
    return elems.map(elem => {
        let elemVal = params.valElems[elem.idx];
        if (elemVal instanceof TypeValue_1.PrimitiveValue) {
            (0, assert_1.default)(typeof elemVal.value === "number");
            elemVal = new TypeValue_1.PrimitiveValue(params.codegen, elemVal.typename, (elem.neg ? -1 : 1) * elemVal.value * elem.multiplier[1]);
        }
        if (elemVal instanceof TypeValue_1.CodeLiteralValue) {
            elemVal = new TypeValue_1.CodeLiteralValue(params.codegen, `${elem.neg ? "-" : ""}${elemVal}${elem.multiplier[0]}`);
        }
        return elemVal;
    });
}
exports.performSemanticConversion = performSemanticConversion;
function genSemanticConversion(params) {
    const elemCount = params.valFieldOrder.length;
    const elems = remapCoordinates(params.coordTypeConfig, elemCount, params.valFieldOrder, params.returnFieldOrder, params.transform);
    return elems.map(elem => {
        let elemName = params.valFieldOrder[elem.idx];
        if (params.valFieldMapping) {
            elemName = params.valFieldMapping[elemName];
        }
        if (params.valName) {
            if (elemCount === 1) {
                elemName = params.valName;
            }
            else {
                elemName = `${params.valName}.${elemName}`;
            }
        }
        return new TypeValue_1.CodeLiteralValue(params.codegen, `${elem.neg ? "-" : ""}${elemName}${elem.multiplier[0]}`);
    });
}
exports.genSemanticConversion = genSemanticConversion;
// fieldMap maps from local struct's field names to dataset struct's field names
function getFieldMappings(fields, fieldMap) {
    const mappings = {
        fields,
        toLocal: {},
        fromLocal: {},
    };
    // generate bidirectional field name maps, unordered
    const fieldMapLocalToDataset = fieldMap ?? Object.keys(mappings.fields).reduce((acc, key) => { acc[key] = key; return acc; }, {});
    const fieldMapDatasetToLocal = Object.keys(fieldMapLocalToDataset).reduce((acc, key) => { acc[fieldMapLocalToDataset[key]] = key; return acc; }, {});
    // fill the fromLocal map in dataset field order
    const dsFieldOrder = Object.keys(mappings.fields);
    for (const dsFieldName of dsFieldOrder) {
        const localFieldName = fieldMapDatasetToLocal[dsFieldName];
        mappings.fromLocal[localFieldName] = dsFieldName;
    }
    // fill the toLocal map in local field order
    const localFieldOrder = fieldMap ? Object.values(fieldMap) : dsFieldOrder;
    for (const dsFieldName of localFieldOrder) {
        const localFieldName = fieldMapDatasetToLocal[dsFieldName];
        mappings.toLocal[dsFieldName] = localFieldName;
    }
    return mappings;
}
exports.getFieldMappings = getFieldMappings;
//# sourceMappingURL=CoordinateTransformer.js.map
