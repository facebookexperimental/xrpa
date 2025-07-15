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
exports.applyNativeProgramContext = exports.setProgramInterface = exports.addSetting = exports.getNativeProgramContext = exports.isNativeProgramContext = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const ProgramInterfaceConverter_1 = require("./ProgramInterfaceConverter");
const MODULE_SETTINGS = "xrpa.nativeProgram.settings";
function isNativeProgramContext(ctx) {
    return typeof ctx === "object" && ctx !== null && "__isNativeProgramContext" in ctx;
}
exports.isNativeProgramContext = isNativeProgramContext;
function getNativeProgramContext() {
    return (0, xrpa_utils_1.getContext)(isNativeProgramContext, "Call must be made within a native program");
}
exports.getNativeProgramContext = getNativeProgramContext;
function addSetting(name, dataType) {
    const ctx = getNativeProgramContext();
    let settings = ctx.properties[MODULE_SETTINGS];
    if (!settings) {
        settings = ctx.properties[MODULE_SETTINGS] = {};
    }
    if (name in settings) {
        throw new Error(`Setting ${name} already exists`);
    }
    settings[name] = (0, xrpa_utils_1.resolveThunk)(dataType);
}
exports.addSetting = addSetting;
function setProgramInterface(programInterface) {
    const ctx = getNativeProgramContext();
    if (Array.isArray(programInterface)) {
        ctx.programInterfaces.push(...programInterface);
    }
    else {
        ctx.programInterfaces.push(programInterface);
    }
}
exports.setProgramInterface = setProgramInterface;
//////////////////////////////////////////////////////////////////////////////
function applyNativeProgramContext(ctx, moduleDef) {
    for (const programInterface of ctx.programInterfaces) {
        (0, ProgramInterfaceConverter_1.bindProgramInterfaceToModule)(ctx, moduleDef, programInterface, false);
    }
    for (const name in ctx.externalProgramInterfaces) {
        (0, ProgramInterfaceConverter_1.bindProgramInterfaceToModule)(ctx, moduleDef, ctx.externalProgramInterfaces[name].programInterface, true);
    }
    const settings = (ctx.properties[MODULE_SETTINGS] ?? {});
    for (const name in settings) {
        moduleDef.addSetting(name, (0, ProgramInterfaceConverter_1.convertDataTypeToUserTypeSpec)(settings[name], null));
    }
}
exports.applyNativeProgramContext = applyNativeProgramContext;
//# sourceMappingURL=NativeProgram.js.map
