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
exports.getObjectTransformBinding = exports.ObjectTransform = exports.getCoordinateSystem = exports.useCoordinateSystem = exports.Scale3 = exports.Distance3 = exports.UnitVector3 = exports.Vector3 = exports.EulerAngles = exports.Quaternion = exports.Matrix4x4 = exports.Matrix4x3 = exports.Scale2 = exports.Distance2 = exports.UnitVector2 = exports.Vector2 = exports.Matrix3x2 = exports.Distance = exports.Angle = void 0;
const assert_1 = __importDefault(require("assert"));
const simply_immutable_1 = require("simply-immutable");
const InterfaceTypes_1 = require("./InterfaceTypes");
const ProgramInterface_1 = require("./ProgramInterface");
const RuntimeEnvironment_1 = require("./RuntimeEnvironment");
const XrpaLanguage_1 = require("./XrpaLanguage");
const BuiltinTypes_1 = require("./shared/BuiltinTypes");
const CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
const Helpers_1 = require("./shared/Helpers");
const COORDINATE_SYSTEM = "xrpa.coordinates.system";
const TRANSFORM_BINDING = "xrpa.coordinates.transformBinding";
function Angle(defaultValue, description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Angle,
        properties: {
            [InterfaceTypes_1.FIELD_DEFAULT]: defaultValue,
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Angle = Angle;
function Distance(defaultValue, description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Distance,
        properties: {
            [InterfaceTypes_1.FIELD_DEFAULT]: defaultValue,
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Distance = Distance;
function Matrix3x2(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Matrix3x2,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Matrix3x2 = Matrix3x2;
function Vector2(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Vector2,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Vector2 = Vector2;
function UnitVector2(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.UnitVector2,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.UnitVector2 = UnitVector2;
function Distance2(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Distance2,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Distance2 = Distance2;
function Scale2(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Scale2,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Scale2 = Scale2;
function Matrix4x3(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Matrix4x3,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Matrix4x3 = Matrix4x3;
function Matrix4x4(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Matrix4x4,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Matrix4x4 = Matrix4x4;
function Quaternion(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Quaternion,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Quaternion = Quaternion;
function EulerAngles(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.EulerAngles,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.EulerAngles = EulerAngles;
function Vector3(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Vector3,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Vector3 = Vector3;
function UnitVector3(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.UnitVector3,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.UnitVector3 = UnitVector3;
function Distance3(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Distance3,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Distance3 = Distance3;
function Scale3(description) {
    return (0, Helpers_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Scale3,
        properties: {
            [InterfaceTypes_1.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Scale3 = Scale3;
////////////////////////////////////////////////////////////////////////////////
function canSetCoordinateSystem(ctx) {
    return (0, ProgramInterface_1.isProgramInterfaceContext)(ctx) || (0, RuntimeEnvironment_1.isRuntimeEnvironmentContext)(ctx);
}
function useCoordinateSystem(coordSystem) {
    const ctx = (0, XrpaLanguage_1.getContext)(canSetCoordinateSystem, "Call must be made within a program or runtime environment");
    ctx.properties[COORDINATE_SYSTEM] = coordSystem;
}
exports.useCoordinateSystem = useCoordinateSystem;
function getCoordinateSystem(ctx) {
    const coordSystem = ctx.properties[COORDINATE_SYSTEM];
    return coordSystem ?? CoordinateTransformer_1.DEFAULT_COORDINATE_SYSTEM;
}
exports.getCoordinateSystem = getCoordinateSystem;
function ObjectTransform(bindings, dataType) {
    dataType = (0, Helpers_1.resolveThunk)(dataType);
    if ((0, InterfaceTypes_1.isStructDataType)(dataType)) {
        const fieldBindings = bindings;
        (0, assert_1.default)(typeof fieldBindings === "object" && fieldBindings !== null, "ObjectTransform: expected object binding");
        let ret = dataType;
        if (fieldBindings.position && ret.fields[fieldBindings.position].typename === BuiltinTypes_1.BuiltinType.Vector3) {
            ret = (0, simply_immutable_1.replaceImmutable)(ret, ["fields", fieldBindings.position], ObjectTransform("position", ret.fields[fieldBindings.position]));
        }
        if (fieldBindings.rotation && ret.fields[fieldBindings.rotation].typename === BuiltinTypes_1.BuiltinType.Quaternion) {
            ret = (0, simply_immutable_1.replaceImmutable)(ret, ["fields", fieldBindings.rotation], ObjectTransform("rotation", ret.fields[fieldBindings.rotation]));
        }
        if (fieldBindings.scale && ret.fields[fieldBindings.scale].typename === BuiltinTypes_1.BuiltinType.Scale3) {
            ret = (0, simply_immutable_1.replaceImmutable)(ret, ["fields", fieldBindings.scale], ObjectTransform("scale", dataType.fields[fieldBindings.scale]));
        }
        return ret;
    }
    else {
        return (0, XrpaLanguage_1.setProperty)(dataType, TRANSFORM_BINDING, bindings);
    }
}
exports.ObjectTransform = ObjectTransform;
function getObjectTransformBinding(dataType) {
    return dataType.properties[TRANSFORM_BINDING];
}
exports.getObjectTransformBinding = getObjectTransformBinding;
//# sourceMappingURL=Coordinates.js.map
