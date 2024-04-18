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
exports.genSyntheticObjectClassSpec = void 0;
const assert_1 = __importDefault(require("assert"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const Helpers_1 = require("../../shared/Helpers");
const StructType_1 = require("../../shared/StructType");
const TypeDefinition_1 = require("../../shared/TypeDefinition");
const TypeValue_1 = require("../../shared/TypeValue");
function isXrpaObjectDef(value) {
    return Boolean(value && typeof value === "object" && value.__isXrpaObjectDef);
}
function isXrpaParamDef(value) {
    return Boolean(value && typeof value === "object" && value.__isXrpaParamDef);
}
function paramToMemberName(codegen, paramName) {
    return codegen.privateMember(`param${(0, Helpers_1.upperFirst)(paramName)}`);
}
function objToMemberName(codegen, objName) {
    return codegen.privateMember(`obj${(0, Helpers_1.upperFirst)(objName)}`);
}
function storeToMemberName(codegen, storeName) {
    return codegen.privateMember(`datastore${(0, Helpers_1.upperFirst)(storeName)}`);
}
function getInfoForObj(ctx, codegen, objDef, includes) {
    const objName = objDef.name;
    const reconcilerDef = ctx.storeDef.getOutputReconcilers().find(reconcilerDef => reconcilerDef.type.getName() === objDef.collectionType);
    (0, assert_1.default)(reconcilerDef, `Output reconciler for ${objDef.collectionType} not found for ${objName}`);
    return {
        objName,
        objType: reconcilerDef.type.getLocalType(ctx.namespace, includes),
        reconcilerName: reconcilerDef.getDataStoreAccessorName(),
        objVarName: objToMemberName(codegen, objName),
        reconcilerDef,
    };
}
function genParameterAccessors(ctx, codegen, classSpec, objectDef) {
    const paramsStruct = new StructType_1.StructType(codegen, "SyntheticObjectParams", codegen.XRPA_NAMESPACE, undefined, objectDef.buildStructSpec(ctx.storeDef.datamodel));
    const fields = paramsStruct.getAllFields();
    for (const paramName in fields) {
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
        });
        classSpec.methods.push({
            name: `set${(0, Helpers_1.upperFirst)(paramName)}`,
            parameters: [{
                    name: paramName,
                    type: fieldType,
                }],
            body: () => [
                // set the local member value
                `${memberName} = ${paramName};`,
                // set the field value on connected datastore objects
                ...(0, Helpers_1.mapAndCollapse)(objectDef.getParamConnections(paramName), connection => {
                    const objMemberName = objToMemberName(codegen, connection.target.name);
                    return [
                        `if (${codegen.genNonNullCheck(objMemberName)}) {`,
                        `  ${codegen.genDerefMethodCall(objMemberName, `set${(0, Helpers_1.upperFirst)(connection.fieldName)}`, [paramName])};`,
                        `}`,
                    ];
                }),
            ],
        });
    }
}
function genCreateObjectsBody(ctx, codegen, objectDef, includes) {
    const createLines = [];
    const updateLines = [];
    const idCall = codegen.genRuntimeGuid({
        dsIdentifierType: ctx.storeDef.moduleDef.DSIdentifier.getLocalType(ctx.namespace, includes),
        guidGen: ctx.storeDef.moduleDef.guidGen,
        includes,
    });
    const storeVarName = storeToMemberName(codegen, ctx.storeDef.apiname);
    for (const objDef of objectDef.objDefs) {
        const { objType, reconcilerDef, reconcilerName, objVarName } = getInfoForObj(ctx, codegen, objDef, includes);
        // create object
        createLines.push(`${objVarName} = ${codegen.genCreateObject(objType, [idCall])};`, `${codegen.genDerefMethodCall(codegen.genDeref(storeVarName, reconcilerName), "addObject", [objVarName])};`);
        // set field values
        const fields = reconcilerDef.type.getAllFields();
        for (const fieldName in objDef.fieldValues) {
            if (!(fieldName in fields)) {
                continue;
            }
            const fieldValue = objDef.fieldValues[fieldName];
            let value = undefined;
            if (isXrpaObjectDef(fieldValue)) {
                value = getInfoForObj(ctx, codegen, fieldValue, includes).objVarName;
            }
            else if (isXrpaParamDef(fieldValue)) {
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
            updateLines.push(`${codegen.genDerefMethodCall(objVarName, `set${(0, Helpers_1.upperFirst)(fieldName)}`, [value.toString()])};`);
        }
    }
    if (objectDef.selfTerminateEvent) {
        const { objVarName } = getInfoForObj(ctx, codegen, objectDef.selfTerminateEvent.target, includes);
        updateLines.push(`if (${codegen.genNonNullCheck(objVarName)}) {`, `  ${codegen.genDerefMethodCall(objVarName, `on${(0, Helpers_1.upperFirst)(objectDef.selfTerminateEvent.fieldName)}`, [codegen.genMethodBind("", "terminate", [], 2)])};`, `}`);
    }
    return createLines.concat(updateLines);
}
function genDestroyObjectsBody(ctx, codegen, objectDef, includes) {
    const lines = [];
    const storeVarName = storeToMemberName(codegen, ctx.storeDef.apiname);
    for (const objDef of objectDef.objDefs) {
        const { reconcilerName, objVarName } = getInfoForObj(ctx, codegen, objDef, includes);
        const objId = codegen.genDerefMethodCall(objVarName, "getDSID", []);
        lines.unshift(`if (${codegen.genNonNullCheck(objVarName)}) {`, `  ${codegen.genDerefMethodCall(codegen.genDeref(storeVarName, reconcilerName), "removeObject", [objId])};`, `  ${objVarName} = ${codegen.getNullValue()};`, `}`);
    }
    return lines;
}
// TODO add support for inbound and outbound message params
// TODO add support for inbound fields
function genSyntheticObjectClassSpec(ctx, codegen, syntheticObjectName, objectDef, includes) {
    const classSpec = new ClassSpec_1.ClassSpec({
        name: syntheticObjectName,
        namespace: ctx.namespace,
        includes,
    });
    // constructor/destructor and datastore pointer
    const storePtrType = codegen.genObjectPtrType(codegen.getDataStoreName(ctx.storeDef.apiname));
    const storeVarName = storeToMemberName(codegen, ctx.storeDef.apiname);
    classSpec.members.push({
        name: storeVarName,
        type: storePtrType,
        visibility: "private",
    });
    classSpec.constructors.push({
        parameters: [{
                name: "datastore",
                type: storePtrType,
            }],
        memberInitializers: [
            [storeVarName, "datastore"],
        ],
        body: () => [
            `${codegen.genDerefMethodCall("", "createObjects", [])};`,
        ],
    });
    classSpec.destructorBody = () => [
        `${codegen.genDerefMethodCall("", "destroyObjects", [])};`,
    ];
    // parameter accessors
    genParameterAccessors(ctx, codegen, classSpec, objectDef);
    // declare member variables for each object
    for (const objDef of objectDef.objDefs) {
        const { objName, objType } = getInfoForObj(ctx, codegen, objDef, classSpec.includes);
        classSpec.members.push({
            name: objToMemberName(codegen, objName),
            type: codegen.genObjectPtrType(objType),
            visibility: "private",
        });
    }
    classSpec.methods.push({
        name: "createObjects",
        body: includes => genCreateObjectsBody(ctx, codegen, objectDef, includes),
        visibility: "private",
    });
    classSpec.methods.push({
        name: "destroyObjects",
        body: includes => genDestroyObjectsBody(ctx, codegen, objectDef, includes),
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
exports.genSyntheticObjectClassSpec = genSyntheticObjectClassSpec;
//# sourceMappingURL=GenSyntheticObjectShared.js.map
