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


// NOTE: this file is agnostic to output language and can be reused for C#, Python, etc.

import { clone } from "@xrpa/xrpa-utils";
import assert from "assert";

import { TargetCodeGenImpl } from "./TargetCodeGen";
import { StructSpec } from "./TypeDefinition";
import { CodeLiteralValue, PrimitiveValue, TypeValue } from "./TypeValue";

export enum CoordAxis {
  posX = "X",
  negX = "-X",
  posY = "Y",
  negY = "-Y",
  posZ = "Z",
  negZ = "-Z",
}

export enum UnitType {
  angular = "angular",
  spatial = "spatial",
}

export enum SpatialUnitType {
  centimeter = "centimeter",
  meter = "meter",
}

export enum AngularUnitType {
  degree = "degree",
  radian = "radian",
}

export interface CoordinateSystemDef {
  up: CoordAxis;
  right: CoordAxis;
  forward: CoordAxis;
  spatialUnit: SpatialUnitType;
  angularUnit: AngularUnitType;
}

export const DEFAULT_COORDINATE_SYSTEM: CoordinateSystemDef = {
  up: CoordAxis.posY,
  right: CoordAxis.posX,
  forward: CoordAxis.negZ,
  spatialUnit: SpatialUnitType.meter,
  angularUnit: AngularUnitType.radian,
};

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
  isScalar?: boolean; // maintain sign through coordinate conversion
  isCoords?: boolean;
  flipSignWithHandedness?: boolean;
  coordMatrixDims?: [number, number];
}

const AXIS_LOOKUP: Record<CoordAxis, AxisTransformer> = {
  [CoordAxis.posX]: { idx: 0, sign: 1 },
  [CoordAxis.negX]: { idx: 0, sign: -1 },
  [CoordAxis.posY]: { idx: 1, sign: 1 },
  [CoordAxis.negY]: { idx: 1, sign: -1 },
  [CoordAxis.posZ]: { idx: 2, sign: 1 },
  [CoordAxis.negZ]: { idx: 2, sign: -1 },
};

function remapAxis(map: [AxisTransformer, AxisTransformer, AxisTransformer], from: CoordAxis, to: CoordAxis) {
  const src = AXIS_LOOKUP[from];
  const dst = AXIS_LOOKUP[to];
  map[dst.idx] = { idx: src.idx, sign: src.sign * dst.sign };
}

function vectorFromAxis(axis: CoordAxis) {
  const a = AXIS_LOOKUP[axis];
  const ret: [number, number, number] = [0, 0, 0];
  ret[a.idx] = a.sign;
  return ret;
}

function crossProduct(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  const ret: [number, number, number] = [0, 0, 0];
  ret[0] = a[1] * b[2] - a[2] * b[1];
  ret[1] = a[2] * b[0] - a[0] * b[2];
  ret[2] = a[0] * b[1] - a[1] * b[0];
  return ret;
}

function dotProduct(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function calcHandedness(coord: CoordinateSystemDef) {
  const rhUp = crossProduct(vectorFromAxis(coord.right), vectorFromAxis(coord.forward));
  return dotProduct(rhUp, vectorFromAxis(coord.up));
}

export function buildCoordTransformer(from: CoordinateSystemDef, to: CoordinateSystemDef, unitTransformer: UnitTransformer): CoordTransformer {
  const transformer: CoordTransformer = {
    multiplier: {
      angular: unitTransformer.angular[from.angularUnit]?.[to.angularUnit] ?? ["", 1],
      spatial: unitTransformer.spatial[from.spatialUnit]?.[to.spatialUnit] ?? ["", 1],
      none: ["", 1],
    },
    axisMap: [
      {idx: 0, sign: 1},
      {idx: 1, sign: 1},
      {idx: 2, sign: 1},
    ],
    handednessFlip: calcHandedness(from) !== calcHandedness(to),
  };

  remapAxis(transformer.axisMap, from.up, to.up);
  remapAxis(transformer.axisMap, from.right, to.right);
  remapAxis(transformer.axisMap, from.forward, to.forward);

  return transformer;
}

export interface RemappedCoordinates {
  idx: number;
  neg: boolean;
  multiplier: [string, number];
}

function remapCoordinates(typeConfig: CoordTypeConfig, elemCount: number, fromFieldOrder: string[], toFieldOrder: string[], transformer: CoordTransformer): RemappedCoordinates[] {
  const multiplier = transformer.multiplier[typeConfig.units ?? "none"] ?? "";

  const dstElems: RemappedCoordinates[] = [];
  for (let i = 0; i < elemCount; ++i) {
    dstElems.push({ idx: i, neg: false, multiplier });
  }

  if (typeConfig.isCoords) {
    const srcElems = clone(dstElems);
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
  } else if (typeConfig.coordMatrixDims) {
    const cols = typeConfig.coordMatrixDims[0];
    const rows = typeConfig.coordMatrixDims[1];

    // swizzle columns
    let srcElems = clone(dstElems);
    for (let i = 0; i < 3; ++i) {
      const {idx, sign} = transformer.axisMap[i];
      for (let j = 0; j < rows; ++j) {
        dstElems[i * rows + j] = srcElems[idx * rows + j];
        if (sign < 0) {
          dstElems[i * rows + j].neg = !dstElems[i * rows + j].neg;
        }
      }
    }

    // swizzle elements within columns
    srcElems = clone(dstElems);
    for (let i = 0; i < cols; ++i) {
      for (let j = 0; j < 3; ++j) {
        const {idx, sign} = transformer.axisMap[j];
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

  assert(fromFieldOrder.length === toFieldOrder.length);
  assert(fromFieldOrder.length === elemCount);
  const srcElems = clone(dstElems);
  for (let i = 0; i < toFieldOrder.length; ++i) {
    const srcIdx = fromFieldOrder.indexOf(toFieldOrder[i]);
    if (srcIdx < 0) {
      throw new Error(`Field ${toFieldOrder[i]} not found in [${fromFieldOrder.join(", ")}]`);
    }
    dstElems[i] = srcElems[srcIdx];
  }

  return dstElems;
}

export function performSemanticConversion(params: {
  codegen: TargetCodeGenImpl;
  returnType: string;
  returnFieldOrder: string[];
  valElems: TypeValue[];
  valFieldOrder: string[];
  coordTypeConfig: CoordTypeConfig;
  transform: CoordTransformer;
  inNamespace: string;
}): TypeValue[] {
  const elems = remapCoordinates(params.coordTypeConfig, params.valElems.length, params.valFieldOrder, params.returnFieldOrder, params.transform);
  return elems.map(elem => {
    let elemVal = params.valElems[elem.idx];
    if (elemVal instanceof PrimitiveValue) {
      assert(typeof elemVal.value === "number");
      elemVal = new PrimitiveValue(
        params.codegen,
        elemVal.typename,
        (elem.neg ? -1 : 1) * elemVal.value * elem.multiplier[1],
      );
    }
    if (elemVal instanceof CodeLiteralValue) {
      elemVal = new CodeLiteralValue(params.codegen, `${elem.neg ? "-" : ""}${elemVal}${elem.multiplier[0]}`);
    }
    return elemVal;
  });
}

export function genSemanticConversion(params: {
  codegen: TargetCodeGenImpl;
  returnType: string;
  returnFieldOrder: string[];
  valName: string;
  valFieldOrder: string[];
  valFieldMapping: Record<string, string> | null;
  coordTypeConfig: CoordTypeConfig;
  transform: CoordTransformer;
}): TypeValue[] {
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
      } else {
        elemName = `${params.valName}.${elemName}`;
      }
    }

    return new CodeLiteralValue(
      params.codegen,
      `${elem.neg ? "-" : ""}${elemName}${elem.multiplier[0]}`,
    );
  });
}

export interface FieldMappings {
  fields: StructSpec;

  // fields are in order of the local type
  toLocal: Record<string, string>;

  // fields are in order of the dataset type
  fromLocal: Record<string, string>;
}

// fieldMap maps from local struct's field names to dataset struct's field names
export function getFieldMappings(fields: StructSpec, fieldMap: Record<string, string> | undefined): FieldMappings {
  const mappings: FieldMappings = {
    fields,
    toLocal: {},
    fromLocal: {},
  };

  // generate bidirectional field name maps, unordered
  const fieldMapLocalToDataset = fieldMap ?? Object.keys(mappings.fields).reduce((acc, key) => { acc[key] = key; return acc; }, {} as Record<string, string>);
  const fieldMapDatasetToLocal = Object.keys(fieldMapLocalToDataset).reduce((acc, key) => { acc[fieldMapLocalToDataset[key]] = key; return acc; }, {} as Record<string, string>);

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
