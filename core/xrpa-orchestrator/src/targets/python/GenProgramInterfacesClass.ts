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
import path from "path";

import { ClassSpec, MethodParam } from "../../shared/ClassSpec";
import { DataStoreDefinition } from "../../shared/DataStore";
import { ModuleDefinition } from "../../shared/ModuleDefinition";
import { PythonIncludeAggregator, getDataStoreHeaderName, getDataStoreName, HEADER, genClassDefinition, getDataStoreHeaderNamespace, getDataStoreClass, identifierName } from "./PythonCodeGenImpl";
import { SharedMemoryTransportStream, TransportStream, XrpaModule } from "./PythonDatasetLibraryTypes";
import { getDataStoreConfigName } from "./GenTypesDefinitions";

function getInboundTransportVarName(storeDef: DataStoreDefinition) {
  return `${storeDef.dataset.toLocaleLowerCase()}_inbound_transport`;
}

function getOutboundTransportVarName(storeDef: DataStoreDefinition) {
  return `${storeDef.dataset.toLocaleLowerCase()}_outbound_transport`;
}

function genTransportParams(moduleDef: ModuleDefinition): MethodParam[] {
  const ret: MethodParam[] = [];
  for (const storeDef of moduleDef.getDataStores()) {
    ret.push({
      name: getInboundTransportVarName(storeDef),
      type: TransportStream,
    });
    ret.push({
      name: getOutboundTransportVarName(storeDef),
      type: TransportStream,
    });
  }
  return ret;
}

export function genProgramInterfacesClass(fileWriter: FileWriter, libDir: string, moduleDef: ModuleDefinition) {
  const namespace = "";

  const className = `${moduleDef.name}ProgramInterfaces`;
  const filename = `${identifierName(moduleDef.name)}_program_interfaces.py`;

  const includes = new PythonIncludeAggregator([]);

  const classSpec = new ClassSpec({
    name: className,
    namespace,
    includes,
    superClass: XrpaModule.getLocalType(namespace, includes),
  });

  classSpec.constructors.push({
    parameters: genTransportParams(moduleDef),
    memberInitializers: moduleDef.getDataStores().map(storeDef => {
      const dataStoreName = getDataStoreName(storeDef.apiname);
      includes.addFile({
        filename: getDataStoreHeaderName(storeDef.apiname),
        namespace: getDataStoreHeaderNamespace(storeDef.apiname),
      });
      return [dataStoreName, `${getDataStoreClass(storeDef.apiname, namespace, includes)}(${getInboundTransportVarName(storeDef)}, ${getOutboundTransportVarName(storeDef)})`];
    }),
  });

  classSpec.destructorBody = ["self.shutdown()"];

  classSpec.methods.push({
    name: "_tick_inputs",
    body: moduleDef.getDataStores().map(storeDef => `self.${getDataStoreName(storeDef.apiname)}.tick_inbound()`),
    visibility: "protected",
  });

  classSpec.methods.push({
    name: "_tick_outputs",
    body: moduleDef.getDataStores().map(storeDef => `self.${getDataStoreName(storeDef.apiname)}.tick_outbound()`),
    visibility: "protected",
  });

  classSpec.methods.push({
    name: "_shutdown",
    body: moduleDef.getDataStores().map(storeDef => `self.${getDataStoreName(storeDef.apiname)}.shutdown()`),
    visibility: "protected",
  });

  const lines = [
    ...HEADER,
    ``,
    ...includes.getNamespaceImports(),
    ``,
    ...genClassDefinition(classSpec),
  ];

  fileWriter.writeFile(path.join(libDir, filename), lines);
}


export function genApplicationInterfaceClass(fileWriter: FileWriter, libDir: string, moduleDef: ModuleDefinition, backgroundTick: boolean) {
  const namespace = "";

  const className = `${moduleDef.name}ApplicationInterface`;
  const filename = `${identifierName(moduleDef.name)}_application_interface.py`;

  const programInterfacesNamespace = `xrpa.${identifierName(moduleDef.name)}_program_interfaces`;
  const includes = new PythonIncludeAggregator([programInterfacesNamespace]);
  if (backgroundTick) {
    includes.addFile({ namespace: "threading" });
  }

  const classSpec = new ClassSpec({
    name: className,
    namespace: namespace,
    includes: includes,
    superClass: `${programInterfacesNamespace}.${moduleDef.name}ProgramInterfaces`,
  });

  const transportInitializers: string[] = [];

  for (const storeDef of moduleDef.getDataStores()) {
    const inboundMemMarker = storeDef.isModuleProgramInterface ? "Input" : "Output";
    const outboundMemMarker = storeDef.isModuleProgramInterface ? "Output" : "Input";

    transportInitializers.push(
      `${SharedMemoryTransportStream.getLocalType(namespace, includes)}("${storeDef.dataset}${inboundMemMarker}", ${getDataStoreConfigName(storeDef.apiname, namespace, includes)})`,
      `${SharedMemoryTransportStream.getLocalType(namespace, includes)}("${storeDef.dataset}${outboundMemMarker}", ${getDataStoreConfigName(storeDef.apiname, namespace, includes)})`,
    );
  }

  classSpec.constructors.push({
    superClassInitializers: transportInitializers,
    body: backgroundTick ? [
      "self._thread = threading.Thread(target=self._background_tick_thread)",
      "self._thread.start()",
    ] : [],
  });

  if (backgroundTick) {
    classSpec.methods.push({
      name: "shutdown",
      body: [
        "self.stop()",
        "self._thread.join()",
      ],
      visibility: "public",
    });
  }

  const lines = [
    ...HEADER,
    ``,
    ...includes.getNamespaceImports(),
    ``,
    ...genClassDefinition(classSpec),
  ];

  fileWriter.writeFile(path.join(libDir, filename), lines);
}
