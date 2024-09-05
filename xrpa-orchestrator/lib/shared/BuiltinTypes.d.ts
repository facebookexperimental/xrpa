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


import { CoordinateSystemDef, CoordTransformer } from "./CoordinateTransformer";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import { TypeDefinition, TypeMap } from "./TypeDefinition";
export declare enum BuiltinType {
    Boolean = "Boolean",
    Count = "Count",
    BitField = "BitField",
    Scalar = "Scalar",
    Timestamp = "Timestamp",
    String = "String",
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
    Signal = "Signal"
}
export interface SemanticConversionData {
    apiname: string;
    toLocalTransform: CoordTransformer;
    fromLocalTransform: CoordTransformer;
}
export declare function isBuiltinType(typeName: string): typeName is BuiltinType;
/*****************************************************/
export declare function genPrimitiveTypes(codegen: TargetCodeGenImpl, typeMap: TypeMap): Record<string, TypeDefinition>;
/*****************************************************/
export declare function getSemanticType(codegen: TargetCodeGenImpl, typeName: BuiltinType, apiname: string, typeMap: TypeMap, localCoordinateSystem: CoordinateSystemDef, storedCoordinateSystem: CoordinateSystemDef): TypeDefinition | null;

