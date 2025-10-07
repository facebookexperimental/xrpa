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


import { upperFirst } from "@xrpa/xrpa-utils";

import { ClassSpec } from "../../shared/ClassSpec";
import { InputReconcilerDefinition, OutputReconcilerDefinition } from "../../shared/DataStore";
import { IncludeAggregator } from "../../shared/Helpers";
import { CollectionTypeDefinition } from "../../shared/TypeDefinition";
import { CodeLiteralValue } from "../../shared/TypeValue";
import { GenDataStoreContext, fieldGetterFuncName, genFieldProperties, getInboundCollectionClassName, getOutboundCollectionClassName } from "../shared/GenDataStoreShared";
import { genSignalFieldAccessors } from "../shared/GenSignalAccessorsShared";
import { PRIMITIVE_INTRINSICS, genFieldChangedCheck, genRuntimeGuid, getDataStoreHeaderName } from "./CsharpCodeGenImpl";
import * as CsharpCodeGenImpl from "./CsharpCodeGenImpl";
import { DataStoreObject, DataStoreReconciler, IDataStoreObjectAccessor, IObjectCollection, ObjectCollection, ObjectCollectionIndex, ObjectCollectionIndexedBinding, TransportStreamAccessor } from "./CsharpDatasetLibraryTypes";
import { genMsgHandler } from "./GenDataStore";
import { genMessageChannelDispatch, genMessageFieldAccessors } from "./GenMessageAccessors";
import { defaultFieldToMemberVar, genChangeHandlerMethods, genPrepFullUpdateFunctionBody, genWriteFieldAccessors, genWriteFunctionBody } from "./GenWriteReconcilerDataStore";

export function genProcessUpdateFunctionBody(
  ctx: GenDataStoreContext,
  includes: IncludeAggregator | null,
  typeDef: CollectionTypeDefinition,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
): string[] {
  const lines: string[] = [];

  const typeFields = typeDef.getStateFields();
  for (const fieldName in typeFields) {
    // inbound fields only
    if (!reconcilerDef.isInboundField(fieldName)) {
      continue;
    }
    const checkName = `Check${upperFirst(fieldName)}Changed`;
    const funcName = fieldGetterFuncName(CsharpCodeGenImpl, typeFields, fieldName);
    lines.push(
      `if (value.${checkName}(fieldsChanged)) {`,
      `  ${defaultFieldToMemberVar(fieldName)} = value.${funcName}();`,
      `}`,
    )
  }

  lines.push(
    `HandleXrpaFieldsChanged(fieldsChanged);`,
  );

  return lines;
}

export function genInboundReconciledTypes(ctx: GenDataStoreContext, includesIn: IncludeAggregator): ClassSpec[] {
  const ret: ClassSpec[] = [];

  const headerFile = getDataStoreHeaderName(ctx.storeDef.apiname);

  for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
    const typeDef = reconcilerDef.type;
    if (typeDef.getLocalHeaderFile() !== headerFile) {
      continue;
    }

    const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);

    const classSpec = new ClassSpec({
      name: typeDef.getLocalType(ctx.namespace, null),
      superClass: DataStoreObject.getLocalType(ctx.namespace, includesIn),
      interfaceName: typeDef.interfaceType ? typeDef.interfaceType.getLocalType(ctx.namespace, includesIn) : `${IDataStoreObjectAccessor.getLocalType(ctx.namespace, includesIn)}<${readAccessor}>`,
      namespace: ctx.namespace,
      includes: includesIn,
    });

    classSpec.constructors.push({
      parameters: [{
        name: "id",
        type: ctx.moduleDef.ObjectUuid,
      }, {
        name: "collection",
        type: IObjectCollection,
      }],
      superClassInitializers: ["id", "collection"],
      body: [],
    });

    genChangeHandlerMethods(classSpec, true);

    genWriteFieldAccessors(classSpec, {
      ctx,
      reconcilerDef,
      fieldToMemberVar: defaultFieldToMemberVar,
      fieldAccessorNameOverrides: {},
      directionality: "outbound",
    });

    genFieldProperties(classSpec, {
      codegen: CsharpCodeGenImpl,
      reconcilerDef,
      fieldToMemberVar: defaultFieldToMemberVar,
      canCreate: false,
      canChange: true,
      canSetDirty: true,
      directionality: "outbound",
      visibility: "private",
    });

    classSpec.methods.push({
      name: "ProcessDSUpdate",
      parameters: [{
        name: "value",
        type: readAccessor,
      }, {
        name: "fieldsChanged",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      body: includes => genProcessUpdateFunctionBody(ctx, includes, typeDef, reconcilerDef),
      isFinal: true,
    });

    classSpec.methods.push({
      name: "Create",
      returnType: classSpec.name,
      parameters: [{
        name: "id",
        type: ctx.moduleDef.ObjectUuid,
      }, {
        name: "obj",
        type: readAccessor,
      }, {
        name: "collection",
        type: IObjectCollection,
      }],
      body: [
        `return new ${classSpec.name}(id, collection);`,
      ],
      isStatic: true,
    });

    genWriteFieldAccessors(classSpec, {
      ctx,
      reconcilerDef,
      fieldToMemberVar: defaultFieldToMemberVar,
      fieldAccessorNameOverrides: {},
      gettersOnly: true,
      directionality: "inbound",
    });

    genFieldProperties(classSpec, {
      codegen: CsharpCodeGenImpl,
      reconcilerDef,
      fieldToMemberVar: defaultFieldToMemberVar,
      canCreate: false,
      canChange: false,
      directionality: "inbound",
      visibility: "private",
    });

    const fields = typeDef.getStateFields();
    for (const name in fields) {
      genFieldChangedCheck(classSpec, { parentType: typeDef, fieldName: name });
    }

    genMessageFieldAccessors(classSpec, {
      reconcilerDef,
      genMsgHandler,
    });

    genSignalFieldAccessors(classSpec, {
      codegen: CsharpCodeGenImpl,
      reconcilerDef,
      proxyObj: null,
    });

    genMessageChannelDispatch(classSpec, {
      reconcilerDef,
      genMsgHandler,
      msgDataToParams: () => ["message"],
    });

    classSpec.methods.push({
      name: "WriteDSChanges",
      parameters: [{
        name: "accessor",
        type: TransportStreamAccessor,
      }],
      body: includes => genWriteFunctionBody({
        ctx,
        includes,
        reconcilerDef,
        fieldToMemberVar: defaultFieldToMemberVar,
        canCreate: false,
      }),
      isVirtual: true,
    });

    classSpec.methods.push({
      name: "PrepDSFullUpdate",
      returnType: CsharpCodeGenImpl.PRIMITIVE_INTRINSICS.uint64.typename,
      body: includes => genPrepFullUpdateFunctionBody({
        ctx,
        includes,
        reconcilerDef,
        fieldToMemberVar: defaultFieldToMemberVar,
        canCreate: false,
      }),
    });

    ret.push(classSpec);
  }

  return ret;
}

export function genObjectCollectionClasses(ctx: GenDataStoreContext, includesIn: IncludeAggregator): ClassSpec[] {
  const ret: ClassSpec[] = [];

  for (const reconcilerDef of ctx.storeDef.getAllReconcilers()) {
    const isLocalOwned = reconcilerDef instanceof OutputReconcilerDefinition;
    const typeDef = reconcilerDef.type;

    const readAccessor = typeDef.getReadAccessorType(ctx.namespace, includesIn);
    const localPtr = typeDef.getLocalTypePtr(ctx.namespace, includesIn);

    const indexedFieldMask = reconcilerDef.getIndexedBitMask();
    const inboundFieldMask = reconcilerDef.getInboundChangeBits();

    const superClass = `${ObjectCollection.getLocalType(ctx.namespace, includesIn)}<${readAccessor}, ${localPtr}>`;

    const classSpec = new ClassSpec({
      name: isLocalOwned ? getOutboundCollectionClassName(ctx, typeDef) : getInboundCollectionClassName(ctx, typeDef),
      superClass,
      namespace: ctx.namespace,
      includes: includesIn,
    });

    const constructorBody: string[] = [];

    // inbound (remotely created) objects are created by the reconciler, so we need to give it a delegate functions
    const reconciledTypeName = typeDef.getLocalType(ctx.namespace, null);
    if (reconcilerDef instanceof InputReconcilerDefinition) {
      constructorBody.push(
        `SetCreateDelegateInternal(${reconciledTypeName}.Create);`,
      );

      classSpec.methods.push({
        name: "SetCreateDelegate",
        parameters: [{
          name: "createDelegate",
          type: "CreateDelegateFunction",
        }],
        body: ["SetCreateDelegateInternal(createDelegate);"],
      });
    } else {
      // expose addObject, removeObject, and createObject to the user
      classSpec.methods.push({
        name: "AddObject",
        parameters: [{
          name: "obj",
          type: localPtr,
        }],
        body: ["AddObjectInternal(obj);"],
      });

      const id = genRuntimeGuid({
        objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, classSpec.includes),
        guidGen: ctx.moduleDef.guidGen,
        includes: classSpec.includes,
      });
      classSpec.methods.push({
        name: "CreateObject",
        returnType: reconciledTypeName,
        body: [
          `var obj = new ${reconciledTypeName}(${id});`,
          `AddObjectInternal(obj);`,
          `return obj;`,
        ],
      });

      classSpec.methods.push({
        name: "RemoveObject",
        parameters: [{
          name: "id",
          type: ctx.moduleDef.ObjectUuid,
        }],
        body: ["RemoveObjectInternal(id);"],
      });
    }

    classSpec.constructors.push({
      parameters: [{
        name: "reconciler",
        type: DataStoreReconciler,
      }],
      superClassInitializers: [
        "reconciler",
        `${typeDef.getCollectionId()}`,
        `${inboundFieldMask}`,
        `${indexedFieldMask}`,
        `${isLocalOwned}`,
      ],
      body: constructorBody,
    });

    setupCollectionClassIndexing(ctx, classSpec, reconcilerDef);

    ret.push(classSpec);
  }
  return ret;
}

export function genIndexedBindingCalls<T extends InputReconcilerDefinition | OutputReconcilerDefinition>(
  ctx: GenDataStoreContext,
  reconcilerDef: T,
  dataStorePtr: string,
  boundObjPtr: string,
  getFieldMemberName: (reconcilerDef: T, fieldName: string) => string,
): Record<string, { addBinding: string, removeBinding: string }> {
  const ret: Record<string, { addBinding: string, removeBinding: string }> = {};

  for (const indexConfig of reconcilerDef.indexConfigs) {
    const indexMemberName = getFieldMemberName(reconcilerDef, indexConfig.indexFieldName);
    ret[indexConfig.indexFieldName] = {
      addBinding: `${dataStorePtr}.Add${upperFirst(indexConfig.indexFieldName)}Binding(${indexMemberName}, ${boundObjPtr});`,
      removeBinding: `${dataStorePtr}.Remove${upperFirst(indexConfig.indexFieldName)}Binding(${indexMemberName}, ${boundObjPtr});`,
    };
  }

  return ret;
}

function setupCollectionClassIndexing(
  ctx: GenDataStoreContext,
  classSpec: ClassSpec,
  reconcilerDef: InputReconcilerDefinition | OutputReconcilerDefinition,
) {
  const indexNotifyCreateLines: string[] = [];
  const indexNotifyUpdateLines: string[] = [];
  const indexNotifyDeleteLines: string[] = [];

  const fields = reconcilerDef.type.getStateFields();
  const readAccessor = reconcilerDef.type.getReadAccessorType(ctx.namespace, classSpec.includes);
  const localPtr = reconcilerDef.type.getLocalTypePtr(ctx.namespace, classSpec.includes);

  for (const indexConfig of reconcilerDef.indexConfigs) {
    const boundType = indexConfig.boundClassName ?? null;
    const indexFieldType = fields[indexConfig.indexFieldName].type;
    const indexFieldTypeName = indexFieldType.getLocalType(ctx.namespace, classSpec.includes);
    const indexFieldGet = fieldGetterFuncName(CsharpCodeGenImpl, fields, indexConfig.indexFieldName);
    const memberName = indexConfig.boundClassName ? CsharpCodeGenImpl.privateMember(`binding${indexConfig.boundClassName}To${upperFirst(indexConfig.indexFieldName)}`) : `${upperFirst(indexConfig.indexFieldName)}Index`;

    indexNotifyCreateLines.push(`${memberName}.OnCreate(obj, obj.${indexFieldGet}());`);
    indexNotifyUpdateLines.push(
      `if ((fieldsChanged & ${reconcilerDef.type.getFieldBitMask(indexConfig.indexFieldName)}) != 0) {`,
      `  ${memberName}.OnUpdate(obj, obj.${indexFieldGet}());`,
      `}`,
    );
    indexNotifyDeleteLines.push(`${memberName}.OnDelete(obj, obj.${indexFieldGet}());`);

    if (boundType) {
      classSpec.members.push({
        name: memberName,
        type: `${ObjectCollectionIndexedBinding.getLocalType(ctx.namespace, classSpec.includes)}<${readAccessor}, ${localPtr}, ${indexFieldTypeName}, ${boundType}>`,
        visibility: "private",
        initialValue: new CodeLiteralValue(CsharpCodeGenImpl, `new()`),
      });

      classSpec.methods.push({
        name: `Add${upperFirst(indexConfig.indexFieldName)}Binding`,
        parameters: [{
          name: "indexValue",
          type: indexFieldType,
        }, {
          name: "localObj",
          type: boundType,
        }],
        body: [
          `${memberName}.AddLocalObject(indexValue, localObj);`,
        ],
      });

      classSpec.methods.push({
        name: `Remove${upperFirst(indexConfig.indexFieldName)}Binding`,
        parameters: [{
          name: "indexValue",
          type: indexFieldType,
        }, {
          name: "localObj",
          type: boundType,
        }],
        body: [
          `${memberName}.RemoveLocalObject(indexValue, localObj);`,
        ],
      });
    } else {
      classSpec.members.push({
        name: memberName,
        type: `${ObjectCollectionIndex.getLocalType(ctx.namespace, classSpec.includes)}<${readAccessor}, ${localPtr}, ${indexFieldTypeName}>`,
        visibility: "public",
        initialValue: new CodeLiteralValue(CsharpCodeGenImpl, "new()"),
      });
    }
  }

  if (indexNotifyCreateLines.length > 0) {
    classSpec.methods.push({
      name: "IndexNotifyCreate",
      parameters: [{
        name: "obj",
        type: localPtr,
      }],
      body: indexNotifyCreateLines,
      isOverride: true,
      visibility: "protected",
    });
  }

  if (indexNotifyUpdateLines.length > 0) {
    classSpec.methods.push({
      name: "IndexNotifyUpdate",
      parameters: [{
        name: "obj",
        type: localPtr,
      }, {
        name: "fieldsChanged",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      body: indexNotifyUpdateLines,
      isOverride: true,
      visibility: "protected",
    });
  }

  if (indexNotifyDeleteLines.length > 0) {
    classSpec.methods.push({
      name: "IndexNotifyDelete",
      parameters: [{
        name: "obj",
        type: localPtr,
      }],
      body: indexNotifyDeleteLines,
      isOverride: true,
      visibility: "protected",
    });
  }
}
