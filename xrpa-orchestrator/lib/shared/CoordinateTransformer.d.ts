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


import { TargetCodeGenImpl } from "./TargetCodeGen";
import { StructSpec } from "./TypeDefinition";
import { TypeValue } from "./TypeValue";
export declare enum CoordAxis {
    posX = "X",
    negX = "-X",
    posY = "Y",
    negY = "-Y",
    posZ = "Z",
    negZ = "-Z"
}
export declare enum UnitType {
    angular = "angular",
    spatial = "spatial"
}
export declare enum SpatialUnitType {
    centimeter = "centimeter",
    meter = "meter"
}
export declare enum AngularUnitType {
    degree = "degree",
    radian = "radian"
}
export interface CoordinateSystemDef {
    up: CoordAxis;
    right: CoordAxis;
    forward: CoordAxis;
    spatialUnit: SpatialUnitType;
    angularUnit: AngularUnitType;
}
export declare const DEFAULT_COORDINATE_SYSTEM: CoordinateSystemDef;
export interface AxisTransformer {
    idx: number;
    sign: number;
}
export interface CoordTransformer {
    multiplier: {
        angular: [string, number];
        spatial: [string, number];
        none: [string, number];
    };
    axisMap: [AxisTransformer, AxisTransformer, AxisTransformer];
    handednessFlip: boolean;
}
export interface UnitTransformer {
    spatial: Record<string, Record<string, [string, number]>>;
    angular: Record<string, Record<string, [string, number]>>;
}
export interface CoordTypeConfig {
    units?: UnitType;
    isScalar?: boolean;
    isCoords?: boolean;
    flipSignWithHandedness?: boolean;
    coordMatrixDims?: [number, number];
}
export declare function buildCoordTransformer(from: CoordinateSystemDef, to: CoordinateSystemDef, unitTransformer: UnitTransformer): CoordTransformer;
export interface RemappedCoordinates {
    idx: number;
    neg: boolean;
    multiplier: [string, number];
}
export declare function performSemanticConversion(params: {
    codegen: TargetCodeGenImpl;
    returnType: string;
    returnFieldOrder: string[];
    valElems: TypeValue[];
    valFieldOrder: string[];
    coordTypeConfig: CoordTypeConfig;
    transform: CoordTransformer;
    inNamespace: string;
}): TypeValue[];
export declare function genSemanticConversion(params: {
    codegen: TargetCodeGenImpl;
    returnType: string;
    returnFieldOrder: string[];
    valName: string;
    valFieldOrder: string[];
    valFieldMapping: Record<string, string> | null;
    coordTypeConfig: CoordTypeConfig;
    transform: CoordTransformer;
}): TypeValue[];
export interface FieldMappings {
    fields: StructSpec;
    toLocal: Record<string, string>;
    fromLocal: Record<string, string>;
}
export declare function getFieldMappings(fields: StructSpec, fieldMap: Record<string, string> | undefined): FieldMappings;

