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
import { CppIncludeAggregator, forwardDeclareClass, genClassHeaderDefinition, genClassSourceDefinition, getDataStoreClass, getDataStoreHeaderName, HEADER } from "./CppCodeGenImpl";
import { DataStoreObject, DataStoreReconciler, IObjectCollection, TransportStream } from "./CppDatasetLibraryTypes";
import { genInboundReconciledTypes, genObjectCollectionClasses } from "./GenReadReconcilerDataStore";
import { genOutboundReconciledTypes } from "./GenWriteReconcilerDataStore";
import { GenDataStoreContext, getInboundCollectionClassName, getOutboundCollectionClassName } from "../shared/GenDataStoreShared";

export function genMsgHandler(fieldName: string) {
  return `${fieldName}MessageHandler_`;
}

function getHeaderIncludes(ctx: GenDataStoreContext, includes: IncludeAggregator) {
  includes.addFile({
    filename: "<functional>",
    namespace: "std",
  });
  includes.addFile({
    filename: "<memory>",
    namespace: "std",
  });
}

function genReconcilerConstructorContents(ctx: GenDataStoreContext): string[] {
  const lines: string[] = [];
  for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
    const typeDef = reconcilerDef.type;
    const className = getInboundCollectionClassName(ctx, typeDef);
    const varName = typeDef.getName();

    lines.push(
      `${varName} = std::make_shared<${className}>(this);`,
      `registerCollection(${varName});`,
    );
  }
  for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
    const typeDef = reconcilerDef.type;
    const className = getOutboundCollectionClassName(ctx, typeDef);
    const varName = typeDef.getName();

    lines.push(
      `${varName} = std::make_shared<${className}>(this);`,
      `registerCollection(${varName});`,
    );
  }
  return lines;
}

function genDataStoreClass(ctx: GenDataStoreContext, includes: IncludeAggregator|null): string[] {
  const className = getDataStoreClass(ctx.storeDef.apiname, ctx.namespace, null);
  const baseClassName = DataStoreReconciler.getLocalType(ctx.namespace, includes);
  const messagePoolSize = ctx.storeDef.datamodel.calcMessagePoolSize();
  const lines = [
    `class ${className} : public ${baseClassName} {`,
    ` public:`,
    `  ${className}(std::weak_ptr<${TransportStream.getLocalType(ctx.namespace, includes)}> inboundTransport, std::weak_ptr<${TransportStream.getLocalType(ctx.namespace, includes)}> outboundTransport)`,
    `      : ${baseClassName}(inboundTransport, outboundTransport, ${messagePoolSize}) {`,
    ...indent(2, genReconcilerConstructorContents(ctx)),
    `  }`,
    ``,
  ];

  for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
    const typeDef = reconcilerDef.type;
    const className = getInboundCollectionClassName(ctx, typeDef);
    const varName = typeDef.getName();
    lines.push(...indent(1, [
      `std::shared_ptr<${className}> ${varName};`,
    ]));
  }

  for (const reconcilerDef of ctx.storeDef.getOutputReconcilers()) {
    const typeDef = reconcilerDef.type;
    const className = getOutboundCollectionClassName(ctx, typeDef);
    const varName = typeDef.getName();
    lines.push(...indent(1, [
      `std::shared_ptr<${className}> ${varName};`,
    ]));
  }

  lines.push(`};`);
  return lines;
}

function genExternalForwardDeclarations(ctx: GenDataStoreContext): string[] {
  const lines: string[] = [];

  for (const reconcilerDef of ctx.storeDef.getInputReconcilers()) {
    for (const indexConfig of reconcilerDef.indexConfigs) {
      if (indexConfig.boundClassName) {
        lines.push(forwardDeclareClass(indexConfig.boundClassName));
      }
    }
  }

  lines.push(``);

  return lines;
}

function genForwardDeclarations(ctx: GenDataStoreContext): string[] {
  const lines: string[] = [];

  const headerFile = getDataStoreHeaderName(ctx.storeDef.apiname);
  for (const typeDef of ctx.storeDef.datamodel.getTypeDefinitionsForHeader(headerFile)) {
    if (typeIsInterface(typeDef)) {
      lines.push(forwardDeclareClass(typeDef.getLocalType(ctx.namespace, null)));
    }
  }

  lines.push(``);

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
        namespace: ctx.namespace,
        includes,
      });
      classSpec.constructors.push({
        parameters: [{
          name: "id",
          type: ctx.moduleDef.ObjectUuid,
        }, {
          name: "collection",
          type: IObjectCollection.getLocalType(ctx.namespace, classSpec.includes) + "*",
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
  const includes = new CppIncludeAggregator();
  getHeaderIncludes(ctx, includes);

  const accessors = genAccessorTypes(ctx, includes);
  const reconciledTypes = [
    ...genInterfaceTypes(ctx, includes),
    ...genOutboundReconciledTypes(ctx, includes),
    ...genInboundReconciledTypes(ctx, includes),
  ];

  const collections = genObjectCollectionClasses(ctx, includes);

  const lines: string[] = [
    ...genExternalForwardDeclarations(ctx),
    ``,
    `namespace ${ctx.namespace} {`,
    ``,
    forwardDeclareClass(getDataStoreClass(ctx.storeDef.apiname, ctx.namespace, null)),
    ...genForwardDeclarations(ctx),
    ``,
    ...mapAndCollapse(accessors, genClassHeaderDefinition),
    ``,
    `// Reconciled Types`,
    ...mapAndCollapse(reconciledTypes, genClassHeaderDefinition),
    ``,
    `// Object Collections`,
    ...mapAndCollapse(collections, genClassHeaderDefinition),
    ``,
    `// Data Store Implementation`,
    ...genDataStoreClass(ctx, includes),
    ``,
    ...mapAndCollapse(accessors, genClassSourceDefinition, includes, true),
    ...mapAndCollapse(reconciledTypes, genClassSourceDefinition, includes, true),
    ...mapAndCollapse(collections, genClassSourceDefinition, includes, true),
    `} // namespace ${ctx.namespace}`,
    ``,
  ];

  lines.unshift(
    ...HEADER,
    `#pragma once`,
    ``,
    ...includes.getIncludes(headerName),
    ``,
  );

  fileWriter.writeFile(path.join(outdir, headerName), lines);
}
