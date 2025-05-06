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


import { ThunkWithParam } from "@xrpa/xrpa-utils";
import { IncludeAggregator } from "./Helpers";
import { TypeDefinition } from "./TypeDefinition";
import { TypeValue } from "./TypeValue";
export interface MethodParam {
    name: string;
    type: TypeDefinition | string;
    defaultValue?: string;
}
export type ClassVisibility = "public" | "private" | "protected";
export type ClassBodyThunk = ThunkWithParam<Array<string>, IncludeAggregator | null>;
interface ClassConstructorDefinition {
    parameters?: Array<MethodParam>;
    superClassInitializers?: Array<string>;
    memberInitializers?: Array<[string, string]>;
    body?: ClassBodyThunk;
    visibility?: ClassVisibility;
    decorations?: Array<string>;
    separateImplementation?: boolean;
}
interface ClassMethodDefinition {
    name: string;
    returnType?: string;
    noDiscard?: boolean;
    parameters?: Array<MethodParam>;
    body: ClassBodyThunk;
    templateParams?: Array<string>;
    whereClauses?: Array<string>;
    isStatic?: boolean;
    isOverride?: boolean;
    isConst?: boolean;
    isInline?: boolean;
    isVirtual?: boolean;
    isAbstract?: boolean;
    isFinal?: boolean;
    visibility?: ClassVisibility;
    decorations?: Array<string>;
    separateImplementation?: boolean;
}
interface ClassMemberDefinition {
    name: string;
    type: TypeDefinition | string;
    initialValue?: TypeValue;
    isStatic?: boolean;
    isConst?: boolean;
    visibility?: ClassVisibility;
    decorations?: Array<string>;
    getter?: string;
    setter?: Array<string>;
}
export declare class ClassSpec {
    constructor(params: {
        name: string;
        namespace: string;
        includes: IncludeAggregator | null;
        superClass?: string;
        interfaceName?: string;
        templateParams?: Array<string>;
        forceAbstract?: boolean;
        decorations?: Array<string>;
        classNameDecoration?: string;
        classEarlyInject?: string[];
    });
    readonly name: string;
    readonly namespace: string;
    readonly includes: IncludeAggregator | null;
    superClass: string | null;
    interfaceName: string | null;
    templateParams: Array<string> | null;
    forceAbstract: boolean;
    decorations: Array<string>;
    classNameDecoration: string | null;
    classEarlyInject: Array<string>;
    constructors: Array<ClassConstructorDefinition>;
    virtualDestructor: boolean;
    destructorBody?: ClassBodyThunk;
    methods: Array<ClassMethodDefinition>;
    members: Array<ClassMemberDefinition>;
    getOrCreateMethod(methodDef: Omit<ClassMethodDefinition, "body">): Array<string>;
}
export {};

