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
  arrayZip,
  collapse,
  EXCLUDE_NAMESPACE,
  genCommentLinesWithCommentMarker,
  indent,
  normalizeIdentifier,
  nsExtractWithSeparator,
  nsJoinWithSeparator,
  nsQualifyWithSeparator,
  removeSuperfluousEmptyLines,
  resolveThunkWithParam,
  trimTrailingEmptyLines,
  upperFirst,
} from "@xrpa/xrpa-utils";
import assert from "assert";

import { ClassSpec, ClassVisibility, MethodParam } from "../../shared/ClassSpec";
import { UnitTransformer } from "../../shared/CoordinateTransformer";
import { IncludeAggregator } from "../../shared/Helpers";
import { ReferenceType } from "../../shared/ReferenceType";
import { CoreXrpaTypes, FieldTypeAndAccessor, GuidGenSpec, PrimitiveIntrinsics } from "../../shared/TargetCodeGen";
import { MessageDataTypeDefinition, SignalDataTypeDefinition, StructTypeDefinition, TypeDefinition, typeIsReference, typeIsSignalData, typeIsStateData } from "../../shared/TypeDefinition";
import { CodeLiteralValue, EmptyValue, TypeValue } from "../../shared/TypeValue";
// NOTE: do not import anything from ./

let gXrpaTypes: CoreXrpaTypes | null = null;
export function registerXrpaTypes(types: CoreXrpaTypes) {
  gXrpaTypes = types;
}

export function getXrpaTypes(): CoreXrpaTypes {
  assert(gXrpaTypes, "XrpaTypes not registered");
  return gXrpaTypes;
}

export const XRPA_NAMESPACE = "xrpa_runtime";

const COPYRIGHT_STRING = `# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
`;
const GENERATED_STRING = "# @" + "generated";

export const HEADER = [
  COPYRIGHT_STRING,
  GENERATED_STRING,
  "",
];

export const UNIT_TRANSFORMER: UnitTransformer = {
  angular: {
    radian: {
      degree: [" * 180 / math.pi", 180 / Math.PI],
    },
    degree: {
      radian: [" * math.pi / 180", Math.PI / 180],
    },
  },
  spatial: {
    meter: {
      centimeter: [" * 100", 100],
    },
    centimeter: {
      meter: [" / 100", 1 / 100],
    },
  },
};

export const PRIMITIVE_INTRINSICS: PrimitiveIntrinsics = {
  string: { typename: "str" },
  microseconds: { typename: "ulong" },
  nanoseconds: { typename: "ulong" },
  uint8: { typename: "int" },
  uint64: { typename: "ulong" },
  int: { typename: "int" },
  int32: { typename: "int" },
  uint32: { typename: "int" },
  float32: { typename: "float" },
  bool: { typename: "bool" },
  arrayFloat3: { typename: "float[]" },
  bytearray: { typename: "bytearray" },

  autovar: { typename: "" },

  TRUE: "True",
  FALSE: "False",
};

export const STMT_TERM = "";

export const HAS_NATIVE_PRIMITIVE_TYPES = false;

export function genGetCurrentClockTime(includes: IncludeAggregator | null, inNanoseconds = false): string {
  includes?.addFile({ namespace: `${XRPA_NAMESPACE}.utils.time_utils` });
  if (inNanoseconds) {
    return `${XRPA_NAMESPACE}.utils.time_utils.TimeUtils.get_current_clock_time_nanoseconds()`;
  }
  return `${XRPA_NAMESPACE}.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()`;
}
export const DEFAULT_INTERFACE_PTR_TYPE = "bare";

const nsSep = ".";

export class PythonIncludeAggregator implements IncludeAggregator {
  private importNamespaces: Record<string, boolean> = {};

  constructor(
    namespaces?: string[],
  ) {
    if (namespaces) {
      for (const namespace of namespaces) {
        this.addFile({ namespace });
      }
    }
  }

  public addFile(params: {
    filename?: string;
    namespace?: string;
    typename?: string;
  }) {
    if (!params.namespace && params.typename) {
      // strip off any template parameters
      const typename = params.typename.split("[")[0];
      params.namespace = nsExtract(typename);
    }
    if (params.namespace) {
      this.importNamespaces[params.namespace] = true;
    }
  }

  public getIncludes(): string[] {
    return [];
  }

  public getNamespaceImports(excludeNamespace?: string): string[] {
    if (excludeNamespace) {
      delete this.importNamespaces[excludeNamespace];
    }
    return Object.keys(this.importNamespaces).sort().map(ns => `import ${ns}`);
  }
}

export function genCommentLines(str?: string): string[] {
  return genCommentLinesWithCommentMarker("#", str);
}

function typenameToCode(typename: string): string {
  if (typename === "ulong") {
    return "int";
  }
  return typename;
}

export function nsQualify(qualifiedName: string, inNamespace: string): string {
  const outNamespace = nsExtract(qualifiedName);
  if (outNamespace === inNamespace || inNamespace === EXCLUDE_NAMESPACE) {
    return nsQualifyWithSeparator(nsSep, qualifiedName, inNamespace);
  }
  return qualifiedName;
}

export function nsJoin(...names: string[]): string {
  return nsJoinWithSeparator(nsSep, names);
}

export function nsExtract(qualifiedName: string, nonNamespacePartCount = 0): string {
  return nsExtractWithSeparator(nsSep, qualifiedName, nonNamespacePartCount);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function constRef(type: string, _byteSize: number): string {
  return type;
}

export function identifierName(name: string, maintainPrivateMarker = false): string {
  if (name.includes(" ")) {
    return name;
  }
  const prefix = maintainPrivateMarker && name.startsWith("_") ? "_" : "";
  return prefix + normalizeIdentifier(name).join("_");
}

export function privateMember(memberVarName: string): string {
  if (memberVarName.startsWith("_") || memberVarName.startsWith("self.")) {
    // already private
    return memberVarName;
  }
  return "_" + identifierName(memberVarName);
}

export function methodMember(methodName: string, visibility: ClassVisibility = "public"): string {
  const parts = methodName.split(nsSep);
  if (visibility !== "public") {
    parts[parts.length - 1] = privateMember(parts[parts.length - 1]);
  } else {
    parts[parts.length - 1] = identifierName(parts[parts.length - 1], true);
  }
  return parts.join(nsSep);
}

function genInitializer(typename: string, values: unknown[]): string {
  if (typename.startsWith("typing.List")) {
    return `[${values.join(", ")}]`;
  }
  return `${typenameToCode(typename)}(${values.join(", ")})`
}

export function genPrimitiveValue(typename: string, value: string | boolean | number | null): string {
  if (value === null) {
    if (typename === PRIMITIVE_INTRINSICS.string.typename) {
      return `""`;
    }
    if (typename) {
      return `${typenameToCode(typename)}()`;
    }
    return "";
  }

  if (typeof value === "string") {
    // escape string
    value = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return `"${value}"`;
  }

  if (typeof value === "boolean") {
    return upperFirst(`${value}`);
  }

  if (!typename) {
    return `${value}`;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  return genInitializer(typename, [value]);
}

function convertFieldValue(kv: [string, string | TypeValue]): string {
  return `${kv[1]}`;
}

export function genMultiValue(typename: string, _hasInitializerConstructor: boolean, valueStrings: [string, string][]): string {
  return genInitializer(typename, valueStrings.map(convertFieldValue));
}

export function genDeclaration(params: {
  typename: string;
  inNamespace: string;
  varName: string;
  initialValue: TypeValue;
  includeTerminator: boolean;
  isStatic?: boolean;
  isConst?: boolean;
}): string {
  // TODO(Python) I suspect this will always need an initializer
  const typename = nsQualify(params.typename, params.inNamespace);
  const initializer = params.initialValue instanceof EmptyValue ? "" : ` = ${params.initialValue.toString(params.inNamespace)}`;
  if (!typename) {
    if (initializer) {
      return `${identifierName(params.varName)}${initializer}`;
    }
    return "";
  }
  return `${identifierName(params.varName)}: ${typenameToCode(typename)}${initializer}`;
}

export function genSharedPointer(localType: string): string {
  return `${localType}`;
}

export function genPointer(localType: string): string {
  return `${localType}`;
}

export function reinterpretValue(_fromType: string, _toType: string, value: TypeValue): string {
  return `${value}`;
}

export function getDataStoreName(apiname: string): string {
  if (apiname === XRPA_NAMESPACE) {
    return XRPA_NAMESPACE;
  }
  return apiname ? `${identifierName(apiname)}_data_store` : "";
}

export function getDataStoreHeaderName(apiname: string): string {
  return apiname ? `${getDataStoreName(apiname)}.py` : "";
}

export function getDataStoreHeaderNamespace(apiname: string): string {
  return apiname ? `xrpa.${getDataStoreName(apiname)}` : "";
}

export function getDataStoreClass(apiname: string, inNamespace: string, includes: IncludeAggregator | null): string {
  const className = normalizeIdentifier(getDataStoreName(apiname)).map((s) => upperFirst(s)).join("");
  const fullName = nsJoin(getDataStoreHeaderNamespace(apiname), className);
  includes?.addFile({ filename: getDataStoreHeaderName(apiname), typename: fullName });
  return nsQualify(fullName, inNamespace);
}

export function getTypesHeaderName(apiname: string): string {
  return apiname ? `${identifierName(apiname)}_types.py` : "";
}

export function getTypesHeaderNamespace(apiname: string): string {
  return apiname ? `xrpa.${identifierName(apiname)}_types` : "xrpa";
}

export function makeObjectAccessor(params: {
  classSpec: ClassSpec;
  isWriteAccessor: boolean;
  isMessageStruct: boolean;
  objectUuidType: string;
}): string {
  const {
    classSpec,
    isWriteAccessor,
    isMessageStruct,
    objectUuidType,
  } = params;

  if (!classSpec.superClass) {
    classSpec.superClass = getXrpaTypes().ObjectAccessorInterface.getLocalType(classSpec.namespace, classSpec.includes);
  }

  classSpec.constructors.push({
    parameters: [{ name: "mem_accessor", type: getXrpaTypes().MemoryAccessor.getLocalType(classSpec.namespace, classSpec.includes) }],
    superClassInitializers: ["mem_accessor"],
  });

  if (isWriteAccessor && !isMessageStruct) {
    classSpec.includes?.addFile({ namespace: "xrpa_runtime.reconciler.collection_change_types" });

    classSpec.methods.push({
      name: "create",
      parameters: [{
        name: "accessor",
        type: getXrpaTypes().TransportStreamAccessor,
      }, {
        name: "collection_id",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "id",
        type: objectUuidType,
      }, {
        name: "change_byte_count",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "timestamp",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      returnType: classSpec.name,
      body: [
        `change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.CreateObject.value, change_byte_count, timestamp)`,
        `change_event.set_collection_id(collection_id)`,
        `change_event.set_object_id(id)`,
        `return ${classSpec.name}(change_event.access_change_data())`,
      ],
      isStatic: true,
      visibility: "public",
    });

    classSpec.methods.push({
      name: "update",
      parameters: [{
        name: "accessor",
        type: getXrpaTypes().TransportStreamAccessor,
      }, {
        name: "collection_id",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "id",
        type: objectUuidType,
      }, {
        name: "fields_changed",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }, {
        name: "change_byte_count",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }],
      returnType: classSpec.name,
      body: [
        `change_event = accessor.write_change_event(xrpa_runtime.reconciler.collection_change_types.CollectionUpdateChangeEventAccessor, xrpa_runtime.reconciler.collection_change_types.CollectionChangeType.UpdateObject.value, change_byte_count)`,
        `change_event.set_collection_id(collection_id)`,
        `change_event.set_object_id(id)`,
        `change_event.set_fields_changed(fields_changed)`,
        `return ${classSpec.name}(change_event.access_change_data())`,
      ],
      isStatic: true,
      visibility: "public",
    });
  }

  if (isWriteAccessor) {
    classSpec.members.push({
      name: "write_offset",
      type: getXrpaTypes().MemoryOffset,
      visibility: "private",
      initialValue: new CodeLiteralValue(module.exports, `${getXrpaTypes().MemoryOffset.getLocalType(classSpec.namespace, classSpec.includes)}()`),
    });

    return "self." + privateMember("write_offset");
  } else {
    classSpec.members.push({
      name: "read_offset",
      type: getXrpaTypes().MemoryOffset,
      visibility: "private",
      initialValue: new CodeLiteralValue(module.exports, `${getXrpaTypes().MemoryOffset.getLocalType(classSpec.namespace, classSpec.includes)}()`),
    });

    return "self." + privateMember("read_offset");
  }
}

export function genEventHandlerType(paramTypes: string[], includes: IncludeAggregator | null): string {
  includes?.addFile({ namespace: "typing" });
  return `typing.Callable[[${paramTypes.map(typenameToCode).join(", ")}], None]`;
}

export function genEventHandlerCall(handler: string, paramValues: string[], handlerCanBeNull: boolean): string {
  if (handlerCanBeNull) {
    return `if ${handler} is not None: ${handler}(${paramValues.join(", ")})`;
  }
  return `${handler}(${paramValues.join(", ")})`;
}

export function genMessageDispatch(params: {
  namespace: string;
  includes: IncludeAggregator | null;
  fieldName: string;
  fieldType: MessageDataTypeDefinition | SignalDataTypeDefinition;
  genMsgHandler: (fieldName: string) => string;
  msgDataToParams: (msgType: MessageDataTypeDefinition, prelude: string[], includes: IncludeAggregator | null) => string[];
  convertToReadAccessor: boolean;
  timestampName?: string;
}): string[] {
  let msgHandler = params.genMsgHandler(params.fieldName);
  const handlerCanBeNull = msgHandler.indexOf(".") < 0;
  const timestamp = params.timestampName ?? "msg_timestamp";
  msgHandler = "self." + msgHandler;
  const lines: string[] = [];
  let indentLevel = 0;
  if (handlerCanBeNull) {
    lines.push(`if ${genNonNullCheck(msgHandler)}:`);
    indentLevel = 1;
  }
  if (typeIsSignalData(params.fieldType)) {
    const msgParams = [timestamp, "message_data"];
    lines.push(
      ...indent(indentLevel, [
        `${msgHandler}.on_signal_data(${msgParams.join(", ")})`,
      ]),
    );
  } else if (!params.fieldType.hasFields()) {
    lines.push(
      ...indent(indentLevel, [
        `${msgHandler}(${timestamp})`,
      ]),
    );
  } else {
    const prelude: string[] = [];
    const msgParams = [timestamp].concat(params.msgDataToParams(params.fieldType, prelude, params.includes));
    lines.push(
      ...indent(indentLevel, [
        ...(params.convertToReadAccessor ? [
          `message = ${params.fieldType.getReadAccessorType(params.namespace, params.includes)}(message_data)`,
        ] : []),
        ...prelude,
        `${msgHandler}(${msgParams.join(", ")})`,
      ]),
    );
  }

  return lines;
}

function paramsToString(classSpec: ClassSpec, parameters: MethodParam[], isStatic: boolean): string {
  const paramsStr = parameters.map((p) => {
    const suffix = p.defaultValue ? ` = ${p.defaultValue}` : "";
    const pname = identifierName(p.name);
    if (typeof p.type === "string") {
      return `${pname}: ${typenameToCode(p.type)}${suffix}`;
    } else {
      return `${p.type.declareLocalParam(classSpec.namespace, classSpec.includes, pname)}${suffix}`;
    }
  }).join(", ");

  if (!isStatic) {
    if (paramsStr) {
      return `self, ${paramsStr}`;
    } else {
      return "self";
    }
  }
  return paramsStr;
}

function initializersToString(initializers: [string, string]): string {
  if (initializers[0].startsWith("self.")) {
    return `${initializers[0]} = ${initializers[1]}`;
  }
  return `self.${initializers[0]} = ${initializers[1]}`;
}

function genClassDefinitionMembers(classSpec: ClassSpec, includes: IncludeAggregator | null, isDataClass: boolean): string[] {
  const lines: string[] = [];

  for (const def of classSpec.members) {
    if (!isDataClass && !def.isStatic) {
      continue;
    }

    if (def.decorations?.length) {
      lines.push(
        ``,
        ...def.decorations,
      );
    }

    const visibility = def.visibility || "public";
    const varName = visibility === "public" ? def.name : privateMember(def.name);
    const typename = typeof def.type === "string" ? def.type : def.type.getLocalType(classSpec.namespace, includes);
    const initialValue = typeof def.type === "string" ? def.initialValue : def.type.getLocalDefaultValue(classSpec.namespace, includes, false, def.initialValue);

    const decl = genDeclaration({
      typename,
      inNamespace: classSpec.namespace,
      varName,
      includeTerminator: false,
      initialValue: (def.getter ? undefined : initialValue) ?? new EmptyValue(module.exports, typename, classSpec.namespace),
      isStatic: def.isStatic,
      isConst: def.isConst,
    });
    lines.push(decl);
  }

  if (lines.length) {
    lines.push(``);
  }

  return lines;
}

function genClassDefinitionConstructors(classSpec: ClassSpec, includes: IncludeAggregator | null): string[] {
  const lines: string[] = [];

  for (const def of classSpec.constructors) {
    const params = paramsToString(classSpec, def.parameters ?? [], false);
    const initializers: string[] = [];
    if (classSpec.superClass) {
      const superClassInitializers = def.superClassInitializers ?? [];
      initializers.push(`super().__init__(${superClassInitializers.join(", ")})`);
    }
    const body = resolveThunkWithParam(def.body ?? [], includes);
    const memberInitializers = (def.memberInitializers ?? []).map(mi => [identifierName(mi[0], true), mi[1]] as [string, string]);
    for (const def of classSpec.members) {
      if (def.isStatic) {
        continue;
      }
      const visibility = def.visibility || "public";
      const varName = visibility === "public" ? identifierName(def.name) : privateMember(def.name);
      if (memberInitializers.find((mi) => mi[0] === varName)) {
        continue;
      }
      const initialValue = typeof def.type === "string" ? def.initialValue : def.type.getLocalDefaultValue(classSpec.namespace, includes, false, def.initialValue);
      if (!initialValue) {
        memberInitializers.push([varName, "None"]);
      } else {
        memberInitializers.push([varName, initialValue.toString(classSpec.namespace)]);
      }
    }
    const allBodyLines = [
      ...initializers,
      ...memberInitializers.map(initializersToString),
      ...body,
    ];
    lines.push(
      ...(def.decorations ?? []),
    );
    if (allBodyLines.length === 0) {
      allBodyLines.push("pass");
    }
    lines.push(
      ...(def.decorations ?? []),
      `def __init__(${params}):`,
      ...indent(1, allBodyLines),
    );

    lines.push(``);
  }

  if (classSpec.destructorBody) {
    const destructorBody = resolveThunkWithParam(classSpec.destructorBody ?? [], includes);
    lines.push(
      `def __del__(self):`,
      ...indent(1, destructorBody),
      ``,
    );
  }

  return lines;
}

function genClassDefinitionMethods(classSpec: ClassSpec, includes: IncludeAggregator | null): string[] {
  const lines: string[] = [];

  for (const def of classSpec.methods) {
    const params = paramsToString(classSpec, def.parameters ?? [], def.isStatic ?? false);
    let returnType = def.returnType ?? "None";
    if (returnType === classSpec.name) {
      returnType = `"${classSpec.name}"`;
    }
    const decl = `def ${methodMember(def.name, def.visibility)}(${params}) -> ${typenameToCode(returnType)}:`;
    lines.push(
      ...(def.decorations ?? []),
    );
    if (def.isStatic) {
      lines.push("@staticmethod");
    }
    if (def.isAbstract) {
      lines.push("@abstractmethod");
      lines.push(
        decl,
        `  pass`,
        ``,
      );
    } else {
      const body = resolveThunkWithParam(def.body, includes);
      if (body.length === 0) {
        body.push("pass");
      }
      lines.push(
        `${decl}`,
        ...indent(1, body),
        ``,
      );
    }
  }

  return lines;
}

export function genClassDefinition(classSpec: ClassSpec): string[] {
  assert(!classSpec.name.includes("."), "Class name cannot contain a namespace");
  let isDataClass = classSpec.constructors.length === 0;

  const classExtends: string[] = [];
  if (classSpec.superClass) {
    classExtends.push(classSpec.superClass);
    isDataClass = false;
  }
  if (classSpec.interfaceName) {
    classExtends.push(classSpec.interfaceName);
    isDataClass = false;
  }

  const extStr = classExtends.length > 0 ? `(${classExtends.join(", ")})` : "";

  assert(!classSpec.templateParams?.length, "Python does not support template parameters yet")

  for (const def of classSpec.methods) {
    if (!def.isStatic) {
      isDataClass = false;
    }
  }

  const decorations = classSpec.decorations ?? [];
  if (isDataClass) {
    decorations.push("@dataclasses.dataclass");
    classSpec.includes?.addFile({ namespace: "dataclasses" });
  }

  return removeSuperfluousEmptyLines([
    ...classSpec.decorations,
    `class ${classSpec.name}${extStr}:`,
    ...indent(1, trimTrailingEmptyLines([
      ...classSpec.classEarlyInject,
      ...genClassDefinitionMembers(classSpec, classSpec.includes, isDataClass),
      ...genClassDefinitionConstructors(classSpec, classSpec.includes),
      ...genClassDefinitionMethods(classSpec, classSpec.includes),
    ])),
    ``,
  ]);
}

export function genReadValue(params: {
  accessor: string;
  accessorIsStruct: boolean;
  fieldOffsetVar: string;
  memAccessorVar: string;
}): string {
  if (params.accessorIsStruct) {
    return `${params.accessor}.read_value(${params.memAccessorVar}, ${params.fieldOffsetVar})`;
  } else {
    return `${params.memAccessorVar}.read_${identifierName(params.accessor)}(${params.fieldOffsetVar})`;
  }
}

export function genWriteValue(params: {
  accessor: string;
  accessorIsStruct: boolean;
  fieldOffsetVar: string;
  memAccessorVar: string;
  value: string | TypeValue;
}): string {
  const value = `${params.value}`;
  if (params.accessorIsStruct) {
    return `${params.accessor}.write_value(${value}, ${params.memAccessorVar}, ${params.fieldOffsetVar})`;
  } else {
    return `${params.memAccessorVar}.write_${identifierName(params.accessor)}(${identifierName(value)}, ${params.fieldOffsetVar})`;
  }
}

export function genDynSizeOfValue(params: {
  accessor: string;
  accessorIsStruct: boolean;
  value: string | TypeValue;
  inNamespace: string;
  includes: IncludeAggregator | null;
}): string {
  if (params.accessorIsStruct) {
    return `${params.accessor}.dyn_size_of_value(${params.value})`;
  } else {
    return `${getXrpaTypes().MemoryAccessor.getLocalType(params.inNamespace, params.includes)}.dyn_size_of_${identifierName(params.accessor)}(${params.value})`;
  }
}

export function genReadWriteValueFunctions(classSpec: ClassSpec, params: {
  localType: TypeDefinition;
  localTypeHasInitializerConstructor: boolean;
  fieldTypes: Record<string, FieldTypeAndAccessor>;
  fieldsToLocal: Record<string, TypeValue>;
  fieldsFromLocal: Record<string, TypeValue>;
  localValueParamName: string;
}): void {
  const fieldReads: string[] = [];
  const fieldWrites: string[] = [];
  const dynFieldSizes: string[] = [];

  for (const name in params.fieldTypes) {
    const field = params.fieldTypes[name];
    const readValue = genReadValue({
      accessor: field.accessor,
      accessorIsStruct: field.accessorIsStruct,
      fieldOffsetVar: "offset",
      memAccessorVar: "mem_accessor",
    });
    const writeValue = genWriteValue({
      accessor: field.accessor,
      accessorIsStruct: field.accessorIsStruct,
      fieldOffsetVar: "offset",
      memAccessorVar: "mem_accessor",
      value: params.fieldsFromLocal[name],
    });
    fieldReads.push(`${name} = ${readValue}`);
    fieldWrites.push(`${writeValue}`);

    if (field.typeSize.dynamicSizeEstimate) {
      dynFieldSizes.push(genDynSizeOfValue({
        accessor: field.accessor,
        accessorIsStruct: field.accessorIsStruct,
        inNamespace: classSpec.namespace,
        includes: classSpec.includes,
        value: params.fieldsFromLocal[name],
      }));
    }
  }

  const fieldsToLocal = arrayZip(Object.keys(params.fieldsToLocal), Object.values(params.fieldsToLocal));
  const localTypeStr = params.localType.getLocalType(classSpec.namespace, classSpec.includes);
  let localReturn = genInitializer(localTypeStr, fieldsToLocal.map(convertFieldValue));
  if (Object.keys(params.fieldsToLocal).length === 1 && localTypeStr === "float") {
    localReturn = `${params.fieldsToLocal[Object.keys(params.fieldsToLocal)[0]]}`;
  }

  classSpec.methods.push({
    name: "read_value",
    returnType: localTypeStr,
    parameters: [{
      name: "mem_accessor",
      type: getXrpaTypes().MemoryAccessor,
    }, {
      name: "offset",
      type: getXrpaTypes().MemoryOffset,
    }],
    isStatic: true,
    body: [
      ...fieldReads,
      `return ${localReturn}`,
    ],
  });

  classSpec.methods.push({
    name: "write_value",
    parameters: [{
      name: params.localValueParamName,
      type: params.localType,
    }, {
      name: "mem_accessor",
      type: getXrpaTypes().MemoryAccessor,
    }, {
      name: "offset",
      type: getXrpaTypes().MemoryOffset,
    }],
    isStatic: true,
    body: fieldWrites,
  });

  if (dynFieldSizes.length > 0) {
    classSpec.methods.push({
      name: "dyn_size_of_value",
      returnType: PRIMITIVE_INTRINSICS.int32.typename,
      parameters: [{
        name: params.localValueParamName,
        type: params.localType,
      }],
      isStatic: true,
      body: [
        `return ${dynFieldSizes.join(" + ")}`,
      ],
    });
  }
}

export function sanitizeEnumNames(enumValues: Record<string, number>): Record<string, number> {
  const sanitized: Record<string, number> = {};
  for (let name in enumValues) {
    const value = enumValues[name];
    if (name === "None") {
      // reserved name in Python
      name = "None_";
    }
    sanitized[name] = value;
  }
  return sanitized;
}

export function genEnumDefinition(enumName: string, enumValues: Record<string, number>, includes: IncludeAggregator | null): string[] {
  if (includes) {
    includes.addFile({ namespace: "enum" });
  }
  return [
    `class ${enumName}(enum.Enum):`,
    ...indent(1, Object.keys(enumValues).map(v => `${v} = ${enumValues[v]}`)),
    ``,
  ];
}

export function genEnumDynamicConversion(targetTypename: string, value: TypeValue): string {
  if (targetTypename === "uint" || targetTypename === "int") {
    return `${value}.value`;
  }
  return `${targetTypename}(${value})`;
}

export function getNullValue(): string {
  return "None";
}

export function genReferencePtrToID(varName: string, objectUuidType: string): string {
  return `(${varName}.get_xrpa_id() if ${varName} is not None else ${objectUuidType}())`;
}

export function genFieldGetter(classSpec: ClassSpec, params: {
  apiname: string;
  fieldName: string;
  fieldType: TypeDefinition;
  fieldToMemberVar: (fieldName: string) => string;
  convertToLocal: boolean;
  description: string | undefined;
  visibility?: "public" | "private";
  isConst: boolean;
}): void {
  if (!typeIsStateData(params.fieldType)) {
    return;
  }

  const decorations = genCommentLines(params.description);

  const fieldVar = params.fieldToMemberVar(params.fieldName);
  const funcName = `get_${identifierName(params.fieldName)}`;
  const fieldType = params.fieldType;
  if (typeIsReference(fieldType)) {
    classSpec.methods.push({
      decorations,
      name: funcName,
      returnType: params.fieldType.declareLocalReturnType(classSpec.namespace, classSpec.includes, !params.convertToLocal),
      isConst: params.isConst,
      visibility: params.visibility,
      body: [
        `return ${fieldVar}`,
      ],
    });
  } else if (params.convertToLocal) {
    classSpec.methods.push({
      decorations,
      name: funcName,
      returnType: fieldType.declareLocalReturnType(classSpec.namespace, classSpec.includes, false),
      isConst: params.isConst,
      visibility: params.visibility,
      body: includes => [
        `return ${fieldType.convertValueToLocal(classSpec.namespace, includes, fieldVar)}`,
      ],
    });
  } else {
    classSpec.methods.push({
      decorations,
      name: funcName,
      returnType: fieldType.declareLocalReturnType(classSpec.namespace, classSpec.includes, true),
      isConst: params.isConst,
      visibility: params.visibility,
      body: [
        `return ${fieldVar}`,
      ],
    });
  }
}

export function genFieldSetter(classSpec: ClassSpec, params: {
  fieldName: string;
  fieldType: TypeDefinition;
  valueToMemberWrite: (fieldName: string) => string;
  convertFromLocal: boolean;
}): void {
  const isRef = typeIsReference(params.fieldType);
  classSpec.methods.push({
    name: `set_${identifierName(params.fieldName)}`,
    parameters: [{
      name: "value",
      type: isRef ? (params.fieldType as ReferenceType).objectUuidType : params.fieldType,
    }],
    body: includes => {
      const value = (params.convertFromLocal && !isRef) ? `${params.fieldType.convertValueFromLocal(classSpec.namespace, includes, "value")}` : "value";
      return [
        `${params.valueToMemberWrite(value)}`,
      ];
    },
  });
}

export function genFieldChangedCheck(classSpec: ClassSpec, params: {
  parentType: StructTypeDefinition;
  fieldName: string;
  visibility?: "public" | "private";
}): void {
  classSpec.methods.push({
    name: `check_${identifierName(params.fieldName)}_changed`,
    returnType: "bool",
    parameters: [{
      name: "fields_changed",
      type: PRIMITIVE_INTRINSICS.uint64.typename,
    }],
    visibility: params.visibility,
    isConst: true,
    isInline: true,
    body: [
      `return (fields_changed & ${params.parentType.getFieldBitMask(params.fieldName)}) != 0`,
    ],
  });
}

export function injectGeneratedTag(fileData: Buffer): Buffer {
  const fileStr = fileData.toString("utf8");
  if (fileStr.startsWith(COPYRIGHT_STRING)) {
    const idx = fileStr.indexOf("\n") + 1;
    return Buffer.from(fileStr.slice(0, idx) + GENERATED_STRING + "\n" + fileStr.slice(idx));
  }
  return Buffer.from(GENERATED_STRING + "\n" + fileStr);
}

export function genRuntimeGuid(params: {
  objectUuidType: string;
  guidGen: GuidGenSpec;
  idParts?: number[],
  includes: IncludeAggregator | null;
}): string {
  if (params.idParts) {
    return `${params.objectUuidType}(${params.idParts.join(", ")})`;
  }
  for (const entry of params.guidGen.includes ?? []) {
    params.includes?.addFile(entry);
  }
  return `${params.objectUuidType}.from_uuid(${params.guidGen.code})`;
}

export function genDeref(ptrName: string, memberName: string): string {
  return `${ptrName || "self"}.${memberName}`;
}

export function genDerefMethodCall(ptrName: string, methodName: string, params: string[]): string {
  const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
  return `${ptrName || "self"}.${methodCall}`;
}

export function genMethodCall(varName: string, methodName: string, params: string[]): string {
  const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
  if (!varName) {
    // Special case for Python: if methodName doesn't contain a namespace separator (.)
    // and varName is empty, we assume it's an instance method and prefix with "self."
    if (!methodName.includes('.')) {
      return `self.${methodCall}`;
    }
    return methodCall;
  }
  return `${varName}.${methodCall}`;
}

export function genMethodBind(ptrName: string, methodName: string, params: Record<string, string[]>, ignoreParamCount: number): string {
  const bindParams = (new Array<string>(ignoreParamCount)).fill("_").concat(Object.keys(params).map(p => `${p}`));
  const methodCall = `${methodMember(methodName)}(${collapse(Object.values(params)).join(", ")})`;
  if (!ptrName) {
    return `lambda ${bindParams.join(", ")}: ${methodCall}`;
  }
  return `lambda ${bindParams.join(", ")}: ${ptrName}.${methodCall}`;
}

export function genPassthroughMethodBind(methodName: string, paramCount: number): string {
  const bindParams = (new Array<string>(paramCount)).fill("_").map((_, i) => `p${i}`);
  return `lambda ${bindParams.join(", ")}: ${methodMember(methodName)}(${bindParams.join(", ")})`;
}

export function genNonNullCheck(ptrName: string): string {
  return `${ptrName} is not None`;
}

export function genCreateObject(type: string, params: string[]): string {
  return `${type}(${params.join(", ")})`;
}

export function genObjectPtrType(type: string): string {
  return type;
}

export function genConvertBoolToInt(value: TypeValue): string {
  return `(1 if ${value} is True else 0)`;
}

export function genConvertIntToBool(value: TypeValue): string {
  return `(${value} == 1)`;
}

export function applyTemplateParams(typename: string, ...templateParams: string[]): string {
  if (!templateParams.length) {
    return typenameToCode(typename);
  }
  return `${typenameToCode(typename)}[${templateParams.join(", ")}]`;
}

export function ifAnyBitIsSet(value: string, bitValue: number, code: string[]): string[] {
  return [
    `if (${value} & ${bitValue}) != 0:`,
    ...indent(1, code),
  ];
}

export function ifAllBitsAreSet(value: string, bitsValue: number, code: string[]): string[] {
  return [
    `if (${value} & ${bitsValue}) == ${bitsValue}:`,
    ...indent(1, code),
  ];
}

export function ifEquals(value: string, value2: string, code: string[]): string[] {
  return [
    `if ${value} == ${value2}:`,
    ...indent(1, code),
  ];
}

export function conditional(condition: string, code: string[], elseCode?: string[]): string[] {
  return [
    `if ${condition}:`,
    ...indent(1, code),
    ...(elseCode ? [
      `else:`,
      ...indent(1, elseCode),
    ] : []),
  ];
}

export function declareVar(varName: string, typename: string, initialValue: TypeValue): string {
  if (!typename) {
    return `${varName} = ${initialValue}`;
  }
  return `${varName}: ${typenameToCode(typename)} = ${initialValue}`;
}
