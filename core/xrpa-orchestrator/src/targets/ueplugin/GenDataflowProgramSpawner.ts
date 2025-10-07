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
import { upperFirst } from "@xrpa/xrpa-utils";
import assert from "assert";

import { ClassSpec } from "../../shared/ClassSpec";
import {
  DataflowProgramDefinition,
  getDataflowInputParamsStructSpec,
  getDataflowInputs,
  getDataflowOutputParamsStructSpec,
  getDataflowOutputs,
  getReconcilerDefForNode,
} from "../../shared/DataflowProgramDefinition";
import { IncludeAggregator } from "../../shared/Helpers";
import { StructType } from "../../shared/StructType";
import { StructTypeDefinition, TypeDefinition, typeIsMessageData, typeIsStateData } from "../../shared/TypeDefinition";
import {
  CppIncludeAggregator,
  XRPA_NAMESPACE,
  PRIMITIVE_INTRINSICS,
  forwardDeclareClass,
  genCreateObject,
  genDerefMethodCall,
  genNonNullCheck,
  genObjectPtrType,
  getDataStoreHeaderName,
  getNullValue,
  nsJoin,
  privateMember,
  genPassthroughMethodBind,
} from "../cpp/CppCodeGenImpl";
import * as CppCodeGenImpl from "../cpp/CppCodeGenImpl";
import { GenDataflowProgramContext } from "../shared/GenDataflowProgramShared";
import { getDataStoreSubsystemName } from "./GenDataStoreSubsystem";
import { genUEMessageProxyDispatch, genUESendMessageAccessor, getComponentClassName, getComponentHeader, writeSceneComponent } from "./SceneComponentShared";

function genStateInputParameterAccessors(params: {
  classSpec: ClassSpec,
  inputParamsStruct: StructTypeDefinition,
  paramName: string,
  fieldType: TypeDefinition,
  cppIncludes: IncludeAggregator | null,
  initializerLines: string[];
  spawnInitializerLines: string[];
  runInitializerLines: string[];
}) {
  const memberName = upperFirst(params.paramName);
  const setterName = `Set${memberName}`;
  const objSetterName = `set${upperFirst(params.paramName)}`;
  const currentObj = privateMember("currentObj");

  const decorations: string[] = [
    `UPROPERTY(EditAnywhere, BlueprintReadWrite, BlueprintSetter = ${setterName})`
  ];

  params.inputParamsStruct.declareLocalFieldClassMember(params.classSpec, params.paramName, memberName, true, decorations, "public");

  params.initializerLines.push(
    ...params.inputParamsStruct.resetLocalFieldVarToDefault(params.classSpec.namespace, params.cppIncludes, params.paramName, memberName),
  );

  params.spawnInitializerLines.push(
    `${genDerefMethodCall("ret", objSetterName, [memberName])};`,
  );

  params.runInitializerLines.push(
    `${genDerefMethodCall(currentObj, objSetterName, [memberName])};`,
  );

  params.classSpec.methods.push({
    name: setterName,
    parameters: [{
      name: params.paramName,
      type: params.fieldType,
    }],
    body: () => [
      // set the local member value
      `${memberName} = ${params.paramName};`,

      `if (${genNonNullCheck(currentObj)}) {`,
      `  ${genDerefMethodCall(currentObj, objSetterName, [params.paramName])};`,
      `}`,
    ],
    separateImplementation: true,
  });
}

function genStateOutputParameterAccessors(params: {
  classSpec: ClassSpec,
  outputParamsStruct: StructTypeDefinition,
  fieldName: string,
  fieldType: TypeDefinition,
  runInitializerLines: string[];
}) {
  const memberName = upperFirst(params.fieldName);
  const currentObj = privateMember("currentObj");

  const decorations = ["UPROPERTY(EditAnywhere, BlueprintReadOnly)"]
  params.outputParamsStruct.declareLocalFieldClassMember(params.classSpec, params.fieldName, memberName, true, decorations, "public");

  params.classSpec.methods.push({
    name: `dispatch${memberName}Changed`,
    parameters: [{
      name: "value",
      type: params.fieldType,
    }],
    body: [
      `${memberName} = value;`,
    ],
    visibility: "private",
    separateImplementation: true,
  });

  params.runInitializerLines.push(
    `${currentObj}->on${memberName}Changed = ${genPassthroughMethodBind(`dispatch${memberName}Changed`, 1)};`,
  );
}

function genParameterAccessors(
  ctx: GenDataflowProgramContext,
  classSpec: ClassSpec,
  programDef: DataflowProgramDefinition,
  cppIncludes: IncludeAggregator | null,
): {
  initializerLines: string[];
  spawnInitializerLines: string[];
  runInitializerLines: string[];
} {
  const initializerLines: string[] = [];
  const spawnInitializerLines: string[] = [];
  const runInitializerLines: string[] = [];

  const inputParamsStruct: StructTypeDefinition = new StructType(
    CppCodeGenImpl,
    "DataflowProgramInputParams",
    XRPA_NAMESPACE,
    undefined,
    getDataflowInputParamsStructSpec(getDataflowInputs(programDef), ctx.moduleDef),
  );
  const fields = inputParamsStruct.getAllFields();

  for (const paramName in fields) {
    const fieldType = fields[paramName].type;
    if (typeIsMessageData(fieldType)) {
      genUESendMessageAccessor(classSpec, {
        namespace: ctx.namespace,
        categoryName: "",
        typeDef: inputParamsStruct,
        fieldName: paramName,
        fieldType,
        proxyObj: privateMember("currentObj"),
      });
    } else if (typeIsStateData(fieldType)) {
      genStateInputParameterAccessors({
        classSpec,
        inputParamsStruct,
        paramName,
        fieldType,
        cppIncludes,
        initializerLines,
        spawnInitializerLines,
        runInitializerLines,
      });
    } else {
      assert(false, `Unsupported input parameter type for ${paramName}`);
    }
  }

  return {
    initializerLines,
    spawnInitializerLines,
    runInitializerLines,
  };
}

function genOutputParameterAccessors(
  ctx: GenDataflowProgramContext,
  classSpec: ClassSpec,
  programDef: DataflowProgramDefinition,
  runInitializerLines: string[],
  forwardDeclarations: string[],
) {
  const outputs = getDataflowOutputs(programDef);
  const outputParamsStruct: StructTypeDefinition = new StructType(
    CppCodeGenImpl,
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
      genUEMessageProxyDispatch(classSpec, {
        storeDef: reconcilerDef.storeDef,
        categoryName: "",
        fieldName,
        fieldType,
        proxyObj: privateMember("currentObj"),
        proxyIsXrpaObj: false,
        initializerLines: runInitializerLines,
        forwardDeclarations,
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
  outSrcDir: string,
  outHeaderDir: string,
  programDef: DataflowProgramDefinition,
  pluginName: string,
) {
  const storeDefs = programDef.programInterfaceNames.map(storeName => ctx.moduleDef.getDataStore(storeName));
  const dataStoreSubsystemTypes = storeDefs.map(storeDef => `U${getDataStoreSubsystemName(storeDef)}`);
  const storeAccessors = storeDefs.map(storeDef => `GetWorld()->GetSubsystem<${getDataStoreSubsystemName(storeDef)}>()`);

  const headerIncludes = new CppIncludeAggregator([
    `Components/SceneComponent.h`,
    `CoreMinimal.h`,
    `<memory>`,
  ]);

  const componentClassName = getComponentClassName(null, programDef.interfaceName);
  const componentName = componentClassName.slice(1);
  const headerName = getComponentHeader(programDef.interfaceName);

  const cppIncludes = new CppIncludeAggregator([
    ...programDef.programInterfaceNames.map(getDataStoreHeaderName),
    ...storeDefs.map(storeDef => `${getDataStoreSubsystemName(storeDef)}.h`),
  ]);

  const programClass = nsJoin(ctx.namespace, programDef.interfaceName);

  const forwardDeclarations = [
    forwardDeclareClass(programClass),
    ...dataStoreSubsystemTypes.map(forwardDeclareClass),
  ];

  const classSpec = new ClassSpec({
    name: componentClassName,
    superClass: "USceneComponent",
    namespace: "",
    includes: headerIncludes,
    decorations: [
      `UCLASS(ClassGroup = ${pluginName}, meta = (BlueprintSpawnableComponent))`,
    ],
    classNameDecoration: `${pluginName.toUpperCase()}_API`,
    classEarlyInject: ["GENERATED_BODY()"],
  });

  classSpec.members.push({
    name: "AutoRun",
    type: PRIMITIVE_INTRINSICS.bool.typename,
    initialValue: false,
    visibility: "public",
    decorations: ["UPROPERTY(EditAnywhere, BlueprintReadWrite)"]
  });

  const { initializerLines, spawnInitializerLines, runInitializerLines } = genParameterAccessors(ctx, classSpec, programDef, cppIncludes);
  genOutputParameterAccessors(ctx, classSpec, programDef, runInitializerLines, forwardDeclarations);

  classSpec.constructors.push({
    body: initializerLines,
    separateImplementation: true,
  });

  classSpec.members.push({
    name: "currentObj",
    type: genObjectPtrType(programClass),
    visibility: "private",
  });

  classSpec.methods.push({
    name: "BeginPlay",
    body: [
      `Super::BeginPlay();`,
      `if (AutoRun) {`,
      `  Run();`,
      `}`,
    ],
    visibility: "protected",
    isVirtual: true,
    isOverride: true,
    separateImplementation: true,
  });

  classSpec.methods.push({
    name: "EndPlay",
    parameters: [{
      name: "EndPlayReason",
      type: "const EEndPlayReason::Type",
    }],
    body: [
      `Stop();`,
      `Super::EndPlay(EndPlayReason);`,
    ],
    visibility: "protected",
    isVirtual: true,
    isOverride: true,
    separateImplementation: true,
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
    decorations: ["UFUNCTION(BlueprintCallable)"],
    separateImplementation: true,
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
    decorations: ["UFUNCTION(BlueprintCallable)"],
    separateImplementation: true,
  });

  classSpec.methods.push({
    name: "Spawn",
    returnType: genObjectPtrType(programClass),
    body: () => {
      return [
        `auto ret = ${genCreateObject(programClass, storeAccessors)};`,
        ...spawnInitializerLines,
        "return ret;",
      ];
    },
    visibility: "public",
    separateImplementation: true,
  });

  writeSceneComponent(classSpec, {
    fileWriter,
    componentName,
    headerName,
    cppIncludes,
    headerIncludes,
    outSrcDir,
    outHeaderDir,
    forwardDeclarations,
  });
}
