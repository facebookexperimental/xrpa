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
exports.reverseProgramDirectionality = exports.reverseDirectionality = exports.propagatePropertiesToInterface = exports.XrpaProgramInterface = exports.UppercaseCompanyName = exports.ProgramOutput = exports.ProgramInput = exports.getDirectionality = exports.IfOutput = exports.IfInput = exports.Output = exports.Input = exports.getProgramInterfaceContext = exports.isProgramInterfaceContext = exports.isXrpaProgramParam = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const simply_immutable_1 = require("simply-immutable");
const DataflowProgram_1 = require("./DataflowProgram");
const InterfaceTypes_1 = require("./InterfaceTypes");
const XrpaLanguage_1 = require("./XrpaLanguage");
const DataflowProgramDefinition_1 = require("./shared/DataflowProgramDefinition");
const DIRECTIONALITY = (0, XrpaLanguage_1.InheritedProperty)("xrpa.directionality");
function isXrpaProgramParam(param) {
    return typeof param === "object" && param !== null && param.__isXrpaProgramParam === true;
}
exports.isXrpaProgramParam = isXrpaProgramParam;
function isProgramInterfaceContext(ctx) {
    return typeof ctx === "object" && ctx !== null && ctx.__isProgramInterfaceContext === true;
}
exports.isProgramInterfaceContext = isProgramInterfaceContext;
function getProgramInterfaceContext() {
    return (0, xrpa_utils_1.getContext)(isProgramInterfaceContext, "Call is only valid within a ProgramInterface");
}
exports.getProgramInterfaceContext = getProgramInterfaceContext;
function Input(dataType) {
    return (0, XrpaLanguage_1.setProperty)((0, xrpa_utils_1.resolveThunk)(dataType), DIRECTIONALITY, "inbound");
}
exports.Input = Input;
function Output(dataType) {
    return (0, XrpaLanguage_1.setProperty)((0, xrpa_utils_1.resolveThunk)(dataType), DIRECTIONALITY, "outbound");
}
exports.Output = Output;
exports.IfInput = {
    propertyToCheck: DIRECTIONALITY,
    expectedValue: "inbound",
};
exports.IfOutput = {
    propertyToCheck: DIRECTIONALITY,
    expectedValue: "outbound",
};
function getDirectionality(dataType) {
    return (0, XrpaLanguage_1.evalProperty)(dataType.properties, DIRECTIONALITY);
}
exports.getDirectionality = getDirectionality;
function programParamToString() {
    return `{{{param:${this.name}}}}`;
}
function ProgramInput(name, dataType) {
    const ctx = getProgramInterfaceContext();
    (0, assert_1.default)(!ctx.parameters[name], `Program already has a parameter with the name "${name}"`);
    if (!dataType) {
        // call getDataflowProgramContext() to assert this is in a dataflow program
        (0, DataflowProgram_1.getDataflowProgramContext)();
        dataType = (0, InterfaceTypes_1.LateBindingType)();
    }
    if ((0, XrpaLanguage_1.isNamedDataType)(dataType)) {
        dataType = (0, XrpaLanguage_1.NameType)(name, dataType);
    }
    const ret = {
        __isXrpaProgramParam: true,
        toString: programParamToString,
        name,
        dataType: Input(dataType),
    };
    ctx.parameters[name] = ret;
    return ret;
}
exports.ProgramInput = ProgramInput;
function ProgramOutput(name, val) {
    const ctx = getProgramInterfaceContext();
    (0, assert_1.default)(!ctx.parameters[name], `Program already has a parameter with the name "${name}"`);
    let dataType;
    let source;
    if ((0, DataflowProgram_1.isDataflowConnection)(val)) {
        source = val;
        (0, assert_1.default)((0, DataflowProgram_1.isDataflowProgramContext)(ctx), "A dataflow connection can only be used as a ProgramOutput in a dataflow program");
        if ((0, DataflowProgram_1.isDataflowForeignObjectInstantiation)(source.targetNode)) {
            dataType = source.targetNode.collectionType.fieldsStruct.fields[source.targetPort] ??
                source.targetNode.collectionType.interfaceType?.fieldsStruct.fields[source.targetPort];
            (0, assert_1.default)(dataType, `Dataflow connection "${source.targetNode.collectionName}.${source.targetPort}" does not exist`);
            (0, assert_1.default)(getDirectionality(dataType) === "outbound", `Dataflow connection "${source.targetNode.name}.${source.targetPort}" is not an output`);
        }
        else if ((0, DataflowProgramDefinition_1.isDataflowStringEmbedding)(source.targetNode)) {
            dataType = (0, InterfaceTypes_1.String)();
        }
        else {
            (0, assert_1.default)(false, `Dataflow connection "${source.targetNode.name}.${source.targetPort}" is an invalid type`);
        }
    }
    else if (typeof val === "string") {
        (0, assert_1.default)((0, DataflowProgram_1.isDataflowProgramContext)(ctx), "A string embedding can only be used as a ProgramOutput in a dataflow program");
        const node = (0, DataflowProgram_1.StringEmbedding)(ctx, val);
        source = (0, DataflowProgram_1.ObjectField)(node, "value");
        dataType = (0, InterfaceTypes_1.String)();
    }
    else {
        dataType = val;
    }
    (0, assert_1.default)(dataType);
    if ((0, XrpaLanguage_1.isNamedDataType)(dataType)) {
        dataType = (0, XrpaLanguage_1.NameType)(name, dataType);
    }
    const ret = {
        __isXrpaProgramParam: true,
        toString: programParamToString,
        name,
        dataType: Output(dataType),
        source,
    };
    ctx.parameters[name] = ret;
    return ret;
}
exports.ProgramOutput = ProgramOutput;
function UppercaseCompanyName(programInterface) {
    return (0, simply_immutable_1.updateImmutable)(programInterface, ["companyName"], programInterface.companyName.toUpperCase());
}
exports.UppercaseCompanyName = UppercaseCompanyName;
function hasSameKeys(a, b) {
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
function isSameType(a, b) {
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
            (0, assert_1.default)((0, InterfaceTypes_1.isStructDataType)(a) && (0, InterfaceTypes_1.isStructDataType)(b), `Types with fields should be structs`);
            if (!hasSameKeys(a.fields, b.fields)) {
                return false;
            }
            for (const fieldKey in a.fields) {
                if (!isSameType(a.fields[fieldKey], b.fields[fieldKey])) {
                    return false;
                }
            }
        }
        else if (key === "fieldsStruct") {
            (0, assert_1.default)((0, InterfaceTypes_1.hasFieldsStruct)(a) && (0, InterfaceTypes_1.hasFieldsStruct)(b), `Types with fieldsStruct should be collections, interfaces, or messages`);
            if (!isSameType(a.fieldsStruct, b.fieldsStruct)) {
                return false;
            }
        }
        else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
            return false;
        }
    }
    return true;
}
class NamedTypeAggregator {
    constructor() {
        this.namedTypes = {};
    }
    preRecursion(dataType, fieldPath) {
        // make sure it has a name
        if (!dataType.name) {
            dataType = (0, simply_immutable_1.replaceImmutable)(dataType, ["name"], (0, xrpa_utils_1.upperFirst)(fieldPath[fieldPath.length - 1]));
        }
        return dataType;
    }
    postRecursion(dataType, fieldPath, isSubStruct) {
        // aggregate named types
        if (!isSubStruct && (0, XrpaLanguage_1.isNamedDataType)(dataType)) {
            this.namedTypes[dataType.name] = this.namedTypes[dataType.name] ?? [];
            this.namedTypes[dataType.name].push({
                dataType,
                fieldPath,
            });
        }
        return dataType;
    }
}
class TypeReplacer {
    constructor(namedTypes, replaceList) {
        this.namedTypes = namedTypes;
        this.replaceList = replaceList;
    }
    preRecursion(dataType) {
        for (const { oldDataType, newName } of this.replaceList) {
            if (isSameType(dataType, oldDataType)) {
                dataType = (0, simply_immutable_1.replaceImmutable)(dataType, ["name"], newName);
            }
        }
        return dataType;
    }
    postRecursion(dataType) {
        this.namedTypes[dataType.name] = dataType;
        return dataType;
    }
}
function XrpaProgramInterface(name, callback) {
    const split = name.split(".");
    (0, assert_1.default)(split.length == 2, `Program interface name must be in the form "<company>.<name>"`);
    const ctx = {
        __isProgramInterfaceContext: true,
        parameters: {},
        properties: {},
    };
    (0, xrpa_utils_1.runInContext)(ctx, callback);
    const programInterface = {
        ...ctx,
        companyName: split[0],
        interfaceName: split[1],
        namedTypes: {},
    };
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
        param.dataType = (0, InterfaceTypes_1.walkTypeTree)(aggregator, [...fieldPath, param.name], param.dataType, programInterface.properties);
    }
    // disambiguate type names
    const replaceList = [];
    const namesUsed = {};
    for (const name in aggregator.namedTypes) {
        const types = aggregator.namedTypes[name];
        if (types.length == 1) {
            namesUsed[name] = true;
            continue;
        }
        const resolvedTypes = [];
        for (const type of types) {
            let found;
            for (const resolved of resolvedTypes) {
                if (isSameType(type.dataType, resolved[0].dataType)) {
                    found = resolved;
                    break;
                }
            }
            if (found) {
                found.push({ ...type, disambiguatedName: "" });
            }
            else {
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
            const newNames = {};
            ++prefixLength;
            namesValid = true;
            for (const resolved of resolvedTypes) {
                const prefix = resolved[0].fieldPath.slice(-prefixLength).map(xrpa_utils_1.upperFirst).join("");
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
        param.dataType = (0, InterfaceTypes_1.walkTypeTree)(replacer, [], param.dataType, programInterface.properties);
        param.dataType = (0, InterfaceTypes_1.propagateInheritableProperties)(param.dataType, programInterface.properties);
    }
    return (0, xrpa_utils_1.safeDeepFreeze)(programInterface);
}
exports.XrpaProgramInterface = XrpaProgramInterface;
function propagatePropertiesToInterface(programInterface, properties) {
    for (const key in programInterface.parameters) {
        const param = programInterface.parameters[key];
        programInterface = (0, simply_immutable_1.replaceImmutable)(programInterface, ["parameters", key, "dataType"], (0, InterfaceTypes_1.propagateInheritableProperties)(param.dataType, properties));
    }
    return programInterface;
}
exports.propagatePropertiesToInterface = propagatePropertiesToInterface;
const DirectionalityReverser = {
    allTypes(dataType) {
        const directionality = getDirectionality(dataType);
        if (directionality === undefined) {
            return dataType;
        }
        return (0, XrpaLanguage_1.setProperty)(dataType, DIRECTIONALITY, directionality === "inbound" ? "outbound" : "inbound");
    }
};
function reverseDirectionality(dataType) {
    return (0, InterfaceTypes_1.walkTypeTree)(DirectionalityReverser, [], dataType, {});
}
exports.reverseDirectionality = reverseDirectionality;
function reverseProgramDirectionality(programInterface) {
    for (const key in programInterface.parameters) {
        const param = programInterface.parameters[key];
        programInterface = (0, simply_immutable_1.replaceImmutable)(programInterface, ["parameters", key, "dataType"], reverseDirectionality(param.dataType));
    }
    return programInterface;
}
exports.reverseProgramDirectionality = reverseProgramDirectionality;
//# sourceMappingURL=ProgramInterface.js.map
