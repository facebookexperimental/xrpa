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
  collapse,
  EXCLUDE_NAMESPACE,
  genCommentLinesWithCommentMarker,
  indent,
  lowerFirst,
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
import { EmptyValue, TypeValue } from "../../shared/TypeValue";
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

export const BUCK_HEADER = [
  "# @" + "generated",
  "",
];

export const UNIT_TRANSFORMER: UnitTransformer = {
  angular: {
    radian: {
      degree: [` * 180.f / ${XRPA_NAMESPACE}::XrpaConstants::PI_CONST`, 180 / Math.PI],
    },
    degree: {
      radian: [` * ${XRPA_NAMESPACE}::XrpaConstants::PI_CONST / 180.f`, Math.PI / 180],
    },
  },
  spatial: {
    meter: {
      centimeter: [" * 100.f", 100],
    },
    centimeter: {
      meter: [" / 100.f", 1 / 100],
    },
  },
};

export const PRIMITIVE_INTRINSICS: PrimitiveIntrinsics = {
  string: { typename: "std::string", headerFile: "<string>" },
  microseconds: { typename: "std::chrono::microseconds", headerFile: "<chrono>" },
  nanoseconds: { typename: "std::chrono::nanoseconds", headerFile: "<chrono>" },
  uint8: { typename: "uint8_t" },
  uint64: { typename: "uint64_t" },
  int: { typename: "int" },
  int32: { typename: "int32_t" },
  uint32: { typename: "uint32_t" },
  float32: { typename: "float" },
  bool: { typename: "bool" },
  arrayFloat3: { typename: "std::array<float, 3>", headerFile: "<array>" },
  bytearray: { typename: "std::vector<uint8_t>", headerFile: "<vector>" },

  autovar: { typename: "auto" },

  TRUE: "true",
  FALSE: "false",
};

export const STMT_TERM = ";";

export const HAS_NATIVE_PRIMITIVE_TYPES = true;

export function genGetCurrentClockTime(_includes: IncludeAggregator | null, inNanoseconds = false): string {
  if (inNanoseconds) {
    return `${XRPA_NAMESPACE}::getCurrentClockTimeNanoseconds()`;
  }
  return `${XRPA_NAMESPACE}::getCurrentClockTimeMicroseconds()`;
}

export const DEFAULT_INTERFACE_PTR_TYPE = "shared_ptr";

const nsSep = "::";

export class CppIncludeAggregator implements IncludeAggregator {
  private includeFiles: Record<string, boolean> = {};

  constructor(
    headerFiles?: string[],
    readonly remapper?: (headerFile: string) => string,
    readonly forbiddenFiles?: string[],
  ) {
    if (this.forbiddenFiles) {
      for (let i = 0; i < this.forbiddenFiles.length; i++) {
        this.forbiddenFiles[i] = this.normalize(this.forbiddenFiles[i]);
      }
    }
    if (headerFiles) {
      for (const header of headerFiles) {
        this.addFile({ filename: header });
      }
    }
  }

  private normalize(fileStr: string): string {
    if (fileStr.charAt(0) !== "<" && fileStr.charAt(0) !== '"') {
      // needs quoted
      fileStr = `"${fileStr}"`;
    }
    if (this.remapper) {
      fileStr = this.remapper(fileStr);
    }
    return fileStr;
  }

  public addFile(params: {
    filename?: string;
    namespace?: string;
    typename?: string;
  }) {
    if (params.filename) {
      const fileStr = this.normalize(params.filename);
      if (this.forbiddenFiles?.includes(fileStr)) {
        throw new Error(`File ${fileStr} is forbidden`);
      }
      this.includeFiles[fileStr] = true;
    }
  }

  public getIncludes(excludeFile?: string): string[] {
    if (excludeFile) {
      delete this.includeFiles[this.normalize(excludeFile)];
    }
    return Object.keys(this.includeFiles).sort().map(str => `#include ${str}`);
  }

  public getNamespaceImports(): string[] {
    return [];
  }
}

export function genCommentLines(str?: string): string[] {
  return genCommentLinesWithCommentMarker("//", str);
}

export function genUnusedVariableProtection(variables: string[]): string[] {
  return variables.map(v => `(void)${v};`);
}

export function nsQualify(qualifiedName: string, inNamespace: string): string {
  const templateStartIdx = qualifiedName.indexOf("<");
  if (templateStartIdx >= 0) {
    const templateEndIdx = qualifiedName.indexOf(">", templateStartIdx);
    if (templateEndIdx >= 0) {
      const templateParam = qualifiedName.slice(templateStartIdx + 1, templateEndIdx);
      const typename = qualifiedName.slice(0, templateStartIdx);
      const namespaceStr = nsQualifyWithSeparator(nsSep, typename, inNamespace);
      const templateStr = nsQualifyWithSeparator(nsSep, templateParam, inNamespace);
      return `${namespaceStr}<${templateStr}${qualifiedName.slice(templateEndIdx)}`;
    }
  }
  return nsQualifyWithSeparator(nsSep, qualifiedName, inNamespace);
}

export function nsJoin(...names: string[]): string {
  return nsJoinWithSeparator(nsSep, names);
}

export function nsExtract(qualifiedName: string, nonNamespacePartCount = 0): string {
  return nsExtractWithSeparator(nsSep, qualifiedName, nonNamespacePartCount);
}

export function forwardDeclareClass(qualifiedName: string): string {
  const className = nsQualify(qualifiedName, EXCLUDE_NAMESPACE);
  const namespace = nsExtract(qualifiedName);
  if (namespace) {
    return `namespace ${namespace} { class ${className}; }`;
  } else {
    return `class ${className};`;
  }
}

export function constRef(type: string, byteSize: number): string {
  if (byteSize <= 8 || type.includes("*")) {
    return type;
  }
  return `const ${type}&`;
}

export function identifierName(name: string): string {
  return name;
}

export function privateMember(memberVarName: string): string {
  if (memberVarName.endsWith("_")) {
    // already private
    return memberVarName;
  }
  return memberVarName + "_";
}

export function methodMember(methodName: string): string {
  const parts = methodName.split(nsSep);
  parts[parts.length - 1] = lowerFirst(parts[parts.length - 1]);
  return parts.join(nsSep);
}

function genInitializer(values: unknown[]): string {
  return `{${values.join(", ")}}`
}

export function genPrimitiveValue(typename: string, value: string | boolean | number | null): string {
  if (value === null) {
    if (typename) {
      return `${typename}{}`;
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
    if (typename === "int" || typename === "int32_t" || typename === "uint32_t" || typename === "uint8_t") {
      return `${value}`;
    }
    if (typename === "uint64_t") {
      return `${value}ULL`;
    }
    if (typename === "float") {
      const valueStr = `${value}`;
      if (valueStr.includes(".")) {
        return valueStr + "f";
      }
      return valueStr + ".f";
    }
  }

  return `${typename}${genInitializer([value])}`;
}

function convertFieldValue(kv: [string, string | TypeValue]): string {
  return `${kv[1]}`;
}

export function genMultiValue(typename: string, _hasInitializerConstructor: boolean, valueStrings: [string, string][]): string {
  return `${typename}${genInitializer(valueStrings.map(convertFieldValue))}`;
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
  if (params.isStatic) {
    prefix += "static ";
  }
  if (params.isConst) {
    prefix += "constexpr ";
  }

  let initializer = params.initialValue instanceof EmptyValue ? "" : ` = ${params.initialValue.toString(params.inNamespace)}`;
  const typePrefix = ` = ${typename}`;
  if (initializer && initializer.startsWith(typePrefix + "{")) {
    initializer = initializer.slice(typePrefix.length);
  }
  return `${prefix}${typename} ${params.varName}${initializer}` + (params.includeTerminator ? ";" : "");
}

export function genSharedPointer(localType: string, includes: IncludeAggregator | null): string {
  includes?.addFile({
    filename: "<memory>",
    typename: "std::shared_ptr",
  });
  return `std::shared_ptr<${localType}>`;
}

export function genPointer(localType: string): string {
  return `${localType}*`;
}

export function reinterpretValue(fromType: string, toType: string, value: TypeValue): string {
  return `${XRPA_NAMESPACE}::reinterpretValue<${toType}, ${fromType}>(${value})`;
}

export function getDataStoreName(apiname: string): string {
  if (apiname === XRPA_NAMESPACE) {
    return XRPA_NAMESPACE;
  }
  return apiname ? `${apiname}DataStore` : "";
}

export function getDataStoreHeaderName(apiname: string): string {
  return apiname ? `${getDataStoreName(apiname)}.h` : "";
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
  return apiname ? `${apiname}Types.h` : "";
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
    parameters: [{ name: "memAccessor", type: getXrpaTypes().MemoryAccessor }],
    body: [],
    superClassInitializers: ["memAccessor"],
  });

  if (isWriteAccessor && !isMessageStruct) {
    classSpec.methods.push({
      name: "create",
      parameters: [{
        name: "accessor",
        type: getXrpaTypes().TransportStreamAccessor.getLocalType(classSpec.namespace, classSpec.includes) + "*",
      }, {
        name: "collectionId",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "id",
        type: constRef(objectUuidType, 16),
      }, {
        name: "changeByteCount",
        type: PRIMITIVE_INTRINSICS.uint32.typename,
      }, {
        name: "timestamp",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      returnType: classSpec.name,
      body: [
        `auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionChangeEventAccessor>(Xrpa::CollectionChangeType::CreateObject, changeByteCount, timestamp);`,
        `changeEvent.setCollectionId(collectionId);`,
        `changeEvent.setObjectId(id);`,
        `return ${classSpec.name}(changeEvent.accessChangeData());`,
      ],
      isStatic: true,
      visibility: "public",
    });

    classSpec.methods.push({
      name: "update",
      parameters: [{
        name: "accessor",
        type: getXrpaTypes().TransportStreamAccessor.getLocalType(classSpec.namespace, classSpec.includes) + "*",
      }, {
        name: "collectionId",
        type: PRIMITIVE_INTRINSICS.int32.typename,
      }, {
        name: "id",
        type: constRef(objectUuidType, 16),
      }, {
        name: "fieldsChanged",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }, {
        name: "changeByteCount",
        type: PRIMITIVE_INTRINSICS.uint32.typename,
      }],
      returnType: classSpec.name,
      body: [
        `auto changeEvent = accessor->writeChangeEvent<Xrpa::CollectionUpdateChangeEventAccessor>(Xrpa::CollectionChangeType::UpdateObject, changeByteCount);`,
        `changeEvent.setCollectionId(collectionId);`,
        `changeEvent.setObjectId(id);`,
        `changeEvent.setFieldsChanged(fieldsChanged);`,
        `return ${classSpec.name}(changeEvent.accessChangeData());`,
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
    });

    return privateMember("writeOffset");
  } else {
    classSpec.members.push({
      name: "readOffset",
      type: getXrpaTypes().MemoryOffset,
      visibility: "private",
    });

    return privateMember("readOffset");
  }
}

export function genEventHandlerType(paramTypes: string[], includes: IncludeAggregator | null): string {
  includes?.addFile({ filename: "<functional>" });
  return `std::function<void(${paramTypes.join(", ")})>`;
}

export function genEventHandlerCall(handler: string, paramValues: string[], handlerCanBeNull: boolean): string {
  if (handlerCanBeNull) {
    return `if (${handler}) { ${handler}(${paramValues.join(", ")}); }`;
  } else {
    return `${handler}(${paramValues.join(", ")});`;
  }
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
  let indentLevel = 0;
  if (handlerCanBeNull) {
    lines.push(`if (${msgHandler}) {`);
    indentLevel = 1;
  }
  if (typeIsSignalData(params.fieldType)) {
    const msgParams = [timestamp, "messageData"];
    lines.push(
      ...indent(indentLevel, [
        `${msgHandler}->onSignalData(${msgParams.join(", ")});`,
      ]),
    );
  } else if (!params.fieldType.hasFields()) {
    lines.push(
      ...indent(indentLevel, [
        `${msgHandler}(${timestamp});`,
      ]),
    );
  } else {
    const prelude: string[] = [];
    const msgParams = [timestamp].concat(params.msgDataToParams(params.fieldType, prelude, params.includes));
    lines.push(
      ...indent(indentLevel, [
        ...((params.convertToReadAccessor) ? [
          `auto message = ${params.fieldType.getReadAccessorType(params.namespace, params.includes)}(messageData);`,
        ] : []),
        ...prelude,
        `${msgHandler}(${msgParams.join(", ")});`,
      ]),
    );
  }

  if (handlerCanBeNull) {
    lines.push(`}`);
  }
  return lines;
}

function paramsToString(classSpec: ClassSpec, parameters: MethodParam[], mode: ClassGenMode): string {
  return parameters.map((p) => {
    const suffix = (p.defaultValue && !isSourceMode(mode)) ? ` = ${p.defaultValue}` : "";
    if (typeof p.type === "string") {
      return `${p.type} ${p.name}${suffix}`;
    } else {
      return `${p.type.declareLocalParam(classSpec.namespace, classSpec.includes, p.name)}${suffix}`;
    }
  }).join(", ");
}

function initializersToString(initializers: [string, string]): string {
  return `${privateMember(initializers[0])}(${initializers[1]})`;
}

enum ClassGenMode {
  ALL,
  HEADER,
  SOURCE,
  SOURCE_INLINE,
}

function isSourceMode(mode: ClassGenMode): boolean {
  return mode === ClassGenMode.SOURCE || mode === ClassGenMode.SOURCE_INLINE;
}

function genClassDefinitionConstructors(classSpec: ClassSpec, includes: IncludeAggregator | null, visibilityFilter: string, mode: ClassGenMode): string[] {
  const lines: string[] = [];

  const namePrefix = isSourceMode(mode) ? `${classSpec.name}::` : "";

  for (const def of classSpec.constructors) {
    const visibility = def.visibility || "public";
    if (visibilityFilter !== visibility) {
      continue;
    }
    if (!def.separateImplementation && isSourceMode(mode)) {
      continue;
    }

    const params = paramsToString(classSpec, def.parameters ?? [], mode);
    const initializers: string[] = [];
    if (classSpec.superClass && def.superClassInitializers) {
      initializers.push(`${classSpec.superClass}(${def.superClassInitializers.join(", ")})`);
    }
    initializers.push(...def.memberInitializers?.map(initializersToString) ?? []);
    const initializersStr = initializers.length > 0 ? ` : ${initializers.join(", ")}` : "";
    const prefix = isSourceMode(mode) ? "" : (def.parameters?.length === 1 ? "explicit " : "");
    const decl = `${prefix}${namePrefix}${classSpec.name}(${params})`;

    if (!isSourceMode(mode)) {
      lines.push(
        ...(def.decorations ?? []),
      );
    }

    if (def.separateImplementation && mode === ClassGenMode.HEADER) {
      lines.push(`${decl};`);
    } else {
      const body = resolveThunkWithParam(def.body ?? [], includes);
      if (body.length === 0) {
        lines.push(
          `${decl}${initializersStr} {}`,
        );
      } else {
        lines.push(
          `${decl}${initializersStr} {`,
          ...indent(1, body),
          `}`,
        );
      }
    }

    lines.push(``);
  }

  const hasDestructor = Boolean(classSpec.virtualDestructor || classSpec.destructorBody);
  if (hasDestructor && !isSourceMode(mode) && visibilityFilter === "public") {
    const destructorBody = resolveThunkWithParam(classSpec.destructorBody ?? [], includes);
    const prefix = classSpec.virtualDestructor ? "virtual " : "";
    if (destructorBody.length === 0) {
      lines.push(
        `${prefix}~${classSpec.name}() = default;`,
        ``,
      );
    } else {
      lines.push(
        `${prefix}~${classSpec.name}() {`,
        ...indent(1, destructorBody),
        `}`,
        ``,
      );
    }
  }

  return lines;
}

function genClassDefinitionMethods(classSpec: ClassSpec, includes: IncludeAggregator | null, visibilityFilter: string, mode: ClassGenMode): string[] {
  const lines: string[] = [];

  const namePrefix = isSourceMode(mode) ? `${classSpec.name}::` : "";

  for (const def of classSpec.methods) {
    const visibility = def.visibility || "public";
    if (visibilityFilter !== visibility) {
      continue;
    }
    if ((!def.separateImplementation || def.isAbstract) && isSourceMode(mode)) {
      continue;
    }

    let prefix = "";
    let suffix = "";
    let isInline = false;
    if (!isSourceMode(mode)) {
      if (def.isVirtual || def.isAbstract) {
        prefix += "virtual ";
      } else {
        if (def.isStatic) {
          prefix += "static ";
        }
        if (def.isInline) {
          isInline = true;
        }
      }
    } else if (mode === ClassGenMode.SOURCE_INLINE) {
      isInline = true;
    }

    if (def.noDiscard) {
      prefix += "[[nodiscard]] ";
    }
    if (isInline) {
      prefix += "inline ";
    }
    if (def.isConst) {
      suffix += " const";
    }

    if (!isSourceMode(mode)) {
      if (def.isOverride) {
        suffix += " override";
      }
      if (def.isFinal) {
        suffix += " final";
      }
    }

    const params = paramsToString(classSpec, def.parameters ?? [], mode);
    const decl = `${prefix}${def.returnType ?? "void"} ${namePrefix}${def.name}(${params})${suffix}`;

    if (!isSourceMode(mode)) {
      lines.push(
        ...(def.decorations ?? []),
      );
    }

    lines.push(
      ...(def.templateParams ? [`template <${def.templateParams.map(p => `typename ${p}`).join(", ")}>`] : []),
    );

    if (def.separateImplementation && mode === ClassGenMode.HEADER) {
      lines.push(`${decl};`);
    } else {
      if (def.isAbstract) {
        lines.push(`${decl} = 0;`);
      } else {
        const body = resolveThunkWithParam(def.body, includes);
        lines.push(
          `${decl} {`,
          ...indent(1, body),
          `}`,
        );
      }
    }
    lines.push(``);
  }

  return lines;
}

function genClassDefinitionMembers(classSpec: ClassSpec, includes: IncludeAggregator | null, visibilityFilter: string, mode: ClassGenMode): string[] {
  const lines: string[] = [];

  if (!isSourceMode(mode)) {
    for (const def of classSpec.members) {
      const visibility = def.visibility || "public";
      if (visibilityFilter !== visibility) {
        continue;
      }

      if (def.decorations?.length) {
        lines.push(
          ``,
          ...def.decorations,
        );
      }

      const varName = visibility === "public" ? def.name : privateMember(def.name);
      const typename = typeof def.type === "string" ? def.type : def.type.getLocalType(classSpec.namespace, includes);
      const initialValue = typeof def.type === "string" ? def.initialValue : def.type.getLocalDefaultValue(classSpec.namespace, includes, false, def.initialValue);

      lines.push(
        genDeclaration({
          typename,
          inNamespace: classSpec.namespace,
          varName,
          includeTerminator: true,
          initialValue: initialValue ?? new EmptyValue(module.exports, typename, classSpec.namespace),
          isStatic: def.isStatic,
          isConst: def.isConst,
        }),
      );

      if (def.decorations?.length) {
        lines.push(
          ``,
        );
      }
    }
  }

  if (lines.length) {
    lines.push(``);
  }

  return lines;
}

function genClassDefinitionPublic(classSpec: ClassSpec, includes: IncludeAggregator | null, mode: ClassGenMode): string[] {
  const lines = [
    ...genClassDefinitionConstructors(classSpec, includes, "public", mode),
    ...genClassDefinitionMembers(classSpec, includes, "public", mode),
    ...genClassDefinitionMethods(classSpec, includes, "public", mode),
  ];
  if (lines.length && !isSourceMode(mode)) {
    return [
      ` public:`,
      ...indent(1, lines),
    ];
  }
  return lines;
}

function genClassDefinitionProtected(classSpec: ClassSpec, includes: IncludeAggregator | null, mode: ClassGenMode): string[] {
  const lines = [
    ...genClassDefinitionConstructors(classSpec, includes, "protected", mode),
    ...genClassDefinitionMethods(classSpec, includes, "protected", mode),
    ...genClassDefinitionMembers(classSpec, includes, "protected", mode),
  ];
  if (lines.length && !isSourceMode(mode)) {
    return [
      ` protected:`,
      ...indent(1, lines),
    ];
  }
  return lines;
}

function genClassDefinitionPrivate(classSpec: ClassSpec, includes: IncludeAggregator | null, mode: ClassGenMode): string[] {
  const lines = [
    ...genClassDefinitionConstructors(classSpec, includes, "private", mode),
    ...genClassDefinitionMethods(classSpec, includes, "private", mode),
    ...genClassDefinitionMembers(classSpec, includes, "private", mode),
  ];
  if (lines.length && !isSourceMode(mode)) {
    return [
      ` private:`,
      ...indent(1, lines),
    ];
  }
  return lines;
}

function genClassHeaderDefinitionInternal(classSpec: ClassSpec, mode: ClassGenMode): string[] {
  const extStr = classSpec.superClass ? `: public ${classSpec.superClass} ` : "";
  const classNameDecorationStr = classSpec.classNameDecoration ? `${classSpec.classNameDecoration} ` : "";

  return removeSuperfluousEmptyLines([
    ...classSpec.decorations,
    ...(classSpec.templateParams ? [`template <${classSpec.templateParams.map(p => `typename ${p}`).join(", ")}>`] : []),
    `class ${classNameDecorationStr}${classSpec.name} ${extStr}{`,
    ...indent(1, classSpec.classEarlyInject),
    ...(classSpec.classEarlyInject.length ? [""] : []),
    ...trimTrailingEmptyLines([
      ...genClassDefinitionPublic(classSpec, classSpec.includes, mode),
      ...genClassDefinitionProtected(classSpec, classSpec.includes, mode),
      ...genClassDefinitionPrivate(classSpec, classSpec.includes, mode),
    ]),
    `};`,
    ``,
  ]);
}

export function genClassDefinition(classSpec: ClassSpec): string[] {
  return genClassHeaderDefinitionInternal(classSpec, ClassGenMode.ALL);
}

export function genClassHeaderDefinition(classSpec: ClassSpec): string[] {
  return genClassHeaderDefinitionInternal(classSpec, ClassGenMode.HEADER);
}

export function genClassSourceDefinition(classSpec: ClassSpec, includes: IncludeAggregator | null, forceInline = false): string[] {
  const mode = forceInline ? ClassGenMode.SOURCE_INLINE : ClassGenMode.SOURCE;
  return removeSuperfluousEmptyLines([
    ...genClassDefinitionPublic(classSpec, includes, mode),
    ...genClassDefinitionProtected(classSpec, includes, mode),
    ...genClassDefinitionPrivate(classSpec, includes, mode),
  ]);
}

export function genReadValue(params: {
  accessor: string;
  accessorIsStruct: boolean;
  fieldOffsetVar: string;
  memAccessorVar: string;
}): string {
  if (params.accessorIsStruct) {
    return `${params.accessor}::readValue(${params.memAccessorVar}, ${params.fieldOffsetVar})`;
  } else {
    return `${params.memAccessorVar}.readValue<${params.accessor}>(${params.fieldOffsetVar})`;
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
    return `${params.accessor}::writeValue(${params.value}, ${params.memAccessorVar}, ${params.fieldOffsetVar})`;
  } else {
    return `${params.memAccessorVar}.writeValue<${params.accessor}>(${params.value}, ${params.fieldOffsetVar})`;
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
    return `${params.accessor}::dynSizeOfValue(${params.value})`;
  } else {
    return `${getXrpaTypes().MemoryAccessor.getLocalType(params.inNamespace, params.includes)}::dynSizeOfValue<${params.accessor}>(${params.value})`;
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

  const localTypeStr = params.localType.getLocalType(classSpec.namespace, classSpec.includes);
  const initializerValues: string[] = [];
  for (const name in params.fieldsToLocal) {
    const v = params.fieldsToLocal[name];
    // apply std::move to v if it is a dynamic value
    if (params.fieldTypes[name]?.typeSize.dynamicSizeEstimate) {
      classSpec.includes?.addFile({ filename: "<utility>" });
      initializerValues.push(`std::move(${v})`);
    } else {
      initializerValues.push(`${v}`);
    }
  }
  const localInitializer = genInitializer(initializerValues);
  let localReturn = `${localTypeStr}${localInitializer}`;
  if (initializerValues.length === 1 && localTypeStr === "float") {
    localReturn = localInitializer.slice(1, -1);
  }

  classSpec.methods.push({
    name: "readValue",
    returnType: localTypeStr,
    parameters: [{
      name: "memAccessor",
      type: getXrpaTypes().MemoryAccessor,
    }, {
      name: "offset",
      type: `${getXrpaTypes().MemoryOffset.getLocalType(classSpec.namespace, classSpec.includes)}&`,
    }],
    isStatic: true,
    body: [
      ...fieldReads,
      `return ${localReturn};`,
    ],
  });

  classSpec.methods.push({
    name: "writeValue",
    parameters: [{
      name: params.localValueParamName,
      type: params.localType,
    }, {
      name: "memAccessor",
      type: getXrpaTypes().MemoryAccessor,
    }, {
      name: "offset",
      type: `${getXrpaTypes().MemoryOffset.getLocalType(classSpec.namespace, classSpec.includes)}&`,
    }],
    isStatic: true,
    body: fieldWrites,
  });

  if (dynFieldSizes.length > 0) {
    classSpec.methods.push({
      name: "dynSizeOfValue",
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
    `enum class ${enumName}: uint32_t {`,
    ...indent(1, Object.keys(enumValues).map(v => `${v} = ${enumValues[v]},`)),
    `};`,
  ];
}

export function genEnumDynamicConversion(targetTypename: string, value: TypeValue): string {
  return `static_cast<${targetTypename}>(${value})`;
}

export function getNullValue(): string {
  return "nullptr";
}

export function genReferencePtrToID(varName: string, objectUuidType: string): string {
  return `${varName}.get() ? ${varName}->getXrpaId() : ${objectUuidType}()`;
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
  const funcName = `get${upperFirst(params.fieldName)}`;
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
      body: includes => {
        return [
          `return ${fieldType.convertValueToLocal(classSpec.namespace, includes, fieldVar)};`,
        ];
      },
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
  const funcName = `set${upperFirst(params.fieldName)}`;
  const paramType = isRef ? (params.fieldType as ReferenceType).objectUuidType : params.fieldType;

  classSpec.methods.push({
    name: funcName,
    parameters: [{
      name: "value",
      type: paramType,
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
    name: `check${upperFirst(params.fieldName)}Changed`,
    returnType: "bool",
    parameters: [{
      name: "fieldsChanged",
      type: "uint64_t",
    }],
    visibility: params.visibility,
    isConst: true,
    isInline: true,
    body: [
      `return fieldsChanged & ${params.parentType.getFieldBitMask(params.fieldName)};`,
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
  return `${params.objectUuidType}(${params.guidGen.code})`;
}

export function genDeref(ptrName: string, memberName: string): string {
  if (!ptrName) {
    return memberName;
  }
  return `${ptrName}->${memberName}`;
}

export function genDerefMethodCall(ptrName: string, methodName: string, params: string[]): string {
  const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
  if (!ptrName) {
    return methodCall;
  }
  return `${ptrName}->${methodCall}`;
}

export function genMethodCall(varName: string, methodName: string, params: string[]): string {
  const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
  if (!varName) {
    return methodCall;
  }
  return `${varName}.${methodCall}`;
}

export function genMethodBind(ptrName: string, methodName: string, params: Record<string, string[]>, ignoreParamCount: number): string {
  const bindParams = (new Array<string>(ignoreParamCount)).fill("auto").concat(Object.keys(params).map(p => `auto ${p}`));
  const methodCall = `${methodMember(methodName)}(${collapse(Object.values(params)).join(", ")})`;
  if (!ptrName) {
    return `[this](${bindParams.join(", ")}) { ${methodCall}; }`;
  }
  return `[${ptrName}](${bindParams.join(", ")}) { ${ptrName}->${methodCall}; }`;
}

export function genPassthroughMethodBind(methodName: string, paramCount: number): string {
  const paramNames = (new Array<string>(paramCount)).fill("_").map((_, i) => `p${i}`);
  const bindParams = paramNames.map(p => `auto ${p}`);
  return `[this](${bindParams.join(", ")}) { ${methodMember(methodName)}(${paramNames.join(", ")}); }`;
}

export function genNonNullCheck(ptrName: string): string {
  return ptrName;
}

export function genCreateObject(type: string, params: string[]): string {
  return `std::make_shared<${type}>(${params.join(", ")})`;
}

export function genObjectPtrType(type: string): string {
  return `std::shared_ptr<${type}>`;
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

export function conditional(condition: string, code: string[], elseCode?: string[]): string[] {
  return [
    `if (${condition}) {`,
    ...indent(1, code),
    `}${elseCode ? ` else {` : ""}`,
    ...(elseCode ? [
      ...indent(1, elseCode),
      `}`,
    ] : []),
  ];
}

export function declareVar(varName: string, typename: string, initialValue: TypeValue): string {
  typename = typename || "auto";
  return `${typename} ${varName} = ${initialValue};`;
}
