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
exports.runInContext = exports.popContext = exports.getContext = exports.getCurrentContext = exports.pushContext = void 0;
const assert_1 = __importDefault(require("assert"));
function getContextStack() {
    // the context stack is stored in a global variable so it can be accessed across copies of xrpa-orchestrator
    const globalStore = global;
    globalStore["__XrpaContextStack"] = globalStore["__XrpaContextStack"] || [];
    return globalStore["__XrpaContextStack"];
}
function pushContext(ctx) {
    getContextStack().push(ctx);
}
exports.pushContext = pushContext;
function getCurrentContext() {
    const contextStack = getContextStack();
    (0, assert_1.default)(contextStack.length > 0, "context stack is empty");
    return contextStack[contextStack.length - 1];
}
exports.getCurrentContext = getCurrentContext;
function getContext(filter, errMessage) {
    const contextStack = getContextStack();
    for (let i = contextStack.length - 1; i >= 0; --i) {
        const ctx = contextStack[i];
        if (filter(ctx)) {
            return ctx;
        }
    }
    (0, assert_1.default)(false, errMessage);
}
exports.getContext = getContext;
function popContext(ctx) {
    const contextStack = getContextStack();
    (0, assert_1.default)(contextStack.length > 0, "context stack is empty");
    (0, assert_1.default)(contextStack[contextStack.length - 1] === ctx, "context stack is not empty");
    contextStack.pop();
}
exports.popContext = popContext;
function runInContext(ctx, callback, prelude) {
    pushContext(ctx);
    try {
        if (prelude) {
            prelude(ctx);
        }
        return callback(ctx);
    }
    finally {
        popContext(ctx);
    }
}
exports.runInContext = runInContext;
//# sourceMappingURL=ContextStack.js.map
