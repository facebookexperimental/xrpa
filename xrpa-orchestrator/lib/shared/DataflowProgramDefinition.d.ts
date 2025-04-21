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


import { OutputReconcilerDefinition } from "./DataStore";
import { ModuleDefinition } from "./ModuleDefinition";
import { StructSpec } from "./TypeDefinition";
import { XrpaCollectionType } from "../InterfaceTypes";
import { ProgramInterface, XrpaProgramParam } from "../ProgramInterface";
export type XrpaFieldValue = number | string | boolean | undefined | XrpaProgramParam | XrpaDataflowGraphNode | XrpaDataflowConnection;
export interface XrpaDataflowGraphNode {
    __isDataflowGraphNode: true;
}
export declare function isDataflowGraphNode(obj: unknown): obj is XrpaDataflowGraphNode;
export interface XrpaDataflowForeignObjectInstantiation extends XrpaDataflowGraphNode {
    __isDataflowObjectInstantiation: true;
    name: string;
    programInterfaceName: string;
    collectionName: string;
    collectionType: XrpaCollectionType;
    fieldValues: Record<string, XrpaFieldValue>;
    isBuffered: boolean;
}
export declare function isDataflowForeignObjectInstantiation(obj: unknown): obj is XrpaDataflowForeignObjectInstantiation;
export interface XrpaDataflowConnection {
    __isDataflowConnection: true;
    targetNode: XrpaDataflowGraphNode;
    targetPort: string;
}
export declare function isDataflowConnection(obj: unknown): obj is XrpaDataflowConnection;
export interface DataflowProgramDefinition extends ProgramInterface {
    __isDataflowProgramDefinition: true;
    paramConnections: Array<[string, XrpaDataflowConnection]>;
    graphNodes: XrpaDataflowGraphNode[];
    selfTerminateEvents: XrpaDataflowConnection[];
    programInterfaceNames: string[];
}
export declare function isDataflowProgramDefinition(obj: unknown): obj is DataflowProgramDefinition;
export interface DataflowInput {
    parameter: XrpaProgramParam;
    connections: XrpaDataflowConnection[];
}
export declare function getDataflowInputs(dataflow: DataflowProgramDefinition): DataflowInput[];
export declare function getDataflowOutputs(dataflow: DataflowProgramDefinition): XrpaProgramParam[];
export declare function getReconcilerDefForNode(moduleDef: ModuleDefinition, graphNode: XrpaDataflowGraphNode): OutputReconcilerDefinition;
export declare function getDataflowInputParamsStructSpec(inputs: DataflowInput[], moduleDef: ModuleDefinition): StructSpec;
export declare function getDataflowOutputParamsStructSpec(outputs: XrpaProgramParam[], moduleDef: ModuleDefinition): StructSpec;

