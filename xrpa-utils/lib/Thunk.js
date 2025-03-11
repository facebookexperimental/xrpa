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
exports.chainAsyncThunk = exports.resolveAsyncThunk = exports.chainThunk = exports.resolveThunkWithParam = exports.resolveThunk = void 0;
function resolveThunk(value) {
    if (typeof value === "function") {
        return value();
    }
    return value;
}
exports.resolveThunk = resolveThunk;
function resolveThunkWithParam(value, param) {
    if (typeof value === "function") {
        return value(param);
    }
    return value;
}
exports.resolveThunkWithParam = resolveThunkWithParam;
function chainThunk(value, next) {
    return () => next(resolveThunk(value));
}
exports.chainThunk = chainThunk;
async function resolveAsyncThunk(value) {
    if (typeof value === "function") {
        return value();
    }
    return value;
}
exports.resolveAsyncThunk = resolveAsyncThunk;
function chainAsyncThunk(value, next) {
    return () => resolveAsyncThunk(value).then(next);
}
exports.chainAsyncThunk = chainAsyncThunk;
//# sourceMappingURL=Thunk.js.map
