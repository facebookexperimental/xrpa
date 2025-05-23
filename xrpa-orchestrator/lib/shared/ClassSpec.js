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
exports.ClassSpec = void 0;
const assert_1 = __importDefault(require("assert"));
function paramsMatch(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; ++i) {
        const aValue = a[i];
        const bValue = b[i];
        if (aValue.name !== b[i].name) {
            return false;
        }
        const aTypeName = typeof aValue.type === "string" ? aValue.type : aValue.type.getName();
        const bTypeName = typeof bValue.type === "string" ? bValue.type : bValue.type.getName();
        if (aTypeName !== bTypeName) {
            return false;
        }
    }
    return true;
}
class ClassSpec {
    constructor(params) {
        this.constructors = [];
        this.virtualDestructor = false;
        this.methods = [];
        this.members = [];
        (0, assert_1.default)(!params.name.includes("::"), `Class name cannot contain :: (found ${params.name})`);
        (0, assert_1.default)(!params.name.includes("."), `Class name cannot contain . (found ${params.name})`);
        this.name = params.name;
        this.namespace = params.namespace;
        this.includes = params.includes;
        this.superClass = params.superClass ?? null;
        this.interfaceName = params.interfaceName ?? null;
        this.templateParams = params.templateParams ?? null;
        this.forceAbstract = Boolean(params.forceAbstract);
        this.decorations = params.decorations ?? [];
        this.classNameDecoration = params.classNameDecoration ?? null;
        this.classEarlyInject = params.classEarlyInject ?? [];
    }
    getOrCreateMethod(methodDef) {
        for (const method of this.methods) {
            if (method.name !== methodDef.name) {
                continue;
            }
            if (!paramsMatch(method.parameters ?? [], methodDef.parameters ?? [])) {
                continue;
            }
            (0, assert_1.default)(Array.isArray(method.body));
            return method.body;
        }
        const method = { ...methodDef, body: [] };
        this.methods.push(method);
        return method.body;
    }
}
exports.ClassSpec = ClassSpec;
//# sourceMappingURL=ClassSpec.js.map
