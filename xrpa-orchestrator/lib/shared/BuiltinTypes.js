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
exports.getSemanticType = exports.genPrimitiveTypes = exports.isBuiltinType = exports.BuiltinType = void 0;
const CoordinateTransformer_1 = require("./CoordinateTransformer");
const NumericSemanticType_1 = require("./NumericSemanticType");
const PrimitiveType_1 = require("./PrimitiveType");
const TypeDefinition_1 = require("./TypeDefinition");
const TypeValue_1 = require("./TypeValue");
var BuiltinType;
(function (BuiltinType) {
    BuiltinType["Boolean"] = "Boolean";
    BuiltinType["Count"] = "Count";
    BuiltinType["BitField"] = "BitField";
    BuiltinType["Scalar"] = "Scalar";
    BuiltinType["Timestamp"] = "Timestamp";
    BuiltinType["String"] = "String";
    BuiltinType["Angle"] = "Angle";
    BuiltinType["Distance"] = "Distance";
    BuiltinType["Matrix3x2"] = "Matrix3x2";
    BuiltinType["Vector2"] = "Vector2";
    BuiltinType["UnitVector2"] = "UnitVector2";
    BuiltinType["Distance2"] = "Distance2";
    BuiltinType["Scale2"] = "Scale2";
    BuiltinType["Matrix4x3"] = "Matrix4x3";
    BuiltinType["Matrix4x4"] = "Matrix4x4";
    BuiltinType["Quaternion"] = "Quaternion";
    BuiltinType["EulerAngles"] = "EulerAngles";
    BuiltinType["Vector3"] = "Vector3";
    BuiltinType["UnitVector3"] = "UnitVector3";
    BuiltinType["Distance3"] = "Distance3";
    BuiltinType["Scale3"] = "Scale3";
    BuiltinType["ColorSRGBA"] = "ColorSRGBA";
    BuiltinType["ColorLinear"] = "ColorLinear";
    BuiltinType["Signal"] = "Signal";
})(BuiltinType = exports.BuiltinType || (exports.BuiltinType = {}));
function isBuiltinType(typeName) {
    return BuiltinType[typeName] !== undefined;
}
exports.isBuiltinType = isBuiltinType;
/*****************************************************/
class TimestampType extends PrimitiveType_1.PrimitiveType {
    constructor(codegen, localType) {
        super(codegen, "Timestamp", codegen.PRIMITIVE_INTRINSICS.uint64, localType, 8, false, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint64.typename, 0), new TypeValue_1.CodeLiteralValue(codegen, codegen.GET_CURRENT_CLOCK_TIME));
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.CLEAR_SET;
    }
    convertValueFromLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.PrimitiveValue) {
            return new TypeValue_1.PrimitiveValue(this.codegen, this.datasetType.typename, value.value);
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
        }
        const dsType = this.getInternalType(inNamespace, includes);
        const localType = this.getLocalType(inNamespace, includes);
        return new TypeValue_1.CodeLiteralValue(this.codegen, this.codegen.reinterpretValue(localType, dsType, value));
    }
    convertValueToLocal(inNamespace, includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.PrimitiveValue) {
            return new TypeValue_1.PrimitiveValue(this.codegen, this.localType.typename, value.value);
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
        }
        const dsType = this.getInternalType(inNamespace, includes);
        const localType = this.getLocalType(inNamespace, includes);
        return new TypeValue_1.CodeLiteralValue(this.codegen, this.codegen.reinterpretValue(dsType, localType, value));
    }
}
/*****************************************************/
class BooleanType extends PrimitiveType_1.PrimitiveType {
    constructor(codegen) {
        super(codegen, "Boolean", codegen.PRIMITIVE_INTRINSICS.int32, codegen.PRIMITIVE_INTRINSICS.bool, 4, false, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.int32.typename, 0));
    }
    userDefaultToTypeValue(_inNamespace, _includes, userDefault) {
        if (userDefault === true || userDefault === 1) {
            return new TypeValue_1.PrimitiveValue(this.codegen, this.datasetType.typename, 1);
        }
        return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    convertValueFromLocal(_inNamespace, _includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.PrimitiveValue) {
            return new TypeValue_1.PrimitiveValue(this.codegen, this.datasetType.typename, value.value ? 1 : 0);
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
        }
        return new TypeValue_1.CodeLiteralValue(this.codegen, `(${value} ? 1 : 0)`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    convertValueToLocal(_inNamespace, _includes, value) {
        if (typeof value === "string") {
            value = new TypeValue_1.CodeLiteralValue(this.codegen, value);
        }
        if (value instanceof TypeValue_1.PrimitiveValue) {
            return new TypeValue_1.PrimitiveValue(this.codegen, this.localType.typename, value.value === 1 ? true : false);
        }
        if (value instanceof TypeValue_1.EmptyValue) {
            return new TypeValue_1.EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
        }
        return new TypeValue_1.CodeLiteralValue(this.codegen, `(${value} == 1 ? true : false)`);
    }
}
/*****************************************************/
class SignalDataType extends PrimitiveType_1.PrimitiveType {
    constructor(codegen) {
        super(codegen, "Signal", { typename: "DSSignalData" }, { typename: "SignalData" }, 0, false, new TypeValue_1.EmptyValue(codegen, "DSSignalData", ""));
    }
    getMetaType() {
        return TypeDefinition_1.TypeMetaType.SIGNAL_DATA;
    }
}
/*****************************************************/
function genPrimitiveTypes(codegen, typeMap) {
    return {
        [BuiltinType.Boolean]: new BooleanType(codegen),
        // TODO maybe rename Count -> WholeNumber, and then add Count back as a semantic type instead? (constrained to >= 0)
        [BuiltinType.Count]: new PrimitiveType_1.PrimitiveType(codegen, BuiltinType.Count, codegen.PRIMITIVE_INTRINSICS.int32, typeMap[BuiltinType.Count] ?? codegen.PRIMITIVE_INTRINSICS.int, 4, true, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.int32.typename, 0)),
        [BuiltinType.BitField]: new PrimitiveType_1.PrimitiveType(codegen, BuiltinType.BitField, codegen.PRIMITIVE_INTRINSICS.uint64, codegen.PRIMITIVE_INTRINSICS.uint64, 8, true, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint64.typename, 0)),
        [BuiltinType.Timestamp]: new TimestampType(codegen, typeMap[BuiltinType.Timestamp] ?? codegen.PRIMITIVE_INTRINSICS.microseconds),
        // TODO this is only to support string settings; actual string support in the dataset will need additional work
        [BuiltinType.String]: new PrimitiveType_1.PrimitiveType(codegen, BuiltinType.String, codegen.PRIMITIVE_INTRINSICS.string, typeMap[BuiltinType.String] ?? codegen.PRIMITIVE_INTRINSICS.string, 0, true, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.string.typename, "")),
        [BuiltinType.Signal]: new SignalDataType(codegen),
    };
}
exports.genPrimitiveTypes = genPrimitiveTypes;
/*****************************************************/
function getSemanticType(codegen, typeName, apiname, typeMap, localCoordinateSystem, storedCoordinateSystem) {
    const conversionData = {
        apiname,
        toLocalTransform: (0, CoordinateTransformer_1.buildCoordTransformer)(storedCoordinateSystem, localCoordinateSystem, codegen.UNIT_TRANSFORMER),
        fromLocalTransform: (0, CoordinateTransformer_1.buildCoordTransformer)(localCoordinateSystem, storedCoordinateSystem, codegen.UNIT_TRANSFORMER),
    };
    const ByteType = new PrimitiveType_1.PrimitiveType(codegen, "byte", codegen.PRIMITIVE_INTRINSICS.uint8, codegen.PRIMITIVE_INTRINSICS.uint8, 4, true, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint8.typename, 0));
    const FloatType = new PrimitiveType_1.PrimitiveType(codegen, "float", codegen.PRIMITIVE_INTRINSICS.float32, codegen.PRIMITIVE_INTRINSICS.float32, 4, true, new TypeValue_1.PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.float32.typename, 0));
    switch (typeName) {
        case BuiltinType.Scalar:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Scalar, typeMap[BuiltinType.Scalar] ?? codegen.PRIMITIVE_INTRINSICS.float32, {
                value: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {
                isScalar: true,
            });
        case BuiltinType.Angle:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Angle, typeMap[BuiltinType.Angle] ?? codegen.PRIMITIVE_INTRINSICS.float32, {
                value: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                units: CoordinateTransformer_1.UnitType.angular,
            });
        case BuiltinType.Distance:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Distance, typeMap[BuiltinType.Distance] ?? codegen.PRIMITIVE_INTRINSICS.float32, {
                value: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                units: CoordinateTransformer_1.UnitType.spatial,
                isScalar: true,
            });
        case BuiltinType.Matrix3x2:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Matrix3x2, typeMap[BuiltinType.Matrix3x2], {
                col0_row0: { type: FloatType, defaultValue: 1, description: undefined },
                col0_row1: { type: FloatType, defaultValue: 0, description: undefined },
                col1_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col1_row1: { type: FloatType, defaultValue: 1, description: undefined },
                col2_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col2_row1: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {});
        case BuiltinType.Vector2:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Vector2, typeMap[BuiltinType.Vector2], {
                x: { type: FloatType, defaultValue: 0, description: undefined },
                y: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                units: CoordinateTransformer_1.UnitType.spatial,
            });
        case BuiltinType.UnitVector2:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.UnitVector2, typeMap[BuiltinType.UnitVector2], {
                x: { type: FloatType, defaultValue: 0, description: undefined },
                y: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {});
        case BuiltinType.Distance2:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Distance2, typeMap[BuiltinType.Distance2], {
                x: { type: FloatType, defaultValue: 0, description: undefined },
                y: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                units: CoordinateTransformer_1.UnitType.spatial,
                isScalar: true,
            });
        case BuiltinType.Scale2:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Scale2, typeMap[BuiltinType.Scale2], {
                x: { type: FloatType, defaultValue: 1, description: undefined },
                y: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {
                isScalar: true,
            });
        case BuiltinType.Matrix4x3:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Matrix4x3, typeMap[BuiltinType.Matrix4x3], {
                col0_row0: { type: FloatType, defaultValue: 1, description: undefined },
                col0_row1: { type: FloatType, defaultValue: 0, description: undefined },
                col0_row2: { type: FloatType, defaultValue: 0, description: undefined },
                col1_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col1_row1: { type: FloatType, defaultValue: 1, description: undefined },
                col1_row2: { type: FloatType, defaultValue: 0, description: undefined },
                col2_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col2_row1: { type: FloatType, defaultValue: 0, description: undefined },
                col2_row2: { type: FloatType, defaultValue: 1, description: undefined },
                col3_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col3_row1: { type: FloatType, defaultValue: 0, description: undefined },
                col3_row2: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                coordMatrixDims: [4, 3],
            });
        case BuiltinType.Matrix4x4:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Matrix4x4, typeMap[BuiltinType.Matrix4x4], {
                col0_row0: { type: FloatType, defaultValue: 1, description: undefined },
                col0_row1: { type: FloatType, defaultValue: 0, description: undefined },
                col0_row2: { type: FloatType, defaultValue: 0, description: undefined },
                col0_row3: { type: FloatType, defaultValue: 0, description: undefined },
                col1_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col1_row1: { type: FloatType, defaultValue: 1, description: undefined },
                col1_row2: { type: FloatType, defaultValue: 0, description: undefined },
                col1_row3: { type: FloatType, defaultValue: 0, description: undefined },
                col2_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col2_row1: { type: FloatType, defaultValue: 0, description: undefined },
                col2_row2: { type: FloatType, defaultValue: 1, description: undefined },
                col2_row3: { type: FloatType, defaultValue: 0, description: undefined },
                col3_row0: { type: FloatType, defaultValue: 0, description: undefined },
                col3_row1: { type: FloatType, defaultValue: 0, description: undefined },
                col3_row2: { type: FloatType, defaultValue: 0, description: undefined },
                col3_row3: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {
                coordMatrixDims: [4, 4],
            });
        case BuiltinType.Quaternion:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Quaternion, typeMap[BuiltinType.Quaternion], {
                x: { type: FloatType, defaultValue: 0, description: undefined },
                y: { type: FloatType, defaultValue: 0, description: undefined },
                z: { type: FloatType, defaultValue: 0, description: undefined },
                w: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {
                isCoords: true,
                flipSignWithHandedness: true,
            });
        case BuiltinType.EulerAngles:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.EulerAngles, typeMap[BuiltinType.EulerAngles], {
                yaw: { type: FloatType, defaultValue: 0, description: undefined },
                pitch: { type: FloatType, defaultValue: 0, description: undefined },
                roll: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                units: CoordinateTransformer_1.UnitType.angular,
            });
        case BuiltinType.Vector3:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Vector3, typeMap[BuiltinType.Vector3], {
                x: { type: FloatType, defaultValue: 0, description: undefined },
                y: { type: FloatType, defaultValue: 0, description: undefined },
                z: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                units: CoordinateTransformer_1.UnitType.spatial,
                isCoords: true,
            });
        case BuiltinType.UnitVector3:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.UnitVector3, typeMap[BuiltinType.UnitVector3], {
                x: { type: FloatType, defaultValue: 0, description: undefined },
                y: { type: FloatType, defaultValue: 0, description: undefined },
                z: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {
                isCoords: true,
            });
        case BuiltinType.Distance3:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Distance3, typeMap[BuiltinType.Distance3], {
                x: { type: FloatType, defaultValue: 0, description: undefined },
                y: { type: FloatType, defaultValue: 0, description: undefined },
                z: { type: FloatType, defaultValue: 0, description: undefined },
            }, conversionData, {
                units: CoordinateTransformer_1.UnitType.spatial,
                isScalar: true,
                isCoords: true,
            });
        case BuiltinType.Scale3:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.Scale3, typeMap[BuiltinType.Scale3], {
                x: { type: FloatType, defaultValue: 1, description: undefined },
                y: { type: FloatType, defaultValue: 1, description: undefined },
                z: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {
                isScalar: true,
                isCoords: true,
            });
        case BuiltinType.ColorSRGBA:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.ColorSRGBA, typeMap[BuiltinType.ColorSRGBA], {
                r: { type: ByteType, defaultValue: 255, description: undefined },
                g: { type: ByteType, defaultValue: 255, description: undefined },
                b: { type: ByteType, defaultValue: 255, description: undefined },
                a: { type: ByteType, defaultValue: 255, description: undefined },
            }, conversionData, {});
        case BuiltinType.ColorLinear:
            return new NumericSemanticType_1.NumericSemanticType(codegen, BuiltinType.ColorLinear, typeMap[BuiltinType.ColorLinear], {
                r: { type: FloatType, defaultValue: 1, description: undefined },
                g: { type: FloatType, defaultValue: 1, description: undefined },
                b: { type: FloatType, defaultValue: 1, description: undefined },
                a: { type: FloatType, defaultValue: 1, description: undefined },
            }, conversionData, {});
    }
    return null;
}
exports.getSemanticType = getSemanticType;
//# sourceMappingURL=BuiltinTypes.js.map
