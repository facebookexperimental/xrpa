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
import { PRIMITIVE_INTRINSICS, genFieldChangedCheck, genRuntimeGuid, getDataStoreHeaderName, identifierName } from "./PythonCodeGenImpl";
import * as PythonCodeGenImpl from "./PythonCodeGenImpl";
import { DataStoreObject, DataStoreReconciler, IDataStoreObjectAccessor, IObjectCollection, ObjectCollection, ObjectCollectionIndex, ObjectCollectionIndexedBinding, TransportStreamAccessor } from "./PythonDatasetLibraryTypes";
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
    const checkName = `check_${identifierName(fieldName)}_changed`;
    const funcName = fieldGetterFuncName(PythonCodeGenImpl, typeFields, fieldName);
    lines.push(
      `if value.${checkName}(fields_changed):`,
      `  ${defaultFieldToMemberVar(fieldName)} = value.${funcName}()`,
    )
  }

  lines.push(
    `self._handle_xrpa_fields_changed(fields_changed)`,
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
      interfaceName: typeDef.interfaceType ? typeDef.interfaceType.getLocalType(ctx.namespace, includesIn) : `${IDataStoreObjectAccessor.getLocalType(ctx.namespace, includesIn)}[${readAccessor}]`,
      namespace: ctx.namespace,
      includes: includesIn,
    });

    genChangeHandlerMethods(classSpec, true);

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

    genWriteFieldAccessors(classSpec, {
      ctx,
      reconcilerDef,
      fieldToMemberVar: defaultFieldToMemberVar,
      fieldAccessorNameOverrides: {},
      directionality: "outbound",
    });

    genFieldProperties(classSpec, {
      codegen: PythonCodeGenImpl,
      reconcilerDef,
      fieldToMemberVar: defaultFieldToMemberVar,
      canCreate: false,
      canChange: true,
      canSetDirty: true,
      directionality: "outbound",
      visibility: "private",
    });

    classSpec.methods.push({
      name: "process_ds_update",
      parameters: [{
        name: "value",
        type: readAccessor,
      }, {
        name: "fields_changed",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      body: includes => genProcessUpdateFunctionBody(ctx, includes, typeDef, reconcilerDef),
      isVirtual: true,
      isFinal: true,
    });

    classSpec.methods.push({
      name: "create",
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
        `return ${classSpec.name}(id, collection)`,
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
      codegen: PythonCodeGenImpl,
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
      codegen: PythonCodeGenImpl,
      reconcilerDef,
      proxyObj: null,
    });

    genMessageChannelDispatch(classSpec, {
      reconcilerDef,
      genMsgHandler,
      msgDataToParams: () => ["message"],
    });

    classSpec.methods.push({
      name: "write_ds_changes",
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
      name: "prep_ds_full_update",
      returnType: PythonCodeGenImpl.PRIMITIVE_INTRINSICS.uint64.typename,
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

    const superClass = `${ObjectCollection.getLocalType(ctx.namespace, includesIn)}[${readAccessor}, ${localPtr}]`;

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
        `self._set_create_delegate_internal(${reconciledTypeName}.create)`,
      );

      classSpec.methods.push({
        name: "set_create_delegate",
        parameters: [{
          name: "create_delegate",
          type: `typing.Callable[[${ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, includesIn)}, ${readAccessor}, ${IObjectCollection.getLocalType(ctx.namespace, includesIn)}], ${localPtr}]`,
        }],
        body: ["self._set_create_delegate_internal(create_delegate)"],
      });
      includesIn.addFile({ namespace: "typing" });
    } else {
      // expose addObject, removeObject, and createObject to the user
      classSpec.methods.push({
        name: "add_object",
        parameters: [{
          name: "obj",
          type: localPtr,
        }],
        body: ["self._add_object_internal(obj)"],
      });

      const id = genRuntimeGuid({
        objectUuidType: ctx.moduleDef.ObjectUuid.getLocalType(ctx.namespace, classSpec.includes),
        guidGen: ctx.moduleDef.guidGen,
        includes: classSpec.includes,
      });
      classSpec.methods.push({
        name: "create_object",
        returnType: reconciledTypeName,
        body: [
          `obj = ${reconciledTypeName}(${id})`,
          `self._add_object_internal(obj)`,
          `return obj`,
        ],
      });

      classSpec.methods.push({
        name: "remove_object",
        parameters: [{
          name: "id",
          type: ctx.moduleDef.ObjectUuid,
        }],
        body: ["self._remove_object_internal(id)"],
      });
    }

    classSpec.constructors.push({
      parameters: [{
        name: "reconciler",
        type: DataStoreReconciler,
      }],
      superClassInitializers: [
        readAccessor,
        "reconciler",
        `${typeDef.getCollectionId()}`,
        `${inboundFieldMask}`,
        `${indexedFieldMask}`,
        upperFirst(`${isLocalOwned}`),
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
      addBinding: `${dataStorePtr}.add_${indexConfig.indexFieldName}_binding(${indexMemberName}, ${boundObjPtr})`,
      removeBinding: `${dataStorePtr}.Remove${indexConfig.indexFieldName}_binding(${indexMemberName}, ${boundObjPtr})`,
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
    const indexFieldGet = fieldGetterFuncName(PythonCodeGenImpl, fields, indexConfig.indexFieldName);
    const memberName = indexConfig.boundClassName ? PythonCodeGenImpl.privateMember(`binding_${indexConfig.boundClassName}_to_${indexConfig.indexFieldName}`) : `${identifierName(indexConfig.indexFieldName)}_index`;

    indexNotifyCreateLines.push(`self.${memberName}.on_create(obj, obj.${indexFieldGet}())`);
    indexNotifyUpdateLines.push(
      `if (fields_changed & ${reconcilerDef.type.getFieldBitMask(indexConfig.indexFieldName)}) != 0:`,
      `  self.${memberName}.on_update(obj, obj.${indexFieldGet}())`,
    );
    indexNotifyDeleteLines.push(`self.${memberName}.on_delete(obj, obj.${indexFieldGet}())`);

    if (boundType) {
      const memberType = `${ObjectCollectionIndexedBinding.getLocalType(ctx.namespace, classSpec.includes)}[${readAccessor}, ${localPtr}, ${indexFieldTypeName}, ${boundType}]`;
      classSpec.members.push({
        name: memberName,
        type: memberType,
        visibility: "private",
        initialValue: new CodeLiteralValue(PythonCodeGenImpl, `${memberType}()`),
      });

      classSpec.methods.push({
        name: `Add${upperFirst(indexConfig.indexFieldName)}Binding`,
        parameters: [{
          name: "index_value",
          type: indexFieldType,
        }, {
          name: "local_obj",
          type: boundType,
        }],
        body: [
          `self.${memberName}.add_local_object(index_value, local_obj)`,
        ],
      });

      classSpec.methods.push({
        name: `Remove${upperFirst(indexConfig.indexFieldName)}Binding`,
        parameters: [{
          name: "index_value",
          type: indexFieldType,
        }, {
          name: "local_obj",
          type: boundType,
        }],
        body: [
          `self.${memberName}.remove_local_object(index_value, local_obj)`,
        ],
      });
    } else {
      const memberType = `${ObjectCollectionIndex.getLocalType(ctx.namespace, classSpec.includes)}[${readAccessor}, ${localPtr}, ${indexFieldTypeName}]`;
      classSpec.members.push({
        name: memberName,
        type: memberType,
        visibility: "public",
        initialValue: new CodeLiteralValue(PythonCodeGenImpl, `${memberType}()`),
      });
    }
  }

  if (indexNotifyCreateLines.length > 0) {
    classSpec.methods.push({
      name: "index_notify_create",
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
      name: "index_notify_update",
      parameters: [{
        name: "obj",
        type: localPtr,
      }, {
        name: "fields_changed",
        type: PRIMITIVE_INTRINSICS.uint64.typename,
      }],
      body: indexNotifyUpdateLines,
      isOverride: true,
      visibility: "protected",
    });
  }

  if (indexNotifyDeleteLines.length > 0) {
    classSpec.methods.push({
      name: "index_notify_delete",
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
