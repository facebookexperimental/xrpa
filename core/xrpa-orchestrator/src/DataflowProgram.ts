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


import { augment, augmentInPlace, getContext, lowerFirst, runInContext, upperFirst } from "@xrpa/xrpa-utils";
import assert from "assert";

import { isCollectionDataType } from "./InterfaceTypes";
import { ProgramInterfaceContext, XrpaProgramInterface, isXrpaProgramParam } from "./ProgramInterface";
import { ExternalProgramCallerContext, ExternalProgramInterfaceContext } from "./RuntimeEnvironment";

import {
  DataflowProgramDefinition,
  XrpaDataflowConnection,
  XrpaDataflowForeignObjectInstantiation,
  XrpaDataflowGraphNode,
  XrpaDataflowStringEmbedding,
  XrpaFieldValue,
  isDataflowConnection,
  isDataflowForeignObjectInstantiation,
  isDataflowGraphNode,
  isDataflowStringEmbedding,
} from "./shared/DataflowProgramDefinition";

export {
  XrpaDataflowConnection,
  XrpaDataflowForeignObjectInstantiation,
  XrpaDataflowGraphNode,
  XrpaFieldValue,
  isDataflowConnection,
  isDataflowForeignObjectInstantiation,
  isDataflowGraphNode,
} from "./shared/DataflowProgramDefinition";

const gEmbeddingRegex = /{{{(.+?)}}}/g;

export interface DataflowProgramContext extends ProgramInterfaceContext, ExternalProgramCallerContext {
  __isDataflowProgramContext: true;
  programInterfaceNames: Set<string>;
  graphNodes: XrpaDataflowGraphNode[];
  stringEmbeddingNodes: Record<string, XrpaDataflowStringEmbedding>;
  selfTerminateEvents: XrpaDataflowConnection[];
}

export function isDataflowProgramContext(ctx: unknown): ctx is DataflowProgramContext {
  return typeof ctx === "object" && ctx !== null && (ctx as DataflowProgramContext).__isDataflowProgramContext === true;
}

export function getDataflowProgramContext(): DataflowProgramContext {
  return getContext(isDataflowProgramContext, "Call is only valid within a DataflowProgram");
}

export function Instantiate(
  collection: [ExternalProgramInterfaceContext, string],
  fieldValues: Record<string, XrpaFieldValue>,
  isBuffered = false,
): XrpaDataflowGraphNode {
  const ctx = getDataflowProgramContext();

  const programInterfaceName = collection[0].programInterface.interfaceName;
  const collectionName = collection[1];
  const collectionType = collection[0].programInterface.namedTypes[collectionName];
  assert(isCollectionDataType(collectionType));

  const nodeId = ctx.graphNodes.length;
  const ret: XrpaDataflowForeignObjectInstantiation = {
    __isDataflowGraphNode: true,
    nodeId,
    name: `${lowerFirst(programInterfaceName)}${upperFirst(collectionName)}${nodeId}`,
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

function dataflowConnectionToString(this: XrpaDataflowConnection): string {
  return `{{{connection:${this.targetNode.nodeId}/${this.targetPort}}}}`;
}

export function ObjectField(node: XrpaDataflowGraphNode, fieldName: string): XrpaDataflowConnection {
  return {
    __isDataflowConnection: true,
    toString: dataflowConnectionToString,
    targetNode: node,
    targetPort: fieldName,
  };
}

export function ObjectReference(node: XrpaDataflowGraphNode): XrpaDataflowConnection {
  return ObjectField(node, "id");
}

export function SelfTerminateOn(fieldValue: { targetNode: XrpaDataflowGraphNode, targetPort: string }): void {
  const ctx = getDataflowProgramContext();
  ctx.selfTerminateEvents.push(ObjectField(fieldValue.targetNode, fieldValue.targetPort));
}

export function StringEmbedding(ctx: DataflowProgramContext, strValue: string): XrpaDataflowStringEmbedding {
  if (strValue in ctx.stringEmbeddingNodes) {
    return ctx.stringEmbeddingNodes[strValue];
  }

  // extract embeddings
  const foundEmbeddings = new Set<string>();
  const embeddedParams: string[] = [];
  const embeddedConnections: XrpaDataflowConnection[] = [];
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
    } else if (embedding.startsWith("connection:")) {
      const connectionFields = embedding.slice("connection:".length).split("/");
      const targetNodeId = parseInt(connectionFields[0], 10);
      const targetPort = connectionFields[1];
      const targetNode = ctx.graphNodes[targetNodeId];
      embeddedConnections.push(ObjectField(targetNode, targetPort));
    }
  }

  const nodeId = ctx.graphNodes.length;
  const ret: XrpaDataflowStringEmbedding = {
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

function replaceStringEmbeddings(ctx: DataflowProgramContext): void {
  for (const graphNode of ctx.graphNodes) {
    if (isDataflowForeignObjectInstantiation(graphNode)) {
      for (const fieldName in graphNode.fieldValues) {
        const fieldValue: XrpaFieldValue = graphNode.fieldValues[fieldName];
        if (typeof fieldValue === "string" && gEmbeddingRegex.test(fieldValue)) {
          const node = StringEmbedding(ctx, fieldValue);
          graphNode.fieldValues[fieldName] = ObjectField(node, "value");
        }
      }
    }
  }
}

export function XrpaDataflowProgram(name: string, callback: (ctx: DataflowProgramContext) => void): DataflowProgramDefinition {
  let ctx: DataflowProgramContext | undefined;

  const programInterface = XrpaProgramInterface(`XrpaDataflow.${name}`, "", piCtx => {
    const dfCtx: DataflowProgramContext = augmentInPlace(piCtx, {
      __isDataflowProgramContext: true,
      externalProgramInterfaces: {},
      programInterfaceNames: new Set<string>(),
      graphNodes: [],
      stringEmbeddingNodes: {},
      selfTerminateEvents: [],
    });
    runInContext(dfCtx, callback);
    replaceStringEmbeddings(dfCtx);
    ctx = dfCtx;
  });
  assert(ctx);

  const nodeMaxDepths = new Map<XrpaDataflowGraphNode, number>();
  const paramConnections: Record<string, [string, XrpaDataflowConnection]> = {};

  function walkConnections(graphNode: XrpaDataflowGraphNode, graphPath: string[], pathBreaksCycles: boolean) {
    const newGraphPath = [...graphPath, graphNode.name];
    pathBreaksCycles = pathBreaksCycles || graphNode.isBuffered;

    // check for cycles and stop recursion if found
    if (graphPath.includes(graphNode.name)) {
      if (pathBreaksCycles) {
        return;
      } else {
        throw new Error(`cycle detected: ${newGraphPath.join(" -> ")}`);
      }
    }

    // update node depth
    const oldDepth = nodeMaxDepths.get(graphNode) ?? 0;
    if (newGraphPath.length > oldDepth) {
      nodeMaxDepths.set(graphNode, newGraphPath.length);
    }

    // recurse
    if (isDataflowForeignObjectInstantiation(graphNode)) {
      for (const fieldName in graphNode.fieldValues) {
        const fieldValue: XrpaFieldValue = graphNode.fieldValues[fieldName];
        if (isDataflowGraphNode(fieldValue)) {
          walkConnections(fieldValue, newGraphPath, pathBreaksCycles);
        } else if (isDataflowConnection(fieldValue)) {
          walkConnections(fieldValue.targetNode, newGraphPath, pathBreaksCycles);
        } else if (isXrpaProgramParam(fieldValue)) {
          const key = [fieldValue.name, graphNode.name, fieldName];
          paramConnections[key.join("/")] = [fieldValue.name, ObjectField(graphNode, fieldName)];
        }
      }
    } else if (isDataflowStringEmbedding(graphNode)) {
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

  const dataflow: DataflowProgramDefinition = augment(programInterface, {
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
