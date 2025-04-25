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
exports.getDataflowOutputParamsStructSpec = exports.getDataflowInputParamsStructSpec = exports.getReconcilerDefForNode = exports.getDataflowOutputs = exports.getDataflowInputs = exports.isDataflowProgramDefinition = exports.isDataflowConnection = exports.isDataflowStringEmbedding = exports.isDataflowForeignObjectInstantiation = exports.isDataflowGraphNode = void 0;
const assert_1 = __importDefault(require("assert"));
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
function isDataflowStringEmbedding(obj) {
    return Boolean(typeof obj === "object" && obj && obj.__isDataflowStringEmbedding === true);
}
exports.isDataflowStringEmbedding = isDataflowStringEmbedding;
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
function getDataflowOutputs(dataflow) {
    return Object.values(dataflow.parameters).filter(paramDef => (0, ProgramInterface_1.getDirectionality)(paramDef.dataType) === "outbound").sort((a, b) => {
        return a.name.localeCompare(b.name);
    });
}
exports.getDataflowOutputs = getDataflowOutputs;
function getReconcilerDefForNode(moduleDef, graphNode) {
    (0, assert_1.default)(isDataflowForeignObjectInstantiation(graphNode));
    const storeDef = moduleDef.getDataStore(graphNode.programInterfaceName);
    (0, assert_1.default)(storeDef, `Data store ${graphNode.programInterfaceName} not found for ${graphNode.name}`);
    const reconcilerDef = storeDef.getOutputReconcilers().find(reconcilerDef => reconcilerDef.type.getName() === graphNode.collectionName);
    (0, assert_1.default)(reconcilerDef, `Output reconciler for ${graphNode.collectionName} not found for ${graphNode.name}`);
    return reconcilerDef;
}
exports.getReconcilerDefForNode = getReconcilerDefForNode;
function getDataflowInputParamsStructSpec(inputs, moduleDef) {
    const paramsStructSpec = {};
    for (const inp of inputs) {
        const param = inp.parameter;
        if (param.dataType.typename === "LateBindingType") {
            const source = inp.connections[0];
            (0, assert_1.default)(source, `Late binding type ${param.name} must have a connection`);
            const reconcilerDef = getReconcilerDefForNode(moduleDef, source.targetNode);
            const fieldDef = reconcilerDef.type.getAllFields()[source.targetPort];
            paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
                type: fieldDef.type,
                description: undefined,
                defaultValue: undefined,
            });
        }
        else {
            paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
                type: (0, ProgramInterfaceConverter_1.getTypeName)(param.dataType),
                description: (0, InterfaceTypes_1.getFieldDescription)(param.dataType),
                defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(param.dataType),
            });
        }
    }
    return paramsStructSpec;
}
exports.getDataflowInputParamsStructSpec = getDataflowInputParamsStructSpec;
function getDataflowOutputParamsStructSpec(outputs, moduleDef) {
    const paramsStructSpec = {};
    for (const param of outputs) {
        if (param.source && isDataflowForeignObjectInstantiation(param.source.targetNode)) {
            const reconcilerDef = getReconcilerDefForNode(moduleDef, param.source.targetNode);
            const fieldDef = reconcilerDef.type.getAllFields()[param.source.targetPort];
            paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
                type: fieldDef.type,
                description: (0, InterfaceTypes_1.getFieldDescription)(param.dataType),
                defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(param.dataType),
            });
        }
        else {
            paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
                type: (0, ProgramInterfaceConverter_1.getTypeName)(param.dataType),
                description: (0, InterfaceTypes_1.getFieldDescription)(param.dataType),
                defaultValue: (0, InterfaceTypes_1.getFieldDefaultValue)(param.dataType),
            });
        }
    }
    return paramsStructSpec;
}
exports.getDataflowOutputParamsStructSpec = getDataflowOutputParamsStructSpec;
//# sourceMappingURL=DataflowProgramDefinition.js.map
