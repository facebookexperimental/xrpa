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
function getInfoForObj(ctx, codegen, graphNode, includes) {
    (0, assert_1.default)((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode));
    const reconcilerDef = (0, DataflowProgramDefinition_1.getReconcilerDefForNode)(ctx.moduleDef, graphNode);
    return {
        objName: graphNode.name,
        objType: reconcilerDef.type.getLocalType(ctx.namespace, includes),
        reconcilerName: reconcilerDef.type.getName(),
        objVarName: objToMemberName(codegen, graphNode.name),
        reconcilerDef,
        storeDef: reconcilerDef.storeDef,
    };
}
function getMessageValues(fieldType) {
    return Object.keys(fieldType.getAllFields()).map(msgField => {
        return `msg${(0, xrpa_utils_1.upperFirst)(msgField)}`;
    });
}
function onMessage(codegen, classSpec, params) {
    const dispatcherName = `dispatch${(0, xrpa_utils_1.upperFirst)(params.objVar)}${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`;
    const dispatcherBody = classSpec.getOrCreateMethod({
        name: dispatcherName,
        parameters: [{
                name: "timestamp",
                type: codegen.PRIMITIVE_INTRINSICS.uint64.typename,
            }, {
                name: "msg",
                type: params.fieldType.getReadAccessorType(classSpec.namespace, classSpec.includes),
            }],
        visibility: "private",
    });
    if (dispatcherBody.length === 0) {
        params.initializersOut.push(`${codegen.genDerefMethodCall(params.objVar, `on${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`, [
            codegen.genPassthroughMethodBind(dispatcherName, 2),
        ])};`);
    }
    if (params.needsMsgValues) {
        // fetch all message fields and store them in local variables
        const varInitializers = getMessageValues(params.fieldType).map(varName => {
            return codegen.declareVar(`${varName}`, "", codegen.genMethodCall("msg", `get${varName.slice(3)}`, []));
        });
        // check if the dispatcherBody already starts with the varInitializers and add them if not
        if (dispatcherBody.length === 0 || dispatcherBody[0] !== varInitializers[0]) {
            dispatcherBody.unshift(...varInitializers);
        }
    }
    dispatcherBody.push(...params.code);
}
function onSignal(codegen, classSpec, params) {
    const signalForwarder = codegen.privateMember(params.objVar + (0, xrpa_utils_1.upperFirst)(params.fieldName) + "Forwarder");
    if (classSpec.members.find(m => m.name === signalForwarder) === undefined) {
        classSpec.members.push({
            name: signalForwarder,
            type: codegen.genObjectPtrType(codegen.getXrpaTypes().InboundSignalForwarder.getLocalType(classSpec.namespace, classSpec.includes)),
            visibility: "private",
        });
        params.initializersOut.push(`${signalForwarder} = ${codegen.genCreateObject(codegen.getXrpaTypes().InboundSignalForwarder.getLocalType(classSpec.namespace, classSpec.includes), [])};`, `${codegen.genDerefMethodCall(params.objVar, `on${(0, xrpa_utils_1.upperFirst)(params.fieldName)}`, [signalForwarder])};`);
    }
    return signalForwarder;
}
function onFieldChanged(codegen, classSpec, params) {
    const dispatcherName = `dispatch${(0, xrpa_utils_1.upperFirst)(params.objVar)}FieldsChanged`;
    const dispatcherBody = classSpec.getOrCreateMethod({
        name: dispatcherName,
        parameters: [{
                name: "fieldsChanged",
                type: codegen.PRIMITIVE_INTRINSICS.uint64.typename,
            }],
        visibility: "private",
    });
    if (dispatcherBody.length === 0) {
        params.initializersOut.push(`${codegen.genDerefMethodCall(params.objVar, `onXrpaFieldsChanged`, [
            codegen.genPassthroughMethodBind(dispatcherName, 1),
        ])};`);
    }
    dispatcherBody.push(...codegen.ifAnyBitIsSet("fieldsChanged", params.bitMask, params.code));
}
function genBindMessageFieldValues(codegen, classSpec, params) {
    const srcFieldType = params.srcFieldType;
    if (!(0, TypeDefinition_1.typeIsMessageData)(srcFieldType)) {
        console.error("Attempted to bind non-message field as an input to a message field", {
            srcObjVar: params.srcObjVar,
            srcFieldName: params.srcFieldName,
            srcFieldType: srcFieldType.getName(),
        });
        throw new Error(`Attempted to bind non-message field as an input to a message field`);
    }
    // TODO verify that the field types are compatible
    onMessage(codegen, classSpec, {
        objVar: params.srcObjVar,
        fieldName: params.srcFieldName,
        fieldType: srcFieldType,
        code: [
            `${codegen.genDerefMethodCall(params.dstObjVar, codegen.methodMember(`send${(0, xrpa_utils_1.upperFirst)(params.dstFieldName)}`), getMessageValues(srcFieldType))};`,
        ],
        initializersOut: params.initializersOut,
        needsMsgValues: true,
    });
}
function genMessageOutputParameter(codegen, classSpec, params) {
    const srcFieldType = params.srcFieldType;
    if (!(0, TypeDefinition_1.typeIsMessageData)(srcFieldType)) {
        console.error("Attempted to bind non-message field as an input to a message output parameter", {
            srcObjVar: params.srcObjVar,
            srcFieldName: params.srcFieldName,
            srcFieldType: srcFieldType.getName(),
            paramName: params.paramName,
        });
        throw new Error(`Attempted to bind non-message field as an input to a message output parameter`);
    }
    // TODO verify that the field types are compatible
    const memberName = paramToMemberName(codegen, params.paramName);
    codegen.genOnMessageAccessor(classSpec, {
        namespace: classSpec.namespace,
        fieldName: params.paramName,
        fieldType: params.paramType,
        genMsgHandler: () => memberName,
    });
    const dispatchCode = codegen.genMessageDispatch({
        namespace: classSpec.namespace,
        includes: classSpec.includes,
        fieldName: params.paramName,
        fieldType: params.paramType,
        genMsgHandler: () => memberName,
        msgDataToParams: () => ["msg"],
        convertToReadAccessor: false,
    });
    onMessage(codegen, classSpec, {
        objVar: params.srcObjVar,
        fieldName: params.srcFieldName,
        fieldType: srcFieldType,
        code: dispatchCode,
        initializersOut: params.initializersOut,
        needsMsgValues: false,
    });
}
function genBindSignalFieldValues(codegen, classSpec, params) {
    if (!(0, TypeDefinition_1.typeIsSignalData)(params.srcFieldType)) {
        console.error("Attempted to bind non-signal field as an input to a signal field", {
            srcObjVar: params.srcObjVar,
            srcFieldName: params.srcFieldName,
            srcFieldType: params.srcFieldType.getName(),
        });
        throw new Error(`Attempted to bind non-signal field as an input to a signal field`);
    }
    const signalForwarder = onSignal(codegen, classSpec, {
        objVar: params.srcObjVar,
        fieldName: params.srcFieldName,
        initializersOut: params.initializersOut,
    });
    params.initializersOut.push(`${codegen.genDerefMethodCall(params.dstObjVar, codegen.applyTemplateParams(`set${(0, xrpa_utils_1.upperFirst)(params.dstFieldName)}`, codegen.PRIMITIVE_INTRINSICS.float32.typename), [signalForwarder])};`);
}
function verifyStateFieldTypesMatch(params) {
    if ((0, TypeDefinition_1.typeIsStateData)(params.srcFieldType)) {
        if (!(0, TypeDefinition_1.typeIsStateData)(params.dstFieldType)) {
            console.error("Incompatible field binding types", {
                srcObjVar: params.srcObjVar,
                srcFieldName: params.srcFieldName,
                srcFieldType: params.srcFieldType.getName(),
                dstObjVar: params.dstObjVar,
                dstFieldName: params.dstFieldName,
                dstFieldType: params.dstFieldType.getName(),
            });
            throw new Error(`Incompatible field binding types`);
        }
        // TODO verify that the field types are compatible
    }
    else {
        console.error("Invalid field binding type", {
            srcObjVar: params.srcObjVar,
            srcFieldName: params.srcFieldName,
            srcFieldType: params.srcFieldType.getName(),
        });
        throw new Error(`Invalid field binding type`);
    }
}
function genBindStateFieldValues(codegen, classSpec, params) {
    verifyStateFieldTypesMatch(params);
    const sourceValues = [
        codegen.genDerefMethodCall(params.srcObjVar, `get${(0, xrpa_utils_1.upperFirst)(params.srcFieldName)}`, []),
    ];
    onFieldChanged(codegen, classSpec, {
        objVar: params.srcObjVar,
        bitMask: params.srcBitMask,
        code: [
            `${codegen.genDerefMethodCall(params.dstObjVar, codegen.methodMember(`set${(0, xrpa_utils_1.upperFirst)(params.dstFieldName)}`), sourceValues)};`,
        ],
        initializersOut: params.initializersOut,
    });
}
function genStateInputParameter(codegen, classSpec, params) {
    const memberName = paramToMemberName(codegen, params.paramName);
    params.inputParamsStruct.declareLocalFieldClassMember(classSpec, params.paramName, memberName, true, [], "private");
    codegen.genFieldGetter(classSpec, {
        apiname: codegen.XRPA_NAMESPACE,
        fieldName: params.paramName,
        fieldType: params.paramType,
        fieldToMemberVar: () => memberName,
        convertToLocal: false,
        description: params.inputParamsStruct.getAllFields()[params.paramName].description,
        visibility: "public",
        isConst: true,
    });
    classSpec.methods.push({
        name: `set${(0, xrpa_utils_1.upperFirst)(params.paramName)}`,
        parameters: [{
                name: params.paramName,
                type: params.paramType,
            }],
        body: () => [
            // set the local member value
            `${memberName} = ${params.paramName};`,
            // set the field value on connected datastore objects
            ...(0, xrpa_utils_1.mapAndCollapse)(params.inputDef.connections, connection => {
                (0, assert_1.default)((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(connection.targetNode));
                const objMemberName = objToMemberName(codegen, connection.targetNode.name);
                return [
                    `if (${codegen.genNonNullCheck(objMemberName)}) {`,
                    `  ${codegen.genDerefMethodCall(objMemberName, `set${(0, xrpa_utils_1.upperFirst)(connection.targetPort)}`, [params.paramName])};`,
                    `}`,
                ];
            }),
        ],
    });
}
function genStateOutputParameter(codegen, classSpec, params) {
    verifyStateFieldTypesMatch({
        srcObjVar: params.srcObjVar,
        srcFieldName: params.srcFieldName,
        srcFieldType: params.srcFieldType,
        dstObjVar: "program",
        dstFieldName: params.paramName,
        dstFieldType: params.paramType,
    });
    const paramBitMask = params.outputParamsStruct.getFieldBitMask(params.paramName);
    const memberName = paramToMemberName(codegen, params.paramName);
    params.outputParamsStruct.declareLocalFieldClassMember(classSpec, params.paramName, memberName, true, [], "private");
    codegen.genFieldGetter(classSpec, {
        apiname: codegen.XRPA_NAMESPACE,
        fieldName: params.paramName,
        fieldType: params.paramType,
        fieldToMemberVar: () => memberName,
        convertToLocal: false,
        description: params.outputParamsStruct.getAllFields()[params.paramName].description,
        visibility: "public",
        isConst: true,
    });
    const handlerName = codegen.privateMember("xrpaFieldsChangedHandler");
    const handlerType = codegen.genEventHandlerType([codegen.PRIMITIVE_INTRINSICS.uint64.typename]);
    const body = classSpec.getOrCreateMethod({
        name: "onXrpaFieldsChanged",
        parameters: [{
                name: "handler",
                type: handlerType,
            }],
    });
    if (body.length === 0) {
        body.push(`${handlerName} = handler;`);
        classSpec.members.push({
            name: handlerName,
            type: handlerType,
            initialValue: new TypeValue_1.CodeLiteralValue(codegen, codegen.getNullValue()),
            visibility: "private",
        });
    }
    onFieldChanged(codegen, classSpec, {
        objVar: params.srcObjVar,
        bitMask: params.srcBitMask,
        initializersOut: params.initializersOut,
        code: [
            `${memberName} = ${codegen.genDerefMethodCall(params.srcObjVar, `get${(0, xrpa_utils_1.upperFirst)(params.srcFieldName)}`, [])};`,
            codegen.genEventHandlerCall(handlerName, [`${paramBitMask}`], true),
        ],
    });
}
function genInputParameterAccessors(ctx, codegen, classSpec, programDef) {
    const inputs = (0, DataflowProgramDefinition_1.getDataflowInputs)(programDef);
    const inputParamsStruct = new StructType_1.StructType(codegen, "DataflowProgramInputParams", codegen.XRPA_NAMESPACE, undefined, (0, DataflowProgramDefinition_1.getDataflowParamsStructSpec)(inputs.map(inp => inp.parameter), ctx.moduleDef));
    const fields = inputParamsStruct.getAllFields();
    for (const inputDef of inputs) {
        const paramName = inputDef.parameter.name;
        const fieldType = fields[paramName].type;
        if ((0, TypeDefinition_1.typeIsMessageData)(fieldType)) {
            (0, assert_1.default)(false, "Message types are not yet supported as input parameters");
        }
        else if ((0, TypeDefinition_1.typeIsStateData)(fieldType)) {
            genStateInputParameter(codegen, classSpec, {
                inputParamsStruct,
                paramName,
                paramType: fieldType,
                inputDef,
            });
        }
        else {
            (0, assert_1.default)(false, `Unsupported input parameter type for ${paramName}`);
        }
    }
}
function genOutputParameterAccessors(ctx, codegen, classSpec, programDef, initializersOut) {
    const outputs = (0, DataflowProgramDefinition_1.getDataflowOutputs)(programDef);
    const outputParamsStruct = new StructType_1.StructType(codegen, "DataflowProgramOutputParams", codegen.XRPA_NAMESPACE, undefined, (0, DataflowProgramDefinition_1.getDataflowParamsStructSpec)(outputs, ctx.moduleDef));
    const outputFields = outputParamsStruct.getAllFields();
    for (const parameter of outputs) {
        if (!parameter.source) {
            continue;
        }
        const paramName = parameter.name;
        const fieldType = outputFields[paramName].type;
        const targetInfo = getInfoForObj(ctx, codegen, parameter.source.targetNode, classSpec.includes);
        const srcFieldType = targetInfo.reconcilerDef.type.getAllFields()[parameter.source.targetPort].type;
        if ((0, TypeDefinition_1.typeIsMessageData)(fieldType)) {
            genMessageOutputParameter(codegen, classSpec, {
                srcObjVar: targetInfo.objVarName,
                srcFieldName: parameter.source.targetPort,
                srcFieldType,
                paramName,
                paramType: fieldType,
                initializersOut,
            });
        }
        else if ((0, TypeDefinition_1.typeIsStateData)(fieldType)) {
            genStateOutputParameter(codegen, classSpec, {
                outputParamsStruct,
                srcObjVar: targetInfo.objVarName,
                srcFieldName: parameter.source.targetPort,
                srcFieldType,
                srcBitMask: targetInfo.reconcilerDef.type.getFieldBitMask(parameter.source.targetPort),
                paramName,
                paramType: fieldType,
                initializersOut,
            });
            codegen.genFieldChangedCheck(classSpec, { parentType: outputParamsStruct, fieldName: paramName });
        }
        else {
            (0, assert_1.default)(false, `Unsupported output parameter type for ${paramName}`);
        }
    }
}
function genCreateObjectsBody(ctx, codegen, programDef, classSpec, initializerLines) {
    const createLines = [];
    const updateLines = [];
    const idCall = codegen.genRuntimeGuid({
        objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, classSpec.includes),
        guidGen: ctx.moduleDef.guidGen,
        includes: classSpec.includes,
    });
    for (const graphNode of programDef.graphNodes) {
        (0, assert_1.default)((0, DataflowProgramDefinition_1.isDataflowForeignObjectInstantiation)(graphNode));
        const { objType, reconcilerDef, reconcilerName, objVarName, storeDef } = getInfoForObj(ctx, codegen, graphNode, classSpec.includes);
        const storeMemberName = codegen.privateMember(storeToVarName(storeDef.apiname));
        // create object
        createLines.push(`${objVarName} = ${codegen.genCreateObject(objType, [idCall])};`, `${codegen.genDerefMethodCall(codegen.genDeref(storeMemberName, reconcilerName), "addObject", [objVarName])};`);
        // set field values
        const fields = reconcilerDef.type.getAllFields();
        for (const fieldName in graphNode.fieldValues) {
            if (!(fieldName in fields)) {
                continue;
            }
            let fieldValue = graphNode.fieldValues[fieldName];
            if ((0, DataflowProgramDefinition_1.isDataflowConnection)(fieldValue)) {
                if (fieldValue.targetPort === "id") {
                    fieldValue = fieldValue.targetNode;
                }
                else {
                    const targetInfo = getInfoForObj(ctx, codegen, fieldValue.targetNode, classSpec.includes);
                    const targetField = targetInfo.reconcilerDef.type.getAllFields()[fieldValue.targetPort];
                    (0, assert_1.default)(targetField, `Field ${fieldValue.targetPort} not found on ${targetInfo.reconcilerDef.type.getName()}`);
                    const dstFieldType = fields[fieldName].type;
                    if ((0, TypeDefinition_1.typeIsMessageData)(dstFieldType)) {
                        genBindMessageFieldValues(codegen, classSpec, {
                            srcObjVar: targetInfo.objVarName,
                            srcFieldName: fieldValue.targetPort,
                            srcFieldType: targetField.type,
                            dstObjVar: objVarName,
                            dstFieldName: fieldName,
                            dstFieldType,
                            initializersOut: updateLines,
                        });
                    }
                    else if ((0, TypeDefinition_1.typeIsSignalData)(dstFieldType)) {
                        genBindSignalFieldValues(codegen, classSpec, {
                            srcObjVar: targetInfo.objVarName,
                            srcFieldName: fieldValue.targetPort,
                            srcFieldType: targetField.type,
                            dstObjVar: objVarName,
                            dstFieldName: fieldName,
                            dstFieldType,
                            initializersOut: updateLines,
                        });
                    }
                    else {
                        genBindStateFieldValues(codegen, classSpec, {
                            srcObjVar: targetInfo.objVarName,
                            srcFieldName: fieldValue.targetPort,
                            srcFieldType: targetField.type,
                            srcBitMask: targetInfo.reconcilerDef.type.getFieldBitMask(fieldValue.targetPort),
                            dstObjVar: objVarName,
                            dstFieldName: fieldName,
                            dstFieldType,
                            initializersOut: updateLines,
                        });
                    }
                    continue;
                }
            }
            let value = undefined;
            if ((0, DataflowProgramDefinition_1.isDataflowGraphNode)(fieldValue)) {
                value = getInfoForObj(ctx, codegen, fieldValue, classSpec.includes).objVarName;
            }
            else if ((0, ProgramInterface_1.isXrpaProgramParam)(fieldValue)) {
                value = paramToMemberName(codegen, fieldValue.name);
            }
            else if (fieldValue !== undefined) {
                const fieldType = reconcilerDef.type.getAllFields()[fieldName].type;
                const fieldTypeName = fieldType.getLocalType(ctx.namespace, classSpec.includes);
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
        const targetInfo = getInfoForObj(ctx, codegen, connection.targetNode, classSpec.includes);
        const targetField = targetInfo.reconcilerDef.type.getAllFields()[connection.targetPort];
        (0, assert_1.default)(targetField, `Field ${connection.targetPort} not found on ${targetInfo.reconcilerDef.type.getName()}`);
        (0, assert_1.default)((0, TypeDefinition_1.typeIsMessageData)(targetField.type), "Self-terminate events can only be bound to message fields");
        updateLines.push(`if (${codegen.genNonNullCheck(targetInfo.objVarName)}) {`, `  ${codegen.genDerefMethodCall(targetInfo.objVarName, `on${(0, xrpa_utils_1.upperFirst)(connection.targetPort)}`, [codegen.genMethodBind("", "terminate", {}, 2)])};`, `}`);
    }
    return createLines.concat(updateLines).concat(initializerLines);
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
// TODO add support for inbound message params
// TODO add support for outbound field params
// TODO add support for inbound and outbound signal params
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
    const initializerLines = [];
    genInputParameterAccessors(ctx, codegen, classSpec, programDef);
    genOutputParameterAccessors(ctx, codegen, classSpec, programDef, initializerLines);
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
        body: genCreateObjectsBody(ctx, codegen, programDef, classSpec, initializerLines),
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
