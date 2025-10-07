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

import { InputReconcilerDefinition } from "../../shared/DataStore";
import { CsIncludeAggregator, HEADER } from "../csharp/CsharpCodeGenImpl";
import { GenDataStoreContext } from "../shared/GenDataStoreShared";
import { getComponentClassName } from "./MonoBehaviourShared";
import { getDataStoreSubsystemName } from "./GenDataStoreSubsystem";
import { IObjectCollection } from "../csharp/CsharpDatasetLibraryTypes";

export function genCollectionEntitySpawner(
  ctx: GenDataStoreContext,
  fileWriter: FileWriter,
  reconcilerDef: InputReconcilerDefinition,
  outDir: string,
) {
  const includes = new CsIncludeAggregator(["UnityEngine"]);

  const componentClass = getComponentClassName(reconcilerDef.type, reconcilerDef.componentProps.idName);
  const className = `${componentClass}Spawner`;
  const namespace = "";

  const dataStore = `${getDataStoreSubsystemName(ctx.storeDef)}.Instance.DataStore.${reconcilerDef.type.getName()}`;
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
    `      ${IObjectCollection.declareLocalParam(namespace, includes, "collection")}) {`,
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

  lines.unshift(
    ...HEADER,
    ...includes.getNamespaceImports(),
    ``,
  );

  fileWriter.writeFile(path.join(outDir, `${className}.cs`), lines);
}
