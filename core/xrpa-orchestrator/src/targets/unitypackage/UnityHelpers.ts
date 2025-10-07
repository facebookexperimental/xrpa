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


import { indent } from "@xrpa/xrpa-utils";

export function genUnitySingleton(className: string, initializers: string[], deinitializers: string[], members: string[]): string[] {
  return [
    `[AddComponentMenu("")]`,
    `public class ${className} : MonoBehaviour {`,
    `  private static ${className} _Instance;`,
    ``,
    `  public static ${className} MaybeInstance { get => _Instance; }`,
    ``,
    `  public static ${className} Instance {`,
    `    get {`,
    `      if (_Instance == null) {`,
    `        _Instance = FindAnyObjectByType<${className}>();`,
    `      }`,
    `      if (_Instance == null) {`,
    `        GameObject obj = new() { name = typeof(${className}).Name };`,
    `        _Instance = obj.AddComponent<${className}>();`,
    `      }`,
    `      return _Instance;`,
    `    }`,
    `  }`,
    ``,
    `  void Awake() {`,
    `    if (_Instance == null) {`,
    `      _Instance = this;`,
    `      DontDestroyOnLoad(gameObject);`,
    ...indent(3, initializers),
    `    } else if (_Instance != this) {`,
    `      Destroy(gameObject);`,
    `    }`,
    `  }`,
    ``,
    `  void OnDestroy() {`,
    ...indent(2, deinitializers),
    `    if (_Instance == this) {`,
    `      _Instance = null;`,
    `    }`,
    `  }`,
    ``,
    ...indent(1, members),
    `}`,
    ``,
  ];
}
