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


import { getContext, Thunk, resolveThunk, safeDeepFreeze } from "@xrpa/xrpa-utils";
import assert from "assert";
import { replaceImmutable } from "simply-immutable";

import { FIELD_DEFAULT, FIELD_DESCRIPTION, XrpaStructFields, XrpaStructType, isStructDataType } from "./InterfaceTypes";
import { ProgramInterface, ProgramInterfaceContext, isProgramInterfaceContext } from "./ProgramInterface";
import { RuntimeEnvironmentContext, isRuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { XrpaDataType, setProperty } from "./XrpaLanguage";

import { BuiltinType } from "./shared/BuiltinTypes";
import { CoordinateSystemDef, DEFAULT_COORDINATE_SYSTEM } from "./shared/CoordinateTransformer";

const COORDINATE_SYSTEM = "xrpa.coordinates.system";
const TRANSFORM_BINDING = "xrpa.coordinates.transformBinding";

export function Angle(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Angle> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Angle,
    properties: {
      [FIELD_DEFAULT]: defaultValue,
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Distance(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Distance> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Distance,
    properties: {
      [FIELD_DEFAULT]: defaultValue,
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Matrix3x2(description?: string): XrpaDataType<BuiltinType.Matrix3x2> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Matrix3x2,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Vector2(description?: string): XrpaDataType<BuiltinType.Vector2> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Vector2,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function UnitVector2(description?: string): XrpaDataType<BuiltinType.UnitVector2> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.UnitVector2,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Distance2(description?: string): XrpaDataType<BuiltinType.Distance2> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Distance2,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Scale2(description?: string): XrpaDataType<BuiltinType.Scale2> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Scale2,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Matrix4x3(description?: string): XrpaDataType<BuiltinType.Matrix4x3> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Matrix4x3,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Matrix4x4(description?: string): XrpaDataType<BuiltinType.Matrix4x4> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Matrix4x4,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Quaternion(description?: string): XrpaDataType<BuiltinType.Quaternion> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Quaternion,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function EulerAngles(description?: string): XrpaDataType<BuiltinType.EulerAngles> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.EulerAngles,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Vector3(description?: string): XrpaDataType<BuiltinType.Vector3> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Vector3,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function UnitVector3(description?: string): XrpaDataType<BuiltinType.UnitVector3> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.UnitVector3,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Distance3(description?: string): XrpaDataType<BuiltinType.Distance3> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Distance3,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

export function Scale3(description?: string): XrpaDataType<BuiltinType.Scale3> {
  return safeDeepFreeze({
    __XrpaDataType: true,
    typename: BuiltinType.Scale3,
    properties: {
      [FIELD_DESCRIPTION]: description,
    },
  });
}

////////////////////////////////////////////////////////////////////////////////

function canSetCoordinateSystem(ctx: unknown): ctx is (ProgramInterfaceContext | RuntimeEnvironmentContext) {
  return isProgramInterfaceContext(ctx) || isRuntimeEnvironmentContext(ctx);
}

export function useCoordinateSystem(coordSystem: CoordinateSystemDef) {
  const ctx = getContext(canSetCoordinateSystem, "Call must be made within a program or runtime environment");
  ctx.properties[COORDINATE_SYSTEM] = coordSystem;
}

export function getCoordinateSystem(ctx: ProgramInterface|ProgramInterfaceContext|RuntimeEnvironmentContext) {
  const coordSystem = ctx.properties[COORDINATE_SYSTEM] as CoordinateSystemDef|undefined;
  return coordSystem ?? DEFAULT_COORDINATE_SYSTEM;
}

////////////////////////////////////////////////////////////////////////////////

type StructObjectTransformBinding<T extends XrpaStructFields> = { position?: keyof T, rotation?: keyof T, scale?: keyof T };
type FieldObjectTransformBinding = "position"|"rotation"|"scale";

export function ObjectTransform(binding: "position", dataType: Thunk<XrpaDataType<BuiltinType.Vector3>>): XrpaDataType<BuiltinType.Vector3>;
export function ObjectTransform(binding: "rotation", dataType: Thunk<XrpaDataType<BuiltinType.Quaternion>>): XrpaDataType<BuiltinType.Quaternion>;
export function ObjectTransform(binding: "scale", dataType: Thunk<XrpaDataType<BuiltinType.Scale3>>): XrpaDataType<BuiltinType.Scale3>;

export function ObjectTransform<T extends XrpaStructFields>(bindings: StructObjectTransformBinding<T>, struct: XrpaStructType<T>): XrpaStructType<T>;

export function ObjectTransform(bindings: StructObjectTransformBinding<XrpaStructFields>|FieldObjectTransformBinding, dataType: Thunk<XrpaDataType>) {
  dataType = resolveThunk(dataType);
  if (isStructDataType(dataType)) {
    const fieldBindings = bindings as StructObjectTransformBinding<XrpaStructFields>;
    assert(typeof fieldBindings === "object" && fieldBindings !== null, "ObjectTransform: expected object binding");

    let ret = dataType;
    if (fieldBindings.position && ret.fields[fieldBindings.position].typename === BuiltinType.Vector3) {
      ret = replaceImmutable(ret, ["fields", fieldBindings.position], ObjectTransform("position", ret.fields[fieldBindings.position] as XrpaDataType<BuiltinType.Vector3>));
    }
    if (fieldBindings.rotation && ret.fields[fieldBindings.rotation].typename === BuiltinType.Quaternion) {
      ret = replaceImmutable(ret, ["fields", fieldBindings.rotation], ObjectTransform("rotation", ret.fields[fieldBindings.rotation] as XrpaDataType<BuiltinType.Quaternion>));
    }
    if (fieldBindings.scale && ret.fields[fieldBindings.scale].typename === BuiltinType.Scale3) {
      ret = replaceImmutable(ret, ["fields", fieldBindings.scale], ObjectTransform("scale", dataType.fields[fieldBindings.scale] as XrpaDataType<BuiltinType.Scale3>));
    }
    return ret;
  } else {
    return setProperty(dataType, TRANSFORM_BINDING, bindings);
  }
}

export function getObjectTransformBinding(dataType: XrpaDataType) {
  return dataType.properties[TRANSFORM_BINDING] as FieldObjectTransformBinding | undefined;
}
