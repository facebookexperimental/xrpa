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

Object.defineProperty(exports, "__esModule", { value: true });
exports.DataMapDefinition = void 0;
class DataMapDefinition {
    constructor(coordinateSystem, typeMap, typeBuckDeps, localArrayType) {
        this.coordinateSystem = coordinateSystem;
        this.typeMap = typeMap;
        this.typeBuckDeps = typeBuckDeps;
        this.localArrayType = localArrayType;
    }
}
exports.DataMapDefinition = DataMapDefinition;
//# sourceMappingURL=DataMap.js.map
