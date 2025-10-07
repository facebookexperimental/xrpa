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


import assert from "assert";

import { OutputReconcilerDefinition } from "./DataStore";
import { ModuleDefinition } from "./ModuleDefinition";
import { StructSpec } from "./TypeDefinition";
import { getFieldDefaultValue, getFieldDescription, XrpaCollectionType } from "../InterfaceTypes";
import { ProgramInterface, XrpaProgramParam, getDirectionality } from "../ProgramInterface";
import { getTypeName } from "../ProgramInterfaceConverter";

export type XrpaFieldValue = number | string | boolean | undefined | XrpaProgramParam | XrpaDataflowGraphNode | XrpaDataflowConnection;

export interface XrpaDataflowGraphNode {
  __isDataflowGraphNode: true;
  nodeId: number;

  // the name is used for variables in the generated code, as well as graph pathing
  name: string;

  // allows cycles to be broken
  isBuffered: boolean;
}

export function isDataflowGraphNode(obj: unknown): obj is XrpaDataflowGraphNode {
  return Boolean(typeof obj === "object" && obj && (obj as XrpaDataflowGraphNode).__isDataflowGraphNode === true);
}

export interface XrpaDataflowForeignObjectInstantiation extends XrpaDataflowGraphNode {
  __isDataflowObjectInstantiation: true;

  // specifies the desired object type
  programInterfaceName: string;
  collectionName: string;
  collectionType: XrpaCollectionType;

  // field values to pipe into the object instantiation
  // - put an object instantiation in as a field value to populate a Reference
  fieldValues: Record<string, XrpaFieldValue>;
}

export function isDataflowForeignObjectInstantiation(obj: unknown): obj is XrpaDataflowForeignObjectInstantiation {
  return Boolean(typeof obj === "object" && obj && (obj as XrpaDataflowForeignObjectInstantiation).__isDataflowObjectInstantiation === true);
}

export interface XrpaDataflowStringEmbedding extends XrpaDataflowGraphNode {
  __isDataflowStringEmbedding: true;

  // string that contains embeddings
  value: string;

  // extracted parameters and connections
  embeddedParams: string[];
  embeddedConnections: XrpaDataflowConnection[];
}

export function isDataflowStringEmbedding(obj: unknown): obj is XrpaDataflowStringEmbedding {
  return Boolean(typeof obj === "object" && obj && (obj as XrpaDataflowStringEmbedding).__isDataflowStringEmbedding === true);
}

export interface XrpaDataflowConnection {
  __isDataflowConnection: true;
  toString(): string;

  targetNode: XrpaDataflowGraphNode;
  targetPort: string;
}

export function isDataflowConnection(obj: unknown): obj is XrpaDataflowConnection {
  return Boolean(typeof obj === "object" && obj && (obj as XrpaDataflowConnection).__isDataflowConnection === true);
}

export interface DataflowProgramDefinition extends ProgramInterface {
  __isDataflowProgramDefinition: true;

  paramConnections: Array<[string, XrpaDataflowConnection]>;
  graphNodes: XrpaDataflowGraphNode[];
  selfTerminateEvents: XrpaDataflowConnection[];
  programInterfaceNames: string[];
}

export function isDataflowProgramDefinition(obj: unknown): obj is DataflowProgramDefinition {
  return Boolean(typeof obj === "object" && obj && (obj as DataflowProgramDefinition).__isDataflowProgramDefinition === true);
}

export interface DataflowInput {
  parameter: XrpaProgramParam;
  connections: XrpaDataflowConnection[];
}

export function getDataflowInputs(dataflow: DataflowProgramDefinition): DataflowInput[] {
  return Object.values(dataflow.parameters).filter(paramDef => getDirectionality(paramDef.dataType) === "inbound").sort((a, b) => {
    return a.name.localeCompare(b.name);
  }).map(paramDef => {
    return {
      parameter: paramDef,
      connections: dataflow.paramConnections.filter(connection => connection[0] === paramDef.name).map(connection => connection[1]),
    };
  });
}

export function getDataflowOutputs(dataflow: DataflowProgramDefinition): XrpaProgramParam[] {
  return Object.values(dataflow.parameters).filter(paramDef => getDirectionality(paramDef.dataType) === "outbound").sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
}

export function getReconcilerDefForNode(moduleDef: ModuleDefinition, graphNode: XrpaDataflowGraphNode): OutputReconcilerDefinition {
  assert(isDataflowForeignObjectInstantiation(graphNode));

  const storeDef = moduleDef.getDataStore(graphNode.programInterfaceName);
  assert(storeDef, `Data store ${graphNode.programInterfaceName} not found for ${graphNode.name}`);

  const reconcilerDef = storeDef.getOutputReconcilers().find(reconcilerDef => reconcilerDef.type.getName() === graphNode.collectionName);
  assert(reconcilerDef, `Output reconciler for ${graphNode.collectionName} not found for ${graphNode.name}`);

  return reconcilerDef;
}

export function getDataflowInputParamsStructSpec(inputs: DataflowInput[], moduleDef: ModuleDefinition): StructSpec {
  const paramsStructSpec: StructSpec = {};

  for (const inp of inputs) {
    const param = inp.parameter;
    if (param.dataType.typename === "LateBindingType") {
      const source = inp.connections[0];
      assert(source, `Late binding type ${param.name} must have a connection`);
      const reconcilerDef = getReconcilerDefForNode(moduleDef, source.targetNode);
      const fieldDef = reconcilerDef.type.getAllFields()[source.targetPort];
      paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
        type: fieldDef.type,
        description: undefined,
        defaultValue: undefined,
      });
    } else {
      paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
        type: getTypeName(param.dataType),
        description: getFieldDescription(param.dataType),
        defaultValue: getFieldDefaultValue(param.dataType),
      });
    }
  }

  return paramsStructSpec;
}

export function getDataflowOutputParamsStructSpec(outputs: XrpaProgramParam[], moduleDef: ModuleDefinition): StructSpec {
  const paramsStructSpec: StructSpec = {};

  for (const param of outputs) {
    if (param.source && isDataflowForeignObjectInstantiation(param.source.targetNode)) {
      const reconcilerDef = getReconcilerDefForNode(moduleDef, param.source.targetNode);
      const fieldDef = reconcilerDef.type.getAllFields()[param.source.targetPort];
      paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
        type: fieldDef.type,
        description: getFieldDescription(param.dataType),
        defaultValue: getFieldDefaultValue(param.dataType),
      });
    } else {
      paramsStructSpec[param.name] = moduleDef.convertUserTypeSpec({
        type: getTypeName(param.dataType),
        description: getFieldDescription(param.dataType),
        defaultValue: getFieldDefaultValue(param.dataType),
      });
    }
  }

  return paramsStructSpec;
}
