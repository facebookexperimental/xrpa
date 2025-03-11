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

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnityPackageModuleDefinition = exports.UepluginModuleDefinition = exports.CppStandalone = exports.CppModuleDefinition = exports.ModuleDefinition = exports.DataStoreDefinition = exports.DataModelDefinition = exports.SpatialUnitType = exports.CoordAxis = exports.AngularUnitType = exports.isBuiltinType = exports.BuiltinType = exports.runProcess = exports.FileWriter = exports.buckRun = exports.buckBuild = void 0;
var xrpa_file_utils_1 = require("@xrpa/xrpa-file-utils");
Object.defineProperty(exports, "buckBuild", { enumerable: true, get: function () { return xrpa_file_utils_1.buckBuild; } });
Object.defineProperty(exports, "buckRun", { enumerable: true, get: function () { return xrpa_file_utils_1.buckRun; } });
Object.defineProperty(exports, "FileWriter", { enumerable: true, get: function () { return xrpa_file_utils_1.FileWriter; } });
Object.defineProperty(exports, "runProcess", { enumerable: true, get: function () { return xrpa_file_utils_1.runProcess; } });
var BuiltinTypes_1 = require("./shared/BuiltinTypes");
Object.defineProperty(exports, "BuiltinType", { enumerable: true, get: function () { return BuiltinTypes_1.BuiltinType; } });
Object.defineProperty(exports, "isBuiltinType", { enumerable: true, get: function () { return BuiltinTypes_1.isBuiltinType; } });
var CoordinateTransformer_1 = require("./shared/CoordinateTransformer");
Object.defineProperty(exports, "AngularUnitType", { enumerable: true, get: function () { return CoordinateTransformer_1.AngularUnitType; } });
Object.defineProperty(exports, "CoordAxis", { enumerable: true, get: function () { return CoordinateTransformer_1.CoordAxis; } });
Object.defineProperty(exports, "SpatialUnitType", { enumerable: true, get: function () { return CoordinateTransformer_1.SpatialUnitType; } });
var DataModel_1 = require("./shared/DataModel");
Object.defineProperty(exports, "DataModelDefinition", { enumerable: true, get: function () { return DataModel_1.DataModelDefinition; } });
var DataStore_1 = require("./shared/DataStore");
Object.defineProperty(exports, "DataStoreDefinition", { enumerable: true, get: function () { return DataStore_1.DataStoreDefinition; } });
var ModuleDefinition_1 = require("./shared/ModuleDefinition");
Object.defineProperty(exports, "ModuleDefinition", { enumerable: true, get: function () { return ModuleDefinition_1.ModuleDefinition; } });
__exportStar(require("./shared/TypeDefinition"), exports);
var CppModuleDefinition_1 = require("./targets/cpp/CppModuleDefinition");
Object.defineProperty(exports, "CppModuleDefinition", { enumerable: true, get: function () { return CppModuleDefinition_1.CppModuleDefinition; } });
var CppStandalone_1 = require("./targets/cpp/CppStandalone");
Object.defineProperty(exports, "CppStandalone", { enumerable: true, get: function () { return CppStandalone_1.CppStandalone; } });
var UepluginModuleDefinition_1 = require("./targets/ueplugin/UepluginModuleDefinition");
Object.defineProperty(exports, "UepluginModuleDefinition", { enumerable: true, get: function () { return UepluginModuleDefinition_1.UepluginModuleDefinition; } });
var UnityPackageModuleDefinition_1 = require("./targets/unitypackage/UnityPackageModuleDefinition");
Object.defineProperty(exports, "UnityPackageModuleDefinition", { enumerable: true, get: function () { return UnityPackageModuleDefinition_1.UnityPackageModuleDefinition; } });
// V2 DSL:
__exportStar(require("./XrpaLanguage"), exports);
__exportStar(require("./ProgramInterface"), exports);
__exportStar(require("./InterfaceTypes"), exports);
__exportStar(require("./RuntimeEnvironment"), exports);
__exportStar(require("./Coordinates"), exports);
__exportStar(require("./GameEngine"), exports);
__exportStar(require("./NativeProgram"), exports);
__exportStar(require("./DataflowProgram"), exports);
__exportStar(require("./Unity"), exports);
__exportStar(require("./UnrealEngine"), exports);
__exportStar(require("./ConvenienceWrappers"), exports);
__exportStar(require("./Eigen"), exports);
//# sourceMappingURL=index.js.map
