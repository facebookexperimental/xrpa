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
import { indent, mapAndCollapse } from "@xrpa/xrpa-utils";
import path from "path";

import { ClassSpec } from "../../shared/ClassSpec";
import { IncludeAggregator } from "../../shared/Helpers";
import { typeIsCollection, typeIsInterface, typeIsStructWithAccessor } from "../../shared/TypeDefinition";
import { GenDataStoreContext, getInboundCollectionClassName, getOutboundCollectionClassName } from "../shared/GenDataStoreShared";
import { genInboundReconciledTypes, genObjectCollectionClasses } from "./GenReadReconcilerDataStore";
import { genOutboundReconciledTypes } from "./GenWriteReconcilerDataStore";
import { PythonIncludeAggregator, genClassDefinition, getDataStoreHeaderName, HEADER, getDataStoreClass, getDataStoreHeaderNamespace } from "./PythonCodeGenImpl";
import * as PythonCodeGenImpl from "./PythonCodeGenImpl";
import { DataStoreObject, DataStoreReconciler, IDataStoreObject, IObjectCollection, TransportStream } from "./PythonDatasetLibraryTypes";

export function genMsgHandler(msg: string) {
  return PythonCodeGenImpl.privateMember(`${msg}_message_handler`);
}

function genReconcilerConstructorContents(ctx: GenDataStoreContext): string[] {
  const lines: string[] = [];
  for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
    const typeDef = reconcilerDef.type;
    const className = getInboundCollectionClassName(ctx, typeDef);
    const varName = typeDef.getName();

    lines.push(
      `self.${varName} = ${className}(self)`,
      `self._register_collection(self.${varName})`,
    );
  }

  for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
    const typeDef = reconcilerDef.type;
    const className = getOutboundCollectionClassName(ctx, typeDef);
    const varName = typeDef.getName();

    lines.push(
      `self.${varName} = ${className}(self)`,
      `self._register_collection(self.${varName})`,
    );
  }
  return lines;
}

function genDataStoreClass(ctx: GenDataStoreContext, includes: IncludeAggregator): string[] {
  const className = getDataStoreClass(ctx.storeDef.apiname, ctx.namespace, null);
  const baseClassName = DataStoreReconciler.getLocalType(ctx.namespace, includes);
  const messagePoolSize = ctx.storeDef.datamodel.calcMessagePoolSize();
  const lines = [
    `class ${className}(${baseClassName}):`,
    `  def __init__(self, ${TransportStream.declareLocalParam(ctx.namespace, includes, "inbound_transport")}, ${TransportStream.declareLocalParam(ctx.namespace, includes, "outbound_transport")}):`,
    `    super().__init__(inbound_transport, outbound_transport, ${messagePoolSize})`,
    ...indent(2, genReconcilerConstructorContents(ctx)),
    ``,
  ];
  return lines;
}

function genAccessorTypes(ctx: GenDataStoreContext, includes: IncludeAggregator): ClassSpec[] {
  const ret: ClassSpec[] = [];

  for (const typeDef of ctx.storeDef.datamodel.getAllTypeDefinitions()) {
    if (typeIsStructWithAccessor(typeDef)) {
      const readDef = typeDef.genReadAccessorDefinition(ctx.namespace, includes);
      if (readDef) {
        ret.push(readDef);
      }

      const writeDef = typeDef.genWriteAccessorDefinition(ctx.namespace, includes);
      if (writeDef) {
        ret.push(writeDef);
      }
    }
  }

  return ret;
}

function genInterfaceTypes(ctx: GenDataStoreContext, includes: IncludeAggregator): ClassSpec[] {
  const ret: ClassSpec[] = [];

  const headerFile = getDataStoreHeaderName(ctx.storeDef.apiname);
  for (const typeDef of ctx.storeDef.datamodel.getTypeDefinitionsForHeader(headerFile)) {
    if (typeIsInterface(typeDef) && !typeIsCollection(typeDef)) {
      const classSpec = new ClassSpec({
        name: typeDef.getLocalType(ctx.namespace, includes),
        superClass: DataStoreObject.getLocalType(ctx.namespace, includes),
        interfaceName: IDataStoreObject.getLocalType(ctx.namespace, includes),
        forceAbstract: true,
        namespace: ctx.namespace,
        includes,
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
      ret.push(classSpec);
    }
  }

  return ret;
}

export function genDataStore(
  fileWriter: FileWriter,
  outdir: string,
  ctx: GenDataStoreContext,
) {
  const headerName = getDataStoreHeaderName(ctx.storeDef.apiname);
  ctx = {...ctx, namespace: getDataStoreHeaderNamespace(ctx.storeDef.apiname)};

  const includes = new PythonIncludeAggregator();

  const accessors = genAccessorTypes(ctx, includes);
  const reconciledTypes = [
    ...genInterfaceTypes(ctx, includes),
    ...genOutboundReconciledTypes(ctx, includes),
    ...genInboundReconciledTypes(ctx, includes),
  ];
  const collections = genObjectCollectionClasses(ctx, includes);

  const lines: string[] = [
    ...mapAndCollapse(accessors, genClassDefinition),
    ``,
    `# Reconciled Types`,
    ...mapAndCollapse(reconciledTypes, genClassDefinition),
    ``,
    `# Object Collections`,
    ...mapAndCollapse(collections, genClassDefinition),
    ``,
    `# Data Store Implementation`,
    ...genDataStoreClass(ctx, includes),
    ``,
  ];

  lines.unshift(
    ...HEADER,
    ``,
    ...includes.getNamespaceImports(ctx.namespace),
    ``,
  );

  fileWriter.writeFile(path.join(outdir, headerName), lines);
}
