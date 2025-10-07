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


import {
  getContext,
  Thunk,
  resolveThunk,
  runInContext,
  safeDeepFreeze,
  upperFirst,
} from "@xrpa/xrpa-utils";
import assert from "assert";
import fs from "fs-extra";
import { replaceImmutable, updateImmutable } from "simply-immutable";

import { getDataflowProgramContext, isDataflowConnection, isDataflowForeignObjectInstantiation, isDataflowProgramContext, ObjectField, StringEmbedding, XrpaDataflowConnection } from "./DataflowProgram";
import {
  LateBindingType,
  String,
  TypeTreeVisitor,
  hasFieldsStruct,
  isStructDataType,
  propagateInheritableProperties,
  walkTypeTree,
} from "./InterfaceTypes";
import {
  BindingProperties,
  InheritedProperty,
  NameType,
  PropertyCondition,
  WithBindingProperties,
  XrpaDataType,
  XrpaNamedDataType,
  evalProperty,
  isNamedDataType,
  setProperty,
} from "./XrpaLanguage";
import { isDataflowStringEmbedding } from "./shared/DataflowProgramDefinition";


const DIRECTIONALITY = InheritedProperty("xrpa.directionality");

export interface XrpaProgramParam<T extends XrpaDataType = XrpaDataType> {
  __isXrpaProgramParam: true;
  toString(): string;

  name: string;
  dataType: T;
  source?: XrpaDataflowConnection;
}

export function isXrpaProgramParam(param: unknown): param is XrpaProgramParam {
  return typeof param === "object" && param !== null && (param as XrpaProgramParam).__isXrpaProgramParam === true;
}

export interface ProgramInterfaceContext extends WithBindingProperties {
  __isProgramInterfaceContext: true;
  parameters: Record<string, XrpaProgramParam>;
}

export function isProgramInterfaceContext(ctx: unknown): ctx is ProgramInterfaceContext {
  return typeof ctx === "object" && ctx !== null && (ctx as ProgramInterfaceContext).__isProgramInterfaceContext === true;
}

export function getProgramInterfaceContext(): ProgramInterfaceContext {
  return getContext(isProgramInterfaceContext, "Call is only valid within a ProgramInterface");
}

export interface ProgramInterface extends ProgramInterfaceContext {
  companyName: string;
  interfaceName: string;
  version: [number, number, number];
  namedTypes: Record<string, XrpaNamedDataType>;
}

export function Input<T extends XrpaDataType>(dataType: Thunk<T>): T {
  return setProperty(resolveThunk(dataType), DIRECTIONALITY, "inbound");
}

export function Output<T extends XrpaDataType>(dataType: Thunk<T>): T {
  return setProperty(resolveThunk(dataType), DIRECTIONALITY, "outbound");
}

export const IfInput: PropertyCondition = {
  propertyToCheck: DIRECTIONALITY,
  expectedValue: "inbound",
};

export const IfOutput: PropertyCondition = {
  propertyToCheck: DIRECTIONALITY,
  expectedValue: "outbound",
};

export function getDirectionality(dataType: XrpaDataType): "inbound" | "outbound" | undefined {
  return evalProperty(dataType.properties, DIRECTIONALITY) as "inbound" | "outbound" | undefined;
}

function programParamToString(this: XrpaProgramParam): string {
  return `{{{param:${this.name}}}}`;
}

export function ProgramInput<T extends XrpaDataType = XrpaDataType>(name: string, dataType: T): XrpaProgramParam<T>;
export function ProgramInput(name: string): XrpaProgramParam<XrpaDataType<never>>;
export function ProgramInput(name: string, dataType?: XrpaDataType): XrpaProgramParam {
  const ctx = getProgramInterfaceContext();
  assert(!ctx.parameters[name], `Program already has a parameter with the name "${name}"`);

  if (!dataType) {
    // call getDataflowProgramContext() to assert this is in a dataflow program
    getDataflowProgramContext();
    dataType = LateBindingType();
  }

  if (isNamedDataType(dataType)) {
    dataType = NameType(name, dataType);
  }

  const ret: XrpaProgramParam = {
    __isXrpaProgramParam: true,
    toString: programParamToString,
    name,
    dataType: Input(dataType),
  };
  ctx.parameters[name] = ret;
  return ret;
}

export function ProgramOutput<T extends XrpaDataType = XrpaDataType>(name: string, dataType: T): XrpaProgramParam<T>;
export function ProgramOutput(name: string, source: XrpaDataflowConnection): XrpaProgramParam;
export function ProgramOutput(name: string, source: string): XrpaProgramParam;
export function ProgramOutput(name: string, val: XrpaDataType | XrpaDataflowConnection | string): XrpaProgramParam {
  const ctx = getProgramInterfaceContext();
  assert(!ctx.parameters[name], `Program already has a parameter with the name "${name}"`);

  let dataType: XrpaDataType | undefined;
  let source: XrpaDataflowConnection | undefined;

  if (isDataflowConnection(val)) {
    source = val;
    assert(isDataflowProgramContext(ctx), "A dataflow connection can only be used as a ProgramOutput in a dataflow program");
    if (isDataflowForeignObjectInstantiation(source.targetNode)) {
      dataType = source.targetNode.collectionType.fieldsStruct.fields[source.targetPort] ??
        source.targetNode.collectionType.interfaceType?.fieldsStruct.fields[source.targetPort];

      assert(dataType, `Dataflow connection "${source.targetNode.collectionName}.${source.targetPort}" does not exist`);
      assert(getDirectionality(dataType) === "outbound", `Dataflow connection "${source.targetNode.name}.${source.targetPort}" is not an output`);
    } else if (isDataflowStringEmbedding(source.targetNode)) {
      dataType = String();
    } else {
      assert(false, `Dataflow connection "${source.targetNode.name}.${source.targetPort}" is an invalid type`);
    }
  } else if (typeof val === "string") {
    assert(isDataflowProgramContext(ctx), "A string embedding can only be used as a ProgramOutput in a dataflow program");
    const node = StringEmbedding(ctx, val);
    source = ObjectField(node, "value");
    dataType = String();
  } else {
    dataType = val;
  }

  assert(dataType);

  if (isNamedDataType(dataType)) {
    dataType = NameType(name, dataType);
  }

  const ret: XrpaProgramParam = {
    __isXrpaProgramParam: true,
    toString: programParamToString,
    name,
    dataType: Output(dataType),
    source,
  };
  ctx.parameters[name] = ret;
  return ret;
}

export function UppercaseCompanyName(programInterface: ProgramInterface): ProgramInterface {
  return updateImmutable(programInterface, ["companyName"], programInterface.companyName.toUpperCase());
}

function hasSameKeys(a: object, b: object): boolean {
  for (const key in a) {
    if (!(key in b)) {
      return false;
    }
  }

  for (const key in b) {
    if (!(key in a)) {
      return false;
    }
  }

  return true;
}

function isSameType(a: XrpaDataType, b: XrpaDataType): boolean {
  if (a === b) {
    return true;
  }

  if (!hasSameKeys(a, b)) {
    return false;
  }

  for (const key in a) {
    if (key === "properties") {
      continue;
    }

    if (key === "fields") {
      assert(isStructDataType(a) && isStructDataType(b), `Types with fields should be structs`);
      if (!hasSameKeys(a.fields, b.fields)) {
        return false;
      }
      for (const fieldKey in a.fields) {
        if (!isSameType(a.fields[fieldKey], b.fields[fieldKey])) {
          return false;
        }
      }
    } else if (key === "fieldsStruct") {
      assert(hasFieldsStruct(a) && hasFieldsStruct(b), `Types with fieldsStruct should be collections, interfaces, or messages`);
      if (!isSameType(a.fieldsStruct, b.fieldsStruct)) {
        return false;
      }
    } else if (JSON.stringify(a[key as keyof XrpaDataType]) !== JSON.stringify(b[key as keyof XrpaDataType])) {
      return false;
    }
  }

  return true;
}

class NamedTypeAggregator implements TypeTreeVisitor {
  namedTypes: Record<string, Array<{
    dataType: XrpaNamedDataType;
    fieldPath: string[];
  }>> = {};

  preRecursion(dataType: XrpaNamedDataType, fieldPath: string[]): XrpaNamedDataType {
    // make sure it has a name
    if (!dataType.name) {
      dataType = replaceImmutable(dataType, ["name"], upperFirst(fieldPath[fieldPath.length - 1]));
    }
    return dataType
  }

  postRecursion(dataType: XrpaNamedDataType, fieldPath: string[], isSubStruct: boolean): XrpaNamedDataType {
    // aggregate named types
    if (!isSubStruct && isNamedDataType(dataType)) {
      this.namedTypes[dataType.name] = this.namedTypes[dataType.name] ?? [];
      this.namedTypes[dataType.name].push({
        dataType,
        fieldPath,
      });
    }
    return dataType;
  }
}

class TypeReplacer implements TypeTreeVisitor {
  constructor(
    private namedTypes: Record<string, XrpaNamedDataType>,
    private replaceList: Array<{
      oldDataType: XrpaDataType;
      newName: string;
    }>
  ) { }

  preRecursion(dataType: XrpaNamedDataType): XrpaNamedDataType {
    for (const { oldDataType, newName } of this.replaceList) {
      if (isSameType(dataType, oldDataType)) {
        dataType = replaceImmutable(dataType, ["name"], newName);
      }
    }
    return dataType;
  }

  postRecursion(dataType: XrpaNamedDataType): XrpaNamedDataType {
    this.namedTypes[dataType.name] = dataType;
    return dataType;
  }
}

export function XrpaProgramInterface(name: string, packageJsonPath: string, callback: (ctx: ProgramInterfaceContext) => void): ProgramInterface {
  const split = name.split(".");
  assert(split.length == 2, `Program interface name must be in the form "<company>.<name>"`);

  const ctx: ProgramInterfaceContext = {
    __isProgramInterfaceContext: true,
    parameters: {},
    properties: {},
  };

  runInContext(ctx, callback);

  const programInterface: ProgramInterface = {
    ...ctx,
    companyName: split[0],
    interfaceName: split[1],
    version: [1, 0, 0],
    namedTypes: {},
  };

  // read version from package.json, if provided
  if (packageJsonPath) {
    const packageJson = fs.readJsonSync(packageJsonPath);
    if (packageJson.version) {
      const splitVersion = packageJson.version.split(".");
      programInterface.version[0] = parseInt(splitVersion[0]);
      programInterface.version[1] = parseInt(splitVersion[1]);
      programInterface.version[2] = parseInt(splitVersion[2]);
    }
  }

  // propagate names down from fields to all NamedTypes (name is required for named types after this point)
  // - keep track of field path, for default naming and for name collision disambiguation
  // - store name -> type lookup
  // - on name collision, check if the types are the same (all fields excluding properties, recursive)
  // - if so, use the existing name
  // - if not, add a prefix on the name to disambiguate (keep track of all types using the same name, and disambiguate them all at the end)

  const aggregator = new NamedTypeAggregator();

  const fieldPath = [programInterface.interfaceName];
  for (const key in programInterface.parameters) {
    const param = programInterface.parameters[key];
    param.dataType = walkTypeTree(
      aggregator,
      [...fieldPath, param.name],
      param.dataType,
      programInterface.properties,
    );
  }

  // disambiguate type names
  const replaceList: Array<{
    oldDataType: XrpaDataType;
    newName: string;
  }> = [];

  const namesUsed: Record<string, boolean> = {};

  for (const name in aggregator.namedTypes) {
    const types = aggregator.namedTypes[name];
    if (types.length == 1) {
      namesUsed[name] = true;
      continue;
    }

    const resolvedTypes: Array<Array<{
      dataType: XrpaNamedDataType;
      fieldPath: string[];
      disambiguatedName: string;
    }>> = [];
    for (const type of types) {
      let found: typeof resolvedTypes[number] | undefined;
      for (const resolved of resolvedTypes) {
        if (isSameType(type.dataType, resolved[0].dataType)) {
          found = resolved;
          break;
        }
      }
      if (found) {
        found.push({ ...type, disambiguatedName: "" });
      } else {
        resolvedTypes.push([{ ...type, disambiguatedName: "" }]);
      }
    }

    // if they all collapsed into the same type, use the name already assigned
    if (resolvedTypes.length === 1) {
      namesUsed[name] = true;
      continue;
    }

    // otherwise, disambiguate
    console.log(`Disambiguating type "${name}"`);
    let namesValid = false;
    let prefixLength = 0;
    do {
      const newNames: Record<string, string> = {};
      ++prefixLength;
      namesValid = true;

      for (const resolved of resolvedTypes) {
        const prefix = resolved[0].fieldPath.slice(-prefixLength).map(upperFirst).join("");
        const disambiguatedName = `${prefix}${name}`;
        if (disambiguatedName in newNames || disambiguatedName in namesUsed) {
          namesValid = false;
          break;
        }
        for (const type of resolved) {
          type.disambiguatedName = disambiguatedName;
        }
      }
    } while (!namesValid);

    for (const resolved of resolvedTypes) {
      for (const type of resolved) {
        replaceList.push({
          oldDataType: type.dataType,
          newName: type.disambiguatedName,
        });
      }
      namesUsed[resolved[0].disambiguatedName] = true;
    }
  }

  // deep rename types that need disambiguation; collect namedTypes while doing so
  const replacer = new TypeReplacer(programInterface.namedTypes, replaceList);
  for (const key in programInterface.parameters) {
    const param = programInterface.parameters[key];
    param.dataType = walkTypeTree(replacer, [], param.dataType, programInterface.properties);
    param.dataType = propagateInheritableProperties(param.dataType, programInterface.properties);
  }

  return safeDeepFreeze(programInterface);
}

export function propagatePropertiesToInterface(
  programInterface: ProgramInterface,
  properties: BindingProperties,
): ProgramInterface {
  for (const key in programInterface.parameters) {
    const param = programInterface.parameters[key];
    programInterface = replaceImmutable(programInterface, ["parameters", key, "dataType"], propagateInheritableProperties(param.dataType, properties));
  }

  return programInterface;
}


const DirectionalityReverser: TypeTreeVisitor = {
  allTypes(dataType: XrpaDataType): XrpaDataType {
    const directionality = getDirectionality(dataType);
    if (directionality === undefined) {
      return dataType;
    }
    return setProperty(dataType, DIRECTIONALITY, directionality === "inbound" ? "outbound" : "inbound");
  }
};

export function reverseDirectionality(dataType: XrpaDataType): XrpaDataType {
  return walkTypeTree(DirectionalityReverser, [], dataType, {});
}

export function reverseProgramDirectionality(programInterface: ProgramInterface): ProgramInterface {
  for (const key in programInterface.parameters) {
    const param = programInterface.parameters[key];
    programInterface = replaceImmutable(programInterface, ["parameters", key, "dataType"], reverseDirectionality(param.dataType));
  }
  return programInterface;
}
