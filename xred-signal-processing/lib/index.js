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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strEquals = exports.strContains = exports.strEndsWith = exports.strStartsWith = exports.isISignalNodeType = exports.ISignalNodeType = void 0;
__exportStar(require("./SignalProcessingInterface"), exports);
__exportStar(require("./MathOps"), exports);
__exportStar(require("./ProcessingNodes"), exports);
var SignalProcessingTypes_1 = require("./SignalProcessingTypes");
Object.defineProperty(exports, "ISignalNodeType", { enumerable: true, get: function () { return SignalProcessingTypes_1.ISignalNodeType; } });
Object.defineProperty(exports, "isISignalNodeType", { enumerable: true, get: function () { return SignalProcessingTypes_1.isISignalNodeType; } });
var xrpa_utils_1 = require("@xrpa/xrpa-utils");
Object.defineProperty(exports, "strStartsWith", { enumerable: true, get: function () { return xrpa_utils_1.strStartsWith; } });
Object.defineProperty(exports, "strEndsWith", { enumerable: true, get: function () { return xrpa_utils_1.strEndsWith; } });
Object.defineProperty(exports, "strContains", { enumerable: true, get: function () { return xrpa_utils_1.strContains; } });
Object.defineProperty(exports, "strEquals", { enumerable: true, get: function () { return xrpa_utils_1.strEquals; } });
//# sourceMappingURL=index.js.map
