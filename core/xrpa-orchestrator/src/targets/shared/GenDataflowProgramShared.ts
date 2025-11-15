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


import { mapAndCollapse, upperFirst } from "@xrpa/xrpa-utils";
import assert from "assert";

import { ClassSpec, MethodParam } from "../../shared/ClassSpec";
import { IncludeAggregator } from "../../shared/Helpers";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { StructType } from "../../shared/StructType";
import {
  DataflowInput,
  DataflowProgramDefinition,
  XrpaDataflowConnection,
  XrpaDataflowForeignObjectInstantiation,
  XrpaDataflowGraphNode,
  XrpaDataflowStringEmbedding,
  getDataflowInputParamsStructSpec,
  getDataflowInputs,
  getDataflowOutputParamsStructSpec,
  getDataflowOutputs,
  getReconcilerDefForNode,
  isDataflowConnection,
  isDataflowForeignObjectInstantiation,
  isDataflowGraphNode,
  isDataflowStringEmbedding,
} from "../../shared/DataflowProgramDefinition";
import { TargetCodeGenImpl } from "../../shared/TargetCodeGen";
import {
  FieldTypeSpec,
  MessageDataTypeDefinition,
  SignalDataTypeDefinition,
  StructTypeDefinition,
  TypeDefinition,
  typeIsEnum,
  typeIsMessageData,
  typeIsSignalData,
  typeIsStateData,
} from "../../shared/TypeDefinition";
import { CodeLiteralValue } from "../../shared/TypeValue";
import { isXrpaProgramParam } from "../../ProgramInterface";
import { genMessageMethodParams, genOnMessageAccessor, getMessageParamNames } from "./GenMessageAccessorsShared";
import { BuiltinType } from "../../shared/BuiltinTypes";

export interface GenDataflowProgramContext {
  namespace: string;
  moduleDef: ModuleDefinition;
}

function paramToMemberName(codegen: TargetCodeGenImpl, paramName: string): string {
  return codegen.privateMember(`param${upperFirst(paramName)}`);
}

function objToMemberName(codegen: TargetCodeGenImpl, objName: string): string {
  return codegen.privateMember(`obj${upperFirst(objName)}`);
}

function storeToVarName(codegen: TargetCodeGenImpl, storeName: string): string {
  return codegen.identifierName(`datastore${upperFirst(storeName)}`);
}

interface ObjectInfo {
  objName: string;
  objVarName: string;
  objType: string;
  objTypeFriendlyName: string;
}

interface TargetInfo extends ObjectInfo {
  fieldSpec: FieldTypeSpec;
  fieldBitMask: number;
}

function getObjectInfo(ctx: GenDataflowProgramContext, codegen: TargetCodeGenImpl, graphNode: XrpaDataflowGraphNode, includes: IncludeAggregator | null): ObjectInfo {
  if (isDataflowForeignObjectInstantiation(graphNode)) {
    const reconcilerDef = getReconcilerDefForNode(ctx.moduleDef, graphNode);

    return {
      objName: graphNode.name,
      objType: reconcilerDef.type.getLocalType(ctx.namespace, includes),
      objVarName: objToMemberName(codegen, graphNode.name),
      objTypeFriendlyName: reconcilerDef.type.getName(),
    };
  } else if (isDataflowStringEmbedding(graphNode)) {
    return {
      objName: graphNode.name,
      objType: codegen.getXrpaTypes().StringEmbedding.getLocalType(ctx.namespace, includes),
      objVarName: objToMemberName(codegen, graphNode.name),
      objTypeFriendlyName: "StringEmbedding",
    };
  } else {
    throw new Error(`Unsupported node: ${JSON.stringify(graphNode)}`);
  }
}

function getTargetInfo(ctx: GenDataflowProgramContext, codegen: TargetCodeGenImpl, connection: XrpaDataflowConnection, includes: IncludeAggregator | null): TargetInfo {
  const objInfo = getObjectInfo(ctx, codegen, connection.targetNode, includes);

  if (isDataflowForeignObjectInstantiation(connection.targetNode)) {
    const reconcilerDef = getReconcilerDefForNode(ctx.moduleDef, connection.targetNode);
    const fieldSpec = reconcilerDef.type.getAllFields()[connection.targetPort];
    assert(fieldSpec, `Field ${connection.targetPort} not found on ${reconcilerDef.type.getName()}`);
    const fieldBitMask = typeIsStateData(fieldSpec.type) ? reconcilerDef.type.getFieldBitMask(connection.targetPort) : 0;
    return {
      ...objInfo,
      fieldSpec,
      fieldBitMask,
    };
  } else if (isDataflowStringEmbedding(connection.targetNode)) {
    return {
      ...objInfo,
      fieldSpec: {
        type: ctx.moduleDef.getBuiltinTypeDefinition(BuiltinType.String),
      },
      fieldBitMask: 1,
    };
  } else {
    throw new Error(`Unsupported node: ${JSON.stringify(connection.targetNode)}`);
  }
}

function onMessage(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  objVar: string,
  fieldName: string,
  fieldType: MessageDataTypeDefinition,

  code: string[],
  initializersOut: string[],
}) {
  const dispatcherName = `dispatch${upperFirst(params.objVar)}${upperFirst(params.fieldName)}`;
  const dispatcherBody = classSpec.getOrCreateMethod({
    name: dispatcherName,
    parameters: [{
      name: "msgTimestamp",
      type: codegen.PRIMITIVE_INTRINSICS.uint64.typename,
    }, {
      name: "msg",
      type: params.fieldType.getReadAccessorType(classSpec.namespace, classSpec.includes),
    }],
    visibility: "private",
  });

  if (dispatcherBody.length === 0) {
    params.initializersOut.push(
      `${codegen.genDerefMethodCall(codegen.genDeref("", params.objVar), `on${upperFirst(params.fieldName)}`, [
        codegen.genPassthroughMethodBind(codegen.genDeref("", codegen.methodMember(dispatcherName, "private")), 2),
      ])}` + codegen.STMT_TERM,
    );

    // fetch all message fields and store them in local variables
    const msgParams = getMessageParamNames(codegen, params.fieldType);
    const varInitializers = Object.keys(msgParams).map(key => {
      return codegen.declareVar(`${msgParams[key]}`, "", codegen.genMethodCall("msg", `get${upperFirst(key)}`, []));
    });
    dispatcherBody.unshift(...varInitializers);
  }

  dispatcherBody.push(...params.code);
}

function onSignal(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  objVar: string,
  fieldName: string,

  initializersOut: string[],
}): string {
  const signalForwarder = codegen.privateMember(params.objVar + upperFirst(params.fieldName) + "Forwarder");

  if (classSpec.members.find(m => m.name === signalForwarder) === undefined) {
    classSpec.members.push({
      name: signalForwarder,
      type: codegen.genObjectPtrType(codegen.getXrpaTypes().InboundSignalForwarder.getLocalType(classSpec.namespace, classSpec.includes)),
      visibility: "private",
    });

    params.initializersOut.push(
      `${codegen.genDeref("", signalForwarder)} = ${codegen.genCreateObject(codegen.getXrpaTypes().InboundSignalForwarder.getLocalType(classSpec.namespace, classSpec.includes), [])}` + codegen.STMT_TERM,
      `${codegen.genDerefMethodCall(codegen.genDeref("", params.objVar), `on${upperFirst(params.fieldName)}`, [codegen.genDeref("", signalForwarder)])}` + codegen.STMT_TERM,
    );
  }

  return signalForwarder;
}

function onFieldChanged(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  objVar: string,
  bitMask: number,
  code: string[],
  initializersOut: string[],
}) {
  const dispatcherName = `dispatch${upperFirst(params.objVar)}FieldsChanged`;
  const dispatcherBody = classSpec.getOrCreateMethod({
    name: dispatcherName,
    parameters: [{
      name: "fieldsChanged",
      type: codegen.PRIMITIVE_INTRINSICS.uint64.typename,
    }],
    visibility: "private",
  });

  if (dispatcherBody.length === 0) {
    params.initializersOut.push(
      `${codegen.genDerefMethodCall(codegen.genDeref("", params.objVar), "onXrpaFieldsChanged", [
        codegen.genPassthroughMethodBind(codegen.genDeref("", codegen.methodMember(dispatcherName, "private")), 1),
      ])}` + codegen.STMT_TERM,
    );
  }

  dispatcherBody.push(
    ...codegen.ifAnyBitIsSet(codegen.identifierName("fieldsChanged"), params.bitMask, params.code),
  );
}

function genBindMessageFieldValues(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  srcObjVar: string,
  srcFieldName: string,
  srcFieldType: TypeDefinition,

  dstObjVar: string,
  dstFieldName: string,
  dstFieldType: MessageDataTypeDefinition,

  initializersOut: string[],
}) {
  const srcFieldType = params.srcFieldType;
  if (!typeIsMessageData(srcFieldType)) {
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
      `${codegen.genDerefMethodCall(codegen.genDeref("", params.dstObjVar), codegen.methodMember(`send${upperFirst(params.dstFieldName)}`), Object.values(getMessageParamNames(codegen, srcFieldType)))}` + codegen.STMT_TERM,
    ],
    initializersOut: params.initializersOut,
  });
}

function genMessageOutputParameter(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  srcObjVar: string,
  srcFieldName: string,
  srcFieldType: TypeDefinition,

  paramName: string,
  paramType: MessageDataTypeDefinition,

  initializersOut: string[],
}) {
  const srcFieldType = params.srcFieldType;
  if (!typeIsMessageData(srcFieldType)) {
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

  genOnMessageAccessor(classSpec, {
    codegen,
    fieldName: params.paramName,
    fieldType: params.paramType,
    genMsgHandler: () => memberName,
    expandMessageFields: true,
  });

  const dispatchCode = codegen.genMessageDispatch({
    namespace: classSpec.namespace,
    includes: classSpec.includes,
    fieldName: params.paramName,
    fieldType: params.paramType,
    genMsgHandler: () => memberName,
    msgDataToParams: () => Object.values(getMessageParamNames(codegen, srcFieldType)),
    convertToReadAccessor: false,
  });

  onMessage(codegen, classSpec, {
    objVar: params.srcObjVar,
    fieldName: params.srcFieldName,
    fieldType: srcFieldType,

    code: dispatchCode,
    initializersOut: params.initializersOut,
  });
}

function genBindSignalFieldValues(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  srcObjVar: string,
  srcFieldName: string,
  srcFieldType: TypeDefinition,

  dstObjVar: string,
  dstFieldName: string,
  dstFieldType: SignalDataTypeDefinition,

  initializersOut: string[],
}) {
  if (!typeIsSignalData(params.srcFieldType)) {
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

  params.initializersOut.push(
    `${codegen.genDerefMethodCall(params.dstObjVar, codegen.applyTemplateParams(`set${upperFirst(params.dstFieldName)}Forwarder`, codegen.PRIMITIVE_INTRINSICS.float32.typename), [signalForwarder])}` + codegen.STMT_TERM,
  );
}

function verifyStateFieldTypesMatch(params: {
  srcObjVar: string,
  srcFieldName: string,
  srcFieldType: TypeDefinition,

  dstObjVar: string,
  dstFieldName: string,
  dstFieldType: TypeDefinition,
}) {
  if (typeIsStateData(params.srcFieldType)) {
    if (!typeIsStateData(params.dstFieldType)) {
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
  } else {
    console.error("Invalid field binding type", {
      srcObjVar: params.srcObjVar,
      srcFieldName: params.srcFieldName,
      srcFieldType: params.srcFieldType.getName(),
    });
    throw new Error(`Invalid field binding type`);
  }
}

function genBindStateFieldValues(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  srcObjVar: string,
  srcFieldName: string,
  srcFieldType: TypeDefinition,
  srcBitMask: number,

  dstObjVar: string,
  dstFieldName: string,
  dstFieldType: TypeDefinition,
  dstIsStringEmbedding: boolean,

  initializersOut: string[],
}) {
  verifyStateFieldTypesMatch(params);

  const setterName = params.dstIsStringEmbedding ? "setEmbeddingValue" : `set${upperFirst(params.dstFieldName)}`;
  const sourceValues = [
    codegen.genDerefMethodCall(codegen.genDeref("", params.srcObjVar), `get${upperFirst(params.srcFieldName)}`, []),
  ];
  if (params.dstIsStringEmbedding) {
    sourceValues.unshift(`"${codegen.genDeref("", params.dstFieldName)}"`);
  }

  params.initializersOut.push(
    `${codegen.genDerefMethodCall(codegen.genDeref("", params.dstObjVar), codegen.methodMember(setterName), sourceValues)}` + codegen.STMT_TERM,
  )

  onFieldChanged(codegen, classSpec, {
    objVar: params.srcObjVar,
    bitMask: params.srcBitMask,
    code: [
      `${codegen.genDerefMethodCall(codegen.genDeref("", params.dstObjVar), codegen.methodMember(setterName), sourceValues)}` + codegen.STMT_TERM,
    ],
    initializersOut: params.initializersOut,
  });
}

function genMessageInputParameter(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  inputParamsStruct: StructTypeDefinition,
  paramName: string,
  paramType: MessageDataTypeDefinition,

  inputDef: DataflowInput,
}) {
  const msgParams = genMessageMethodParams({
    codegen,
    namespace: classSpec.namespace,
    includes: classSpec.includes,
    fieldType: params.paramType,
  });
  const msgParamNames = msgParams.map(p => p.name);

  classSpec.methods.push({
    name: `send${upperFirst(params.paramName)}`,
    parameters: msgParams,
    body: () => [
      // send the message on all connected datastore objects
      ...mapAndCollapse(params.inputDef.connections, connection => {
        assert(isDataflowForeignObjectInstantiation(connection.targetNode));
        const objMemberName = codegen.genDeref("", objToMemberName(codegen, connection.targetNode.name));
        return codegen.conditional(codegen.genNonNullCheck(objMemberName), [
          codegen.genDerefMethodCall(objMemberName, `send${upperFirst(connection.targetPort)}`, msgParamNames) + codegen.STMT_TERM,
        ]);
      }),
    ],
    visibility: "public",
  });
}


function genStateInputParameter(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  inputParamsStruct: StructTypeDefinition,
  paramName: string,
  paramType: TypeDefinition,

  inputDef: DataflowInput,
}) {
  const memberName = paramToMemberName(codegen, params.paramName);

  params.inputParamsStruct.declareLocalFieldClassMember(classSpec, params.paramName, memberName, true, [], "private");

  codegen.genFieldGetter(classSpec, {
    apiname: codegen.XRPA_NAMESPACE,
    fieldName: params.paramName,
    fieldType: params.paramType,
    fieldToMemberVar: () => codegen.genDeref("", memberName),
    convertToLocal: false,
    description: params.inputParamsStruct.getAllFields()[params.paramName].description,
    visibility: "public",
    isConst: true,
  });

  classSpec.methods.push({
    name: `set${upperFirst(params.paramName)}`,
    parameters: [{
      name: params.paramName,
      type: params.paramType,
    }],
    body: () => [
      // set the local member value
      `${codegen.genDeref("", memberName)} = ${params.paramName}` + codegen.STMT_TERM,

      // set the field value on connected datastore objects
      ...mapAndCollapse(params.inputDef.connections, connection => {
        const objMemberName = codegen.genDeref("", objToMemberName(codegen, connection.targetNode.name));
        if (isDataflowForeignObjectInstantiation(connection.targetNode)) {
          return codegen.conditional(codegen.genNonNullCheck(objMemberName), [
            codegen.genDerefMethodCall(objMemberName, `set${upperFirst(connection.targetPort)}`, [params.paramName]) + codegen.STMT_TERM,
          ]);
        } else if (isDataflowStringEmbedding(connection.targetNode)) {
          return codegen.conditional(codegen.genNonNullCheck(objMemberName), [
            codegen.genDerefMethodCall(objMemberName, "setEmbeddingValue", [`"${connection.targetPort}"`, params.paramName]) + codegen.STMT_TERM,
          ]);
        } else {
          throw new Error(`Unsupported input connection type: ${JSON.stringify(connection.targetNode)}`);
        }
      }),
    ],
  });
}

function genStateOutputParameter(codegen: TargetCodeGenImpl, classSpec: ClassSpec, params: {
  outputParamsStruct: StructTypeDefinition,

  srcObjVar: string,
  srcFieldName: string,
  srcFieldType: TypeDefinition,
  srcBitMask: number,

  paramName: string,
  paramType: TypeDefinition,

  initializersOut: string[],
}) {
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
    fieldToMemberVar: () => codegen.genDeref("", memberName),
    convertToLocal: false,
    description: params.outputParamsStruct.getAllFields()[params.paramName].description,
    visibility: "public",
    isConst: true,
  });

  const fieldHandlerName = codegen.methodMember(`on${upperFirst(params.paramName)}Changed`);
  classSpec.members.push({
    name: fieldHandlerName,
    type: codegen.genEventHandlerType([params.srcFieldType.getLocalType(classSpec.namespace, classSpec.includes)], classSpec.includes),
    initialValue: new CodeLiteralValue(codegen, codegen.getNullValue()),
  });

  const handlerName = codegen.privateMember("xrpaFieldsChangedHandler");
  const handlerType = codegen.genEventHandlerType([codegen.PRIMITIVE_INTRINSICS.uint64.typename], classSpec.includes);

  const body = classSpec.getOrCreateMethod({
    name: "onXrpaFieldsChanged",
    parameters: [{
      name: "handler",
      type: handlerType,
    }],
  });
  if (body.length === 0) {
    body.push(`${codegen.genDeref("", handlerName)} = handler` + codegen.STMT_TERM);

    classSpec.members.push({
      name: handlerName,
      type: handlerType,
      initialValue: new CodeLiteralValue(codegen, codegen.getNullValue()),
      visibility: "private",
    });
  }

  onFieldChanged(codegen, classSpec, {
    objVar: params.srcObjVar,
    bitMask: params.srcBitMask,
    initializersOut: params.initializersOut,
    code: [
      `${codegen.genDeref("", memberName)} = ${codegen.genDerefMethodCall(codegen.genDeref("", params.srcObjVar), `get${upperFirst(params.srcFieldName)}`, [])}` + codegen.STMT_TERM,
      codegen.genEventHandlerCall(codegen.genDeref("", handlerName), [`${paramBitMask}`], true),
      codegen.genEventHandlerCall(codegen.genDeref("", fieldHandlerName), [codegen.genDeref("", memberName)], true),
    ],
  });
}

function genInputParameterAccessors(
  ctx: GenDataflowProgramContext,
  codegen: TargetCodeGenImpl,
  classSpec: ClassSpec,
  programDef: DataflowProgramDefinition,
) {
  const inputs = getDataflowInputs(programDef);
  const inputParamsStruct: StructTypeDefinition = new StructType(
    codegen,
    "DataflowProgramInputParams",
    codegen.XRPA_NAMESPACE,
    undefined,
    getDataflowInputParamsStructSpec(inputs, ctx.moduleDef),
  );

  const fields = inputParamsStruct.getAllFields();

  for (const inputDef of inputs) {
    const paramName = inputDef.parameter.name;
    const fieldType = fields[paramName].type;

    if (typeIsMessageData(fieldType)) {
      genMessageInputParameter(codegen, classSpec, {
        inputParamsStruct,
        paramName,
        paramType: fieldType,
        inputDef,
      });
    } else if (typeIsStateData(fieldType)) {
      genStateInputParameter(codegen, classSpec, {
        inputParamsStruct,
        paramName,
        paramType: fieldType,
        inputDef,
      });
    } else {
      assert(false, `Unsupported input parameter type for ${paramName}`);
    }
  }
}

function genOutputParameterAccessors(
  ctx: GenDataflowProgramContext,
  codegen: TargetCodeGenImpl,
  classSpec: ClassSpec,
  programDef: DataflowProgramDefinition,
  initializersOut: string[],
) {
  const outputs = getDataflowOutputs(programDef);
  const outputParamsStruct: StructTypeDefinition = new StructType(
    codegen,
    "DataflowProgramOutputParams",
    codegen.XRPA_NAMESPACE,
    undefined,
    getDataflowOutputParamsStructSpec(outputs, ctx.moduleDef),
  );

  const outputFields = outputParamsStruct.getAllFields();

  for (const parameter of outputs) {
    if (!parameter.source) {
      continue;
    }

    const paramName = parameter.name;
    const fieldType = outputFields[paramName].type;
    const targetInfo = getTargetInfo(ctx, codegen, parameter.source, classSpec.includes);

    if (typeIsMessageData(fieldType)) {
      genMessageOutputParameter(codegen, classSpec, {
        srcObjVar: targetInfo.objVarName,
        srcFieldName: parameter.source.targetPort,
        srcFieldType: targetInfo.fieldSpec.type,

        paramName,
        paramType: fieldType,

        initializersOut,
      });
    } else if (typeIsStateData(fieldType)) {
      genStateOutputParameter(codegen, classSpec, {
        outputParamsStruct,

        srcObjVar: targetInfo.objVarName,
        srcFieldName: parameter.source.targetPort,
        srcFieldType: targetInfo.fieldSpec.type,
        srcBitMask: targetInfo.fieldBitMask,

        paramName,
        paramType: fieldType,

        initializersOut,
      });

      codegen.genFieldChangedCheck(classSpec, { parentType: outputParamsStruct, fieldName: paramName });
    } else {
      assert(false, `Unsupported output parameter type for ${paramName}`);
    }
  }
}

function genForeignObjectInstantiation(
  ctx: GenDataflowProgramContext,
  codegen: TargetCodeGenImpl,
  classSpec: ClassSpec,
  graphNode: XrpaDataflowForeignObjectInstantiation,
  createLines: string[],
  updateLines: string[],
) {
  const { objVarName } = getObjectInfo(ctx, codegen, graphNode, classSpec.includes);
  const reconcilerDef = getReconcilerDefForNode(ctx.moduleDef, graphNode);
  const storeMemberName = codegen.genDeref("", codegen.privateMember(storeToVarName(codegen, reconcilerDef.storeDef.apiname)));

  // create object
  createLines.push(
    `${codegen.genDeref("", objVarName)} = ${codegen.genDerefMethodCall(codegen.genDeref(storeMemberName, reconcilerDef.type.getName()), "createObject", [])}` + codegen.STMT_TERM,
  );

  // set field values
  const fields = reconcilerDef.type.getAllFields();
  for (const fieldName in graphNode.fieldValues) {
    if (!(fieldName in fields)) {
      continue;
    }

    let fieldValue = graphNode.fieldValues[fieldName];
    if (isDataflowConnection(fieldValue)) {
      if (fieldValue.targetPort === "id") {
        fieldValue = fieldValue.targetNode;
      } else {
        const targetInfo = getTargetInfo(ctx, codegen, fieldValue, classSpec.includes);
        const dstFieldType = fields[fieldName].type;

        if (typeIsMessageData(dstFieldType)) {
          genBindMessageFieldValues(codegen, classSpec, {
            srcObjVar: targetInfo.objVarName,
            srcFieldName: fieldValue.targetPort,
            srcFieldType: targetInfo.fieldSpec.type,

            dstObjVar: objVarName,
            dstFieldName: fieldName,
            dstFieldType,

            initializersOut: updateLines,
          });
        } else if (typeIsSignalData(dstFieldType)) {
          genBindSignalFieldValues(codegen, classSpec, {
            srcObjVar: targetInfo.objVarName,
            srcFieldName: fieldValue.targetPort,
            srcFieldType: targetInfo.fieldSpec.type,

            dstObjVar: objVarName,
            dstFieldName: fieldName,
            dstFieldType,

            initializersOut: updateLines,
          });
        } else {
          genBindStateFieldValues(codegen, classSpec, {
            srcObjVar: targetInfo.objVarName,
            srcFieldName: fieldValue.targetPort,
            srcFieldType: targetInfo.fieldSpec.type,
            srcBitMask: targetInfo.fieldBitMask,

            dstObjVar: objVarName,
            dstFieldName: fieldName,
            dstFieldType,
            dstIsStringEmbedding: false,

            initializersOut: updateLines,
          });
        }
        continue;
      }
    }

    let value: string | number | undefined = undefined;
    if (isDataflowGraphNode(fieldValue)) {
      const objVarName = getObjectInfo(ctx, codegen, fieldValue, classSpec.includes).objVarName;
      value = codegen.genDerefMethodCall(codegen.genDeref("", objVarName), "getXrpaId", []);
    } else if (isXrpaProgramParam(fieldValue)) {
      value = codegen.genDeref("", paramToMemberName(codegen, fieldValue.name));
    } else if (fieldValue !== undefined) {
      const fieldType = reconcilerDef.type.getAllFields()[fieldName].type;
      const fieldTypeName = fieldType.getLocalType(ctx.namespace, classSpec.includes);
      if (typeIsEnum(fieldType)) {
        value = codegen.genEnumDynamicConversion(fieldTypeName, new CodeLiteralValue(codegen, `${fieldValue}`));
      } else {
        value = codegen.genPrimitiveValue(fieldTypeName, fieldValue);
      }
    } else {
      continue;
    }
    if (typeIsStateData(fields[fieldName].type)) {
      updateLines.push(
        `${codegen.genDerefMethodCall(codegen.genDeref("", objVarName), `set${upperFirst(fieldName)}`, [value.toString()])}` + codegen.STMT_TERM,
      );
    }
  }
}

function genStringEmbedding(
  ctx: GenDataflowProgramContext,
  codegen: TargetCodeGenImpl,
  classSpec: ClassSpec,
  graphNode: XrpaDataflowStringEmbedding,
  createLines: string[],
  updateLines: string[],
) {
  const { objType, objVarName } = getObjectInfo(ctx, codegen, graphNode, classSpec.includes);

  // create object
  createLines.push(
    `${codegen.genDeref("", objVarName)} = ${codegen.genCreateObject(objType, [codegen.genPrimitiveValue(codegen.PRIMITIVE_INTRINSICS.string.typename, graphNode.value)])}` + codegen.STMT_TERM,
  );

  // set initial embedding values from params
  for (const paramName of graphNode.embeddedParams) {
    const embeddingKey = `{{{param:${paramName}}}}`;
    updateLines.push(
      `${codegen.genDerefMethodCall(codegen.genDeref("", objVarName), "setEmbeddingValue", [`"${embeddingKey}"`, codegen.genDeref("", paramToMemberName(codegen, paramName))])}` + codegen.STMT_TERM,
    );
  }

  for (const connection of graphNode.embeddedConnections) {
    const targetInfo = getTargetInfo(ctx, codegen, connection, classSpec.includes);
    const embeddingKey = `{{{connection:${connection.targetNode.nodeId}/${connection.targetPort}}}}`;
    genBindStateFieldValues(codegen, classSpec, {
      srcObjVar: targetInfo.objVarName,
      srcFieldName: connection.targetPort,
      srcFieldType: targetInfo.fieldSpec.type,
      srcBitMask: targetInfo.fieldBitMask,

      dstObjVar: objVarName,
      dstFieldName: embeddingKey,
      dstFieldType: ctx.moduleDef.getBuiltinTypeDefinition(BuiltinType.String),
      dstIsStringEmbedding: true,

      initializersOut: updateLines,
    });
  }
}

function genCreateObjectsBody(
  ctx: GenDataflowProgramContext,
  codegen: TargetCodeGenImpl,
  programDef: DataflowProgramDefinition,
  classSpec: ClassSpec,
  initializerLines: string[],
): string[] {
  const createLines: string[] = [];
  const updateLines: string[] = [];

  for (const graphNode of programDef.graphNodes) {
    if (isDataflowForeignObjectInstantiation(graphNode)) {
      genForeignObjectInstantiation(ctx, codegen, classSpec, graphNode, createLines, updateLines);
    } else if (isDataflowStringEmbedding(graphNode)) {
      genStringEmbedding(ctx, codegen, classSpec, graphNode, createLines, updateLines);
    } else {
      throw new Error(`Unsupported node: ${JSON.stringify(graphNode)}`);
    }
  }

  for (const connection of programDef.selfTerminateEvents) {
    const targetInfo = getTargetInfo(ctx, codegen, connection, classSpec.includes);
    assert(typeIsMessageData(targetInfo.fieldSpec.type), "Self-terminate events can only be bound to message fields");

    // if a message has no fields then the handler only takes the timestamp as a parameter; otherwise it takes the message reader as well
    const paramCount = targetInfo.fieldSpec.type.hasFields() ? 2 : 1;

    updateLines.push(...codegen.conditional(codegen.genNonNullCheck(codegen.genDeref("", targetInfo.objVarName)), [
      codegen.genDerefMethodCall(codegen.genDeref("", targetInfo.objVarName), `on${upperFirst(connection.targetPort)}`, [codegen.genMethodBind("", "terminate", {}, paramCount)]) + codegen.STMT_TERM,
    ]));
  }

  return createLines.concat(updateLines).concat(initializerLines);
}

function genDestroyObjectsBody(
  ctx: GenDataflowProgramContext,
  codegen: TargetCodeGenImpl,
  programDef: DataflowProgramDefinition,
  includes: IncludeAggregator | null,
): string[] {
  const lines: string[] = [];

  for (const graphNode of programDef.graphNodes) {
    const { objVarName } = getObjectInfo(ctx, codegen, graphNode, includes);
    if (isDataflowForeignObjectInstantiation(graphNode)) {
      const reconcilerDef = getReconcilerDefForNode(ctx.moduleDef, graphNode);
      const storeDef = reconcilerDef.storeDef;
      const storeMemberName = codegen.genDeref("", codegen.privateMember(storeToVarName(codegen, storeDef.apiname)));
      const objId = codegen.genDerefMethodCall(codegen.genDeref("", objVarName), "getXrpaId", []);
      lines.unshift(...codegen.conditional(codegen.genNonNullCheck(codegen.genDeref("", objVarName)), [
        codegen.genDerefMethodCall(codegen.genDeref(storeMemberName, reconcilerDef.type.getName()), "removeObject", [objId]) + codegen.STMT_TERM,
        `${codegen.genDeref("", objVarName)} = ${codegen.getNullValue()}` + codegen.STMT_TERM,
      ]));
    } else if (isDataflowStringEmbedding(graphNode)) {
      lines.unshift(...codegen.conditional(codegen.genNonNullCheck(codegen.genDeref("", objVarName)), [
        `${codegen.genDeref("", objVarName)} = ${codegen.getNullValue()}` + codegen.STMT_TERM,
      ]));
    } else {
      throw new Error(`Unsupported node: ${JSON.stringify(graphNode)}`);
    }
  }

  return lines;
}

// TODO add support for inbound and outbound signal params

export function genDataflowProgramClassSpec(
  ctx: GenDataflowProgramContext,
  codegen: TargetCodeGenImpl,
  programDef: DataflowProgramDefinition,
  includes: IncludeAggregator | null,
): ClassSpec {
  const classSpec = new ClassSpec({
    name: programDef.interfaceName,
    namespace: ctx.namespace,
    includes,
  });

  // constructor/destructor and datastore pointer
  const constructorParams: MethodParam[] = [];
  const memberInitializers: [string, string][] = [];

  for (const storeName of programDef.programInterfaceNames) {
    const storeDef = ctx.moduleDef.getDataStore(storeName);
    const dataStoreClassName = codegen.getDataStoreClass(storeDef.apiname, classSpec.namespace, classSpec.includes);
    const storePtrType = codegen.genObjectPtrType(dataStoreClassName);
    const storeVarName = storeToVarName(codegen, storeDef.apiname);

    classSpec.members.push({
      name: storeVarName,
      type: storePtrType,
      visibility: "private",
    });

    constructorParams.push({
      name: storeVarName,
      type: storePtrType,
    });

    memberInitializers.push([codegen.privateMember(storeVarName), storeVarName])
  }

  classSpec.constructors.push({
    parameters: constructorParams,
    memberInitializers,
    body: () => [
      `${codegen.genDerefMethodCall("", codegen.methodMember("createObjects", "private"), [])}` + codegen.STMT_TERM,
    ],
  });

  classSpec.destructorBody = () => [
    `${codegen.genDerefMethodCall("", codegen.methodMember("destroyObjects", "private"), [])}` + codegen.STMT_TERM,
  ];

  // parameter accessors
  const initializerLines: string[] = [];
  genInputParameterAccessors(ctx, codegen, classSpec, programDef);
  genOutputParameterAccessors(ctx, codegen, classSpec, programDef, initializerLines);

  // declare member variables for each object
  for (const graphNode of programDef.graphNodes) {
    const { objName, objType } = getObjectInfo(ctx, codegen, graphNode, classSpec.includes);
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
      `${codegen.genDerefMethodCall("", codegen.methodMember("destroyObjects", "private"), [])}` + codegen.STMT_TERM,
    ],
    visibility: "public",
  });

  return classSpec;
}
