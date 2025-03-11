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
exports.getDataflowInputStructSpec = exports.getDataflowInputs = exports.isDataflowProgramDefinition = exports.isDataflowConnection = exports.isDataflowForeignObjectInstantiation = exports.isDataflowGraphNode = void 0;
const InterfaceTypes_1 = require("../InterfaceTypes");
const ProgramInterface_1 = require("../ProgramInterface");
const ProgramInterfaceConverter_1 = require("../ProgramInterfaceConverter");
function isDataflowGraphNode(obj) {
    return Boolean(typeof obj === "object" && obj && obj.__isDataflowGraphNode === true);
}
exports.isDataflowGraphNode = isDataflowGraphNode;
function isDataflowForeignObjectInstantiation(obj) {
    return Boolean(typeof obj === "object" && obj && obj.__isDataflowObjectInstantiation === true);
}
exports.isDataflowForeignObjectInstantiation = isDataflowForeignObjectInstantiation;
function isDataflowConnection(obj) {
    return Boolean(typeof obj === "object" && obj && obj.__isDataflowConnection === true);
}
exports.isDataflowConnection = isDataflowConnection;
function isDataflowProgramDefinition(obj) {
    return Boolean(typeof obj === "object" && obj && obj.__isDataflowProgramDefinition === true);
}
exports.isDataflowProgramDefinition = isDataflowProgramDefinition;
function getDataflowInputs(dataflow) {
    return Object.values(dataflow.parameters).filter(paramDef => (0, ProgramInterface_1.getDirectionality)(paramDef.dataType) === "inbound").sort((a, b) => {
        return a.name.localeCompare(b.name);
    }).map(paramDef => {
        return {
            parameter: paramDef,
            connections: dataflow.paramConnections.filter(connection => connection[0] === paramDef.name).map(connection => connection[1]),
        };
    });
}
exports.getDataflowInputs = getDataflowInputs;
function getDataflowInputStructSpec(inputs, moduleDef) {
    const paramsStructSpec = {};
    for (const input of inputs) {
        const dataType = input.parameter.dataType;
        paramsStructSpec[input.parameter.name] = moduleDef.convertUserTypeSpec({
            type: (0, ProgramInterfaceConverter_1.getTypeName)(dataType),
            description: (0, InterfaceTypes_1.getFieldDescription)(dataType),
            defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(dataType),
        });
    }
    return paramsStructSpec;
}
exports.getDataflowInputStructSpec = getDataflowInputStructSpec;
//# sourceMappingURL=DataflowProgramDefinition.js.map
