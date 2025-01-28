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
exports.XrpaPythonApplication = exports.XrpaNativePythonProgram = exports.XrpaNativeCppProgram = exports.addBuckDependency = exports.useBuck = exports.StdVectorArrayType = exports.OvrCoordinateSystem = exports.withHeader = void 0;
const NativeProgram_1 = require("./NativeProgram");
const RuntimeEnvironment_1 = require("./RuntimeEnvironment");
const XrpaLanguage_1 = require("./XrpaLanguage");
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
    getSize: "size()",
    setSize: "resize()",
    removeAll: "clear()",
    addItem: "push()",
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
            buckConfig.deps.push(dep);
        }
        else {
            buckConfig.deps = [dep];
        }
    }
}
exports.addBuckDependency = addBuckDependency;
function XrpaNativeCppProgram(name, outputDir, callback) {
    const ctx = {
        __isRuntimeEnvironmentContext: true,
        __isNativeProgramContext: true,
        programInterface: undefined,
        externalProgramInterfaces: {},
        properties: {},
    };
    (0, XrpaLanguage_1.runInContext)(ctx, callback);
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
    (0, XrpaLanguage_1.runInContext)(ctx, callback);
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
