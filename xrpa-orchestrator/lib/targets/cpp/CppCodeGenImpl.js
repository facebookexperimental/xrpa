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
exports.refParam = exports.genObjectPtrType = exports.genCreateObject = exports.genNonNullCheck = exports.genMethodBind = exports.genDerefMethodCall = exports.genDeref = exports.genRuntimeGuid = exports.injectGeneratedTag = exports.genFieldChangedCheck = exports.genFieldSetter = exports.genFieldGetter = exports.genReferencePtrToID = exports.getNullValue = exports.genEnumDynamicConversion = exports.genEnumDefinition = exports.genReadWriteValueFunctions = exports.genWriteValue = exports.genReadValue = exports.genClassSourceDefinition = exports.genClassHeaderDefinition = exports.genClassDefinition = exports.makeObjectAccessor = exports.getTypesHeaderName = exports.getDataStoreHeaderName = exports.getDataStoreName = exports.reinterpretValue = exports.genPointer = exports.genDeclaration = exports.genMultiValue = exports.genPrimitiveValue = exports.methodMember = exports.privateMember = exports.constRef = exports.forwardDeclareClass = exports.nsExtract = exports.nsJoin = exports.nsQualify = exports.genCommentLines = exports.CppIncludeAggregator = exports.DEFAULT_INTERFACE_PTR_TYPE = exports.GET_CURRENT_CLOCK_TIME = exports.PRIMITIVE_INTRINSICS = exports.UNIT_TRANSFORMER = exports.BUCK_HEADER = exports.HEADER = exports.XRPA_NAMESPACE = exports.registerXrpaTypes = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
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
exports.BUCK_HEADER = [
    "# @" + "generated",
    "",
];
exports.UNIT_TRANSFORMER = {
    angular: {
        radian: {
            degree: [` * 180.f / ${exports.XRPA_NAMESPACE}::DSHelpers::PI_CONST`, 180 / Math.PI],
        },
        degree: {
            radian: [` * ${exports.XRPA_NAMESPACE}::DSHelpers::PI_CONST / 180.f`, Math.PI / 180],
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
exports.PRIMITIVE_INTRINSICS = {
    string: { typename: "std::string", headerFile: "<string>" },
    microseconds: { typename: "std::chrono::microseconds", headerFile: "<chrono>" },
    uint8: { typename: "uint8_t" },
    uint64: { typename: "uint64_t" },
    int: { typename: "int" },
    int32: { typename: "int32_t" },
    uint32: { typename: "uint32_t" },
    float32: { typename: "float" },
    bool: { typename: "bool" },
    arrayFloat3: { typename: "std::array<float, 3>", headerFile: "<array>" },
};
exports.GET_CURRENT_CLOCK_TIME = `${exports.XRPA_NAMESPACE}::getCurrentClockTimeMicroseconds()`;
exports.DEFAULT_INTERFACE_PTR_TYPE = "shared_ptr";
const nsSep = "::";
class CppIncludeAggregator {
    constructor(headerFiles, remapper, forbiddenFiles) {
        this.remapper = remapper;
        this.forbiddenFiles = forbiddenFiles;
        this.includeFiles = {};
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
    normalize(fileStr) {
        if (fileStr.charAt(0) !== "<" && fileStr.charAt(0) !== '"') {
            // needs quoted
            fileStr = `"${fileStr}"`;
        }
        if (this.remapper) {
            fileStr = this.remapper(fileStr);
        }
        return fileStr;
    }
    addFile(params) {
        if (params.filename) {
            const fileStr = this.normalize(params.filename);
            if (this.forbiddenFiles?.includes(fileStr)) {
                throw new Error(`File ${fileStr} is forbidden`);
            }
            this.includeFiles[fileStr] = true;
        }
    }
    getIncludes(excludeFile) {
        if (excludeFile) {
            delete this.includeFiles[this.normalize(excludeFile)];
        }
        return Object.keys(this.includeFiles).sort().map(str => `#include ${str}`);
    }
    getNamespaceImports() {
        return [];
    }
}
exports.CppIncludeAggregator = CppIncludeAggregator;
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
function forwardDeclareClass(qualifiedName) {
    const className = nsQualify(qualifiedName, xrpa_utils_1.EXCLUDE_NAMESPACE);
    const namespace = nsExtract(qualifiedName);
    if (namespace) {
        return `namespace ${namespace} { class ${className}; }`;
    }
    else {
        return `class ${className};`;
    }
}
exports.forwardDeclareClass = forwardDeclareClass;
function constRef(type, byteSize) {
    if (byteSize <= 8 || type.includes("*")) {
        return type;
    }
    return `const ${type}&`;
}
exports.constRef = constRef;
function privateMember(memberVarName) {
    if (memberVarName.endsWith("_")) {
        // already private
        return memberVarName;
    }
    return memberVarName + "_";
}
exports.privateMember = privateMember;
function methodMember(methodName) {
    return methodName;
}
exports.methodMember = methodMember;
function genInitializer(values) {
    return `{${values.join(", ")}}`;
}
function genPrimitiveValue(typename, value) {
    if (value === null) {
        if (typename) {
            return `${typename}{}`;
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
exports.genPrimitiveValue = genPrimitiveValue;
function convertFieldValue(kv) {
    return `${kv[1]}`;
}
function genMultiValue(typename, _hasInitializerConstructor, valueStrings) {
    return `${typename}${genInitializer(valueStrings.map(convertFieldValue))}`;
}
exports.genMultiValue = genMultiValue;
function genDeclaration(params) {
    const typename = nsQualify(params.typename, params.inNamespace);
    let prefix = "";
    if (params.isStatic) {
        prefix += "static ";
    }
    if (params.isConst) {
        prefix += "constexpr ";
    }
    let initializer = params.initialValue instanceof TypeValue_1.EmptyValue ? "" : ` = ${params.initialValue.toString(params.inNamespace)}`;
    const typePrefix = ` = ${typename}`;
    if (initializer && initializer.startsWith(typePrefix + "{")) {
        initializer = initializer.slice(typePrefix.length);
    }
    return `${prefix}${typename} ${params.varName}${initializer}` + (params.includeTerminator ? ";" : "");
}
exports.genDeclaration = genDeclaration;
function genPointer(ptrType, localType, includes) {
    switch (ptrType) {
        case "shared_ptr":
            includes?.addFile({
                filename: "<memory>",
                typename: "std::shared_ptr",
            });
            return `std::shared_ptr<${localType}>`;
        case "weak_ptr":
            includes?.addFile({
                filename: "<memory>",
                typename: "std::weak_ptr",
            });
            return `std::weak_ptr<${localType}>`;
        case "bare":
            return `${localType}*`;
    }
    throw new Error(`Invalid ptrType: ${ptrType}`);
}
exports.genPointer = genPointer;
function reinterpretValue(fromType, toType, value) {
    return `${exports.XRPA_NAMESPACE}::reinterpretValue<${toType}, ${fromType}>(${value})`;
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
    return apiname ? `${getDataStoreName(apiname)}.h` : "";
}
exports.getDataStoreHeaderName = getDataStoreHeaderName;
function getTypesHeaderName(apiname) {
    return apiname ? `${apiname}Types.h` : "";
}
exports.getTypesHeaderName = getTypesHeaderName;
function makeObjectAccessor(classSpec, isWriteAccessor, dsIdentifierType) {
    (0, assert_1.default)(gXrpaTypes, "Expected Xrpa types to be registered");
    if (!classSpec.superClass) {
        classSpec.superClass = gXrpaTypes.ObjectAccessorInterface.getLocalType(classSpec.namespace, classSpec.includes);
    }
    classSpec.constructors.push({});
    classSpec.constructors.push({
        parameters: [{ name: "memAccessor", type: gXrpaTypes.MemoryAccessor }],
        body: [],
        superClassInitializers: ["memAccessor"],
    });
    if (isWriteAccessor) {
        classSpec.methods.push({
            name: "create",
            parameters: [{
                    name: "accessor",
                    type: gXrpaTypes.DatasetAccessor.getLocalType(classSpec.namespace, classSpec.includes) + "*",
                }, {
                    name: "id",
                    type: constRef(dsIdentifierType, 16),
                }, {
                    name: "changeByteCount",
                    type: exports.PRIMITIVE_INTRINSICS.uint32.typename,
                }, {
                    name: "timestamp",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
                }],
            returnType: classSpec.name,
            body: [
                `auto changeEvent = accessor->writeChangeEvent<Xrpa::DSCollectionChangeEventAccessor>(Xrpa::DSChangeType::CreateObject, changeByteCount, timestamp);`,
                `changeEvent.setCollectionId(DS_TYPE);`,
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
                    type: gXrpaTypes.DatasetAccessor.getLocalType(classSpec.namespace, classSpec.includes) + "*",
                }, {
                    name: "id",
                    type: constRef(dsIdentifierType, 16),
                }, {
                    name: "fieldsChanged",
                    type: exports.PRIMITIVE_INTRINSICS.uint64.typename,
                }, {
                    name: "changeByteCount",
                    type: exports.PRIMITIVE_INTRINSICS.uint32.typename,
                }],
            returnType: classSpec.name,
            body: [
                `auto changeEvent = accessor->writeChangeEvent<Xrpa::DSCollectionUpdateChangeEventAccessor>(Xrpa::DSChangeType::UpdateObject, changeByteCount);`,
                `changeEvent.setCollectionId(DS_TYPE);`,
                `changeEvent.setObjectId(id);`,
                `changeEvent.setFieldsChanged(fieldsChanged);`,
                `return ${classSpec.name}(changeEvent.accessChangeData());`,
            ],
            isStatic: true,
            visibility: "public",
        });
    }
}
exports.makeObjectAccessor = makeObjectAccessor;
function paramsToString(classSpec, parameters, mode) {
    return parameters.map((p) => {
        const suffix = (p.defaultValue && !isSourceMode(mode)) ? ` = ${p.defaultValue}` : "";
        if (typeof p.type === "string") {
            return `${p.type} ${p.name}${suffix}`;
        }
        else {
            return `${p.type.declareLocalParam(classSpec.namespace, classSpec.includes, p.name)}${suffix}`;
        }
    }).join(", ");
}
function initializersToString(initializers) {
    return `${privateMember(initializers[0])}(${initializers[1]})`;
}
var ClassGenMode;
(function (ClassGenMode) {
    ClassGenMode[ClassGenMode["ALL"] = 0] = "ALL";
    ClassGenMode[ClassGenMode["HEADER"] = 1] = "HEADER";
    ClassGenMode[ClassGenMode["SOURCE"] = 2] = "SOURCE";
    ClassGenMode[ClassGenMode["SOURCE_INLINE"] = 3] = "SOURCE_INLINE";
})(ClassGenMode || (ClassGenMode = {}));
function isSourceMode(mode) {
    return mode === ClassGenMode.SOURCE || mode === ClassGenMode.SOURCE_INLINE;
}
function genClassDefinitionConstructors(classSpec, includes, visibilityFilter, mode) {
    const lines = [];
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
        const initializers = [];
        if (classSpec.superClass && def.superClassInitializers) {
            initializers.push(`${classSpec.superClass}(${def.superClassInitializers.join(", ")})`);
        }
        initializers.push(...def.memberInitializers?.map(initializersToString) ?? []);
        const initializersStr = initializers.length > 0 ? ` : ${initializers.join(", ")}` : "";
        const prefix = isSourceMode(mode) ? "" : (def.parameters?.length === 1 ? "explicit " : "");
        const decl = `${prefix}${namePrefix}${classSpec.name}(${params})`;
        if (!isSourceMode(mode)) {
            lines.push(...(def.decorations ?? []));
        }
        if (def.separateImplementation && mode === ClassGenMode.HEADER) {
            lines.push(`${decl};`);
        }
        else {
            const body = typeof def.body === "function" ? def.body(includes) : (def.body ?? []);
            if (body.length === 0) {
                lines.push(`${decl}${initializersStr} {}`);
            }
            else {
                lines.push(`${decl}${initializersStr} {`, ...(0, xrpa_utils_1.indent)(1, body), `}`);
            }
        }
        lines.push(``);
    }
    const hasDestructor = Boolean(classSpec.virtualDestructor || classSpec.destructorBody);
    if (hasDestructor && !isSourceMode(mode) && visibilityFilter === "public") {
        const destructorBody = typeof classSpec.destructorBody === "function" ? classSpec.destructorBody(includes) : (classSpec.destructorBody ?? []);
        const prefix = classSpec.virtualDestructor ? "virtual " : "";
        if (destructorBody.length === 0) {
            lines.push(`${prefix}~${classSpec.name}() = default;`, ``);
        }
        else {
            lines.push(`${prefix}~${classSpec.name}() {`, ...(0, xrpa_utils_1.indent)(1, destructorBody), `}`, ``);
        }
    }
    return lines;
}
function genClassDefinitionMethods(classSpec, includes, visibilityFilter, mode) {
    const lines = [];
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
            }
            else {
                if (def.isStatic) {
                    prefix += "static ";
                }
                if (def.isInline) {
                    isInline = true;
                }
            }
        }
        else if (mode === ClassGenMode.SOURCE_INLINE) {
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
            lines.push(...(def.decorations ?? []));
        }
        lines.push(...(def.templateParams ? [`template <${def.templateParams.map(p => `typename ${p}`).join(", ")}>`] : []));
        if (def.separateImplementation && mode === ClassGenMode.HEADER) {
            lines.push(`${decl};`);
        }
        else {
            if (def.isAbstract) {
                lines.push(`${decl} = 0;`);
            }
            else {
                const body = typeof def.body === "function" ? def.body(includes) : def.body;
                lines.push(`${decl} {`, ...(0, xrpa_utils_1.indent)(1, body), `}`);
            }
        }
        lines.push(``);
    }
    return lines;
}
function genClassDefinitionMembers(classSpec, includes, visibilityFilter, mode) {
    const lines = [];
    if (!isSourceMode(mode)) {
        for (const def of classSpec.members) {
            const visibility = def.visibility || "public";
            if (visibilityFilter !== visibility) {
                continue;
            }
            if (def.decorations?.length) {
                lines.push(``, ...def.decorations);
            }
            const varName = visibility === "public" ? def.name : privateMember(def.name);
            const typename = typeof def.type === "string" ? def.type : def.type.getLocalType(classSpec.namespace, includes);
            const initialValue = typeof def.type === "string" ? def.initialValue : def.type.getLocalDefaultValue(classSpec.namespace, includes, false, def.initialValue);
            lines.push(genDeclaration({
                typename,
                inNamespace: classSpec.namespace,
                varName,
                includeTerminator: true,
                initialValue: initialValue ?? new TypeValue_1.EmptyValue(module.exports, typename, classSpec.namespace),
                isStatic: def.isStatic,
                isConst: def.isConst,
            }));
            if (def.decorations?.length) {
                lines.push(``);
            }
        }
    }
    if (lines.length) {
        lines.push(``);
    }
    return lines;
}
function genClassDefinitionPublic(classSpec, includes, mode) {
    const lines = [
        ...genClassDefinitionConstructors(classSpec, includes, "public", mode),
        ...genClassDefinitionMembers(classSpec, includes, "public", mode),
        ...genClassDefinitionMethods(classSpec, includes, "public", mode),
    ];
    if (lines.length && !isSourceMode(mode)) {
        return [
            ` public:`,
            ...(0, xrpa_utils_1.indent)(1, lines),
        ];
    }
    return lines;
}
function genClassDefinitionProtected(classSpec, includes, mode) {
    const lines = [
        ...genClassDefinitionConstructors(classSpec, includes, "protected", mode),
        ...genClassDefinitionMethods(classSpec, includes, "protected", mode),
        ...genClassDefinitionMembers(classSpec, includes, "protected", mode),
    ];
    if (lines.length && !isSourceMode(mode)) {
        return [
            ` protected:`,
            ...(0, xrpa_utils_1.indent)(1, lines),
        ];
    }
    return lines;
}
function genClassDefinitionPrivate(classSpec, includes, mode) {
    const lines = [
        ...genClassDefinitionConstructors(classSpec, includes, "private", mode),
        ...genClassDefinitionMethods(classSpec, includes, "private", mode),
        ...genClassDefinitionMembers(classSpec, includes, "private", mode),
    ];
    if (lines.length && !isSourceMode(mode)) {
        return [
            ` private:`,
            ...(0, xrpa_utils_1.indent)(1, lines),
        ];
    }
    return lines;
}
function genClassHeaderDefinitionInternal(classSpec, mode) {
    const extStr = classSpec.superClass ? `: public ${classSpec.superClass} ` : "";
    const classNameDecorationStr = classSpec.classNameDecoration ? `${classSpec.classNameDecoration} ` : "";
    return (0, xrpa_utils_1.removeSuperfluousEmptyLines)([
        ...classSpec.decorations,
        ...(classSpec.templateParams ? [`template <${classSpec.templateParams.map(p => `typename ${p}`).join(", ")}>`] : []),
        `class ${classNameDecorationStr}${classSpec.name} ${extStr}{`,
        ...(0, xrpa_utils_1.indent)(1, classSpec.classEarlyInject),
        ...(classSpec.classEarlyInject.length ? [""] : []),
        ...(0, xrpa_utils_1.trimTrailingEmptyLines)([
            ...genClassDefinitionPublic(classSpec, classSpec.includes, mode),
            ...genClassDefinitionProtected(classSpec, classSpec.includes, mode),
            ...genClassDefinitionPrivate(classSpec, classSpec.includes, mode),
        ]),
        `};`,
        ``,
    ]);
}
function genClassDefinition(classSpec) {
    return genClassHeaderDefinitionInternal(classSpec, ClassGenMode.ALL);
}
exports.genClassDefinition = genClassDefinition;
function genClassHeaderDefinition(classSpec) {
    return genClassHeaderDefinitionInternal(classSpec, ClassGenMode.HEADER);
}
exports.genClassHeaderDefinition = genClassHeaderDefinition;
function genClassSourceDefinition(classSpec, includes, forceInline = false) {
    const mode = forceInline ? ClassGenMode.SOURCE_INLINE : ClassGenMode.SOURCE;
    return (0, xrpa_utils_1.removeSuperfluousEmptyLines)([
        ...genClassDefinitionPublic(classSpec, includes, mode),
        ...genClassDefinitionProtected(classSpec, includes, mode),
        ...genClassDefinitionPrivate(classSpec, includes, mode),
    ]);
}
exports.genClassSourceDefinition = genClassSourceDefinition;
function genReadValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}::readValue(${params.memAccessorVar}, ${params.fieldOffset})`;
    }
    else {
        const maxBytes = params.accessorMaxBytes !== null ? `, ${params.accessorMaxBytes}` : "";
        return `${params.memAccessorVar}.readValue<${params.accessor}>(${params.fieldOffset}${maxBytes})`;
    }
}
exports.genReadValue = genReadValue;
function genWriteValue(params) {
    if (params.accessorIsStruct) {
        return `${params.accessor}::writeValue(${params.value}, ${params.memAccessorVar}, ${params.fieldOffset})`;
    }
    else {
        const maxBytes = params.accessorMaxBytes !== null ? `, ${params.accessorMaxBytes}` : "";
        return `${params.memAccessorVar}.writeValue<${params.accessor}>(${params.value}, ${params.fieldOffset}${maxBytes})`;
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
    // TODO apply std::move to v if it is a non-primitive type
    const localTypeStr = params.localType.getLocalType(classSpec.namespace, classSpec.includes);
    const localInitializer = genInitializer(Object.values(params.fieldsToLocal).map(v => `${v}`));
    let localReturn = `${localTypeStr}${localInitializer}`;
    if (Object.keys(params.fieldsToLocal).length === 1 && localTypeStr === "float") {
        localReturn = localInitializer.slice(1, -1);
    }
    (0, assert_1.default)(gXrpaTypes, "Expected Xrpa types to be registered");
    classSpec.methods.push({
        name: "readValue",
        returnType: localTypeStr,
        parameters: [{
                name: "memAccessor",
                type: gXrpaTypes.MemoryAccessor,
            }, {
                name: "offset",
                type: "int32_t",
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
                type: gXrpaTypes.MemoryAccessor,
            }, {
                name: "offset",
                type: "int32_t",
            }],
        isStatic: true,
        body: fieldWrites,
    });
}
exports.genReadWriteValueFunctions = genReadWriteValueFunctions;
function genEnumDefinition(enumName, enumValues) {
    return [
        `enum class ${enumName}: uint32_t {`,
        ...(0, xrpa_utils_1.indent)(1, Object.keys(enumValues).map(v => `${v} = ${enumValues[v]},`)),
        `};`,
    ];
}
exports.genEnumDefinition = genEnumDefinition;
function genEnumDynamicConversion(targetTypename, value) {
    return `static_cast<${targetTypename}>(${value})`;
}
exports.genEnumDynamicConversion = genEnumDynamicConversion;
function getNullValue() {
    return "nullptr";
}
exports.getNullValue = getNullValue;
function genReferencePtrToID(varName, ptrType, dsIdentifierType) {
    const conditional = ptrType === "bare" ? varName : `${varName}.get()`;
    return `${conditional} ? ${varName}->getXrpaId() : ${dsIdentifierType}()`;
}
exports.genReferencePtrToID = genReferencePtrToID;
function genFieldGetter(classSpec, params) {
    if (!(0, TypeDefinition_1.typeIsStateData)(params.fieldType)) {
        return;
    }
    const decorations = genCommentLines(params.description);
    const fieldVar = params.fieldToMemberVar(params.fieldName);
    const funcName = `get${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const fieldType = params.fieldType;
    if ((0, TypeDefinition_1.typeIsReference)(fieldType)) {
        const returnType = fieldType.getReferencedSuperType(classSpec.namespace, classSpec.includes);
        classSpec.methods.push({
            decorations,
            name: funcName,
            returnType,
            parameters: [{
                    name: "datastore",
                    type: getDataStoreName(params.apiname) + "*",
                }],
            isConst: params.isConst,
            noDiscard: true,
            separateImplementation: true,
            visibility: params.visibility,
            body: includes => {
                const validLeafTypes = fieldType.getReferencedTypeList(classSpec.namespace, includes);
                return [
                    // TODO can this be implemented as ReferenceType.convertValueToLocal?
                    `return datastore->getObjectByID<${returnType}, ${validLeafTypes.join(", ")}>(${fieldVar});`,
                ];
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
            body: includes => {
                return [
                    `return ${fieldType.convertValueToLocal(classSpec.namespace, includes, fieldVar)};`,
                ];
            },
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
    const funcName = `set${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const paramType = isRef ? params.fieldType.dsIdentifierType : params.fieldType;
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
exports.genFieldSetter = genFieldSetter;
function genFieldChangedCheck(classSpec, params) {
    classSpec.methods.push({
        name: `check${(0, xrpa_utils_1.upperFirst)(params.fieldName)}Changed`,
        returnType: "bool",
        parameters: [{
                name: "fieldsChanged",
                type: "uint64_t",
            }],
        visibility: params.visibility,
        isConst: true,
        isInline: true,
        body: includes => [
            `return fieldsChanged & ${params.parentType.getChangedBit(classSpec.namespace, includes, params.fieldName)};`,
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
        return `${params.dsIdentifierType}(${params.idParts.join(", ")})`;
    }
    for (const entry of params.guidGen.includes ?? []) {
        params.includes?.addFile(entry);
    }
    return `${params.dsIdentifierType}(${params.guidGen.code})`;
}
exports.genRuntimeGuid = genRuntimeGuid;
function genDeref(ptrName, memberName) {
    return `${ptrName}->${memberName}`;
}
exports.genDeref = genDeref;
function genDerefMethodCall(ptrName, methodName, params) {
    const methodCall = `${(0, xrpa_utils_1.lowerFirst)(methodName)}(${params.join(", ")})`;
    if (!ptrName) {
        return methodCall;
    }
    return `${ptrName}->${methodCall}`;
}
exports.genDerefMethodCall = genDerefMethodCall;
function genMethodBind(ptrName, methodName, params, bindParamCount) {
    const bindParams = new Array(bindParamCount).fill("auto");
    const methodCall = `${(0, xrpa_utils_1.lowerFirst)(methodName)}(${params.join(", ")})`;
    if (!ptrName) {
        return `[this](${bindParams.join(", ")}) { ${methodCall}; }`;
    }
    return `[${ptrName}](${bindParams.join(", ")}) { ${ptrName}->${methodCall}; }`;
}
exports.genMethodBind = genMethodBind;
function genNonNullCheck(ptrName) {
    return ptrName;
}
exports.genNonNullCheck = genNonNullCheck;
function genCreateObject(type, params) {
    return `std::make_shared<${type}>(${params.join(", ")})`;
}
exports.genCreateObject = genCreateObject;
function genObjectPtrType(type) {
    return `std::shared_ptr<${type}>`;
}
exports.genObjectPtrType = genObjectPtrType;
function refParam(varName) {
    return varName;
}
exports.refParam = refParam;
//# sourceMappingURL=CppCodeGenImpl.js.map
