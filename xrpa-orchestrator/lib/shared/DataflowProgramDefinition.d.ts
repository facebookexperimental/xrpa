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


import { ModuleDefinition } from "./ModuleDefinition";
import { StructSpec } from "./TypeDefinition";
import { ProgramInterface, XrpaProgramParam } from "../ProgramInterface";
export type XrpaFieldValue = number | string | boolean | undefined | XrpaProgramParam | XrpaDataflowGraphNode;
export interface XrpaDataflowGraphNode {
    __isDataflowGraphNode: true;
}
export declare function isDataflowGraphNode(obj: unknown): obj is XrpaDataflowGraphNode;
export interface XrpaDataflowForeignObjectInstantiation extends XrpaDataflowGraphNode {
    __isDataflowObjectInstantiation: true;
    name: string;
    programInterfaceName: string;
    collectionType: string;
    fieldValues: Record<string, XrpaFieldValue>;
    isBuffered: boolean;
}
export declare function isDataflowForeignObjectInstantiation(obj: unknown): obj is XrpaDataflowForeignObjectInstantiation;
export interface DataflowConnection {
    targetNode: XrpaDataflowGraphNode;
    targetPort: string;
}
export interface DataflowProgramDefinition extends ProgramInterface {
    __isDataflowProgramDefinition: true;
    paramConnections: Array<[string, DataflowConnection]>;
    graphNodes: XrpaDataflowGraphNode[];
    selfTerminateEvents: DataflowConnection[];
    programInterfaceNames: string[];
}
export declare function isDataflowProgramDefinition(obj: unknown): obj is DataflowProgramDefinition;
export interface DataflowInput {
    parameter: XrpaProgramParam;
    connections: DataflowConnection[];
}
export declare function getDataflowInputs(dataflow: DataflowProgramDefinition): DataflowInput[];
export declare function getDataflowInputStructSpec(inputs: DataflowInput[], moduleDef: ModuleDefinition): StructSpec;

