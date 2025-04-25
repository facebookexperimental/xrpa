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
exports.XrpaDataflowProgram = exports.StringEmbedding = exports.SelfTerminateOn = exports.ObjectReference = exports.ObjectField = exports.Instantiate = exports.getDataflowProgramContext = exports.isDataflowProgramContext = exports.isDataflowGraphNode = exports.isDataflowForeignObjectInstantiation = exports.isDataflowConnection = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const InterfaceTypes_1 = require("./InterfaceTypes");
const ProgramInterface_1 = require("./ProgramInterface");
const DataflowProgramDefinition_1 = require("./shared/DataflowProgramDefinition");
var DataflowProgramDefinition_2 = require("./shared/DataflowProgramDefinition");
Object.defineProperty(exports, "isDataflowConnection", { enumerable: true, get: function () { return DataflowProgramDefinition_2.isDataflowConnection; } });
Object.defineProperty(exports, "isDataflowForeignObjectInstantiation", { enumerable: true, get: function () { return DataflowProgramDefinition_2.isDataflowForeignObjectInstantiation; } });
Object.defineProperty(exports, "isDataflowGraphNode", { enumerable: true, get: function () { return DataflowProgramDefinition_2.isDataflowGraphNode; } });
const gEmbeddingRegex = /{{{(.+?)}}}/g;
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
    const collectionName = collection[1];
    const collectionType = collection[0].programInterface.namedTypes[collectionName];
    (0, assert_1.default)((0, InterfaceTypes_1.isCollectionDataType)(collectionType));
    const nodeId = ctx.graphNodes.length;
    const ret = {
        __isDataflowGraphNode: true,
        nodeId,
        name: `${(0, xrpa_utils_1.lowerFirst)(programInterfaceName)}${(0, xrpa_utils_1.upperFirst)(collectionName)}${nodeId}`,
        isBuffered,
        __isDataflowObjectInstantiation: true,
        programInterfaceName,
        collectionName,
        collectionType,
        fieldValues,
    };
    ctx.graphNodes.push(ret);
    ctx.programInterfaceNames.add(programInterfaceName);
    return ret;
}
exports.Instantiate = Instantiate;
function dataflowConnectionToString() {
    return `{{{connection:${this.targetNode.nodeId}/${this.targetPort}}}}`;
}
function ObjectField(node, fieldName) {
    return {
        __isDataflowConnection: true,
        toString: dataflowConnectionToString,
        targetNode: node,
        targetPort: fieldName,
    };
}
exports.ObjectField = ObjectField;
function ObjectReference(node) {
    return ObjectField(node, "id");
}
exports.ObjectReference = ObjectReference;
function SelfTerminateOn(fieldValue) {
    const ctx = getDataflowProgramContext();
    ctx.selfTerminateEvents.push(ObjectField(fieldValue.targetNode, fieldValue.targetPort));
}
exports.SelfTerminateOn = SelfTerminateOn;
function StringEmbedding(ctx, strValue) {
    if (strValue in ctx.stringEmbeddingNodes) {
        return ctx.stringEmbeddingNodes[strValue];
    }
    // extract embeddings
    const foundEmbeddings = new Set();
    const embeddedParams = [];
    const embeddedConnections = [];
    gEmbeddingRegex.lastIndex = 0;
    const matches = strValue.matchAll(gEmbeddingRegex);
    for (const match of matches) {
        const embedding = match[1];
        if (foundEmbeddings.has(embedding)) {
            // dedupe
            continue;
        }
        foundEmbeddings.add(embedding);
        if (embedding.startsWith("param:")) {
            const paramName = embedding.slice("param:".length);
            embeddedParams.push(paramName);
        }
        else if (embedding.startsWith("connection:")) {
            const connectionFields = embedding.slice("connection:".length).split("/");
            const targetNodeId = parseInt(connectionFields[0], 10);
            const targetPort = connectionFields[1];
            const targetNode = ctx.graphNodes[targetNodeId];
            embeddedConnections.push(ObjectField(targetNode, targetPort));
        }
    }
    const nodeId = ctx.graphNodes.length;
    const ret = {
        __isDataflowGraphNode: true,
        nodeId,
        name: `stringEmbedding${nodeId}`,
        isBuffered: false,
        __isDataflowStringEmbedding: true,
        value: strValue,
        embeddedParams,
        embeddedConnections,
    };
    ctx.graphNodes.push(ret);
    ctx.stringEmbeddingNodes[strValue] = ret;
    return ret;
}
exports.StringEmbedding = StringEmbedding;
function replaceStringEmbeddings(ctx) {
    for (const graphNode of ctx.graphNodes) {
        if ((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode)) {
            for (const fieldName in graphNode.fieldValues) {
                const fieldValue = graphNode.fieldValues[fieldName];
                if (typeof fieldValue === "string" && gEmbeddingRegex.test(fieldValue)) {
                    const node = StringEmbedding(ctx, fieldValue);
                    graphNode.fieldValues[fieldName] = ObjectField(node, "value");
                }
            }
        }
    }
}
function XrpaDataflowProgram(name, callback) {
    let ctx;
    const programInterface = (0, ProgramInterface_1.XrpaProgramInterface)(`XrpaDataflow.${name}`, piCtx => {
        const dfCtx = (0, xrpa_utils_1.augmentInPlace)(piCtx, {
            __isDataflowProgramContext: true,
            externalProgramInterfaces: {},
            programInterfaceNames: new Set(),
            graphNodes: [],
            stringEmbeddingNodes: {},
            selfTerminateEvents: [],
        });
        (0, xrpa_utils_1.runInContext)(dfCtx, callback);
        replaceStringEmbeddings(dfCtx);
        ctx = dfCtx;
    });
    (0, assert_1.default)(ctx);
    const nodeMaxDepths = new Map();
    const paramConnections = {};
    function walkConnections(graphNode, graphPath, pathBreaksCycles) {
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
        if ((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode)) {
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
                    paramConnections[key.join("/")] = [fieldValue.name, ObjectField(graphNode, fieldName)];
                }
            }
        }
        else if ((0, DataflowProgramDefinition_1.isDataflowStringEmbedding)(graphNode)) {
            for (const embeddedConnection of graphNode.embeddedConnections) {
                walkConnections(embeddedConnection.targetNode, newGraphPath, pathBreaksCycles);
            }
            for (let idx = 0; idx < graphNode.embeddedParams.length; ++idx) {
                const paramName = graphNode.embeddedParams[idx];
                const fieldName = `{{{param:${paramName}}}`;
                const key = [paramName, graphNode.name, fieldName];
                paramConnections[key.join("/")] = [paramName, ObjectField(graphNode, fieldName)];
            }
        }
    }
    for (const graphNode of ctx.graphNodes) {
        walkConnections(graphNode, [], false);
    }
    for (const connection of ctx.selfTerminateEvents) {
        walkConnections(connection.targetNode, ["selfTerminateEvent"], false);
    }
    for (const paramName in ctx.parameters) {
        const param = ctx.parameters[paramName];
        if (param.source) {
            walkConnections(param.source.targetNode, [param.source.targetPort], true);
        }
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
