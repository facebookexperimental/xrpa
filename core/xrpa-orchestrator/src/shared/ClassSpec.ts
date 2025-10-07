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
import assert from "assert";

export interface MethodParam {
  name: string;
  type: TypeDefinition | string;
  defaultValue?: string;
}

function paramsMatch(a: Array<MethodParam>, b: Array<MethodParam>): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    const aValue = a[i];
    const bValue = b[i];
    if (aValue.name !== b[i].name) {
      return false;
    }
    const aTypeName = typeof aValue.type === "string" ? aValue.type : aValue.type.getName();
    const bTypeName = typeof bValue.type === "string" ? bValue.type : bValue.type.getName();
    if (aTypeName !== bTypeName) {
      return false;
    }
  }
  return true
}

export type ClassVisibility = "public" | "private" | "protected";

export type ClassBodyThunk = ThunkWithParam<Array<string>, IncludeAggregator | null>;

interface ClassConstructorDefinition {
  parameters?: Array<MethodParam>;
  superClassInitializers?: Array<string>;
  memberInitializers?: Array<[string, string]>; // name, value
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

  // for languages that support getters and setters
  getter?: string;
  setter?: Array<string>;
}

export class ClassSpec {
  constructor(
    params: {
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
    },
  ) {
    assert(!params.name.includes("::"), `Class name cannot contain :: (found ${params.name})`);
    assert(!params.name.includes("."), `Class name cannot contain . (found ${params.name})`);
    this.name = params.name;
    this.namespace = params.namespace;
    this.includes = params.includes;
    this.superClass = params.superClass ?? null;
    this.interfaceName = params.interfaceName ?? null;
    this.templateParams = params.templateParams ?? null;
    this.forceAbstract = Boolean(params.forceAbstract);
    this.decorations = params.decorations ?? [];
    this.classNameDecoration = params.classNameDecoration ?? null;
    this.classEarlyInject = params.classEarlyInject ?? [];
  }

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

  constructors: Array<ClassConstructorDefinition> = [];

  virtualDestructor = false;
  destructorBody?: ClassBodyThunk;

  methods: Array<ClassMethodDefinition> = [];

  members: Array<ClassMemberDefinition> = [];

  getOrCreateMethod(methodDef: Omit<ClassMethodDefinition, "body">): Array<string> {
    for (const method of this.methods) {
      if (method.name !== methodDef.name) {
        continue;
      }
      if (!paramsMatch(method.parameters ?? [], methodDef.parameters ?? [])) {
        continue;
      }

      assert(Array.isArray(method.body));
      return method.body;
    }

    const method = { ...methodDef, body: [] };
    this.methods.push(method);
    return method.body;
  }
}
