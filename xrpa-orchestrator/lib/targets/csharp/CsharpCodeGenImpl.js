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
exports.genRuntimeGuid = exports.injectGeneratedTag = exports.genFieldChangedCheck = exports.genFieldSetter = exports.genFieldGetter = exports.genReferencePtrToID = exports.getNullValue = exports.genEnumDynamicConversion = exports.genEnumDefinition = exports.sanitizeEnumNames = exports.genReadWriteValueFunctions = exports.genDynSizeOfValue = exports.genWriteValue = exports.genReadValue = exports.genClassDefinition = exports.genMessageDispatch = exports.genEventHandlerCall = exports.genEventHandlerType = exports.makeObjectAccessor = exports.getTypesHeaderNamespace = exports.getTypesHeaderName = exports.getDataStoreClass = exports.getDataStoreHeaderNamespace = exports.getDataStoreHeaderName = exports.getDataStoreName = exports.reinterpretValue = exports.genPointer = exports.genSharedPointer = exports.genDeclaration = exports.genMultiValue = exports.genPrimitiveValue = exports.methodMember = exports.privateMember = exports.identifierName = exports.constRef = exports.nsExtract = exports.nsJoin = exports.nsQualify = exports.genCommentLines = exports.CsIncludeAggregator = exports.DEFAULT_INTERFACE_PTR_TYPE = exports.genGetCurrentClockTime = exports.HAS_NATIVE_PRIMITIVE_TYPES = exports.STMT_TERM = exports.PRIMITIVE_INTRINSICS = exports.UNIT_TRANSFORMER = exports.HEADER = exports.XRPA_NAMESPACE = exports.getXrpaTypes = exports.registerXrpaTypes = void 0;
exports.declareVar = exports.ifEquals = exports.ifAllBitsAreSet = exports.ifAnyBitIsSet = exports.applyTemplateParams = exports.genConvertIntToBool = exports.genConvertBoolToInt = exports.genObjectPtrType = exports.genCreateObject = exports.genNonNullCheck = exports.genPassthroughMethodBind = exports.genMethodBind = exports.genMethodCall = exports.genDerefMethodCall = exports.genDeref = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
// NOTE: do not import anything from ./
let gXrpaTypes = null;
function registerXrpaTypes(types) {
    gXrpaTypes = types;
}
exports.registerXrpaTypes = registerXrpaTypes;
function getXrpaTypes() {
    (0, assert_1.default)(gXrpaTypes, "XrpaTypes not registered");
    return gXrpaTypes;
}
exports.getXrpaTypes = getXrpaTypes;
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
exports.PRIMITIVE_INTRINSICS = {
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
exports.STMT_TERM = ";";
exports.HAS_NATIVE_PRIMITIVE_TYPES = true;
function genGetCurrentClockTime(_includes, inNanoseconds = false) {
    if (inNanoseconds) {
        return `${exports.XRPA_NAMESPACE}.TimeUtils.GetCurrentClockTimeNanoseconds()`;
    }
    return `${exports.XRPA_NAMESPACE}.TimeUtils.GetCurrentClockTimeMicroseconds()`;
}
exports.genGetCurrentClockTime = genGetCurrentClockTime;
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
    return (0, xrpa_utils_1.genCommentLinesWithCommentMarker)("//", str);
}
exports.genCommentLines = genCommentLines;
function nsQualify(qualifiedName, inNamespace) {
    return (0, xrpa_utils_1.nsQualifyWithSeparator)(nsSep, qualifiedName, inNamespace);
}
exports.nsQualify = nsQualify;
function nsJoin(...names) {
    return (0, xrpa_utils_1.nsJoinWithSeparator)(nsSep, names);
}
exports.nsJoin = nsJoin;
function nsExtract(qualifiedName, nonNamespacePartCount = 0) {
    return (0, xrpa_utils_1.nsExtractWithSeparator)(nsSep, qualifiedName, nonNamespacePartCount);
}
exports.nsExtract = nsExtract;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function constRef(type, _byteSize) {
    return type;
}
exports.constRef = constRef;
function identifierName(name) {
    return name;
}
exports.identifierName = identifierName;
function privateMember(memberVarName) {
    if (memberVarName.startsWith("_")) {
        // already private
        return memberVarName;
    }
    return "_" + memberVarName;
}
exports.privateMember = privateMember;
function methodMember(methodName) {
    const parts = methodName.split(nsSep);
    parts[parts.length - 1] = (0, xrpa_utils_1.upperFirst)(parts[parts.length - 1]);
    return parts.join(nsSep);
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
function genSharedPointer(localType) {
    return `${localType}`;
}
exports.genSharedPointer = genSharedPointer;
function genPointer(localType) {
    return `${localType}`;
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
function getDataStoreHeaderNamespace(apiname) {
    return getDataStoreName(apiname);
}
exports.getDataStoreHeaderNamespace = getDataStoreHeaderNamespace;
function getDataStoreClass(apiname, inNamespace, includes) {
    const fullName = nsJoin(getDataStoreHeaderNamespace(apiname), getDataStoreName(apiname));
    includes?.addFile({ filename: getDataStoreHeaderName(apiname), typename: fullName });
    return nsQualify(fullName, inNamespace);
}
exports.getDataStoreClass = getDataStoreClass;
function getTypesHeaderName(apiname) {
    return apiname ? `${apiname}Types.cs` : "";
}
exports.getTypesHeaderName = getTypesHeaderName;
function getTypesHeaderNamespace(apiname) {
    return getDataStoreHeaderNamespace(apiname);
}
exports.getTypesHeaderNamespace = getTypesHeaderNamespace;
function makeObjectAccessor(params) {
    const { classSpec, isWriteAccessor, isMessageStruct, objectUuidType, } = params;
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
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "id",
                    type: objectUuidType,
                }, {
                    name: "changeByteCount",
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "timestamp",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
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
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "id",
                    type: objectUuidType,
                }, {
                    name: "fieldsChanged",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
                }, {
                    name: "changeByteCount",
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
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
            initialValue: new TypeValue_1.CodeLiteralValue(module.exports, "new()"),
        });
        return privateMember("writeOffset");
    }
    else {
        classSpec.members.push({
            name: "readOffset",
            type: getXrpaTypes().MemoryOffset,
            visibility: "private",
            initialValue: new TypeValue_1.CodeLiteralValue(module.exports, "new()"),
        });
        return privateMember("readOffset");
    }
}
exports.makeObjectAccessor = makeObjectAccessor;
function genEventHandlerType(paramTypes, includes) {
    includes?.addFile({ namespace: "System" });
    if (paramTypes.length === 0) {
        return "System.Action";
    }
    return `System.Action<${paramTypes.join(", ")}>`;
}
exports.genEventHandlerType = genEventHandlerType;
function genEventHandlerCall(handler, paramValues, handlerCanBeNull) {
    if (handlerCanBeNull) {
        return `${handler}?.Invoke(${paramValues.join(", ")});`;
    }
    return `${handler}(${paramValues.join(", ")});`;
}
exports.genEventHandlerCall = genEventHandlerCall;
function genMessageDispatch(params) {
    const msgHandler = params.genMsgHandler(params.fieldName);
    const handlerCanBeNull = msgHandler.indexOf(".") < 0;
    const timestamp = params.timestampName ?? "msgTimestamp";
    const lines = [];
    if ((0, TypeDefinition_1.typeIsSignalData)(params.fieldType)) {
        const msgParams = [timestamp, "messageData"];
        lines.push(`${msgHandler}?.OnSignalData(${msgParams.join(", ")});`);
    }
    else if (!params.fieldType.hasFields()) {
        lines.push(genEventHandlerCall(msgHandler, [timestamp], handlerCanBeNull));
    }
    else {
        const prelude = [];
        const msgParams = [timestamp].concat(params.msgDataToParams(params.fieldType, prelude, params.includes));
        lines.push(...(params.convertToReadAccessor ? [
            `${params.fieldType.getReadAccessorType(params.namespace, params.includes)} message = new(messageData);`,
        ] : []), ...prelude, genEventHandlerCall(msgHandler, msgParams, handlerCanBeNull));
    }
    return lines;
}
exports.genMessageDispatch = genMessageDispatch;
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
                ...(0, xrpa_utils_1.indent)(2, def.setter),
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
        const body = (0, xrpa_utils_1.resolveThunkWithParam)(def.body ?? [], includes);
        const allBodyLines = [
            ...(def.memberInitializers?.map(initializersToString) ?? []),
            ...body,
        ];
        lines.push(...(def.decorations ?? []));
        if (allBodyLines.length === 0) {
            lines.push(`${decl} {}`);
        }
        else {
            lines.push(...(def.decorations ?? []), `${decl} {`, ...(0, xrpa_utils_1.indent)(1, allBodyLines), `}`);
        }
        lines.push(``);
    }
    if (classSpec.destructorBody) {
        const destructorBody = (0, xrpa_utils_1.resolveThunkWithParam)(classSpec.destructorBody ?? [], includes);
        lines.push(`public void Dispose() {`, `  Dispose(true);`, `  GC.SuppressFinalize(this);`, `}`, ``, `protected virtual void Dispose(bool disposing) {`, ...(0, xrpa_utils_1.indent)(1, destructorBody), `}`, ``, `~${classSpec.name}() {`, `  Dispose(false);`, `}`, ``);
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
        const templateParams = def.templateParams?.length ? `<${def.templateParams.join(", ")}>` : "";
        const whereClauses = def.whereClauses?.length ? ` where ${def.whereClauses.join(" ")} ` : "";
        const decl = `${prefix}${def.returnType ?? "void"} ${methodMember(def.name)}${templateParams}(${params})${whereClauses}`;
        lines.push(...(def.decorations ?? []));
        if (def.isAbstract) {
            lines.push(`${decl};`);
        }
        else {
            const body = (0, xrpa_utils_1.resolveThunkWithParam)(def.body, includes);
            lines.push(`${decl} {`, ...(0, xrpa_utils_1.indent)(1, body), `}`, ``);
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
        classSpec.includes?.addFile({ namespace: "System" });
        classExtends.push("IDisposable");
    }
    const extStr = classExtends.length > 0 ? `: ${classExtends.join(", ")} ` : "";
    const classNameDecorationStr = classSpec.classNameDecoration ? `${classSpec.classNameDecoration} ` : "";
    const classIsAbstract = classSpec.forceAbstract || classSpec.methods.filter(m => m.isAbstract).length > 0;
    const classTemplateParams = classSpec.templateParams ? `<${classSpec.templateParams.join(", ")}>` : "";
    return (0, xrpa_utils_1.removeSuperfluousEmptyLines)([
        ...classSpec.decorations,
        `public ${classIsAbstract ? "abstract " : ""}class ${classNameDecorationStr}${classSpec.name}${classTemplateParams} ${extStr}{`,
        ...(0, xrpa_utils_1.indent)(1, (0, xrpa_utils_1.trimTrailingEmptyLines)([
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
function accessorToName(accessor) {
    if (accessor === "byte[]") {
        return "bytes";
    }
    return accessor;
}
function genReadValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.ReadValue(${params.memAccessorVar}, ${params.fieldOffsetVar})`;
    }
    else {
        return `${params.memAccessorVar}.Read${(0, xrpa_utils_1.upperFirst)(accessorToName(params.accessor))}(${params.fieldOffsetVar})`;
    }
}
exports.genReadValue = genReadValue;
function genWriteValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.WriteValue(${params.value}, ${params.memAccessorVar}, ${params.fieldOffsetVar})`;
    }
    else {
        return `${params.memAccessorVar}.Write${(0, xrpa_utils_1.upperFirst)(accessorToName(params.accessor))}(${params.value}, ${params.fieldOffsetVar})`;
    }
}
exports.genWriteValue = genWriteValue;
function genDynSizeOfValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.DynSizeOfValue(${params.value})`;
    }
    else {
        return `${getXrpaTypes().MemoryAccessor.getLocalType(params.inNamespace, params.includes)}.DynSizeOf${(0, xrpa_utils_1.upperFirst)(accessorToName(params.accessor))}(${params.value})`;
    }
}
exports.genDynSizeOfValue = genDynSizeOfValue;
function genReadWriteValueFunctions(classSpec, params) {
    const fieldReads = [];
    const fieldWrites = [];
    const dynFieldSizes = [];
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
    const fieldsToLocal = (0, xrpa_utils_1.arrayZip)(Object.keys(params.fieldsToLocal), Object.values(params.fieldsToLocal));
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
            returnType: exports.PRIMITIVE_INTRINSICS.int32.typename,
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
exports.genReadWriteValueFunctions = genReadWriteValueFunctions;
function sanitizeEnumNames(enumValues) {
    return enumValues;
}
exports.sanitizeEnumNames = sanitizeEnumNames;
function genEnumDefinition(enumName, enumValues) {
    return [
        `public enum ${enumName} : uint {`,
        ...(0, xrpa_utils_1.indent)(1, Object.keys(enumValues).map(v => `${v} = ${enumValues[v]},`)),
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
function genReferencePtrToID(varName, objectUuidType) {
    return `${varName}?.GetXrpaId() ?? new ${objectUuidType}()`;
}
exports.genReferencePtrToID = genReferencePtrToID;
function genFieldGetter(classSpec, params) {
    if (!(0, TypeDefinition_1.typeIsStateData)(params.fieldType)) {
        return;
    }
    const decorations = genCommentLines(params.description);
    const fieldVar = params.fieldToMemberVar(params.fieldName);
    const funcName = `Get${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const fieldType = params.fieldType;
    if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
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
        name: `Set${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`,
        parameters: [{
                name: "value",
                type: isRef ? params.fieldType.objectUuidType : params.fieldType,
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
        name: `Check${(0, xrpa_utils_1.upperFirst)(params.fieldName)}Changed`,
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
        return `new ${params.objectUuidType}(${params.idParts.join(", ")})`;
    }
    for (const entry of params.guidGen.includes ?? []) {
        params.includes?.addFile(entry);
    }
    return `new ${params.objectUuidType}(${params.guidGen.code})`;
}
exports.genRuntimeGuid = genRuntimeGuid;
function genDeref(ptrName, memberName) {
    if (!ptrName) {
        return memberName;
    }
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
function genMethodCall(varName, methodName, params) {
    const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
    if (!varName) {
        return methodCall;
    }
    return `${varName}.${methodCall}`;
}
exports.genMethodCall = genMethodCall;
function genMethodBind(ptrName, methodName, params, ignoreParamCount) {
    const bindParams = (new Array(ignoreParamCount)).fill("_").concat(Object.keys(params).map(p => `${p}`));
    const methodCall = `${methodMember(methodName)}(${(0, xrpa_utils_1.collapse)(Object.values(params)).join(", ")})`;
    if (!ptrName) {
        return `(${bindParams.join(", ")}) => ${methodCall}`;
    }
    return `(${bindParams.join(", ")}) => ${ptrName}.${methodCall}`;
}
exports.genMethodBind = genMethodBind;
function genPassthroughMethodBind(methodName) {
    return methodMember(methodName);
}
exports.genPassthroughMethodBind = genPassthroughMethodBind;
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
function genConvertBoolToInt(value) {
    return `(${value} ? 1 : 0)`;
}
exports.genConvertBoolToInt = genConvertBoolToInt;
function genConvertIntToBool(value) {
    return `(${value} == 1 ? true : false)`;
}
exports.genConvertIntToBool = genConvertIntToBool;
function applyTemplateParams(typename, ...templateParams) {
    if (!templateParams.length) {
        return typename;
    }
    return `${typename}<${templateParams.join(", ")}>`;
}
exports.applyTemplateParams = applyTemplateParams;
function ifAnyBitIsSet(value, bitsValue, code) {
    return [
        `if ((${value} & ${bitsValue}) != 0) {`,
        ...(0, xrpa_utils_1.indent)(1, code),
        `}`,
    ];
}
exports.ifAnyBitIsSet = ifAnyBitIsSet;
function ifAllBitsAreSet(value, bitsValue, code) {
    return [
        `if ((${value} & ${bitsValue}) == ${bitsValue}) {`,
        ...(0, xrpa_utils_1.indent)(1, code),
        `}`,
    ];
}
exports.ifAllBitsAreSet = ifAllBitsAreSet;
function ifEquals(value, value2, code) {
    return [
        `if (${value} == ${value2}) {`,
        ...(0, xrpa_utils_1.indent)(1, code),
        `}`,
    ];
}
exports.ifEquals = ifEquals;
function declareVar(varName, typename, initialValue) {
    typename = typename || "var";
    return `${typename} ${varName} = ${initialValue};`;
}
exports.declareVar = declareVar;
//# sourceMappingURL=CsharpCodeGenImpl.js.map
