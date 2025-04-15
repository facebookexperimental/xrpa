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
exports.genApplicationInterfaceClass = exports.genProgramInterfacesClass = void 0;
const path_1 = __importDefault(require("path"));
const ClassSpec_1 = require("../../shared/ClassSpec");
const PythonCodeGenImpl_1 = require("./PythonCodeGenImpl");
const PythonDatasetLibraryTypes_1 = require("./PythonDatasetLibraryTypes");
const GenTypesDefinitions_1 = require("./GenTypesDefinitions");
function getInboundTransportVarName(storeDef) {
    return `${storeDef.dataset.toLocaleLowerCase()}_inbound_transport`;
}
function getOutboundTransportVarName(storeDef) {
    return `${storeDef.dataset.toLocaleLowerCase()}_outbound_transport`;
}
function genTransportParams(moduleDef) {
    const ret = [];
    for (const storeDef of moduleDef.getDataStores()) {
        ret.push({
            name: getInboundTransportVarName(storeDef),
            type: PythonDatasetLibraryTypes_1.TransportStream,
        });
        ret.push({
            name: getOutboundTransportVarName(storeDef),
            type: PythonDatasetLibraryTypes_1.TransportStream,
        });
    }
    return ret;
}
function genProgramInterfacesClass(fileWriter, libDir, moduleDef) {
    const namespace = "";
    const className = `${moduleDef.name}ProgramInterfaces`;
    const filename = `${(0, PythonCodeGenImpl_1.identifierName)(moduleDef.name)}_program_interfaces.py`;
    const includes = new PythonCodeGenImpl_1.PythonIncludeAggregator([]);
    const classSpec = new ClassSpec_1.ClassSpec({
        name: className,
        namespace,
        includes,
        superClass: PythonDatasetLibraryTypes_1.XrpaModule.getLocalType(namespace, includes),
    });
    classSpec.constructors.push({
        parameters: genTransportParams(moduleDef),
        memberInitializers: moduleDef.getDataStores().map(storeDef => {
            const dataStoreName = (0, PythonCodeGenImpl_1.getDataStoreName)(storeDef.apiname);
            includes.addFile({
                filename: (0, PythonCodeGenImpl_1.getDataStoreHeaderName)(storeDef.apiname),
                namespace: (0, PythonCodeGenImpl_1.getDataStoreHeaderNamespace)(storeDef.apiname),
            });
            return [dataStoreName, `${(0, PythonCodeGenImpl_1.getDataStoreClass)(storeDef.apiname, namespace, includes)}(${getInboundTransportVarName(storeDef)}, ${getOutboundTransportVarName(storeDef)})`];
        }),
    });
    classSpec.destructorBody = ["self.shutdown()"];
    classSpec.methods.push({
        name: "_tick_inputs",
        body: moduleDef.getDataStores().map(storeDef => `self.${(0, PythonCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}.tick_inbound()`),
        visibility: "protected",
    });
    classSpec.methods.push({
        name: "_tick_outputs",
        body: moduleDef.getDataStores().map(storeDef => `self.${(0, PythonCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}.tick_outbound()`),
        visibility: "protected",
    });
    classSpec.methods.push({
        name: "_shutdown",
        body: moduleDef.getDataStores().map(storeDef => `self.${(0, PythonCodeGenImpl_1.getDataStoreName)(storeDef.apiname)}.shutdown()`),
        visibility: "protected",
    });
    const lines = [
        ...PythonCodeGenImpl_1.HEADER,
        ``,
        ...includes.getNamespaceImports(),
        ``,
        ...(0, PythonCodeGenImpl_1.genClassDefinition)(classSpec),
    ];
    fileWriter.writeFile(path_1.default.join(libDir, filename), lines);
}
exports.genProgramInterfacesClass = genProgramInterfacesClass;
function genApplicationInterfaceClass(fileWriter, libDir, moduleDef, backgroundTick) {
    const namespace = "";
    const className = `${moduleDef.name}ApplicationInterface`;
    const filename = `${(0, PythonCodeGenImpl_1.identifierName)(moduleDef.name)}_application_interface.py`;
    const programInterfacesNamespace = `xrpa.${(0, PythonCodeGenImpl_1.identifierName)(moduleDef.name)}_program_interfaces`;
    const includes = new PythonCodeGenImpl_1.PythonIncludeAggregator([programInterfacesNamespace]);
    if (backgroundTick) {
        includes.addFile({ namespace: "threading" });
    }
    const classSpec = new ClassSpec_1.ClassSpec({
        name: className,
        namespace: namespace,
        includes: includes,
        superClass: `${programInterfacesNamespace}.${moduleDef.name}ProgramInterfaces`,
    });
    const transportInitializers = [];
    for (const storeDef of moduleDef.getDataStores()) {
        const inboundMemMarker = storeDef.isModuleProgramInterface ? "Input" : "Output";
        const outboundMemMarker = storeDef.isModuleProgramInterface ? "Output" : "Input";
        transportInitializers.push(`${PythonDatasetLibraryTypes_1.SharedMemoryTransportStream.getLocalType(namespace, includes)}("${storeDef.dataset}${inboundMemMarker}", ${(0, GenTypesDefinitions_1.getDataStoreConfigName)(storeDef.apiname, namespace, includes)})`, `${PythonDatasetLibraryTypes_1.SharedMemoryTransportStream.getLocalType(namespace, includes)}("${storeDef.dataset}${outboundMemMarker}", ${(0, GenTypesDefinitions_1.getDataStoreConfigName)(storeDef.apiname, namespace, includes)})`);
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
        ...PythonCodeGenImpl_1.HEADER,
        ``,
        ...includes.getNamespaceImports(),
        ``,
        ...(0, PythonCodeGenImpl_1.genClassDefinition)(classSpec),
    ];
    fileWriter.writeFile(path_1.default.join(libDir, filename), lines);
}
exports.genApplicationInterfaceClass = genApplicationInterfaceClass;
//# sourceMappingURL=GenProgramInterfacesClass.js.map
