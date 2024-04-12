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


import { DataModelDefinition } from "./DataModel";
import { UserTypeSpec } from "./ModuleDefinition";
import { StructSpec } from "./TypeDefinition";
export declare class XrpaParamDef {
    readonly name: string;
    readonly type: UserTypeSpec;
    readonly __isXrpaParamDef = true;
    constructor(name: string, type: UserTypeSpec);
}
export type XrpaFieldValue = number | string | boolean | undefined | XrpaParamDef | XrpaObjectDef;
export declare class XrpaObjectDef {
    readonly collectionType: string;
    readonly name: string;
    readonly fieldValues: Record<string, XrpaFieldValue>;
    readonly __isXrpaObjectDef = true;
    private static idCounter;
    private id;
    constructor(collectionType: string, name?: string, fieldValues?: Record<string, XrpaFieldValue>);
}
interface ConnectedObjectField {
    target: XrpaObjectDef;
    fieldName: string;
}
export declare class XrpaSyntheticObject {
    readonly selfTerminateEvent?: ConnectedObjectField | undefined;
    readonly objDefs: Array<XrpaObjectDef>;
    private paramDefs;
    constructor(objects: Array<XrpaObjectDef>, selfTerminateEvent?: ConnectedObjectField | undefined);
    buildStructSpec(datamodel: DataModelDefinition): StructSpec;
    getParamConnections(paramName: string): Array<ConnectedObjectField>;
}
export {};

