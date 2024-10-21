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

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refParam = exports.genObjectPtrType = exports.genCreateObject = exports.genNonNullCheck = exports.genMethodBind = exports.genDerefMethodCall = exports.genDeref = exports.genRuntimeGuid = exports.injectGeneratedTag = exports.genFieldChangedCheck = exports.genFieldSetter = exports.genFieldGetter = exports.genReferencePtrToID = exports.getNullValue = exports.genEnumDynamicConversion = exports.genEnumDefinition = exports.genReadWriteValueFunctions = exports.genWriteValue = exports.genReadValue = exports.genClassDefinition = exports.makeObjectAccessor = exports.getTypesHeaderName = exports.getDataStoreHeaderName = exports.getDataStoreName = exports.reinterpretValue = exports.genPointer = exports.genDeclaration = exports.genMultiValue = exports.genPrimitiveValue = exports.methodMember = exports.privateMember = exports.constRef = exports.nsExtract = exports.nsJoin = exports.nsQualify = exports.genCommentLines = exports.CsIncludeAggregator = exports.DEFAULT_INTERFACE_PTR_TYPE = exports.GET_CURRENT_CLOCK_TIME = exports.PRIMITIVE_INTRINSICS = exports.UNIT_TRANSFORMER = exports.HEADER = exports.XRPA_NAMESPACE = exports.registerXrpaTypes = void 0;
const assert_1 = __importDefault(require("assert"));
const Helpers_1 = require("../../shared/Helpers");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
let gXrpaTypes = null;
function registerXrpaTypes(types) {
    gXrpaTypes = types;
}
exports.registerXrpaTypes = registerXrpaTypes;
exports.XRPA_NAMESPACE = "Xrpa";
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
exports.HEADER = [
    COPYRIGHT_STRING,
    GENERATED_STRING,
    "",
];
exports.UNIT_TRANSFORMER = {
    angular: {
        radian: {
            degree: [" * 180f / Math.PI", 180 / Math.PI],
        },
        degree: {
            radian: [" * Math.PI / 180f", Math.PI / 180],
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
exports.PRIMITIVE_INTRINSICS = {
    string: { typename: "string" },
    microseconds: { typename: "ulong" },
    uint8: { typename: "byte" },
    uint64: { typename: "ulong" },
    int: { typename: "int" },
    int32: { typename: "int" },
    uint32: { typename: "uint" },
    float32: { typename: "float" },
    bool: { typename: "bool" },
};
exports.GET_CURRENT_CLOCK_TIME = `${exports.XRPA_NAMESPACE}.DatasetAccessor.GetCurrentClockTimeMicroseconds()`;
exports.DEFAULT_INTERFACE_PTR_TYPE = "bare";
const nsSep = ".";
class CsIncludeAggregator {
    constructor(namespaces) {
        this.importNamespaces = {};
        if (namespaces) {
            for (const namespace of namespaces) {
                this.addFile({ namespace });
            }
        }
    }
    addFile(params) {
        if (params.typename && !params.namespace) {
            params.namespace = nsExtract(params.typename);
        }
        if (params.namespace) {
            this.importNamespaces[params.namespace] = true;
        }
    }
    getIncludes() {
        return [];
    }
    getNamespaceImports(excludeNamespace) {
        if (excludeNamespace) {
            delete this.importNamespaces[excludeNamespace];
        }
        return Object.keys(this.importNamespaces).sort().map(ns => `using ${ns};`);
    }
}
exports.CsIncludeAggregator = CsIncludeAggregator;
function genCommentLines(str) {
    return (0, Helpers_1.genCommentLinesWithCommentMarker)("//", str);
}
exports.genCommentLines = genCommentLines;
function nsQualify(qualifiedName, inNamespace) {
    return (0, Helpers_1.nsQualifyWithSeparator)(nsSep, qualifiedName, inNamespace);
}
exports.nsQualify = nsQualify;
function nsJoin(...names) {
    return (0, Helpers_1.nsJoinWithSeparator)(nsSep, names);
}
exports.nsJoin = nsJoin;
function nsExtract(qualifiedName, nonNamespacePartCount = 0) {
    return (0, Helpers_1.nsExtractWithSeparator)(nsSep, qualifiedName, nonNamespacePartCount);
}
exports.nsExtract = nsExtract;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function constRef(type, _byteSize) {
    return type;
}
exports.constRef = constRef;
function privateMember(memberVarName) {
    if (memberVarName.startsWith("_")) {
        // already private
        return memberVarName;
    }
    return "_" + memberVarName;
}
exports.privateMember = privateMember;
function methodMember(methodName) {
    return (0, Helpers_1.upperFirst)(methodName);
}
exports.methodMember = methodMember;
function genInitializer(values) {
    return `{${values.join(", ")}}`;
}
function genPrimitiveValue(typename, value) {
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
        value = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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
exports.genPrimitiveValue = genPrimitiveValue;
function convertFieldValueInitializer(kv) {
    return `${kv[1]}`;
}
function convertFieldValue(kv) {
    if (!kv[0]) {
        return `${kv[1]}`;
    }
    return `${kv[0]} = ${kv[1]}`;
}
function genMultiValue(typename, hasInitializerConstructor, valueStrings) {
    return `new ${typename}${genInitializer(valueStrings.map(hasInitializerConstructor ? convertFieldValueInitializer : convertFieldValue))}`;
}
exports.genMultiValue = genMultiValue;
function genDeclaration(params) {
    const typename = nsQualify(params.typename, params.inNamespace);
    let prefix = "";
    if (params.isStatic && params.isConst) {
        prefix += "const ";
    }
    else if (params.isStatic) {
        prefix += "static ";
    }
    else if (params.isConst) {
        prefix += "readonly ";
    }
    const initializer = params.initialValue instanceof TypeValue_1.EmptyValue ? "" : ` = ${params.initialValue.toString(params.inNamespace)}`;
    return `${prefix}${typename} ${params.varName}${initializer}` + (params.includeTerminator ? ";" : "");
}
exports.genDeclaration = genDeclaration;
function genPointer(ptrType, localType) {
    switch (ptrType) {
        case "bare":
            return `${localType}`;
    }
    throw new Error(`Invalid ptrType: ${ptrType}`);
}
exports.genPointer = genPointer;
function reinterpretValue(_fromType, _toType, value) {
    return `${value}`;
}
exports.reinterpretValue = reinterpretValue;
function getDataStoreName(apiname) {
    if (apiname === exports.XRPA_NAMESPACE) {
        return exports.XRPA_NAMESPACE;
    }
    return apiname ? `${apiname}DataStore` : "";
}
exports.getDataStoreName = getDataStoreName;
function getDataStoreHeaderName(apiname) {
    return apiname ? `${getDataStoreName(apiname)}.cs` : "";
}
exports.getDataStoreHeaderName = getDataStoreHeaderName;
function getTypesHeaderName(apiname) {
    return apiname ? `${apiname}Types.cs` : "";
}
exports.getTypesHeaderName = getTypesHeaderName;
function makeObjectAccessor(classSpec, isWriteAccessor, dsIdentifierType) {
    (0, assert_1.default)(gXrpaTypes, "Expected Xrpa types to be registered");
    if (!classSpec.superClass) {
        classSpec.superClass = gXrpaTypes.ObjectAccessorInterface.getLocalType(classSpec.namespace, classSpec.includes);
    }
    classSpec.constructors.push({});
    classSpec.constructors.push({
        parameters: [{ name: "memAccessor", type: gXrpaTypes.MemoryAccessor.getLocalType(classSpec.namespace, classSpec.includes) }],
        body: ["SetAccessor(memAccessor);"],
    });
    if (isWriteAccessor) {
        classSpec.methods.push({
            name: "Create",
            parameters: [{
                    name: "accessor",
                    type: gXrpaTypes.DatasetAccessor,
                }, {
                    name: "id",
                    type: dsIdentifierType,
                }, {
                    name: "changeByteCount",
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "timestamp",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
                }],
            returnType: classSpec.name,
            body: [
                `var changeEvent = accessor.WriteChangeEvent<Xrpa.DSCollectionChangeEventAccessor>((int)Xrpa.DSChangeType.CreateObject, changeByteCount, timestamp);`,
                `changeEvent.SetCollectionId(DS_TYPE);`,
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
                    type: gXrpaTypes.DatasetAccessor,
                }, {
                    name: "id",
                    type: dsIdentifierType,
                }, {
                    name: "fieldsChanged",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
                }, {
                    name: "changeByteCount",
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }],
            returnType: classSpec.name,
            body: [
                `var changeEvent = accessor.WriteChangeEvent<Xrpa.DSCollectionUpdateChangeEventAccessor>((int)Xrpa.DSChangeType.UpdateObject, changeByteCount);`,
                `changeEvent.SetCollectionId(DS_TYPE);`,
                `changeEvent.SetObjectId(id);`,
                `changeEvent.SetFieldsChanged(fieldsChanged);`,
                `return new ${classSpec.name}(changeEvent.AccessChangeData());`,
            ],
            isStatic: true,
            visibility: "public",
        });
    }
}
exports.makeObjectAccessor = makeObjectAccessor;
function paramsToString(classSpec, parameters) {
    return parameters.map((p) => {
        const suffix = p.defaultValue ? ` = ${p.defaultValue}` : "";
        if (typeof p.type === "string") {
            return `${p.type} ${p.name}${suffix}`;
        }
        else {
            return `${p.type.declareLocalParam(classSpec.namespace, classSpec.includes, p.name)}${suffix}`;
        }
    }).join(", ");
}
function initializersToString(initializers) {
    return `${privateMember(initializers[0])} = ${initializers[1]};`;
}
function genClassDefinitionMembers(classSpec, includes) {
    const lines = [];
    for (const def of classSpec.members) {
        if (def.decorations?.length) {
            lines.push(``, ...def.decorations);
        }
        else if (def.getter) {
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
            initialValue: (def.getter ? undefined : initialValue) ?? new TypeValue_1.EmptyValue(module.exports, typename, classSpec.namespace),
            isStatic: def.isStatic,
            isConst: def.isConst,
        });
        if (def.getter) {
            lines.push(`${decl} {`, `  get => ${def.getter};`, ...((def.setter && def.setter.length) ? [
                `  set {`,
                ...(0, Helpers_1.indent)(2, def.setter),
                `  }`,
            ] : []), `}`, ``);
        }
        else {
            lines.push(`${decl};`);
        }
    }
    if (lines.length) {
        lines.push(``);
    }
    return lines;
}
function genClassDefinitionConstructors(classSpec, includes) {
    const lines = [];
    for (const def of classSpec.constructors) {
        const visibility = def.visibility || "public";
        const params = paramsToString(classSpec, def.parameters ?? []);
        const initializers = [];
        if (classSpec.superClass && def.superClassInitializers) {
            initializers.push(`base(${def.superClassInitializers.join(", ")})`);
        }
        const initializersStr = initializers.length > 0 ? ` : ${initializers.join(", ")}` : "";
        const decl = `${visibility} ${classSpec.name}(${params})${initializersStr}`;
        const body = typeof def.body === "function" ? def.body(includes) : (def.body ?? []);
        const allBodyLines = [
            ...(def.memberInitializers?.map(initializersToString) ?? []),
            ...body,
        ];
        lines.push(...(def.decorations ?? []));
        if (allBodyLines.length === 0) {
            lines.push(`${decl} {}`);
        }
        else {
            lines.push(...(def.decorations ?? []), `${decl} {`, ...(0, Helpers_1.indent)(1, allBodyLines), `}`);
        }
        lines.push(``);
    }
    if (classSpec.destructorBody) {
        const destructorBody = typeof classSpec.destructorBody === "function" ? classSpec.destructorBody(includes) : (classSpec.destructorBody ?? []);
        lines.push(`public void Dispose() {`, `  Dispose(true);`, `  GC.SuppressFinalize(this);`, `}`, ``, `protected virtual void Dispose(bool disposing) {`, ...(0, Helpers_1.indent)(1, destructorBody), `}`, ``, `~${classSpec.name}() {`, `  Dispose(false);`, `}`, ``);
    }
    return lines;
}
function genClassDefinitionMethods(classSpec, includes) {
    const lines = [];
    for (const def of classSpec.methods) {
        let prefix = def.visibility || "public";
        if (prefix === "private") {
            prefix = "";
        }
        else {
            prefix += " ";
        }
        if (def.isStatic) {
            prefix += "static ";
        }
        if (def.isOverride) {
            prefix += "override ";
        }
        else if (def.isAbstract) {
            prefix += "abstract ";
        }
        else if (def.isVirtual) {
            prefix += "virtual ";
        }
        const params = paramsToString(classSpec, def.parameters ?? []);
        const decl = `${prefix}${def.returnType ?? "void"} ${methodMember(def.name)}(${params})`;
        lines.push(...(def.decorations ?? []));
        if (def.isAbstract) {
            lines.push(`${decl};`);
        }
        else {
            const body = typeof def.body === "function" ? def.body(includes) : def.body;
            lines.push(`${decl} {`, ...(0, Helpers_1.indent)(1, body), `}`, ``);
        }
    }
    return lines;
}
function genClassDefinition(classSpec) {
    const classExtends = [];
    if (classSpec.superClass) {
        classExtends.push(classSpec.superClass);
    }
    if (classSpec.interfaceName) {
        classExtends.push(classSpec.interfaceName);
    }
    if (classSpec.destructorBody) {
        classExtends.push("IDisposable");
    }
    const extStr = classExtends.length > 0 ? `: ${classExtends.join(", ")} ` : "";
    const classNameDecorationStr = classSpec.classNameDecoration ? `${classSpec.classNameDecoration} ` : "";
    const classIsAbstract = classSpec.forceAbstract || classSpec.methods.filter(m => m.isAbstract).length > 0;
    const classTemplateParams = classSpec.templateParams ? `<${classSpec.templateParams.join(", ")}>` : "";
    return (0, Helpers_1.removeSuperfluousEmptyLines)([
        ...classSpec.decorations,
        `public ${classIsAbstract ? "abstract " : ""}class ${classNameDecorationStr}${classSpec.name}${classTemplateParams} ${extStr}{`,
        ...(0, Helpers_1.indent)(1, (0, Helpers_1.trimTrailingEmptyLines)([
            ...classSpec.classEarlyInject,
            ...genClassDefinitionMembers(classSpec, classSpec.includes),
            ...genClassDefinitionConstructors(classSpec, classSpec.includes),
            ...genClassDefinitionMethods(classSpec, classSpec.includes),
        ])),
        `}`,
        ``,
    ]);
}
exports.genClassDefinition = genClassDefinition;
function genReadValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.ReadValue(${params.memAccessorVar}, ${params.fieldOffset})`;
    }
    else {
        const maxBytes = params.accessorMaxBytes !== null ? `, ${params.accessorMaxBytes}` : "";
        return `${params.memAccessorVar}.Read${(0, Helpers_1.upperFirst)(params.accessor)}(${params.fieldOffset}${maxBytes})`;
    }
}
exports.genReadValue = genReadValue;
function genWriteValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.WriteValue(${params.value}, ${params.memAccessorVar}, ${params.fieldOffset})`;
    }
    else {
        const maxBytes = params.accessorMaxBytes !== null ? `, ${params.accessorMaxBytes}` : "";
        return `${params.memAccessorVar}.Write${(0, Helpers_1.upperFirst)(params.accessor)}(${params.value}, ${params.fieldOffset}${maxBytes})`;
    }
}
exports.genWriteValue = genWriteValue;
function genReadWriteValueFunctions(classSpec, params) {
    const fieldReads = [];
    const fieldWrites = [];
    for (const name in params.fieldTypes) {
        const field = params.fieldTypes[name];
        const readValue = genReadValue({
            accessor: field.accessor,
            accessorIsStruct: field.accessorIsStruct,
            accessorMaxBytes: field.accessorMaxBytes,
            fieldOffset: `offset + ${field.fieldOffsetName}`,
            memAccessorVar: "memAccessor",
        });
        const writeValue = genWriteValue({
            accessor: field.accessor,
            accessorIsStruct: field.accessorIsStruct,
            accessorMaxBytes: field.accessorMaxBytes,
            fieldOffset: `offset + ${field.fieldOffsetName}`,
            memAccessorVar: "memAccessor",
            value: params.fieldsFromLocal[name],
        });
        fieldReads.push(`${field.typename} ${name} = ${readValue};`);
        fieldWrites.push(`${writeValue};`);
    }
    const fieldsToLocal = (0, Helpers_1.arrayZip)(Object.keys(params.fieldsToLocal), Object.values(params.fieldsToLocal));
    const localInitializer = genInitializer(fieldsToLocal.map(params.localTypeHasInitializerConstructor ? convertFieldValueInitializer : convertFieldValue));
    const localTypeStr = params.localType.getLocalType(classSpec.namespace, classSpec.includes);
    let localReturn = `new ${localTypeStr}${localInitializer}`;
    if (Object.keys(params.fieldsToLocal).length === 1 && localTypeStr === "float") {
        localReturn = `${params.fieldsToLocal[Object.keys(params.fieldsToLocal)[0]]}`;
    }
    (0, assert_1.default)(gXrpaTypes, "Expected Xrpa types to be registered");
    classSpec.methods.push({
        name: "ReadValue",
        returnType: localTypeStr,
        parameters: [{
                name: "memAccessor",
                type: gXrpaTypes.MemoryAccessor,
            }, {
                name: "offset",
                type: "int",
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
                type: gXrpaTypes.MemoryAccessor,
            }, {
                name: "offset",
                type: "int",
            }],
        isStatic: true,
        body: fieldWrites,
    });
}
exports.genReadWriteValueFunctions = genReadWriteValueFunctions;
function genEnumDefinition(enumName, enumValues) {
    return [
        `public enum ${enumName} : uint {`,
        ...(0, Helpers_1.indent)(1, Object.keys(enumValues).map(v => `${v} = ${enumValues[v]},`)),
        `}`,
    ];
}
exports.genEnumDefinition = genEnumDefinition;
function genEnumDynamicConversion(targetTypename, value) {
    if (targetTypename === "uint") {
        return `(uint)(${value})`;
    }
    return `(${targetTypename})(uint)(${value})`;
}
exports.genEnumDynamicConversion = genEnumDynamicConversion;
function getNullValue() {
    return "null";
}
exports.getNullValue = getNullValue;
function genReferencePtrToID(varName, _ptrType, dsIdentifierType) {
    return `${varName}?.GetXrpaId() ?? new ${dsIdentifierType}()`;
}
exports.genReferencePtrToID = genReferencePtrToID;
function genFieldGetter(classSpec, params) {
    if (!(0, TypeDefinition_1.typeIsStateData)(params.fieldType)) {
        return;
    }
    const decorations = genCommentLines(params.description);
    const fieldVar = params.fieldToMemberVar(params.fieldName);
    const funcName = `Get${(0, Helpers_1.upperFirst)(params.fieldName)}`;
    const fieldType = params.fieldType;
    if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
        const returnType = fieldType.getReferencedSuperType(classSpec.namespace, classSpec.includes);
        classSpec.methods.push({
            decorations: decorations,
            name: funcName,
            returnType,
            parameters: [{
                    name: "datastore",
                    type: getDataStoreName(params.apiname),
                }],
            isConst: params.isConst,
            noDiscard: true,
            visibility: params.visibility,
            body: includes => {
                const body = [];
                const validLeafTypes = fieldType.getReferencedTypeList(classSpec.namespace, includes);
                for (const leafType of validLeafTypes) {
                    body.push(`datastore.GetObjectByID(${fieldVar}, out ${leafType} ${leafType}Val);`, `if (${leafType}Val != null) {`, `  return ${leafType}Val;`, `}`);
                }
                body.push(`return null;`);
                return body;
            },
        });
        classSpec.methods.push({
            decorations,
            name: `${funcName}Id`,
            returnType: fieldType.declareLocalReturnType(classSpec.namespace, classSpec.includes, !params.convertToLocal),
            isConst: params.isConst,
            visibility: params.visibility,
            body: [
                `return ${fieldVar};`,
            ],
        });
    }
    else if (params.convertToLocal) {
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
    }
    else {
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
exports.genFieldGetter = genFieldGetter;
function genFieldSetter(classSpec, params) {
    const isRef = (0, TypeDefinition_1.typeIsReference)(params.fieldType);
    classSpec.methods.push({
        name: `Set${(0, Helpers_1.upperFirst)(params.fieldName)}`,
        parameters: [{
                name: "value",
                type: isRef ? params.fieldType.dsIdentifierType : params.fieldType,
            }],
        body: includes => {
            const value = (params.convertFromLocal && !isRef) ? `${params.fieldType.convertValueFromLocal(classSpec.namespace, includes, "value")}` : "value";
            return [
                `${params.valueToMemberWrite(value)};`,
            ];
        },
    });
}
exports.genFieldSetter = genFieldSetter;
function genFieldChangedCheck(classSpec, params) {
    classSpec.methods.push({
        name: `Check${(0, Helpers_1.upperFirst)(params.fieldName)}Changed`,
        returnType: "bool",
        parameters: [{
                name: "fieldsChanged",
                type: "ulong",
            }],
        visibility: params.visibility,
        isConst: true,
        isInline: true,
        body: includes => [
            `return (fieldsChanged & ${params.parentType.getChangedBit(classSpec.namespace, includes, params.fieldName)}) != 0;`,
        ],
    });
}
exports.genFieldChangedCheck = genFieldChangedCheck;
function injectGeneratedTag(fileData) {
    const fileStr = fileData.toString("utf8");
    if (fileStr.startsWith(COPYRIGHT_STRING)) {
        const idx = fileStr.indexOf("\n") + 1;
        return Buffer.from(fileStr.slice(0, idx) + GENERATED_STRING + "\n" + fileStr.slice(idx));
    }
    return Buffer.from(GENERATED_STRING + "\n" + fileStr);
}
exports.injectGeneratedTag = injectGeneratedTag;
function genRuntimeGuid(params) {
    if (params.idParts) {
        return `new ${params.dsIdentifierType}(${params.idParts.join(", ")})`;
    }
    for (const entry of params.guidGen.includes ?? []) {
        params.includes?.addFile(entry);
    }
    return `new ${params.dsIdentifierType}(${params.guidGen.code})`;
}
exports.genRuntimeGuid = genRuntimeGuid;
function genDeref(ptrName, memberName) {
    return `${ptrName}.${memberName}`;
}
exports.genDeref = genDeref;
function genDerefMethodCall(ptrName, methodName, params) {
    const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
    if (!ptrName) {
        return methodCall;
    }
    return `${ptrName}.${methodCall}`;
}
exports.genDerefMethodCall = genDerefMethodCall;
function genMethodBind(ptrName, methodName, params, bindParamCount) {
    const bindParams = new Array(bindParamCount).fill("_");
    const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
    if (!ptrName) {
        return `(${bindParams.join(", ")}) => ${methodCall}`;
    }
    return `(${bindParams.join(", ")}) => ${ptrName}.${methodCall}`;
}
exports.genMethodBind = genMethodBind;
function genNonNullCheck(ptrName) {
    return `${ptrName} != null`;
}
exports.genNonNullCheck = genNonNullCheck;
function genCreateObject(type, params) {
    return `new ${type}(${params.join(", ")})`;
}
exports.genCreateObject = genCreateObject;
function genObjectPtrType(type) {
    return type;
}
exports.genObjectPtrType = genObjectPtrType;
function refParam(varName) {
    return `ref ${varName}`;
}
exports.refParam = refParam;
//# sourceMappingURL=CsharpCodeGenImpl.js.map
