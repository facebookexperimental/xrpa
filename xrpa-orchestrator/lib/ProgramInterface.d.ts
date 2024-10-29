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


import { Thunk } from "@xrpa/xrpa-utils";
import { BindingProperties, PropertyCondition, WithBindingProperties, XrpaDataType, XrpaNamedDataType } from "./XrpaLanguage";
export interface XrpaProgramParam<T extends XrpaDataType = XrpaDataType> {
    __isXrpaProgramParam: true;
    name: string;
    dataType: T;
}
export declare function isXrpaProgramParam(param: unknown): param is XrpaProgramParam;
export interface ProgramInterfaceContext extends WithBindingProperties {
    __isProgramInterfaceContext: true;
    parameters: Record<string, XrpaProgramParam>;
}
export declare function isProgramInterfaceContext(ctx: unknown): ctx is ProgramInterfaceContext;
export declare function getProgramInterfaceContext(): ProgramInterfaceContext;
export interface ProgramInterface extends ProgramInterfaceContext {
    companyName: string;
    interfaceName: string;
    namedTypes: Record<string, XrpaNamedDataType>;
}
export declare function Input<T extends XrpaDataType>(dataType: Thunk<T>): T;
export declare function Output<T extends XrpaDataType>(dataType: Thunk<T>): T;
export declare const IfInput: PropertyCondition;
export declare const IfOutput: PropertyCondition;
export declare function getDirectionality(dataType: XrpaDataType): "inbound" | "outbound" | undefined;
export declare function ProgramInput<T extends XrpaDataType = XrpaDataType>(name: string, dataType: T): XrpaProgramParam<T>;
export declare function ProgramOutput<T extends XrpaDataType = XrpaDataType>(name: string, dataType: T): XrpaProgramParam<T>;
export declare function UppercaseCompanyName(programInterface: ProgramInterface): ProgramInterface;
export declare function XrpaProgramInterface(name: string, callback: (ctx: ProgramInterfaceContext) => void): ProgramInterface;
export declare function propagatePropertiesToInterface(programInterface: ProgramInterface, properties: BindingProperties): ProgramInterface;
export declare function reverseDirectionality(dataType: XrpaDataType): XrpaDataType;
export declare function reverseProgramDirectionality(programInterface: ProgramInterface): ProgramInterface;

