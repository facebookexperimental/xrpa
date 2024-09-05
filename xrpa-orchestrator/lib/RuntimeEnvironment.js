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
exports.bindExternalProgram = exports.getDataMap = exports.mapArrays = exports.getInterfaceTypeMap = exports.mapInterfaceType = exports.mapType = exports.getRuntimeEnvironmentContext = exports.isRuntimeEnvironmentContext = exports.getExternalProgramCallerContext = exports.isExternalProgramCallerContext = void 0;
const Coordinates_1 = require("./Coordinates");
const XrpaLanguage_1 = require("./XrpaLanguage");
const BuiltinTypes_1 = require("./shared/BuiltinTypes");
const Helpers_1 = require("./shared/Helpers");
const TYPE_MAP = "xrpa.nativeProgram.typeMap";
const INTERFACE_TYPE_MAPS = "xrpa.nativeProgram.interfaceTypeMaps";
const LOCAL_ARRAY_TYPE = "xrpa.nativeProgram.localArrayType";
function isExternalProgramCallerContext(ctx) {
    return typeof ctx === "object" && ctx !== null && "externalProgramInterfaces" in ctx;
}
exports.isExternalProgramCallerContext = isExternalProgramCallerContext;
function getExternalProgramCallerContext() {
    return (0, XrpaLanguage_1.getContext)(isExternalProgramCallerContext, "Call is only valid within a context which can bind external programs");
}
exports.getExternalProgramCallerContext = getExternalProgramCallerContext;
function isRuntimeEnvironmentContext(ctx) {
    return typeof ctx === "object" && ctx !== null && "__isRuntimeEnvironmentContext" in ctx;
}
exports.isRuntimeEnvironmentContext = isRuntimeEnvironmentContext;
function getRuntimeEnvironmentContext() {
    return (0, XrpaLanguage_1.getContext)(isRuntimeEnvironmentContext, "Call is only valid within a runtime environment");
}
exports.getRuntimeEnvironmentContext = getRuntimeEnvironmentContext;
function mapTypeInternal(typeMap, dataType, mapped) {
    if (typeof dataType === "string") {
        typeMap[dataType] = mapped;
        return;
    }
    dataType = (0, Helpers_1.resolveThunk)(dataType);
    if (dataType.typename in BuiltinTypes_1.BuiltinType) {
        typeMap[dataType.typename] = mapped;
        return;
    }
    if ((0, XrpaLanguage_1.isNamedDataType)(dataType) && dataType.name) {
        typeMap[dataType.name] = mapped;
        return;
    }
    throw new Error(`Cannot map type ${dataType.typename}`);
}
function mapType(dataType, mapped) {
    const ctx = getRuntimeEnvironmentContext();
    let typeMap = ctx.properties[TYPE_MAP];
    if (!typeMap) {
        typeMap = ctx.properties[TYPE_MAP] = {};
    }
    mapTypeInternal(typeMap, dataType, mapped);
}
exports.mapType = mapType;
function mapInterfaceType(programInterface, dataType, mapped) {
    const ctx = getRuntimeEnvironmentContext();
    let typeMaps = ctx.properties[INTERFACE_TYPE_MAPS];
    if (!typeMaps) {
        typeMaps = ctx.properties[INTERFACE_TYPE_MAPS] = {};
    }
    let typeMap = typeMaps[programInterface.interfaceName];
    if (!typeMap) {
        typeMap = typeMaps[programInterface.interfaceName] = {};
    }
    mapTypeInternal(typeMap, dataType, mapped);
}
exports.mapInterfaceType = mapInterfaceType;
function getInterfaceTypeMap(ctx, programInterface) {
    const typeMaps = ctx.properties[INTERFACE_TYPE_MAPS];
    return (typeMaps?.[programInterface.interfaceName]) ?? {};
}
exports.getInterfaceTypeMap = getInterfaceTypeMap;
function mapArrays(localArrayType) {
    const ctx = getRuntimeEnvironmentContext();
    ctx.properties[LOCAL_ARRAY_TYPE] = localArrayType;
}
exports.mapArrays = mapArrays;
function getDataMap(ctx) {
    const typeMap = ctx.properties[TYPE_MAP];
    return {
        coordinateSystem: (0, Coordinates_1.getCoordinateSystem)(ctx),
        typeMap: typeMap ?? {},
        typeBuckDeps: [],
        localArrayType: ctx.properties[LOCAL_ARRAY_TYPE],
    };
}
exports.getDataMap = getDataMap;
function bindExternalProgram(programInterface) {
    const ctx = getExternalProgramCallerContext();
    // recurse into dependent external program interfaces; do this first to maintain depenency order
    if (isExternalProgramCallerContext(programInterface)) {
        for (const key in programInterface.externalProgramInterfaces) {
            bindExternalProgram(programInterface.externalProgramInterfaces[key].programInterface);
        }
    }
    if (!(programInterface.interfaceName in ctx.externalProgramInterfaces)) {
        ctx.externalProgramInterfaces[programInterface.interfaceName] = {
            programInterface,
            properties: {},
        };
    }
    return ctx.externalProgramInterfaces[programInterface.interfaceName];
}
exports.bindExternalProgram = bindExternalProgram;
//# sourceMappingURL=RuntimeEnvironment.js.map
