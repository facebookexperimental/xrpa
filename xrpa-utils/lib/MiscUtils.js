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
exports.chainAsyncThunk = exports.resolveAsyncThunk = exports.chainThunk = exports.resolveThunkWithParam = exports.resolveThunk = exports.isExcluded = exports.filterToNumberArray = exports.filterToNumber = exports.filterToStringPairArray = exports.filterToStringArray = exports.filterToString = exports.assertIsKeyOf = exports.throwBadValue = exports.absurd = void 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function absurd(v) {
    // this function intentionally left blank
}
exports.absurd = absurd;
function throwBadValue(val, expected) {
    throw new Error(`expected ${expected}, found ${val} (${typeof val})`);
}
exports.throwBadValue = throwBadValue;
function assertIsString(val) {
    if (typeof val !== "string") {
        throwBadValue(val, "string type");
    }
}
function assertIsKeyOf(val, enumOrLookup) {
    assertIsString(val);
    const keys = Object.keys(enumOrLookup);
    if (!keys.includes(val)) {
        throwBadValue(val, keys.join("|"));
    }
}
exports.assertIsKeyOf = assertIsKeyOf;
function filterToString(val) {
    return typeof val === "string" ? val : undefined;
}
exports.filterToString = filterToString;
function filterToStringArray(val, minLength = 0) {
    if (!Array.isArray(val)) {
        return undefined;
    }
    if (val.length < minLength) {
        return undefined;
    }
    for (const v of val) {
        if (typeof v !== "string") {
            return undefined;
        }
    }
    return val;
}
exports.filterToStringArray = filterToStringArray;
function filterToStringPairArray(val, minLength = 0) {
    if (!Array.isArray(val)) {
        return undefined;
    }
    if (val.length < minLength) {
        return undefined;
    }
    const ret = [];
    for (const v of val) {
        const tuple = filterToStringArray(v, 2);
        if (tuple) {
            ret.push(tuple);
        }
    }
    return ret;
}
exports.filterToStringPairArray = filterToStringPairArray;
function filterToNumber(val) {
    return typeof val === "number" ? val : undefined;
}
exports.filterToNumber = filterToNumber;
function filterToNumberArray(val, minLength = 0) {
    if (!Array.isArray(val)) {
        return undefined;
    }
    if (val.length < minLength) {
        return undefined;
    }
    for (const v of val) {
        if (typeof v !== "number") {
            return undefined;
        }
    }
    return val;
}
exports.filterToNumberArray = filterToNumberArray;
function isExcluded(key, includeList, excludeList) {
    if (includeList && !includeList.includes(key)) {
        return true;
    }
    if (excludeList && excludeList.includes(key)) {
        return true;
    }
    return false;
}
exports.isExcluded = isExcluded;
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
//# sourceMappingURL=MiscUtils.js.map
