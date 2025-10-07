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


import { FileWriter } from "@xrpa/xrpa-file-utils";
import { indent, upperFirst } from "@xrpa/xrpa-utils";
import assert from "assert";

import { ClassSpec } from "../../shared/ClassSpec";
import { StructType } from "../../shared/StructType";
import {
  DataflowProgramDefinition,
  getDataflowInputParamsStructSpec,
  getDataflowInputs,
  getDataflowOutputParamsStructSpec,
  getDataflowOutputs,
  getReconcilerDefForNode,
} from "../../shared/DataflowProgramDefinition";
import { StructTypeDefinition, TypeDefinition, typeIsMessageData, typeIsStateData } from "../../shared/TypeDefinition";
import {
  CsIncludeAggregator,
  XRPA_NAMESPACE,
  PRIMITIVE_INTRINSICS,
  genCreateObject,
  genDerefMethodCall,
  genNonNullCheck,
  genObjectPtrType,
  getNullValue,
  nsJoin,
  privateMember,
} from "../csharp/CsharpCodeGenImpl";
import * as CsharpCodeGenImpl from "../csharp/CsharpCodeGenImpl";
import { GenDataflowProgramContext } from "../shared/GenDataflowProgramShared";
import { getDataStoreSubsystemName } from "./GenDataStoreSubsystem";
import { genUnityMessageProxyDispatch, genUnitySendMessageAccessor, getComponentClassName, writeMonoBehaviour } from "./MonoBehaviourShared";


function genStateInputParameterAccessors(params: {
  classSpec: ClassSpec,
  inputParamsStruct: StructTypeDefinition,
  paramName: string,
  fieldType: TypeDefinition,
  validateLines: string[];
  spawnInitializerLines: string[];
  runInitializerLines: string[];
}) {
  const memberName = upperFirst(params.paramName);
  const memberFieldName = privateMember(memberName);
  const objGetterName = `Get${upperFirst(params.paramName)}`;
  const objSetterName = `Set${upperFirst(params.paramName)}`;
  const currentObj = privateMember("currentObj");

  const decorations: string[] = [
    "[SerializeField]"
  ];

  params.inputParamsStruct.declareLocalFieldClassMember(params.classSpec, params.paramName, memberFieldName, true, decorations, "private");

  params.spawnInitializerLines.push(
    `${genDerefMethodCall("ret", objSetterName, [memberName])};`,
  );

  params.runInitializerLines.push(
    `${genDerefMethodCall(currentObj, objSetterName, [memberName])};`,
  );

  params.classSpec.members.push({
    name: memberName,
    type: params.fieldType,
    getter: memberFieldName,
    setter: [
      // set the local member value
      `${memberFieldName} = value;`,

      `if (${genNonNullCheck(currentObj)}) {`,
      `  ${genDerefMethodCall(currentObj, objSetterName, ["value"])};`,
      `}`,
    ],
  });

  params.validateLines.push(
    `if (!${genDerefMethodCall(currentObj, objGetterName, [])}.Equals(${memberFieldName})) {`,
    `  ${genDerefMethodCall(currentObj, objSetterName, [memberFieldName])};`,
    `}`,
  );
}


function genStateOutputParameterAccessors(params: {
  classSpec: ClassSpec,
  outputParamsStruct: StructTypeDefinition,
  fieldName: string,
  fieldType: TypeDefinition,
  runInitializerLines: string[];
}) {
  const memberName = upperFirst(params.fieldName);
  const memberFieldName = privateMember(memberName);
  const currentObj = privateMember("currentObj");

  params.outputParamsStruct.declareLocalFieldClassMember(params.classSpec, params.fieldName, memberFieldName, true, [], "private");

  params.classSpec.members.push({
    name: memberName,
    type: params.fieldType,
    getter: memberFieldName,
  });

  params.classSpec.members.push({
    name: `On${memberName}Changed`,
    type: `event System.Action<${params.fieldType.getLocalType(params.classSpec.namespace, params.classSpec.includes)}>`,
  });

  params.classSpec.methods.push({
    name: `Dispatch${memberName}Changed`,
    parameters: [{
      name: "value",
      type: params.fieldType,
    }],
    body: [
      `${memberFieldName} = value;`,
      `On${memberName}Changed?.Invoke(${memberFieldName});`,
    ],
    visibility: "private",
  });

  params.runInitializerLines.push(
    `${currentObj}.On${memberName}Changed += Dispatch${memberName}Changed;`,
  );
}

function genInputParameterAccessors(
  ctx: GenDataflowProgramContext,
  classSpec: ClassSpec,
  programDef: DataflowProgramDefinition,
): {
  spawnInitializerLines: string[];
  runInitializerLines: string[];
} {
  const spawnInitializerLines: string[] = [];
  const runInitializerLines: string[] = [];
  const validateLines: string[] = [];

  const currentObj = privateMember("currentObj");

  const inputParamsStruct: StructTypeDefinition = new StructType(
    CsharpCodeGenImpl,
    "DataflowProgramInputParams",
    XRPA_NAMESPACE,
    undefined,
    getDataflowInputParamsStructSpec(getDataflowInputs(programDef), ctx.moduleDef),
  );
  const fields = inputParamsStruct.getAllFields();

  for (const paramName in fields) {
    const fieldType = fields[paramName].type;
    if (typeIsMessageData(fieldType)) {
      genUnitySendMessageAccessor(classSpec, {
        namespace: ctx.namespace,
        typeDef: inputParamsStruct,
        fieldName: paramName,
        fieldType,
        proxyObj: currentObj,
      });
    } else if (typeIsStateData(fieldType)) {
      genStateInputParameterAccessors({
        classSpec,
        inputParamsStruct,
        paramName,
        fieldType,
        validateLines,
        spawnInitializerLines,
        runInitializerLines,
      });
    } else {
      assert(false, `Unsupported input parameter type for ${paramName}`);
    }
  }

  classSpec.methods.push({
    name: "OnValidate",
    body: [
      `if (${genNonNullCheck(currentObj)}) {`,
      ...indent(1, validateLines),
      `}`,
    ],
    visibility: "private",
  });

  return {
    spawnInitializerLines,
    runInitializerLines,
  };
}

function genOutputParameterAccessors(
  ctx: GenDataflowProgramContext,
  classSpec: ClassSpec,
  programDef: DataflowProgramDefinition,
  runInitializerLines: string[],
) {
  const outputs = getDataflowOutputs(programDef);
  const outputParamsStruct: StructTypeDefinition = new StructType(
    CsharpCodeGenImpl,
    "DataflowProgramOutputParams",
    XRPA_NAMESPACE,
    undefined,
    getDataflowOutputParamsStructSpec(outputs, ctx.moduleDef),
  );

  const outputFields = outputParamsStruct.getAllFields();

  for (const parameter of outputs) {
    if (!parameter.source) {
      continue;
    }

    const fieldName = parameter.name;
    const fieldType = outputFields[fieldName].type;

    if (typeIsMessageData(fieldType)) {
      const reconcilerDef = getReconcilerDefForNode(ctx.moduleDef, parameter.source.targetNode);
      genUnityMessageProxyDispatch(classSpec, {
        storeDef: reconcilerDef.storeDef,
        fieldName,
        fieldType,
        proxyObj: privateMember("currentObj"),
        initializerLines: runInitializerLines,
        dispatchMessageReader: false,
      });
    } else if (typeIsStateData(fieldType)) {
      genStateOutputParameterAccessors({
        classSpec,
        outputParamsStruct,
        fieldName,
        fieldType,
        runInitializerLines,
      });
    } else {
      assert(false, "Only message types are currently supported as output parameters");
    }
  }
}

export function genDataflowProgramSpawner(
  ctx: GenDataflowProgramContext,
  fileWriter: FileWriter,
  outDir: string,
  programDef: DataflowProgramDefinition,
) {
  const storeDefs = programDef.programInterfaceNames.map(storeName => ctx.moduleDef.getDataStore(storeName));
  const storeAccessors = storeDefs.map(storeDef => `${getDataStoreSubsystemName(storeDef)}.Instance.DataStore`);

  const programClass = nsJoin(ctx.namespace, programDef.interfaceName);

  const classSpec = new ClassSpec({
    name: getComponentClassName(programDef.interfaceName),
    superClass: "MonoBehaviour",
    namespace: "",
    includes: new CsIncludeAggregator(["UnityEngine", ctx.namespace]),
  });

  classSpec.members.push({
    name: "AutoRun",
    type: PRIMITIVE_INTRINSICS.bool.typename,
    initialValue: false,
    visibility: "public",
    decorations: ["[SerializeField]"]
  });

  const { spawnInitializerLines, runInitializerLines } = genInputParameterAccessors(ctx, classSpec, programDef);

  genOutputParameterAccessors(ctx, classSpec, programDef, runInitializerLines);

  classSpec.members.push({
    name: "currentObj",
    type: genObjectPtrType(programClass),
    visibility: "private",
  });

  classSpec.methods.push({
    name: "Start",
    body: [
      `if (AutoRun) {`,
      `  Run();`,
      `}`,
    ],
    visibility: "private",
  });

  classSpec.methods.push({
    name: "OnDestroy",
    body: [
      `Stop();`,
    ],
    visibility: "private",
  });

  classSpec.methods.push({
    name: "Run",
    body: () => {
      return [
        `Stop();`,
        `${privateMember("currentObj")} = ${genCreateObject(programClass, storeAccessors)};`,
        ...runInitializerLines,
      ];
    },
    visibility: "public",
  });

  classSpec.methods.push({
    name: "Stop",
    body: () => {
      return [
        `if (${genNonNullCheck(privateMember("currentObj"))}) {`,
        `  ${genDerefMethodCall(privateMember("currentObj"), "terminate", [])};`,
        `}`,
        `${privateMember("currentObj")} = ${getNullValue()};`,
      ];
    },
    visibility: "public",
  });

  classSpec.methods.push({
    name: "Spawn",
    returnType: genObjectPtrType(programClass),
    body: () => {
      return [
        `var ret = ${genCreateObject(programClass, storeAccessors)};`,
        ...spawnInitializerLines,
        "return ret;",
      ];
    },
    visibility: "public",
  });

  writeMonoBehaviour(classSpec, {
    fileWriter,
    outDir,
  });
}
