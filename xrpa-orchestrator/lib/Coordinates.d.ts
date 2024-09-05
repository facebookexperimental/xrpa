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


import { XrpaStructFields, XrpaStructType } from "./InterfaceTypes";
import { ProgramInterface, ProgramInterfaceContext } from "./ProgramInterface";
import { RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { XrpaDataType } from "./XrpaLanguage";
import { BuiltinType } from "./shared/BuiltinTypes";
import { CoordinateSystemDef } from "./shared/CoordinateTransformer";
import { Thunk } from "./shared/Helpers";
export declare function Angle(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Angle>;
export declare function Distance(defaultValue?: number, description?: string): XrpaDataType<BuiltinType.Distance>;
export declare function Matrix3x2(description?: string): XrpaDataType<BuiltinType.Matrix3x2>;
export declare function Vector2(description?: string): XrpaDataType<BuiltinType.Vector2>;
export declare function UnitVector2(description?: string): XrpaDataType<BuiltinType.UnitVector2>;
export declare function Distance2(description?: string): XrpaDataType<BuiltinType.Distance2>;
export declare function Scale2(description?: string): XrpaDataType<BuiltinType.Scale2>;
export declare function Matrix4x3(description?: string): XrpaDataType<BuiltinType.Matrix4x3>;
export declare function Matrix4x4(description?: string): XrpaDataType<BuiltinType.Matrix4x4>;
export declare function Quaternion(description?: string): XrpaDataType<BuiltinType.Quaternion>;
export declare function EulerAngles(description?: string): XrpaDataType<BuiltinType.EulerAngles>;
export declare function Vector3(description?: string): XrpaDataType<BuiltinType.Vector3>;
export declare function UnitVector3(description?: string): XrpaDataType<BuiltinType.UnitVector3>;
export declare function Distance3(description?: string): XrpaDataType<BuiltinType.Distance3>;
export declare function Scale3(description?: string): XrpaDataType<BuiltinType.Scale3>;
export declare function useCoordinateSystem(coordSystem: CoordinateSystemDef): void;
export declare function getCoordinateSystem(ctx: ProgramInterface | ProgramInterfaceContext | RuntimeEnvironmentContext): CoordinateSystemDef;
type StructObjectTransformBinding<T extends XrpaStructFields> = {
    position?: keyof T;
    rotation?: keyof T;
    scale?: keyof T;
};
type FieldObjectTransformBinding = "position" | "rotation" | "scale";
export declare function ObjectTransform(binding: "position", dataType: Thunk<XrpaDataType<BuiltinType.Vector3>>): XrpaDataType<BuiltinType.Vector3>;
export declare function ObjectTransform(binding: "rotation", dataType: Thunk<XrpaDataType<BuiltinType.Quaternion>>): XrpaDataType<BuiltinType.Quaternion>;
export declare function ObjectTransform(binding: "scale", dataType: Thunk<XrpaDataType<BuiltinType.Scale3>>): XrpaDataType<BuiltinType.Scale3>;
export declare function ObjectTransform<T extends XrpaStructFields>(bindings: StructObjectTransformBinding<T>, struct: XrpaStructType<T>): XrpaStructType<T>;
export declare function getObjectTransformBinding(dataType: XrpaDataType): FieldObjectTransformBinding | undefined;
export {};

