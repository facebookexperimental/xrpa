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
exports.XrpaDataflowProgram = exports.SelfTerminateOn = exports.ObjectField = exports.ObjectReference = exports.Instantiate = exports.getDataflowProgramContext = exports.isDataflowProgramContext = exports.isDataflowGraphNode = exports.isDataflowForeignObjectInstantiation = exports.isDataflowConnection = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const ProgramInterface_1 = require("./ProgramInterface");
const DataflowProgramDefinition_1 = require("./shared/DataflowProgramDefinition");
var DataflowProgramDefinition_2 = require("./shared/DataflowProgramDefinition");
Object.defineProperty(exports, "isDataflowConnection", { enumerable: true, get: function () { return DataflowProgramDefinition_2.isDataflowConnection; } });
Object.defineProperty(exports, "isDataflowForeignObjectInstantiation", { enumerable: true, get: function () { return DataflowProgramDefinition_2.isDataflowForeignObjectInstantiation; } });
Object.defineProperty(exports, "isDataflowGraphNode", { enumerable: true, get: function () { return DataflowProgramDefinition_2.isDataflowGraphNode; } });
function isDataflowProgramContext(ctx) {
    return typeof ctx === "object" && ctx !== null && ctx.__isDataflowProgramContext === true;
}
exports.isDataflowProgramContext = isDataflowProgramContext;
function getDataflowProgramContext() {
    return (0, xrpa_utils_1.getContext)(isDataflowProgramContext, "Call is only valid within a DataflowProgram");
}
exports.getDataflowProgramContext = getDataflowProgramContext;
function Instantiate(collection, fieldValues, isBuffered = false) {
    const ctx = getDataflowProgramContext();
    const programInterfaceName = collection[0].programInterface.interfaceName;
    const collectionType = collection[1];
    const ret = {
        __isDataflowGraphNode: true,
        __isDataflowObjectInstantiation: true,
        name: `${(0, xrpa_utils_1.lowerFirst)(programInterfaceName)}${(0, xrpa_utils_1.upperFirst)(collectionType)}${ctx.idCount++}`,
        programInterfaceName,
        collectionType,
        fieldValues,
        isBuffered,
    };
    ctx.graphNodes.push(ret);
    ctx.programInterfaceNames.add(programInterfaceName);
    return ret;
}
exports.Instantiate = Instantiate;
function ObjectReference(node) {
    return {
        __isDataflowConnection: true,
        targetNode: node,
        targetPort: "id",
    };
}
exports.ObjectReference = ObjectReference;
function ObjectField(node, fieldName) {
    return {
        __isDataflowConnection: true,
        targetNode: node,
        targetPort: fieldName,
    };
}
exports.ObjectField = ObjectField;
function SelfTerminateOn(fieldValue) {
    const ctx = getDataflowProgramContext();
    ctx.selfTerminateEvents.push({
        __isDataflowConnection: true,
        targetNode: fieldValue.targetNode,
        targetPort: fieldValue.targetPort,
    });
}
exports.SelfTerminateOn = SelfTerminateOn;
function XrpaDataflowProgram(name, callback) {
    let ctx;
    const programInterface = (0, ProgramInterface_1.XrpaProgramInterface)(`XrpaDataflow.${name}`, piCtx => {
        const dfCtx = (0, xrpa_utils_1.augmentInPlace)(piCtx, {
            __isDataflowProgramContext: true,
            externalProgramInterfaces: {},
            idCount: 0,
            programInterfaceNames: new Set(),
            graphNodes: [],
            selfTerminateEvents: [],
        });
        (0, xrpa_utils_1.runInContext)(dfCtx, callback);
        ctx = dfCtx;
    });
    (0, assert_1.default)(ctx);
    const nodeMaxDepths = new Map();
    const paramConnections = {};
    function walkConnections(graphNode, graphPath, pathBreaksCycles) {
        if (!(0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode)) {
            (0, assert_1.default)(false, "Unexpected graph node type");
        }
        const newGraphPath = [...graphPath, graphNode.name];
        pathBreaksCycles = pathBreaksCycles || graphNode.isBuffered;
        // check for cycles and stop recursion if found
        if (graphPath.includes(graphNode.name)) {
            if (pathBreaksCycles) {
                return;
            }
            else {
                throw new Error(`cycle detected: ${newGraphPath.join(" -> ")}`);
            }
        }
        // update node depth
        const oldDepth = nodeMaxDepths.get(graphNode) ?? 0;
        if (newGraphPath.length > oldDepth) {
            nodeMaxDepths.set(graphNode, newGraphPath.length);
        }
        // recurse
        for (const fieldName in graphNode.fieldValues) {
            const fieldValue = graphNode.fieldValues[fieldName];
            if ((0, DataflowProgramDefinition_1.isDataflowGraphNode)(fieldValue)) {
                walkConnections(fieldValue, newGraphPath, pathBreaksCycles);
            }
            else if ((0, DataflowProgramDefinition_1.isDataflowConnection)(fieldValue)) {
                walkConnections(fieldValue.targetNode, newGraphPath, pathBreaksCycles);
            }
            else if ((0, ProgramInterface_1.isXrpaProgramParam)(fieldValue)) {
                const key = [fieldValue.name, graphNode.name, fieldName];
                paramConnections[key.join("/")] = [fieldValue.name, {
                        __isDataflowConnection: true,
                        targetNode: graphNode,
                        targetPort: fieldName,
                    }];
            }
        }
    }
    for (const graphNode of ctx.graphNodes) {
        walkConnections(graphNode, [], false);
    }
    for (const connection of ctx.selfTerminateEvents) {
        walkConnections(connection.targetNode, ["selfTerminateEvent"], false);
    }
    const dataflow = (0, xrpa_utils_1.augment)(programInterface, {
        __isDataflowProgramDefinition: true,
        // sort nodes by max depth in descending order, so they get created in the right order
        graphNodes: [...nodeMaxDepths.keys()].sort((a, b) => {
            const aDepth = nodeMaxDepths.get(a) ?? 0;
            const bDepth = nodeMaxDepths.get(b) ?? 0;
            return bDepth - aDepth;
        }),
        selfTerminateEvents: ctx.selfTerminateEvents,
        paramConnections: Object.values(paramConnections),
        // sort program interface names for stable output
        programInterfaceNames: [...ctx.programInterfaceNames].sort(),
    });
    return dataflow;
}
exports.XrpaDataflowProgram = XrpaDataflowProgram;
//# sourceMappingURL=DataflowProgram.js.map
