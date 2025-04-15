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
exports.genCollectionEntitySpawner = void 0;
const path_1 = __importDefault(require("path"));
const CsharpCodeGenImpl_1 = require("../csharp/CsharpCodeGenImpl");
const MonoBehaviourShared_1 = require("./MonoBehaviourShared");
const GenDataStoreSubsystem_1 = require("./GenDataStoreSubsystem");
const CsharpDatasetLibraryTypes_1 = require("../csharp/CsharpDatasetLibraryTypes");
function genCollectionEntitySpawner(ctx, fileWriter, reconcilerDef, outDir) {
    const includes = new CsharpCodeGenImpl_1.CsIncludeAggregator(["UnityEngine"]);
    const componentClass = (0, MonoBehaviourShared_1.getComponentClassName)(reconcilerDef.type, reconcilerDef.componentProps.idName);
    const className = `${componentClass}Spawner`;
    const namespace = "";
    const dataStore = `${(0, GenDataStoreSubsystem_1.getDataStoreSubsystemName)(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.type.getName()}`;
    const readAccessor = reconcilerDef.type.getReadAccessorType(namespace, includes);
    const reconciledType = reconcilerDef.type.getLocalType(ctx.namespace, includes);
    const lines = [
        `public class ${className} : MonoBehaviour {`,
        `  public GameObject entityPrefab;`,
        ``,
        `  private static ${className} _Instance;`,
        ``,
        `  public static ${className} Instance { get => _Instance; }`,
        ``,
        `  void Awake() {`,
        `    if (_Instance == null) {`,
        `      _Instance = this;`,
        `      ${dataStore}.SetCreateDelegate(${className}.Spawn);`,
        `    } else if (_Instance != this) {`,
        `      Destroy(gameObject);`,
        `    }`,
        `  }`,
        ``,
        `  void OnDestroy() {`,
        `    if (_Instance == this) {`,
        `      _Instance = null;`,
        `    }`,
        `  }`,
        ``,
        `  private static ${reconciledType} Spawn(`,
        `      ${ctx.moduleDef.ObjectUuid.declareLocalParam(namespace, includes, "id")},`,
        `      ${readAccessor} remoteValue,`,
        `      ${CsharpDatasetLibraryTypes_1.IObjectCollection.declareLocalParam(namespace, includes, "collection")}) {`,
        `    GameObject go = null;`,
        `    if (_Instance?.entityPrefab) {`,
        `      go = Instantiate(_Instance.entityPrefab);`,
        `    } else {`,
        `      go = new GameObject("Spawned${componentClass}");`,
        `    }`,
        `    var comp = go.GetComponent<${componentClass}>();`,
        `    if (comp == null) {`,
        `      comp = go.AddComponent<${componentClass}>();`,
        `    }`,
        `    var obj = ${reconciledType}.Create(id, remoteValue, collection);`,
        `    comp.SetXrpaObject(obj);`,
        `    return obj;`,
        `  }`,
        `}`,
        ``,
    ];
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, ...includes.getNamespaceImports(), ``);
    fileWriter.writeFile(path_1.default.join(outDir, `${className}.cs`), lines);
}
exports.genCollectionEntitySpawner = genCollectionEntitySpawner;
//# sourceMappingURL=GenCollectionEntitySpawner.js.map
