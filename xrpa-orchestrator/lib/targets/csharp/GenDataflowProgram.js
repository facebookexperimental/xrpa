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

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genDataflowProgram = void 0;
const path_1 = __importDefault(require("path"));
const GenDataflowProgramShared_1 = require("../shared/GenDataflowProgramShared");
const CsharpCodeGenImpl_1 = require("./CsharpCodeGenImpl");
const CsharpCodeGenImpl = __importStar(require("./CsharpCodeGenImpl"));
function genDataflowProgram(ctx, fileWriter, outdir, programDef) {
    const filename = `${programDef.interfaceName}.cs`;
    const classSpec = (0, GenDataflowProgramShared_1.genDataflowProgramClassSpec)(ctx, CsharpCodeGenImpl, programDef, new CsharpCodeGenImpl_1.CsIncludeAggregator());
    const lines = [
        `namespace ${ctx.namespace} {`,
        ``,
        ...(0, CsharpCodeGenImpl_1.genClassDefinition)(classSpec),
        ``,
        `} // namespace ${ctx.namespace}`,
        ``,
    ];
    lines.unshift(...CsharpCodeGenImpl_1.HEADER, ``, ...(classSpec.includes?.getNamespaceImports(ctx.namespace) ?? []), ``);
    fileWriter.writeFile(path_1.default.join(outdir, filename), lines);
}
exports.genDataflowProgram = genDataflowProgram;
//# sourceMappingURL=GenDataflowProgram.js.map
