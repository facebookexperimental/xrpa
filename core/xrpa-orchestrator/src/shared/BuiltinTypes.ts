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


import { buildCoordTransformer, CoordinateSystemDef, CoordTransformer, UnitType } from "./CoordinateTransformer";
import { IncludeAggregator } from "./Helpers";
import { NumericSemanticType } from "./NumericSemanticType";
import { PrimitiveType } from "./PrimitiveType";
import { StructType } from "./StructType";
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { SignalDataTypeDefinition, TypeDefinition, TypeMap, TypeMetaType, UserDefaultValue } from "./TypeDefinition";
import { CodeLiteralValue, ConstructValue, EmptyValue, PrimitiveValue, TypeValue } from "./TypeValue";

export enum BuiltinType {
  Boolean = "Boolean",
  Count = "Count",
  BitField = "BitField",
  Scalar = "Scalar",
  Timestamp = "Timestamp",
  HiResTimestamp = "HiResTimestamp",
  String = "String",
  Float3 = "Float3",
  Angle = "Angle",
  Distance = "Distance",
  Matrix3x2 = "Matrix3x2",
  Vector2 = "Vector2",
  UnitVector2 = "UnitVector2",
  Distance2 = "Distance2",
  Scale2 = "Scale2",
  Matrix4x3 = "Matrix4x3",
  Matrix4x4 = "Matrix4x4",
  Quaternion = "Quaternion",
  EulerAngles = "EulerAngles",
  Vector3 = "Vector3",
  UnitVector3 = "UnitVector3",
  Distance3 = "Distance3",
  Scale3 = "Scale3",
  ColorSRGBA = "ColorSRGBA",
  ColorLinear = "ColorLinear",
  Signal = "Signal",
}

export interface SemanticConversionData {
  apiname: string;
  toLocalTransform: CoordTransformer;
  fromLocalTransform: CoordTransformer;
}

export function isBuiltinType(typeName: string): typeName is BuiltinType {
  return BuiltinType[typeName as BuiltinType] !== undefined;
}

/*****************************************************/

class TimestampType extends PrimitiveType {
  constructor(
    codegen: TargetCodeGenImpl,
    name: string,
    localType: TypeSpec,
  ) {
    super(
      codegen,
      name,
      codegen.PRIMITIVE_INTRINSICS.uint64,
      localType,
      8,
      false,
      new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint64.typename, 0),
      new CodeLiteralValue(codegen, codegen.genGetCurrentClockTime(null, name === BuiltinType.HiResTimestamp)),
    );
  }

  public getMetaType(): TypeMetaType {
    return TypeMetaType.CLEAR_SET;
  }

  public convertValueFromLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof PrimitiveValue) {
      return new PrimitiveValue(this.codegen, this.datasetType.typename, value.value);
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
    }
    const dsType = this.getInternalType(inNamespace, includes);
    const localType = this.getLocalType(inNamespace, includes);
    return new CodeLiteralValue(this.codegen, this.codegen.reinterpretValue(localType, dsType, value));
  }

  public convertValueToLocal(inNamespace: string, includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof PrimitiveValue) {
      return new PrimitiveValue(this.codegen, this.localType.typename, value.value);
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    const dsType = this.getInternalType(inNamespace, includes);
    const localType = this.getLocalType(inNamespace, includes);
    return new CodeLiteralValue(this.codegen, this.codegen.reinterpretValue(dsType, localType, value));
  }
}

/*****************************************************/

class BooleanType extends PrimitiveType {
  constructor(codegen: TargetCodeGenImpl) {
    super(
      codegen,
      "Boolean",
      codegen.PRIMITIVE_INTRINSICS.int32,
      codegen.PRIMITIVE_INTRINSICS.bool,
      4,
      false,
      new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.int32.typename, 0),
    )
  }

  public userDefaultToTypeValue(_inNamespace: string, _includes: IncludeAggregator | null, userDefault: UserDefaultValue): TypeValue | undefined {
    if (userDefault === true || userDefault === 1) {
      return new PrimitiveValue(this.codegen, this.datasetType.typename, 1);
    }
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public convertValueFromLocal(_inNamespace: string, _includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof PrimitiveValue) {
      return new PrimitiveValue(this.codegen, this.datasetType.typename, value.value ? 1 : 0);
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.datasetType.typename, value.defaultNamespace);
    }
    return new CodeLiteralValue(this.codegen, this.codegen.genConvertBoolToInt(value));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public convertValueToLocal(_inNamespace: string, _includes: IncludeAggregator | null, value: string | TypeValue): TypeValue {
    if (typeof value === "string") {
      value = new CodeLiteralValue(this.codegen, value);
    }
    if (value instanceof PrimitiveValue) {
      return new PrimitiveValue(this.codegen, this.localType.typename, value.value === 1 ? true : false);
    }
    if (value instanceof EmptyValue) {
      return new EmptyValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    if (value instanceof ConstructValue) {
      return new ConstructValue(this.codegen, this.localType.typename, value.defaultNamespace);
    }
    return new CodeLiteralValue(this.codegen, this.codegen.genConvertIntToBool(value));
  }
}

/*****************************************************/

export class ByteArrayType extends PrimitiveType {
  constructor(codegen: TargetCodeGenImpl, dynamicSizeEstimate: number) {
    super(
      codegen,
      "ByteArray",
      codegen.PRIMITIVE_INTRINSICS.bytearray,
      codegen.PRIMITIVE_INTRINSICS.bytearray,
      {
        staticSize: 4,
        dynamicSizeEstimate,
      },
      true,
      new EmptyValue(codegen, codegen.PRIMITIVE_INTRINSICS.bytearray.typename, ""),
    )
  }
}

/*****************************************************/

class SignalDataType extends PrimitiveType implements SignalDataTypeDefinition {
  constructor(codegen: TargetCodeGenImpl) {
    super(
      codegen,
      "Signal",
      { typename: "DSSignalData" },
      { typename: "SignalData" },
      0,
      false,
      new EmptyValue(codegen, "DSSignalData", ""),
    )
  }

  public getMetaType(): TypeMetaType.SIGNAL_DATA {
    return TypeMetaType.SIGNAL_DATA;
  }

  public getExpectedBytesPerSecond(): number {
    // 48kHz, 4 channels, 32-bit float
    return 48000 * 4 * 4;
  }
}

/*****************************************************/

export function genPrimitiveTypes(codegen: TargetCodeGenImpl, typeMap: TypeMap): Record<string, TypeDefinition> {
  const FloatType = new PrimitiveType(
    codegen,
    "float",
    codegen.PRIMITIVE_INTRINSICS.float32,
    codegen.PRIMITIVE_INTRINSICS.float32,
    4,
    true,
    new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.float32.typename, 0),
  );

  return {
    [BuiltinType.Boolean]: new BooleanType(codegen),

    // TODO maybe rename Count -> WholeNumber, and then add Count back as a semantic type instead? (constrained to >= 0)
    [BuiltinType.Count]: new PrimitiveType(
      codegen,
      BuiltinType.Count,
      codegen.PRIMITIVE_INTRINSICS.int32,
      typeMap[BuiltinType.Count] ?? codegen.PRIMITIVE_INTRINSICS.int,
      4,
      true,
      new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.int32.typename, 0),
    ),

    [BuiltinType.BitField]: new PrimitiveType(
      codegen,
      BuiltinType.BitField,
      codegen.PRIMITIVE_INTRINSICS.uint64,
      codegen.PRIMITIVE_INTRINSICS.uint64,
      8,
      true,
      new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint64.typename, 0),
    ),

    [BuiltinType.Timestamp]: new TimestampType(
      codegen,
      BuiltinType.Timestamp,
      typeMap[BuiltinType.Timestamp] ?? codegen.PRIMITIVE_INTRINSICS.microseconds,
    ),

    [BuiltinType.HiResTimestamp]: new TimestampType(
      codegen,
      BuiltinType.HiResTimestamp,
      typeMap[BuiltinType.HiResTimestamp] ?? codegen.PRIMITIVE_INTRINSICS.nanoseconds,
    ),

    [BuiltinType.String]: new PrimitiveType(
      codegen,
      BuiltinType.String,
      codegen.PRIMITIVE_INTRINSICS.string,
      typeMap[BuiltinType.String] ?? codegen.PRIMITIVE_INTRINSICS.string,
      {
        staticSize: 4,
        dynamicSizeEstimate: 252,
      },
      true,
      new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.string.typename, ""),
    ),

    [BuiltinType.Float3]: new StructType(
      codegen,
      BuiltinType.Float3,
      "",
      undefined,
      {
        x: { type: FloatType, defaultValue: 0 },
        y: { type: FloatType, defaultValue: 0 },
        z: { type: FloatType, defaultValue: 0 },
      },
      {
        ...codegen.PRIMITIVE_INTRINSICS.arrayFloat3,
        fieldMap: {
          "[0]": "x",
          "[1]": "y",
          "[2]": "z",
        },
      },
    ),

    [BuiltinType.Signal]: new SignalDataType(codegen),
  };
}

/*****************************************************/

export function getSemanticType(
  codegen: TargetCodeGenImpl,
  typeName: BuiltinType,
  apiname: string,
  typeMap: TypeMap,
  localCoordinateSystem: CoordinateSystemDef,
  storedCoordinateSystem: CoordinateSystemDef,
): TypeDefinition | null {
  const conversionData: SemanticConversionData = {
    apiname,
    toLocalTransform: buildCoordTransformer(storedCoordinateSystem, localCoordinateSystem, codegen.UNIT_TRANSFORMER),
    fromLocalTransform: buildCoordTransformer(localCoordinateSystem, storedCoordinateSystem, codegen.UNIT_TRANSFORMER),
  };

  const ByteType = new PrimitiveType(
    codegen,
    "byte",
    codegen.PRIMITIVE_INTRINSICS.uint8,
    codegen.PRIMITIVE_INTRINSICS.uint8,
    4,
    true,
    new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.uint8.typename, 0),
  );

  const FloatType = new PrimitiveType(
    codegen,
    "float",
    codegen.PRIMITIVE_INTRINSICS.float32,
    codegen.PRIMITIVE_INTRINSICS.float32,
    4,
    true,
    new PrimitiveValue(codegen, codegen.PRIMITIVE_INTRINSICS.float32.typename, 0),
  );

  switch (typeName) {
    case BuiltinType.Scalar:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Scalar,
        typeMap[BuiltinType.Scalar] ?? codegen.PRIMITIVE_INTRINSICS.float32,
        {
          value: { type: FloatType, defaultValue: 1, description: undefined },
        },
        conversionData,
        {
          isScalar: true,
        },
      );

    case BuiltinType.Angle:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Angle,
        typeMap[BuiltinType.Angle] ?? codegen.PRIMITIVE_INTRINSICS.float32,
        {
          value: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {
          units: UnitType.angular,
        },
      );

    case BuiltinType.Distance:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Distance,
        typeMap[BuiltinType.Distance] ?? codegen.PRIMITIVE_INTRINSICS.float32,
        {
          value: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {
          units: UnitType.spatial,
          isScalar: true,
        },
      );

    case BuiltinType.Matrix3x2:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Matrix3x2,
        typeMap[BuiltinType.Matrix3x2],
        {
          col0_row0: { type: FloatType, defaultValue: 1, description: undefined },
          col0_row1: { type: FloatType, defaultValue: 0, description: undefined },
          col1_row0: { type: FloatType, defaultValue: 0, description: undefined },
          col1_row1: { type: FloatType, defaultValue: 1, description: undefined },
          col2_row0: { type: FloatType, defaultValue: 0, description: undefined },
          col2_row1: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {},
      );

    case BuiltinType.Vector2:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Vector2,
        typeMap[BuiltinType.Vector2],
        {
          x: { type: FloatType, defaultValue: 0, description: undefined },
          y: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {
          units: UnitType.spatial,
        },
      );

    case BuiltinType.UnitVector2:
      return new NumericSemanticType(
        codegen,
        BuiltinType.UnitVector2,
        typeMap[BuiltinType.UnitVector2],
        {
          x: { type: FloatType, defaultValue: 0, description: undefined },
          y: { type: FloatType, defaultValue: 1, description: undefined },
        },
        conversionData,
        {},
      );

    case BuiltinType.Distance2:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Distance2,
        typeMap[BuiltinType.Distance2],
        {
          x: { type: FloatType, defaultValue: 0, description: undefined },
          y: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {
          units: UnitType.spatial,
          isScalar: true,
        },
      );

    case BuiltinType.Scale2:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Scale2,
        typeMap[BuiltinType.Scale2],
        {
          x: { type: FloatType, defaultValue: 1, description: undefined },
          y: { type: FloatType, defaultValue: 1, description: undefined },
        },
        conversionData,
        {
          isScalar: true,
        },
      );

    case BuiltinType.Matrix4x3:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Matrix4x3,
        typeMap[BuiltinType.Matrix4x3],
        {
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
        },
        conversionData,
        {
          coordMatrixDims: [4, 3],
        },
      );

    case BuiltinType.Matrix4x4:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Matrix4x4,
        typeMap[BuiltinType.Matrix4x4],
        {
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
        },
        conversionData,
        {
          coordMatrixDims: [4, 4],
        },
      );

    case BuiltinType.Quaternion:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Quaternion,
        typeMap[BuiltinType.Quaternion],
        {
          x: { type: FloatType, defaultValue: 0, description: undefined },
          y: { type: FloatType, defaultValue: 0, description: undefined },
          z: { type: FloatType, defaultValue: 0, description: undefined },
          w: { type: FloatType, defaultValue: 1, description: undefined },
        },
        conversionData,
        {
          isCoords: true,
          flipSignWithHandedness: true,
        },
      );

    case BuiltinType.EulerAngles:
      return new NumericSemanticType(
        codegen,
        BuiltinType.EulerAngles,
        typeMap[BuiltinType.EulerAngles],
        {
          yaw: { type: FloatType, defaultValue: 0, description: undefined },
          pitch: { type: FloatType, defaultValue: 0, description: undefined },
          roll: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {
          units: UnitType.angular,
        },
      );

    case BuiltinType.Vector3:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Vector3,
        typeMap[BuiltinType.Vector3],
        {
          x: { type: FloatType, defaultValue: 0, description: undefined },
          y: { type: FloatType, defaultValue: 0, description: undefined },
          z: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {
          units: UnitType.spatial,
          isCoords: true,
        },
      );

    case BuiltinType.UnitVector3:
      return new NumericSemanticType(
        codegen,
        BuiltinType.UnitVector3,
        typeMap[BuiltinType.UnitVector3],
        {
          x: { type: FloatType, defaultValue: 0, description: undefined },
          y: { type: FloatType, defaultValue: 0, description: undefined },
          z: { type: FloatType, defaultValue: 1, description: undefined },
        },
        conversionData,
        {
          isCoords: true,
        },
      );

    case BuiltinType.Distance3:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Distance3,
        typeMap[BuiltinType.Distance3],
        {
          x: { type: FloatType, defaultValue: 0, description: undefined },
          y: { type: FloatType, defaultValue: 0, description: undefined },
          z: { type: FloatType, defaultValue: 0, description: undefined },
        },
        conversionData,
        {
          units: UnitType.spatial,
          isScalar: true,
          isCoords: true,
        },
      );

    case BuiltinType.Scale3:
      return new NumericSemanticType(
        codegen,
        BuiltinType.Scale3,
        typeMap[BuiltinType.Scale3],
        {
          x: { type: FloatType, defaultValue: 1, description: undefined },
          y: { type: FloatType, defaultValue: 1, description: undefined },
          z: { type: FloatType, defaultValue: 1, description: undefined },
        },
        conversionData,
        {
          isScalar: true,
          isCoords: true,
        },
      );

    case BuiltinType.ColorSRGBA:
      return new NumericSemanticType(
        codegen,
        BuiltinType.ColorSRGBA,
        typeMap[BuiltinType.ColorSRGBA],
        {
          r: { type: ByteType, defaultValue: 255, description: undefined },
          g: { type: ByteType, defaultValue: 255, description: undefined },
          b: { type: ByteType, defaultValue: 255, description: undefined },
          a: { type: ByteType, defaultValue: 255, description: undefined },
        },
        conversionData,
        {},
      );

    case BuiltinType.ColorLinear:
      return new NumericSemanticType(
        codegen,
        BuiltinType.ColorLinear,
        typeMap[BuiltinType.ColorLinear],
        {
          r: { type: FloatType, defaultValue: 1, description: undefined },
          g: { type: FloatType, defaultValue: 1, description: undefined },
          b: { type: FloatType, defaultValue: 1, description: undefined },
          a: { type: FloatType, defaultValue: 1, description: undefined },
        },
        conversionData,
        {},
      );
  }

  return null;
}
