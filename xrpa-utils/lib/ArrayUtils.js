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
exports.pushUnique = exports.recordZip = exports.arrayZip = exports.mapAndCollapse = exports.collapseAndMap = exports.collapse = void 0;
function collapse(values) {
    const ret = [];
    for (const value of values) {
        if (Array.isArray(value)) {
            ret.push(...value);
        }
        else {
            ret.push(value);
        }
    }
    return ret;
}
exports.collapse = collapse;
function collapseAndMap(values, mapFunc) {
    return collapse(values).map(mapFunc);
}
exports.collapseAndMap = collapseAndMap;
function mapAndCollapse(values, mapFunc, ...args) {
    return collapse(values.map(v => mapFunc(v, ...args)));
}
exports.mapAndCollapse = mapAndCollapse;
function arrayZip(a, b) {
    if (a.length !== b.length) {
        throw new Error("arrayZip length mismatch, got " + a.length + " vs " + b.length);
    }
    const ret = [];
    for (let i = 0; i < a.length; i++) {
        ret.push([a[i], b[i]]);
    }
    return ret;
}
exports.arrayZip = arrayZip;
function recordZip(a, b) {
    if (a.length !== b.length) {
        throw new Error("recordZip length mismatch, got " + a.length + " vs " + b.length);
    }
    const ret = {};
    for (let i = 0; i < a.length; i++) {
        ret[a[i]] = b[i];
    }
    return ret;
}
exports.recordZip = recordZip;
function pushUnique(arr, val) {
    const idx = arr.indexOf(val);
    if (idx >= 0) {
        return idx;
    }
    return arr.push(val);
}
exports.pushUnique = pushUnique;
//# sourceMappingURL=ArrayUtils.js.map
