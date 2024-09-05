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


import { ProgramInterfaceContext } from "./ProgramInterface";
import { ExternalProgramCallerContext, ExternalProgramInterfaceContext } from "./RuntimeEnvironment";
import { DataflowConnection, DataflowProgramDefinition, XrpaDataflowGraphNode, XrpaFieldValue } from "./shared/DataflowProgramDefinition";
export { XrpaDataflowForeignObjectInstantiation, XrpaDataflowGraphNode, XrpaFieldValue, isDataflowForeignObjectInstantiation, isDataflowGraphNode, } from "./shared/DataflowProgramDefinition";
export interface DataflowProgramContext extends ProgramInterfaceContext, ExternalProgramCallerContext {
    __isDataflowProgramContext: true;
    idCount: number;
    programInterfaceNames: Set<string>;
    graphNodes: XrpaDataflowGraphNode[];
    selfTerminateEvents: DataflowConnection[];
}
export declare function isDataflowProgramContext(ctx: unknown): ctx is DataflowProgramContext;
export declare function getDataflowProgramContext(): DataflowProgramContext;
export declare function Instantiate(collection: [ExternalProgramInterfaceContext, string], fieldValues: Record<string, XrpaFieldValue>, isBuffered?: boolean): XrpaDataflowGraphNode;
export declare function SelfTerminateOn(trigger: DataflowConnection): void;
export declare function XrpaDataflowProgram(name: string, callback: (ctx: DataflowProgramContext) => void): DataflowProgramDefinition;

