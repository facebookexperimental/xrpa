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
exports.genDataflowProgramClassSpec = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const StructType_1 = require("../../shared/StructType");
const DataflowProgramDefinition_1 = require("../../shared/DataflowProgramDefinition");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
const ProgramInterface_1 = require("../../ProgramInterface");
function paramToMemberName(codegen, paramName) {
    return codegen.privateMember(`param${(0, xrpa_utils_1.upperFirst)(paramName)}`);
}
function objToMemberName(codegen, objName) {
    return codegen.privateMember(`obj${(0, xrpa_utils_1.upperFirst)(objName)}`);
}
function storeToVarName(storeName) {
    return `datastore${(0, xrpa_utils_1.upperFirst)(storeName)}`;
}
function getDataStoreForObj(ctx, graphNode) {
    (0, assert_1.default)((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode));
    const storeDef = ctx.moduleDef.getDataStore(graphNode.programInterfaceName);
    (0, assert_1.default)(storeDef, `Data store ${graphNode.programInterfaceName} not found for ${graphNode.name}`);
    return storeDef;
}
function getInfoForObj(ctx, codegen, graphNode, includes) {
    (0, assert_1.default)((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode));
    const objName = graphNode.name;
    const storeDef = getDataStoreForObj(ctx, graphNode);
    const reconcilerDef = storeDef.getOutputReconcilers().find(reconcilerDef => reconcilerDef.type.getName() === graphNode.collectionType);
    (0, assert_1.default)(reconcilerDef, `Output reconciler for ${graphNode.collectionType} not found for ${objName}`);
    return {
        objName,
        objType: reconcilerDef.type.getLocalType(ctx.namespace, includes),
        reconcilerName: reconcilerDef.type.getName(),
        objVarName: objToMemberName(codegen, objName),
        reconcilerDef,
        storeDef,
    };
}
function genParameterAccessors(ctx, codegen, classSpec, programDef) {
    const inputs = (0, DataflowProgramDefinition_1.getDataflowInputs)(programDef);
    const paramsStruct = new StructType_1.StructType(codegen, "DataflowProgramParams", codegen.XRPA_NAMESPACE, undefined, (0, DataflowProgramDefinition_1.getDataflowInputStructSpec)(inputs, ctx.moduleDef));
    const fields = paramsStruct.getAllFields();
    for (const inputDef of inputs) {
        const paramName = inputDef.parameter.name;
        const memberName = paramToMemberName(codegen, paramName);
        const fieldType = fields[paramName].type;
        paramsStruct.declareLocalFieldClassMember(classSpec, paramName, memberName, true, [], "private");
        codegen.genFieldGetter(classSpec, {
            apiname: codegen.XRPA_NAMESPACE,
            fieldName: paramName,
            fieldType,
            fieldToMemberVar: fieldName => paramToMemberName(codegen, fieldName),
            convertToLocal: false,
            description: fields[paramName].description,
            visibility: "public",
            isConst: true,
        });
        classSpec.methods.push({
            name: `set${(0, xrpa_utils_1.upperFirst)(paramName)}`,
            parameters: [{
                    name: paramName,
                    type: fieldType,
                }],
            body: () => [
                // set the local member value
                `${memberName} = ${paramName};`,
                // set the field value on connected datastore objects
                ...(0, xrpa_utils_1.mapAndCollapse)(inputDef.connections, connection => {
                    (0, assert_1.default)((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(connection.targetNode));
                    const objMemberName = objToMemberName(codegen, connection.targetNode.name);
                    return [
                        `if (${codegen.genNonNullCheck(objMemberName)}) {`,
                        `  ${codegen.genDerefMethodCall(objMemberName, `set${(0, xrpa_utils_1.upperFirst)(connection.targetPort)}`, [paramName])};`,
                        `}`,
                    ];
                }),
            ],
        });
    }
}
function genCreateObjectsBody(ctx, codegen, programDef, includes) {
    const createLines = [];
    const updateLines = [];
    const idCall = codegen.genRuntimeGuid({
        objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, includes),
        guidGen: ctx.moduleDef.guidGen,
        includes,
    });
    for (const graphNode of programDef.graphNodes) {
        (0, assert_1.default)((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode));
        const { objType, reconcilerDef, reconcilerName, objVarName, storeDef } = getInfoForObj(ctx, codegen, graphNode, includes);
        const storeMemberName = codegen.privateMember(storeToVarName(storeDef.apiname));
        // create object
        createLines.push(`${objVarName} = ${codegen.genCreateObject(objType, [idCall])};`, `${codegen.genDerefMethodCall(codegen.genDeref(storeMemberName, reconcilerName), "addObject", [objVarName])};`);
        // set field values
        const fields = reconcilerDef.type.getAllFields();
        for (const fieldName in graphNode.fieldValues) {
            if (!(fieldName in fields)) {
                continue;
            }
            const fieldValue = graphNode.fieldValues[fieldName];
            let value = undefined;
            if ((0, DataflowProgramDefinition_1.isDataflowGraphNode)(fieldValue)) {
                value = getInfoForObj(ctx, codegen, fieldValue, includes).objVarName;
            }
            else if ((0, ProgramInterface_1.isXrpaProgramParam)(fieldValue)) {
                value = paramToMemberName(codegen, fieldValue.name);
            }
            else if (fieldValue !== undefined) {
                const fieldType = reconcilerDef.type.getAllFields()[fieldName].type;
                const fieldTypeName = fieldType.getLocalType(ctx.namespace, includes);
                if ((0, TypeDefinition_1.typeIsEnum)(fieldType)) {
                    value = codegen.genEnumDynamicConversion(fieldTypeName, new TypeValue_1.CodeLiteralValue(codegen, `${fieldValue}`));
                }
                else {
                    value = codegen.genPrimitiveValue(fieldTypeName, fieldValue);
                }
            }
            else {
                continue;
            }
            updateLines.push(`${codegen.genDerefMethodCall(objVarName, `set${(0, xrpa_utils_1.upperFirst)(fieldName)}`, [value.toString()])};`);
        }
    }
    for (const connection of programDef.selfTerminateEvents) {
        const { objVarName } = getInfoForObj(ctx, codegen, connection.targetNode, includes);
        updateLines.push(`if (${codegen.genNonNullCheck(objVarName)}) {`, `  ${codegen.genDerefMethodCall(objVarName, `on${(0, xrpa_utils_1.upperFirst)(connection.targetPort)}`, [codegen.genMethodBind("", "terminate", [], 2)])};`, `}`);
    }
    return createLines.concat(updateLines);
}
function genDestroyObjectsBody(ctx, codegen, programDef, includes) {
    const lines = [];
    for (const graphNode of programDef.graphNodes) {
        const { reconcilerName, objVarName, storeDef } = getInfoForObj(ctx, codegen, graphNode, includes);
        const storeMemberName = codegen.privateMember(storeToVarName(storeDef.apiname));
        const objId = codegen.genDerefMethodCall(objVarName, "getXrpaId", []);
        lines.unshift(`if (${codegen.genNonNullCheck(objVarName)}) {`, `  ${codegen.genDerefMethodCall(codegen.genDeref(storeMemberName, reconcilerName), "removeObject", [objId])};`, `  ${objVarName} = ${codegen.getNullValue()};`, `}`);
    }
    return lines;
}
// TODO add support for inbound and outbound message params
// TODO add support for inbound fields
function genDataflowProgramClassSpec(ctx, codegen, programDef, includes) {
    const classSpec = new ClassSpec_1.ClassSpec({
        name: programDef.interfaceName,
        namespace: ctx.namespace,
        includes,
    });
    // constructor/destructor and datastore pointer
    const constructorParams = [];
    const memberInitializers = [];
    for (const storeName of programDef.programInterfaceNames) {
        const storeDef = ctx.moduleDef.getDataStore(storeName);
        const dataStoreClassName = codegen.getDataStoreClass(storeDef.apiname, classSpec.namespace, classSpec.includes);
        const storePtrType = codegen.genObjectPtrType(dataStoreClassName);
        const storeVarName = storeToVarName(storeDef.apiname);
        classSpec.members.push({
            name: storeVarName,
            type: storePtrType,
            visibility: "private",
        });
        constructorParams.push({
            name: storeVarName,
            type: storePtrType,
        });
        memberInitializers.push([codegen.privateMember(storeVarName), storeVarName]);
    }
    classSpec.constructors.push({
        parameters: constructorParams,
        memberInitializers,
        body: () => [
            `${codegen.genDerefMethodCall("", "createObjects", [])};`,
        ],
    });
    classSpec.destructorBody = () => [
        `${codegen.genDerefMethodCall("", "destroyObjects", [])};`,
    ];
    // parameter accessors
    genParameterAccessors(ctx, codegen, classSpec, programDef);
    // declare member variables for each object
    for (const graphNode of programDef.graphNodes) {
        const { objName, objType } = getInfoForObj(ctx, codegen, graphNode, classSpec.includes);
        classSpec.members.push({
            name: objToMemberName(codegen, objName),
            type: codegen.genObjectPtrType(objType),
            visibility: "private",
        });
    }
    classSpec.methods.push({
        name: "createObjects",
        body: includes => genCreateObjectsBody(ctx, codegen, programDef, includes),
        visibility: "private",
    });
    classSpec.methods.push({
        name: "destroyObjects",
        body: includes => genDestroyObjectsBody(ctx, codegen, programDef, includes),
        visibility: "private",
    });
    classSpec.methods.push({
        name: "terminate",
        body: () => [
            `${codegen.genDerefMethodCall("", "destroyObjects", [])};`,
        ],
        visibility: "public",
    });
    return classSpec;
}
exports.genDataflowProgramClassSpec = genDataflowProgramClassSpec;
//# sourceMappingURL=GenDataflowProgramShared.js.map
