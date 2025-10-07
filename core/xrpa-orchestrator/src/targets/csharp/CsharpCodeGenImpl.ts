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
  genCommentLinesWithCommentMarker,
  indent,
  nsExtractWithSeparator,
  nsJoinWithSeparator,
  nsQualifyWithSeparator,
  removeSuperfluousEmptyLines,
  resolveThunkWithParam,
  trimTrailingEmptyLines,
  upperFirst,
} from "@xrpa/xrpa-utils";
import assert from "assert";

import { ClassSpec, MethodParam } from "../../shared/ClassSpec";
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

export const XRPA_NAMESPACE = "Xrpa";

const COPYRIGHT_STRING = `/*
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
`;
const GENERATED_STRING = "// @" + "generated";

export const HEADER = [
  COPYRIGHT_STRING,
  GENERATED_STRING,
  "",
];

export const UNIT_TRANSFORMER: UnitTransformer = {
  angular: {
    radian: {
      degree: [" * 180f / ((float)System.Math.PI)", 180 / Math.PI],
    },
    degree: {
      radian: [" * ((float)System.Math.PI) / 180f", Math.PI / 180],
    },
  },
  spatial: {
    meter: {
      centimeter: [" * 100f", 100],
    },
    centimeter: {
      meter: [" / 100f", 1 / 100],
    },
  },
};

export const PRIMITIVE_INTRINSICS: PrimitiveIntrinsics = {
  string: { typename: "string" },
  microseconds: { typename: "ulong" },
  nanoseconds: { typename: "ulong" },
  uint8: { typename: "byte" },
  uint64: { typename: "ulong" },
  int: { typename: "int" },
  int32: { typename: "int" },
  uint32: { typename: "uint" },
  float32: { typename: "float" },
  bool: { typename: "bool" },
  arrayFloat3: { typename: "float3[]" },
  bytearray: { typename: "byte[]" },

  autovar: { typename: "var" },

  TRUE: "true",
  FALSE: "false",
};

export const STMT_TERM = ";";

export const HAS_NATIVE_PRIMITIVE_TYPES = true;

export function genGetCurrentClockTime(_includes: IncludeAggregator | null, inNanoseconds = false): string {
  if (inNanoseconds) {
    return `${XRPA_NAMESPACE}.TimeUtils.GetCurrentClockTimeNanoseconds()`;
  }
  return `${XRPA_NAMESPACE}.TimeUtils.GetCurrentClockTimeMicroseconds()`;
}

export const DEFAULT_INTERFACE_PTR_TYPE = "bare";

const nsSep = ".";

export class CsIncludeAggregator implements IncludeAggregator {
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
    if (params.typename && !params.namespace) {
      params.namespace = nsExtract(params.typename);
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
    return Object.keys(this.importNamespaces).sort().map(ns => `using ${ns};`);
  }
}

export function genCommentLines(str?: string): string[] {
  return genCommentLinesWithCommentMarker("//", str);
}

export function nsQualify(qualifiedName: string, inNamespace: string): string {
  return nsQualifyWithSeparator(nsSep, qualifiedName, inNamespace);
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

export function identifierName(name: string): string {
  return name;
}

export function privateMember(memberVarName: string): string {
  if (memberVarName.startsWith("_")) {
    // already private
    return memberVarName;
  }
  return "_" + memberVarName;
}

export function methodMember(methodName: string): string {
  const parts = methodName.split(nsSep);
  parts[parts.length - 1] = upperFirst(parts[parts.length - 1]);
  return parts.join(nsSep);
}

function genInitializer(values: unknown[]): string {
  return `{${values.join(", ")}}`
}

export function genPrimitiveValue(typename: string, value: string | boolean | number | null): string {
  if (value === null) {
    if (typename === "string") {
      return `""`;
    }
    if (typename) {
      return `new ${typename}()`;
    }
    return "";
  }

  if (typeof value === "string") {
    // escape string
    value = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return `"${value}"`;
  }

  if (typeof value === "boolean") {
    return `${value}`;
  }

  if (!typename) {
    return `${value}`;
  }

  if (typeof value === "number") {
    if (typename === "int" || typename === "uint" || typename === "byte") {
      return `${value}`;
    }
    if (typename === "ulong") {
      return `${value}UL`;
    }
    if (typename === "float") {
      return `${value}f`;
    }
  }

  return `new ${typename}${genInitializer([value])}`;
}

function convertFieldValueInitializer(kv: [string, string | TypeValue]): string {
  return `${kv[1]}`;
}

function convertFieldValue(kv: [string, string | TypeValue]): string {
  if (!kv[0]) {
    return `${kv[1]}`;
  }
  return `${kv[0]} = ${kv[1]}`;
}

export function genMultiValue(typename: string, hasInitializerConstructor: boolean, valueStrings: [string, string][]): string {
  return `new ${typename}${genInitializer(valueStrings.map(hasInitializerConstructor ? convertFieldValueInitializer : convertFieldValue))}`;
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
  const typename = nsQualify(params.typename, params.inNamespace);
  let prefix = "";
  if (params.isStatic && params.isConst) {
    prefix += "const ";
  } else if (params.isStatic) {
    prefix += "static ";
  } else if (params.isConst) {
    prefix += "readonly ";
  }

  const initializer = params.initialValue instanceof EmptyValue ? "" : ` = ${params.initialValue.toString(params.inNamespace)}`;
  return `${prefix}${typename} ${params.varName}${initializer}` + (params.includeTerminator ? ";" : "");
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
  return apiname ? `${apiname}DataStore` : "";
}

export function getDataStoreHeaderName(apiname: string): string {
  return apiname ? `${getDataStoreName(apiname)}.cs` : "";
}

export function getDataStoreHeaderNamespace(apiname: string): string {
  return getDataStoreName(apiname);
}

export function getDataStoreClass(apiname: string, inNamespace: string, includes: IncludeAggregator | null): string {
  const fullName = nsJoin(getDataStoreHeaderNamespace(apiname), getDataStoreName(apiname));
  includes?.addFile({ filename: getDataStoreHeaderName(apiname), typename: fullName });
  return nsQualify(fullName, inNamespace);
}

export function getTypesHeaderName(apiname: string): string {
  return apiname ? `${apiname}Types.cs` : "";
}

export function getTypesHeaderNamespace(apiname: string): string {
  return getDataStoreHeaderNamespace(apiname);
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

  classSpec.constructors.push({});

  classSpec.constructors.push({
    parameters: [{ name: "memAccessor", type: getXrpaTypes().MemoryAccessor.getLocalType(classSpec.namespace, classSpec.includes) }],
    body: ["SetAccessor(memAccessor);"],
  });

  if (isWriteAccessor && !isMessageStruct) {
    classSpec.methods.push({
      name: "Create",
      parameters: [{
        name: "accessor",
        type: getXrpaTypes().TransportStreamAccessor,
      }, {
        name: "collectionId",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "id",
        type: objectUuidType,
      }, {
        name: "changeByteCount",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "timestamp",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      returnType: classSpec.name,
      body: [
        `var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionChangeEventAccessor>((int)Xrpa.CollectionChangeType.CreateObject, changeByteCount, timestamp);`,
        `changeEvent.SetCollectionId(collectionId);`,
        `changeEvent.SetObjectId(id);`,
        `return new ${classSpec.name}(changeEvent.AccessChangeData());`,
      ],
      isStatic: true,
      visibility: "public",
    });

    classSpec.methods.push({
      name: "Update",
      parameters: [{
        name: "accessor",
        type: getXrpaTypes().TransportStreamAccessor,
      }, {
        name: "collectionId",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "id",
        type: objectUuidType,
      }, {
        name: "fieldsChanged",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }, {
        name: "changeByteCount",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }],
      returnType: classSpec.name,
      body: [
        `var changeEvent = accessor.WriteChangeEvent<Xrpa.CollectionUpdateChangeEventAccessor>((int)Xrpa.CollectionChangeType.UpdateObject, changeByteCount);`,
        `changeEvent.SetCollectionId(collectionId);`,
        `changeEvent.SetObjectId(id);`,
        `changeEvent.SetFieldsChanged(fieldsChanged);`,
        `return new ${classSpec.name}(changeEvent.AccessChangeData());`,
      ],
      isStatic: true,
      visibility: "public",
    });
  }

  if (isWriteAccessor) {
    classSpec.members.push({
      name: "writeOffset",
      type: getXrpaTypes().MemoryOffset,
      visibility: "private",
      initialValue: new CodeLiteralValue(module.exports, "new()"),
    });

    return privateMember("writeOffset");
  } else {
    classSpec.members.push({
      name: "readOffset",
      type: getXrpaTypes().MemoryOffset,
      visibility: "private",
      initialValue: new CodeLiteralValue(module.exports, "new()"),
    });

    return privateMember("readOffset");
  }
}

export function genEventHandlerType(paramTypes: string[], includes: IncludeAggregator | null): string {
  includes?.addFile({ namespace: "System" });
  if (paramTypes.length === 0) {
    return "System.Action";
  }
  return `System.Action<${paramTypes.join(", ")}>`;
}

export function genEventHandlerCall(handler: string, paramValues: string[], handlerCanBeNull: boolean): string {
  if (handlerCanBeNull) {
    return `${handler}?.Invoke(${paramValues.join(", ")});`;
  }
  return `${handler}(${paramValues.join(", ")});`;
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
  const msgHandler = params.genMsgHandler(params.fieldName);
  const handlerCanBeNull = msgHandler.indexOf(".") < 0;
  const timestamp = params.timestampName ?? "msgTimestamp";
  const lines: string[] = [];
  if (typeIsSignalData(params.fieldType)) {
    const msgParams = [timestamp, "messageData"];
    lines.push(
      `${msgHandler}?.OnSignalData(${msgParams.join(", ")});`,
    );
  } else if (!params.fieldType.hasFields()) {
    lines.push(
      genEventHandlerCall(msgHandler, [timestamp], handlerCanBeNull),
    );
  } else {
    const prelude: string[] = [];
    const msgParams = [timestamp].concat(params.msgDataToParams(params.fieldType, prelude, params.includes));
    lines.push(
      ...(params.convertToReadAccessor ? [
        `${params.fieldType.getReadAccessorType(params.namespace, params.includes)} message = new(messageData);`,
      ] : []),
      ...prelude,
      genEventHandlerCall(msgHandler, msgParams, handlerCanBeNull),
    );
  }

  return lines;
}

function paramsToString(classSpec: ClassSpec, parameters: MethodParam[]): string {
  return parameters.map((p) => {
    const suffix = p.defaultValue ? ` = ${p.defaultValue}` : "";
    if (typeof p.type === "string") {
      return `${p.type} ${p.name}${suffix}`;
    } else {
      return `${p.type.declareLocalParam(classSpec.namespace, classSpec.includes, p.name)}${suffix}`;
    }
  }).join(", ");
}

function initializersToString(initializers: [string, string]): string {
  return `${privateMember(initializers[0])} = ${initializers[1]};`;
}

function genClassDefinitionMembers(classSpec: ClassSpec, includes: IncludeAggregator | null): string[] {
  const lines: string[] = [];

  for (const def of classSpec.members) {
    if (def.decorations?.length) {
      lines.push(
        ``,
        ...def.decorations,
      );
    } else if (def.getter) {
      lines.push(``);
    }

    const visibility = def.visibility || "public";
    const varName = visibility === "public" ? def.name : privateMember(def.name);
    const typename = typeof def.type === "string" ? def.type : def.type.getLocalType(classSpec.namespace, includes);
    const initialValue = typeof def.type === "string" ? def.initialValue : def.type.getLocalDefaultValue(classSpec.namespace, includes, false, def.initialValue);

    const decl = visibility + " " + genDeclaration({
      typename,
      inNamespace: classSpec.namespace,
      varName,
      includeTerminator: false,
      initialValue: (def.getter ? undefined : initialValue) ?? new EmptyValue(module.exports, typename, classSpec.namespace),
      isStatic: def.isStatic,
      isConst: def.isConst,
    });
    if (def.getter) {
      lines.push(
        `${decl} {`,
        `  get => ${def.getter};`,
        ...((def.setter && def.setter.length) ? [
          `  set {`,
          ...indent(2, def.setter),
          `  }`,
        ] : []),
        `}`,
        ``,
      );
    } else {
      lines.push(`${decl};`);
    }
  }

  if (lines.length) {
    lines.push(``);
  }

  return lines;
}

function genClassDefinitionConstructors(classSpec: ClassSpec, includes: IncludeAggregator | null): string[] {
  const lines: string[] = [];

  for (const def of classSpec.constructors) {
    const visibility = def.visibility || "public";
    const params = paramsToString(classSpec, def.parameters ?? []);
    const initializers: string[] = [];
    if (classSpec.superClass && def.superClassInitializers) {
      initializers.push(`base(${def.superClassInitializers.join(", ")})`);
    }
    const initializersStr = initializers.length > 0 ? ` : ${initializers.join(", ")}` : "";
    const decl = `${visibility} ${classSpec.name}(${params})${initializersStr}`;
    const body = resolveThunkWithParam(def.body ?? [], includes);
    const allBodyLines = [
      ...(def.memberInitializers?.map(initializersToString) ?? []),
      ...body,
    ];
    lines.push(
      ...(def.decorations ?? []),
    );
    if (allBodyLines.length === 0) {
      lines.push(
        `${decl} {}`,
      );
    } else {
      lines.push(
        ...(def.decorations ?? []),
        `${decl} {`,
        ...indent(1, allBodyLines),
        `}`,
      );
    }

    lines.push(``);
  }

  if (classSpec.destructorBody) {
    const destructorBody = resolveThunkWithParam(classSpec.destructorBody ?? [], includes);
    lines.push(
      `public void Dispose() {`,
      `  Dispose(true);`,
      `  GC.SuppressFinalize(this);`,
      `}`,
      ``,
      `protected virtual void Dispose(bool disposing) {`,
      ...indent(1, destructorBody),
      `}`,
      ``,
      `~${classSpec.name}() {`,
      `  Dispose(false);`,
      `}`,
      ``,
    );
  }

  return lines;
}

function genClassDefinitionMethods(classSpec: ClassSpec, includes: IncludeAggregator | null): string[] {
  const lines: string[] = [];

  for (const def of classSpec.methods) {
    let prefix: string = def.visibility || "public";
    if (prefix === "private") {
      prefix = "";
    } else {
      prefix += " ";
    }
    if (def.isStatic) {
      prefix += "static ";
    }
    if (def.isOverride) {
      prefix += "override ";
    } else if (def.isAbstract) {
      prefix += "abstract ";
    } else if (def.isVirtual) {
      prefix += "virtual ";
    }
    const params = paramsToString(classSpec, def.parameters ?? []);
    const templateParams = def.templateParams?.length ? `<${def.templateParams.join(", ")}>` : "";
    const whereClauses = def.whereClauses?.length ? ` where ${def.whereClauses.join(" ")} ` : "";
    const decl = `${prefix}${def.returnType ?? "void"} ${methodMember(def.name)}${templateParams}(${params})${whereClauses}`;
    lines.push(
      ...(def.decorations ?? []),
    );
    if (def.isAbstract) {
      lines.push(`${decl};`);
    } else {
      const body = resolveThunkWithParam(def.body, includes);
      lines.push(
        `${decl} {`,
        ...indent(1, body),
        `}`,
        ``,
      );
    }
  }

  return lines;
}

export function genClassDefinition(classSpec: ClassSpec): string[] {
  const classExtends: string[] = [];
  if (classSpec.superClass) {
    classExtends.push(classSpec.superClass);
  }
  if (classSpec.interfaceName) {
    classExtends.push(classSpec.interfaceName);
  }
  if (classSpec.destructorBody) {
    classSpec.includes?.addFile({ namespace: "System" });
    classExtends.push("IDisposable");
  }

  const extStr = classExtends.length > 0 ? `: ${classExtends.join(", ")} ` : "";
  const classNameDecorationStr = classSpec.classNameDecoration ? `${classSpec.classNameDecoration} ` : "";

  const classIsAbstract = classSpec.forceAbstract || classSpec.methods.filter(m => m.isAbstract).length > 0;
  const classTemplateParams = classSpec.templateParams ? `<${classSpec.templateParams.join(", ")}>` : "";

  return removeSuperfluousEmptyLines([
    ...classSpec.decorations,
    `public ${classIsAbstract ? "abstract " : ""}class ${classNameDecorationStr}${classSpec.name}${classTemplateParams} ${extStr}{`,
    ...indent(1, trimTrailingEmptyLines([
      ...classSpec.classEarlyInject,
      ...genClassDefinitionMembers(classSpec, classSpec.includes),
      ...genClassDefinitionConstructors(classSpec, classSpec.includes),
      ...genClassDefinitionMethods(classSpec, classSpec.includes),
    ])),
    `}`,
    ``,
  ]);
}

function accessorToName(accessor: string): string {
  if (accessor === "byte[]") {
    return "bytes";
  }
  return accessor;
}

export function genReadValue(params: {
  accessor: string;
  accessorIsStruct: boolean;
  fieldOffsetVar: string;
  memAccessorVar: string;
}): string {
  if (params.accessorIsStruct) {
    return `${params.accessor}.ReadValue(${params.memAccessorVar}, ${params.fieldOffsetVar})`;
  } else {
    return `${params.memAccessorVar}.Read${upperFirst(accessorToName(params.accessor))}(${params.fieldOffsetVar})`;
  }
}

export function genWriteValue(params: {
  accessor: string;
  accessorIsStruct: boolean;
  fieldOffsetVar: string;
  memAccessorVar: string;
  value: string | TypeValue;
}): string {
  if (params.accessorIsStruct) {
    return `${params.accessor}.WriteValue(${params.value}, ${params.memAccessorVar}, ${params.fieldOffsetVar})`;
  } else {
    return `${params.memAccessorVar}.Write${upperFirst(accessorToName(params.accessor))}(${params.value}, ${params.fieldOffsetVar})`;
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
    return `${params.accessor}.DynSizeOfValue(${params.value})`;
  } else {
    return `${getXrpaTypes().MemoryAccessor.getLocalType(params.inNamespace, params.includes)}.DynSizeOf${upperFirst(accessorToName(params.accessor))}(${params.value})`;
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
      memAccessorVar: "memAccessor",
    });
    const writeValue = genWriteValue({
      accessor: field.accessor,
      accessorIsStruct: field.accessorIsStruct,
      fieldOffsetVar: "offset",
      memAccessorVar: "memAccessor",
      value: params.fieldsFromLocal[name],
    });
    fieldReads.push(`${field.typename} ${name} = ${readValue};`);
    fieldWrites.push(`${writeValue};`);

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
  const localInitializer = genInitializer(fieldsToLocal.map(params.localTypeHasInitializerConstructor ? convertFieldValueInitializer : convertFieldValue));
  const localTypeStr = params.localType.getLocalType(classSpec.namespace, classSpec.includes);
  let localReturn = `new ${localTypeStr}${localInitializer}`;
  if (Object.keys(params.fieldsToLocal).length === 1 && localTypeStr === "float") {
    localReturn = `${params.fieldsToLocal[Object.keys(params.fieldsToLocal)[0]]}`;
  }

  classSpec.methods.push({
    name: "ReadValue",
    returnType: localTypeStr,
    parameters: [{
      name: "memAccessor",
      type: getXrpaTypes().MemoryAccessor,
    }, {
      name: "offset",
      type: getXrpaTypes().MemoryOffset,
    }],
    isStatic: true,
    body: [
      ...fieldReads,
      `return ${localReturn};`,
    ],
  });

  classSpec.methods.push({
    name: "WriteValue",
    parameters: [{
      name: params.localValueParamName,
      type: params.localType,
    }, {
      name: "memAccessor",
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
      name: "DynSizeOfValue",
      returnType: PRIMITIVE_INTRINSICS.int32.typename,
      parameters: [{
        name: params.localValueParamName,
        type: params.localType,
      }],
      isStatic: true,
      body: [
        `return ${dynFieldSizes.join(" + ")};`,
      ],
    });
  }
}

export function sanitizeEnumNames(enumValues: Record<string, number>): Record<string, number> {
  return enumValues;
}

export function genEnumDefinition(enumName: string, enumValues: Record<string, number>): string[] {
  return [
    `public enum ${enumName} : uint {`,
    ...indent(1, Object.keys(enumValues).map(v => `${v} = ${enumValues[v]},`)),
    `}`,
  ];
}

export function genEnumDynamicConversion(targetTypename: string, value: TypeValue): string {
  if (targetTypename === "uint") {
    return `(uint)(${value})`;
  }
  return `(${targetTypename})(uint)(${value})`;
}

export function getNullValue(): string {
  return "null";
}

export function genReferencePtrToID(varName: string, objectUuidType: string): string {
  return `${varName}?.GetXrpaId() ?? new ${objectUuidType}()`;
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
  const funcName = `Get${upperFirst(params.fieldName)}`;
  const fieldType = params.fieldType;
  if (typeIsReference(fieldType)) {
    classSpec.methods.push({
      decorations,
      name: funcName,
      returnType: fieldType.declareLocalReturnType(classSpec.namespace, classSpec.includes, !params.convertToLocal),
      isConst: params.isConst,
      visibility: params.visibility,
      body: [
        `return ${fieldVar};`,
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
        `return ${fieldType.convertValueToLocal(classSpec.namespace, includes, fieldVar)};`,
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
        `return ${fieldVar};`,
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
    name: `Set${upperFirst(params.fieldName)}`,
    parameters: [{
      name: "value",
      type: isRef ? (params.fieldType as ReferenceType).objectUuidType : params.fieldType,
    }],
    body: includes => {
      const value = (params.convertFromLocal && !isRef) ? `${params.fieldType.convertValueFromLocal(classSpec.namespace, includes, "value")}` : "value";
      return [
        `${params.valueToMemberWrite(value)};`,
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
    name: `Check${upperFirst(params.fieldName)}Changed`,
    returnType: "bool",
    parameters: [{
      name: "fieldsChanged",
      type: "ulong",
    }],
    visibility: params.visibility,
    isConst: true,
    isInline: true,
    body: [
      `return (fieldsChanged & ${params.parentType.getFieldBitMask(params.fieldName)}) != 0;`,
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
    return `new ${params.objectUuidType}(${params.idParts.join(", ")})`;
  }
  for (const entry of params.guidGen.includes ?? []) {
    params.includes?.addFile(entry);
  }
  return `new ${params.objectUuidType}(${params.guidGen.code})`;
}

export function genDeref(ptrName: string, memberName: string): string {
  if (!ptrName) {
    return memberName;
  }
  return `${ptrName}.${memberName}`;
}

export function genDerefMethodCall(ptrName: string, methodName: string, params: string[]): string {
  const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
  if (!ptrName) {
    return methodCall;
  }
  return `${ptrName}.${methodCall}`;
}

export function genMethodCall(varName: string, methodName: string, params: string[]): string {
  const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
  if (!varName) {
    return methodCall;
  }
  return `${varName}.${methodCall}`;
}

export function genMethodBind(ptrName: string, methodName: string, params: Record<string, string[]>, ignoreParamCount: number): string {
  const bindParams = (new Array<string>(ignoreParamCount)).fill("_").concat(Object.keys(params).map(p => `${p}`));
  const methodCall = `${methodMember(methodName)}(${collapse(Object.values(params)).join(", ")})`;
  if (!ptrName) {
    return `(${bindParams.join(", ")}) => ${methodCall}`;
  }
  return `(${bindParams.join(", ")}) => ${ptrName}.${methodCall}`;
}

export function genPassthroughMethodBind(methodName: string): string {
  return methodMember(methodName);
}

export function genNonNullCheck(ptrName: string): string {
  return `${ptrName} != null`;
}

export function genCreateObject(type: string, params: string[]): string {
  return `new ${type}(${params.join(", ")})`;
}

export function genObjectPtrType(type: string): string {
  return type;
}

export function genConvertBoolToInt(value: TypeValue): string {
  return `(${value} ? 1 : 0)`;
}

export function genConvertIntToBool(value: TypeValue): string {
  return `(${value} == 1 ? true : false)`;
}

export function applyTemplateParams(typename: string, ...templateParams: string[]): string {
  if (!templateParams.length) {
    return typename;
  }
  return `${typename}<${templateParams.join(", ")}>`;
}

export function ifAnyBitIsSet(value: string, bitsValue: number, code: string[]): string[] {
  return [
    `if ((${value} & ${bitsValue}) != 0) {`,
    ...indent(1, code),
    `}`,
  ];
}

export function ifAllBitsAreSet(value: string, bitsValue: number, code: string[]): string[] {
  return [
    `if ((${value} & ${bitsValue}) == ${bitsValue}) {`,
    ...indent(1, code),
    `}`,
  ];
}

export function ifEquals(value: string, value2: string, code: string[]): string[] {
  return [
    `if (${value} == ${value2}) {`,
    ...indent(1, code),
    `}`,
  ];
}

export function declareVar(varName: string, typename: string, initialValue: TypeValue): string {
  typename = typename || "var";
  return `${typename} ${varName} = ${initialValue};`;
}
