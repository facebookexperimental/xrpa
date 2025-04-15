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
exports.genDerefMethodCall = exports.genDeref = exports.genRuntimeGuid = exports.injectGeneratedTag = exports.genFieldChangedCheck = exports.genFieldSetter = exports.genFieldGetter = exports.genReferencePtrToID = exports.getNullValue = exports.genEnumDynamicConversion = exports.genEnumDefinition = exports.genReadWriteValueFunctions = exports.genDynSizeOfValue = exports.genWriteValue = exports.genReadValue = exports.genClassDefinition = exports.genMessageDispatch = exports.genOnMessageAccessor = exports.genMessageHandlerType = exports.genEventHandlerCall = exports.genEventHandlerType = exports.makeObjectAccessor = exports.getTypesHeaderNamespace = exports.getTypesHeaderName = exports.getDataStoreClass = exports.getDataStoreHeaderNamespace = exports.getDataStoreHeaderName = exports.getDataStoreName = exports.reinterpretValue = exports.genPointer = exports.genDeclaration = exports.genMultiValue = exports.genPrimitiveValue = exports.methodMember = exports.privateMember = exports.identifierName = exports.constRef = exports.nsExtract = exports.nsJoin = exports.nsQualify = exports.genCommentLines = exports.PythonIncludeAggregator = exports.DEFAULT_INTERFACE_PTR_TYPE = exports.genGetCurrentClockTime = exports.PRIMITIVE_INTRINSICS = exports.UNIT_TRANSFORMER = exports.HEADER = exports.XRPA_NAMESPACE = exports.getXrpaTypes = exports.registerXrpaTypes = void 0;
exports.declareVar = exports.ifAllBitsAreSet = exports.ifAnyBitIsSet = exports.applyTemplateParams = exports.genConvertIntToBool = exports.genConvertBoolToInt = exports.genObjectPtrType = exports.genCreateObject = exports.genNonNullCheck = exports.genPassthroughMethodBind = exports.genMethodBind = exports.genMethodCall = void 0;
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
exports.XRPA_NAMESPACE = "xrpa_runtime";
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
exports.HEADER = [
    COPYRIGHT_STRING,
    GENERATED_STRING,
    "",
];
exports.UNIT_TRANSFORMER = {
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
exports.PRIMITIVE_INTRINSICS = {
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
    TRUE: "True",
    FALSE: "False",
};
function genGetCurrentClockTime(includes, inNanoseconds = false) {
    includes?.addFile({ namespace: `${exports.XRPA_NAMESPACE}.utils.time_utils` });
    if (inNanoseconds) {
        return `${exports.XRPA_NAMESPACE}.utils.time_utils.TimeUtils.get_current_clock_time_nanoseconds()`;
    }
    return `${exports.XRPA_NAMESPACE}.utils.time_utils.TimeUtils.get_current_clock_time_microseconds()`;
}
exports.genGetCurrentClockTime = genGetCurrentClockTime;
exports.DEFAULT_INTERFACE_PTR_TYPE = "bare";
const nsSep = ".";
class PythonIncludeAggregator {
    constructor(namespaces) {
        this.importNamespaces = {};
        if (namespaces) {
            for (const namespace of namespaces) {
                this.addFile({ namespace });
            }
        }
    }
    addFile(params) {
        if (!params.namespace && params.typename) {
            // strip off any template parameters
            const typename = params.typename.split("[")[0];
            params.namespace = nsExtract(typename);
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
        return Object.keys(this.importNamespaces).sort().map(ns => `import ${ns}`);
    }
}
exports.PythonIncludeAggregator = PythonIncludeAggregator;
function genCommentLines(str) {
    return (0, xrpa_utils_1.genCommentLinesWithCommentMarker)("#", str);
}
exports.genCommentLines = genCommentLines;
function typenameToCode(typename) {
    if (typename === "ulong") {
        return "int";
    }
    return typename;
}
function nsQualify(qualifiedName, inNamespace) {
    const outNamespace = nsExtract(qualifiedName);
    if (outNamespace === inNamespace || inNamespace === xrpa_utils_1.EXCLUDE_NAMESPACE) {
        return (0, xrpa_utils_1.nsQualifyWithSeparator)(nsSep, qualifiedName, inNamespace);
    }
    return qualifiedName;
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
function identifierName(name, maintainPrivateMarker = false) {
    const prefix = maintainPrivateMarker && name.startsWith("_") ? "_" : "";
    return prefix + (0, xrpa_utils_1.normalizeIdentifier)(name).join("_");
}
exports.identifierName = identifierName;
function privateMember(memberVarName) {
    if (memberVarName.startsWith("_") || memberVarName.startsWith("self.")) {
        // already private
        return memberVarName;
    }
    return "_" + identifierName(memberVarName);
}
exports.privateMember = privateMember;
function methodMember(methodName, visibility = "public") {
    if (visibility !== "public") {
        return privateMember(methodName);
    }
    return identifierName(methodName);
}
exports.methodMember = methodMember;
function genInitializer(typename, values) {
    if (typename.startsWith("typing.List")) {
        return `[${values.join(", ")}]`;
    }
    return `${typenameToCode(typename)}(${values.join(", ")})`;
}
function genPrimitiveValue(typename, value) {
    if (value === null) {
        if (typename === exports.PRIMITIVE_INTRINSICS.string.typename) {
            return `""`;
        }
        if (typename) {
            return `${typenameToCode(typename)}()`;
        }
        return "";
    }
    if (typeof value === "string") {
        // escape string
        value = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return `"${value}"`;
    }
    if (typeof value === "boolean") {
        return (0, xrpa_utils_1.upperFirst)(`${value}`);
    }
    if (!typename) {
        return `${value}`;
    }
    if (typeof value === "number") {
        return `${value}`;
    }
    return genInitializer(typename, [value]);
}
exports.genPrimitiveValue = genPrimitiveValue;
function convertFieldValue(kv) {
    return `${kv[1]}`;
}
function genMultiValue(typename, _hasInitializerConstructor, valueStrings) {
    return genInitializer(typename, valueStrings.map(convertFieldValue));
}
exports.genMultiValue = genMultiValue;
function genDeclaration(params) {
    // TODO(Python) I suspect this will always need an initializer
    const typename = nsQualify(params.typename, params.inNamespace);
    const initializer = params.initialValue instanceof TypeValue_1.EmptyValue ? "" : ` = ${params.initialValue.toString(params.inNamespace)}`;
    return `${params.varName}: ${typenameToCode(typename)}${initializer}`;
}
exports.genDeclaration = genDeclaration;
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
    return apiname ? `${identifierName(apiname)}_data_store` : "";
}
exports.getDataStoreName = getDataStoreName;
function getDataStoreHeaderName(apiname) {
    return apiname ? `${getDataStoreName(apiname)}.py` : "";
}
exports.getDataStoreHeaderName = getDataStoreHeaderName;
function getDataStoreHeaderNamespace(apiname) {
    return apiname ? `xrpa.${getDataStoreName(apiname)}` : "";
}
exports.getDataStoreHeaderNamespace = getDataStoreHeaderNamespace;
function getDataStoreClass(apiname, inNamespace, includes) {
    const className = (0, xrpa_utils_1.normalizeIdentifier)(getDataStoreName(apiname)).map((s) => (0, xrpa_utils_1.upperFirst)(s)).join("");
    const fullName = nsJoin(getDataStoreHeaderNamespace(apiname), className);
    includes?.addFile({ filename: getDataStoreHeaderName(apiname), typename: fullName });
    return nsQualify(fullName, inNamespace);
}
exports.getDataStoreClass = getDataStoreClass;
function getTypesHeaderName(apiname) {
    return apiname ? `${identifierName(apiname)}_types.py` : "";
}
exports.getTypesHeaderName = getTypesHeaderName;
function getTypesHeaderNamespace(apiname) {
    return apiname ? `xrpa.${identifierName(apiname)}_types` : "xrpa";
}
exports.getTypesHeaderNamespace = getTypesHeaderNamespace;
function makeObjectAccessor(params) {
    const { classSpec, isWriteAccessor, isMessageStruct, objectUuidType, } = params;
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
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "id",
                    type: objectUuidType,
                }, {
                    name: "change_byte_count",
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "timestamp",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
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
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
                }, {
                    name: "id",
                    type: objectUuidType,
                }, {
                    name: "fields_changed",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
                }, {
                    name: "change_byte_count",
                    type: exports.PRIMITIVE_INTRINSICS.int32.typename,
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
            initialValue: new TypeValue_1.CodeLiteralValue(module.exports, `${getXrpaTypes().MemoryOffset.getLocalType(classSpec.namespace, classSpec.includes)}()`),
        });
        return "self." + privateMember("write_offset");
    }
    else {
        classSpec.members.push({
            name: "read_offset",
            type: getXrpaTypes().MemoryOffset,
            visibility: "private",
            initialValue: new TypeValue_1.CodeLiteralValue(module.exports, `${getXrpaTypes().MemoryOffset.getLocalType(classSpec.namespace, classSpec.includes)}()`),
        });
        return "self." + privateMember("read_offset");
    }
}
exports.makeObjectAccessor = makeObjectAccessor;
function genEventHandlerType(paramTypes) {
    return `typing.Callable[[${paramTypes.map(typenameToCode).join(", ")}], None]`;
}
exports.genEventHandlerType = genEventHandlerType;
function genEventHandlerCall(handler, paramValues, handlerCanBeNull) {
    if (handlerCanBeNull) {
        return `if ${handler} is not None: ${handler}(${paramValues.join(", ")})`;
    }
    return `${handler}(${paramValues.join(", ")})`;
}
exports.genEventHandlerCall = genEventHandlerCall;
function genMessageHandlerType(params) {
    const paramTypes = [exports.PRIMITIVE_INTRINSICS.uint64.typename];
    if (params.fieldType.hasFields()) {
        paramTypes.push(params.fieldType.getReadAccessorType(params.namespace, params.includes));
    }
    return genEventHandlerType(paramTypes);
}
exports.genMessageHandlerType = genMessageHandlerType;
function genOnMessageAccessor(classSpec, params) {
    const handlerType = genMessageHandlerType({
        ...params,
        includes: classSpec.includes,
    });
    const msgHandler = params.genMsgHandler(params.fieldName);
    classSpec.methods.push({
        name: `on_${params.fieldName}`,
        parameters: [{
                name: "handler",
                type: handlerType,
            }],
        body: [
            `self.${msgHandler} = handler`,
        ],
    });
    classSpec.members.push({
        name: msgHandler,
        type: handlerType,
        initialValue: new TypeValue_1.CodeLiteralValue(module.exports, "None"),
        visibility: "private",
    });
    classSpec.includes?.addFile({ namespace: "typing" });
}
exports.genOnMessageAccessor = genOnMessageAccessor;
function genMessageDispatch(params) {
    let msgHandler = params.genMsgHandler(params.fieldName);
    const handlerCanBeNull = msgHandler.indexOf(".") < 0;
    const timestamp = params.timestampName ?? "timestamp";
    msgHandler = "self." + msgHandler;
    const lines = [];
    let indentLevel = 0;
    if (handlerCanBeNull) {
        lines.push(`if ${genNonNullCheck(msgHandler)}:`);
        indentLevel = 1;
    }
    if (!params.fieldType.hasFields()) {
        lines.push(...(0, xrpa_utils_1.indent)(indentLevel, [
            `${msgHandler}(${timestamp})`,
        ]));
    }
    else {
        const prelude = [];
        const msgParams = [timestamp].concat(params.msgDataToParams(params.fieldType, prelude, params.includes));
        lines.push(...(0, xrpa_utils_1.indent)(indentLevel, [
            ...(params.convertToReadAccessor ? [
                `message = ${params.fieldType.getReadAccessorType(params.namespace, params.includes)}(message_data)`,
            ] : []),
            ...prelude,
            `${msgHandler}(${msgParams.join(", ")})`,
        ]));
    }
    return lines;
}
exports.genMessageDispatch = genMessageDispatch;
function paramsToString(classSpec, parameters, isStatic) {
    const paramsStr = parameters.map((p) => {
        const suffix = p.defaultValue ? ` = ${p.defaultValue}` : "";
        const pname = identifierName(p.name);
        if (typeof p.type === "string") {
            return `${pname}: ${typenameToCode(p.type)}${suffix}`;
        }
        else {
            return `${p.type.declareLocalParam(classSpec.namespace, classSpec.includes, pname)}${suffix}`;
        }
    }).join(", ");
    if (!isStatic) {
        if (paramsStr) {
            return `self, ${paramsStr}`;
        }
        else {
            return "self";
        }
    }
    return paramsStr;
}
function initializersToString(initializers) {
    if (initializers[0].startsWith("self.")) {
        return `${initializers[0]} = ${initializers[1]}`;
    }
    return `self.${initializers[0]} = ${initializers[1]}`;
}
function genClassDefinitionMembers(classSpec, includes, isDataClass) {
    const lines = [];
    for (const def of classSpec.members) {
        if (!isDataClass && !def.isStatic) {
            continue;
        }
        if (def.decorations?.length) {
            lines.push(``, ...def.decorations);
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
            initialValue: (def.getter ? undefined : initialValue) ?? new TypeValue_1.EmptyValue(module.exports, typename, classSpec.namespace),
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
function genClassDefinitionConstructors(classSpec, includes) {
    const lines = [];
    for (const def of classSpec.constructors) {
        const params = paramsToString(classSpec, def.parameters ?? [], false);
        const initializers = [];
        if (classSpec.superClass) {
            const superClassInitializers = def.superClassInitializers ?? [];
            initializers.push(`super().__init__(${superClassInitializers.join(", ")})`);
        }
        const body = (0, xrpa_utils_1.resolveThunkWithParam)(def.body ?? [], includes);
        const memberInitializers = (def.memberInitializers ?? []).map(mi => [identifierName(mi[0], true), mi[1]]);
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
            if (!initialValue || initialValue instanceof TypeValue_1.EmptyValue) {
                memberInitializers.push([varName, "None"]);
            }
            else {
                memberInitializers.push([varName, initialValue.toString(classSpec.namespace)]);
            }
        }
        const allBodyLines = [
            ...initializers,
            ...memberInitializers.map(initializersToString),
            ...body,
        ];
        lines.push(...(def.decorations ?? []));
        if (allBodyLines.length === 0) {
            allBodyLines.push("pass");
        }
        lines.push(...(def.decorations ?? []), `def __init__(${params}):`, ...(0, xrpa_utils_1.indent)(1, allBodyLines));
        lines.push(``);
    }
    if (classSpec.destructorBody) {
        const destructorBody = (0, xrpa_utils_1.resolveThunkWithParam)(classSpec.destructorBody ?? [], includes);
        lines.push(`def __del__(self):`, ...(0, xrpa_utils_1.indent)(1, destructorBody), ``);
    }
    return lines;
}
function genClassDefinitionMethods(classSpec, includes) {
    const lines = [];
    for (const def of classSpec.methods) {
        const params = paramsToString(classSpec, def.parameters ?? [], def.isStatic ?? false);
        let returnType = def.returnType ?? "None";
        if (returnType === classSpec.name) {
            returnType = `"${classSpec.name}"`;
        }
        const decl = `def ${methodMember(def.name, def.visibility)}(${params}) -> ${typenameToCode(returnType)}:`;
        lines.push(...(def.decorations ?? []));
        if (def.isStatic) {
            lines.push("@staticmethod");
        }
        if (def.isAbstract) {
            lines.push("@abstractmethod");
            lines.push(decl, `  pass`, ``);
        }
        else {
            const body = (0, xrpa_utils_1.resolveThunkWithParam)(def.body, includes);
            if (body.length === 0) {
                body.push("pass");
            }
            lines.push(`${decl}`, ...(0, xrpa_utils_1.indent)(1, body), ``);
        }
    }
    return lines;
}
function genClassDefinition(classSpec) {
    (0, assert_1.default)(!classSpec.name.includes("."), "Class name cannot contain a namespace");
    let isDataClass = classSpec.constructors.length === 0;
    const classExtends = [];
    if (classSpec.superClass) {
        classExtends.push(classSpec.superClass);
        isDataClass = false;
    }
    if (classSpec.interfaceName) {
        classExtends.push(classSpec.interfaceName);
        isDataClass = false;
    }
    const extStr = classExtends.length > 0 ? `(${classExtends.join(", ")})` : "";
    (0, assert_1.default)(!classSpec.templateParams?.length, "Python does not support template parameters yet");
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
    return (0, xrpa_utils_1.removeSuperfluousEmptyLines)([
        ...classSpec.decorations,
        `class ${classSpec.name}${extStr}:`,
        ...(0, xrpa_utils_1.indent)(1, (0, xrpa_utils_1.trimTrailingEmptyLines)([
            ...classSpec.classEarlyInject,
            ...genClassDefinitionMembers(classSpec, classSpec.includes, isDataClass),
            ...genClassDefinitionConstructors(classSpec, classSpec.includes),
            ...genClassDefinitionMethods(classSpec, classSpec.includes),
        ])),
        ``,
    ]);
}
exports.genClassDefinition = genClassDefinition;
function genReadValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.read_value(${params.memAccessorVar}, ${params.fieldOffsetVar})`;
    }
    else {
        return `${params.memAccessorVar}.read_${identifierName(params.accessor)}(${params.fieldOffsetVar})`;
    }
}
exports.genReadValue = genReadValue;
function genWriteValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.write_value(${params.value}, ${params.memAccessorVar}, ${params.fieldOffsetVar})`;
    }
    else {
        return `${params.memAccessorVar}.write_${identifierName(params.accessor)}(${params.value}, ${params.fieldOffsetVar})`;
    }
}
exports.genWriteValue = genWriteValue;
function genDynSizeOfValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}.dyn_size_of_value(${params.value})`;
    }
    else {
        return `${getXrpaTypes().MemoryAccessor.getLocalType(params.inNamespace, params.includes)}.dyn_size_of_${identifierName(params.accessor)}(${params.value})`;
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
    const fieldsToLocal = (0, xrpa_utils_1.arrayZip)(Object.keys(params.fieldsToLocal), Object.values(params.fieldsToLocal));
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
            returnType: exports.PRIMITIVE_INTRINSICS.int32.typename,
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
exports.genReadWriteValueFunctions = genReadWriteValueFunctions;
function genEnumDefinition(enumName, enumValues, includes) {
    if (includes) {
        includes.addFile({ namespace: "enum" });
    }
    return [
        `class ${enumName}(enum.Enum):`,
        ...(0, xrpa_utils_1.indent)(1, Object.keys(enumValues).map(v => `${v} = ${enumValues[v]}`)),
        ``,
    ];
}
exports.genEnumDefinition = genEnumDefinition;
function genEnumDynamicConversion(targetTypename, value) {
    if (targetTypename === "uint" || targetTypename === "int") {
        return `${value}.value`;
    }
    return `${targetTypename}(${value})`;
}
exports.genEnumDynamicConversion = genEnumDynamicConversion;
function getNullValue() {
    return "None";
}
exports.getNullValue = getNullValue;
function genReferencePtrToID(varName, objectUuidType) {
    return `(${varName}.get_xrpa_id() if ${varName} is not None else ${objectUuidType}())`;
}
exports.genReferencePtrToID = genReferencePtrToID;
function genFieldGetter(classSpec, params) {
    if (!(0, TypeDefinition_1.typeIsStateData)(params.fieldType)) {
        return;
    }
    const decorations = genCommentLines(params.description);
    const fieldVar = params.fieldToMemberVar(params.fieldName);
    const funcName = `get_${identifierName(params.fieldName)}`;
    const fieldType = params.fieldType;
    if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
        const returnType = fieldType.getReferencedSuperType(classSpec.namespace, classSpec.includes);
        classSpec.methods.push({
            decorations: decorations,
            name: funcName,
            returnType,
            parameters: [{
                    name: "datastore",
                    type: getDataStoreClass(params.apiname, classSpec.namespace, classSpec.includes),
                }],
            isConst: params.isConst,
            noDiscard: true,
            visibility: params.visibility,
            body: includes => {
                const body = [
                    `obj_id = ${fieldVar}`,
                ];
                const validLeafTypes = fieldType.getReferencedTypeList(classSpec.namespace, includes);
                for (const leafType of validLeafTypes) {
                    const varName = identifierName(leafType.collectionName) + "_val";
                    body.push(`${varName} = datastore.${leafType.collectionName}.get_object(obj_id)`, `if ${varName} is not None:`, `  return ${varName}`);
                }
                body.push(`return None`);
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
                `return ${fieldVar}`,
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
                `return ${fieldType.convertValueToLocal(classSpec.namespace, includes, fieldVar)}`,
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
                `return ${fieldVar}`,
            ],
        });
    }
}
exports.genFieldGetter = genFieldGetter;
function genFieldSetter(classSpec, params) {
    const isRef = (0, TypeDefinition_1.typeIsReference)(params.fieldType);
    classSpec.methods.push({
        name: `set_${identifierName(params.fieldName)}`,
        parameters: [{
                name: "value",
                type: isRef ? params.fieldType.objectUuidType : params.fieldType,
            }],
        body: includes => {
            const value = (params.convertFromLocal && !isRef) ? `${params.fieldType.convertValueFromLocal(classSpec.namespace, includes, "value")}` : "value";
            return [
                `${params.valueToMemberWrite(value)}`,
            ];
        },
    });
}
exports.genFieldSetter = genFieldSetter;
function genFieldChangedCheck(classSpec, params) {
    classSpec.methods.push({
        name: `check_${identifierName(params.fieldName)}_changed`,
        returnType: "bool",
        parameters: [{
                name: "fields_changed",
                type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        visibility: params.visibility,
        isConst: true,
        isInline: true,
        body: [
            `return (fields_changed & ${params.parentType.getFieldBitMask(params.fieldName)}) != 0`,
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
        return `${params.objectUuidType}(${params.idParts.join(", ")})`;
    }
    for (const entry of params.guidGen.includes ?? []) {
        params.includes?.addFile(entry);
    }
    return `${params.objectUuidType}.from_uuid(${params.guidGen.code})`;
}
exports.genRuntimeGuid = genRuntimeGuid;
function genDeref(ptrName, memberName) {
    return `${ptrName || "self"}.${memberName}`;
}
exports.genDeref = genDeref;
function genDerefMethodCall(ptrName, methodName, params) {
    const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
    return `${ptrName || "self"}.${methodCall}`;
}
exports.genDerefMethodCall = genDerefMethodCall;
function genMethodCall(varName, methodName, params) {
    const methodCall = `${methodMember(methodName)}(${params.join(", ")})`;
    return `${varName || "self"}.${methodCall}`;
}
exports.genMethodCall = genMethodCall;
function genMethodBind(ptrName, methodName, params, ignoreParamCount) {
    const bindParams = (new Array(ignoreParamCount)).fill("_").concat(Object.keys(params).map(p => `${p}`));
    const methodCall = `${methodMember(methodName)}(${(0, xrpa_utils_1.collapse)(Object.values(params)).join(", ")})`;
    if (!ptrName) {
        return `lambda ${bindParams.join(", ")}: ${methodCall}`;
    }
    return `lambda ${bindParams.join(", ")}: ${ptrName}.${methodCall}`;
}
exports.genMethodBind = genMethodBind;
function genPassthroughMethodBind(methodName, paramCount) {
    const bindParams = (new Array(paramCount)).fill("_").map((_, i) => `p${i}`);
    return `lambda ${bindParams.join(", ")}: ${methodMember(methodName)}(${bindParams.join(", ")})`;
}
exports.genPassthroughMethodBind = genPassthroughMethodBind;
function genNonNullCheck(ptrName) {
    return `${ptrName} is not None`;
}
exports.genNonNullCheck = genNonNullCheck;
function genCreateObject(type, params) {
    return `${type}(${params.join(", ")})`;
}
exports.genCreateObject = genCreateObject;
function genObjectPtrType(type) {
    return type;
}
exports.genObjectPtrType = genObjectPtrType;
function genConvertBoolToInt(value) {
    return `(1 if ${value} is True else 0)`;
}
exports.genConvertBoolToInt = genConvertBoolToInt;
function genConvertIntToBool(value) {
    return `(${value} == 1)`;
}
exports.genConvertIntToBool = genConvertIntToBool;
function applyTemplateParams(typename, ...templateParams) {
    if (!templateParams.length) {
        return typenameToCode(typename);
    }
    return `${typenameToCode(typename)}[${templateParams.join(", ")}]`;
}
exports.applyTemplateParams = applyTemplateParams;
function ifAnyBitIsSet(value, bitValue, code) {
    return [
        `if (${value} & ${bitValue}) != 0:`,
        ...(0, xrpa_utils_1.indent)(1, code),
    ];
}
exports.ifAnyBitIsSet = ifAnyBitIsSet;
function ifAllBitsAreSet(value, bitsValue, code) {
    return [
        `if (${value} & ${bitsValue}) == ${bitsValue}:`,
        ...(0, xrpa_utils_1.indent)(1, code),
    ];
}
exports.ifAllBitsAreSet = ifAllBitsAreSet;
function declareVar(varName, typename, initialValue) {
    if (!typename) {
        return `${varName} = ${initialValue}`;
    }
    return `${varName}: ${typenameToCode(typename)} = ${initialValue}`;
}
exports.declareVar = declareVar;
//# sourceMappingURL=PythonCodeGenImpl.js.map
