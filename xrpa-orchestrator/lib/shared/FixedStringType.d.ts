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


import { PrimitiveType } from "./PrimitiveType";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import { TypeMap } from "./TypeDefinition";
export declare class FixedStringType extends PrimitiveType {
    readonly maxBytes: number;
    constructor(codegen: TargetCodeGenImpl, name: string, _apiname: string, maxBytes: number, typeMap: TypeMap);
    getInternalMaxBytes(): number | null;
}

