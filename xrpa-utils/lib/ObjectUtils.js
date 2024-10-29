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
exports.objectIsEmpty = exports.clone = exports.safeDeepFreeze = exports.augmentInPlace = exports.augment = void 0;
const simply_immutable_1 = require("simply-immutable");
function augment(obj, props) {
    const ret = (0, simply_immutable_1.shallowCloneMutable)(obj);
    for (const key in props) {
        ret[key] = props[key];
    }
    return safeDeepFreeze(ret);
}
exports.augment = augment;
function augmentInPlace(obj, props) {
    for (const key in props) {
        obj[key] = props[key];
    }
    return obj;
}
exports.augmentInPlace = augmentInPlace;
function safeDeepFreeze(o) {
    if (Array.isArray(o)) {
        if (!(0, simply_immutable_1.isFrozen)(o)) {
            Object.freeze(o);
            for (let i = 0; i < o.length; ++i) {
                safeDeepFreeze(o[i]);
            }
        }
    }
    else if (typeof o === "object" && o !== null) {
        if (!(0, simply_immutable_1.isFrozen)(o)) {
            Object.freeze(o);
            for (const key in o) {
                safeDeepFreeze(o[key]);
            }
        }
    }
    return o;
}
exports.safeDeepFreeze = safeDeepFreeze;
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.clone = clone;
function objectIsEmpty(obj) {
    for (const key in obj) {
        return false;
    }
    return true;
}
exports.objectIsEmpty = objectIsEmpty;
//# sourceMappingURL=ObjectUtils.js.map
