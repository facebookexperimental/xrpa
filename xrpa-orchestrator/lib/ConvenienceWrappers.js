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
exports.XrpaPythonApplication = exports.XrpaNativePythonProgram = exports.XrpaNativeCppProgram = exports.addBuckDependency = exports.useBuck = exports.PythonListType = exports.StdVectorArrayType = exports.OvrCoordinateSystem = exports.withHeader = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const InterfaceTypes_1 = require("./InterfaceTypes");
const NativeProgram_1 = require("./NativeProgram");
const RuntimeEnvironment_1 = require("./RuntimeEnvironment");
const CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
const CppModuleDefinition_1 = require("./targets/cpp/CppModuleDefinition");
const PythonApplication_1 = require("./targets/python/PythonApplication");
const PythonModuleDefinition_1 = require("./targets/python/PythonModuleDefinition");
function withHeader(headerFile, types) {
    const ret = {};
    for (const key in types) {
        ret[key] = {
            typename: types[key],
            headerFile,
        };
    }
    return ret;
}
exports.withHeader = withHeader;
exports.OvrCoordinateSystem = {
    up: CoordinateTransformer_1.CoordAxis.posY,
    right: CoordinateTransformer_1.CoordAxis.posX,
    forward: CoordinateTransformer_1.CoordAxis.negZ,
    spatialUnit: CoordinateTransformer_1.SpatialUnitType.meter,
    angularUnit: CoordinateTransformer_1.AngularUnitType.radian,
};
exports.StdVectorArrayType = {
    headerFile: "<vector>",
    typename: "std::vector",
    setSize: "resize()",
    removeAll: "clear()",
    addItem: "push()",
};
exports.PythonListType = {
    typename: "typing.List",
    setSize: null,
    removeAll: "clear()",
    addItem: "append()",
};
//////////////////////////////////////////////////////////////////////////////
const BUCK_CONFIG = "xrpa.cpp.buckConfig";
function useBuck(config) {
    const ctx = (0, NativeProgram_1.getNativeProgramContext)();
    ctx.properties[BUCK_CONFIG] = config;
}
exports.useBuck = useBuck;
function getBuckConfig(ctx) {
    return ctx.properties[BUCK_CONFIG];
}
function addBuckDependency(dep) {
    const ctx = (0, NativeProgram_1.getNativeProgramContext)();
    const buckConfig = getBuckConfig(ctx);
    if (buckConfig) {
        if (buckConfig.deps) {
            (0, xrpa_utils_1.pushUnique)(buckConfig.deps, dep);
        }
        else {
            buckConfig.deps = [dep];
        }
    }
}
exports.addBuckDependency = addBuckDependency;
function mapInterfaceImageTypes(programInterface, usingBuck) {
    let hasImageTypes = false;
    for (const name in programInterface.namedTypes) {
        const type = programInterface.namedTypes[name];
        if (type.properties[InterfaceTypes_1.IS_IMAGE_TYPE] === true) {
            (0, RuntimeEnvironment_1.mapInterfaceType)(programInterface, type.name, {
                typename: "ImageTypes::Image",
                headerFile: "<ImageTypes.h>",
            });
            hasImageTypes = true;
        }
    }
    if (hasImageTypes) {
        (0, RuntimeEnvironment_1.mapInterfaceType)(programInterface, "ImageFormat", {
            typename: "ImageTypes::Format",
            headerFile: "<ImageTypes.h>",
        });
        (0, RuntimeEnvironment_1.mapInterfaceType)(programInterface, "ImageEncoding", {
            typename: "ImageTypes::Encoding",
            headerFile: "<ImageTypes.h>",
        });
        (0, RuntimeEnvironment_1.mapInterfaceType)(programInterface, "ImageOrientation", {
            typename: "ImageTypes::Orientation",
            headerFile: "<ImageTypes.h>",
        });
        if (usingBuck) {
            addBuckDependency("//arvr/projects/xred/platform/modules/Shared/image:ImageTypes");
        }
    }
}
function mapCppImageTypes() {
    const ctx = (0, NativeProgram_1.getNativeProgramContext)();
    const usingBuck = getBuckConfig(ctx) != undefined;
    if (ctx.programInterface) {
        mapInterfaceImageTypes(ctx.programInterface, usingBuck);
    }
    for (const key in ctx.externalProgramInterfaces) {
        const programInterface = ctx.externalProgramInterfaces[key].programInterface;
        mapInterfaceImageTypes(programInterface, usingBuck);
    }
}
function XrpaNativeCppProgram(name, outputDir, callback) {
    const ctx = {
        __isRuntimeEnvironmentContext: true,
        __isNativeProgramContext: true,
        programInterface: undefined,
        externalProgramInterfaces: {},
        properties: {},
    };
    (0, xrpa_utils_1.runInContext)(ctx, callback, () => {
        (0, RuntimeEnvironment_1.mapArrays)(exports.StdVectorArrayType);
    });
    (0, xrpa_utils_1.runInContext)(ctx, mapCppImageTypes);
    const buckConfig = getBuckConfig(ctx);
    const datamap = (0, RuntimeEnvironment_1.getDataMap)(ctx);
    datamap.typeBuckDeps = buckConfig?.deps ?? [];
    const ret = new CppModuleDefinition_1.CppModuleDefinition(name, datamap, outputDir, buckConfig);
    (0, NativeProgram_1.applyNativeProgramContext)(ctx, ret);
    return ret;
}
exports.XrpaNativeCppProgram = XrpaNativeCppProgram;
function XrpaNativePythonProgram(name, outputDir, callback) {
    const ctx = {
        __isRuntimeEnvironmentContext: true,
        __isNativeProgramContext: true,
        programInterface: undefined,
        externalProgramInterfaces: {},
        properties: {},
    };
    (0, xrpa_utils_1.runInContext)(ctx, callback, () => {
        (0, RuntimeEnvironment_1.mapArrays)(exports.PythonListType);
    });
    const datamap = (0, RuntimeEnvironment_1.getDataMap)(ctx);
    const ret = new PythonModuleDefinition_1.PythonModuleDefinition(name, datamap, outputDir);
    (0, NativeProgram_1.applyNativeProgramContext)(ctx, ret);
    return ret;
}
exports.XrpaNativePythonProgram = XrpaNativePythonProgram;
function XrpaPythonApplication(name, outputDir, callback) {
    return new PythonApplication_1.PythonApplication(XrpaNativePythonProgram(name, outputDir, callback));
}
exports.XrpaPythonApplication = XrpaPythonApplication;
//# sourceMappingURL=ConvenienceWrappers.js.map
