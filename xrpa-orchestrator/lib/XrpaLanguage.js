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
exports.runInContext = exports.popContext = exports.getContext = exports.getCurrentContext = exports.pushContext = exports.NameType = exports.isNamedDataType = exports.Augment = exports.ChainAugments = exports.isXrpaDataType = exports.setPropertiesOrCurry = exports.setProperties = exports.setProperty = exports.evalProperty = exports.FALSEY = exports.TRUTHY = exports.getInheritableProperties = exports.isInheritedProperty = exports.InheritedProperty = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const simply_immutable_1 = require("simply-immutable");
const INHERIT_TAG = "<inherit>";
function InheritedProperty(property) {
    return `${property}${INHERIT_TAG}`;
}
exports.InheritedProperty = InheritedProperty;
function isInheritedProperty(property) {
    return property.endsWith(INHERIT_TAG);
}
exports.isInheritedProperty = isInheritedProperty;
function getInheritableProperties(properties) {
    const ret = {};
    for (const key in properties) {
        if (key.endsWith(INHERIT_TAG)) {
            ret[key] = properties[key];
        }
    }
    return ret;
}
exports.getInheritableProperties = getInheritableProperties;
exports.TRUTHY = "xrpa.propertySymbol.truthy";
exports.FALSEY = "xrpa.propertySymbol.falsey";
function isConditionalPropertyValue(thing) {
    return thing != null && thing.__isConditionalPropertyValue === true;
}
function evalProperty(properties, propertyName) {
    const propValue = properties[propertyName];
    if (!isConditionalPropertyValue(propValue)) {
        return propValue;
    }
    for (const condition of propValue.conditionals) {
        const propertyToCheck = properties[condition.propertyToCheck];
        if (condition.expectedValue === exports.TRUTHY && propertyToCheck) {
            return condition.value;
        }
        else if (condition.expectedValue === exports.FALSEY && !propertyToCheck) {
            return condition.value;
        }
        else if (propertyToCheck === condition.expectedValue) {
            return condition.value;
        }
    }
    return propValue.defaultValue;
}
exports.evalProperty = evalProperty;
function setProperty(obj, propertyName, value, condition) {
    if (!condition) {
        return (0, simply_immutable_1.replaceImmutable)(obj, ["properties", propertyName], value);
    }
    if (!isConditionalPropertyValue(obj.properties[propertyName])) {
        obj = (0, simply_immutable_1.replaceImmutable)(obj, ["properties", propertyName], {
            __isConditionalPropertyValue: true,
            conditionals: [],
            defaultValue: obj.properties[propertyName],
        });
    }
    return (0, simply_immutable_1.arrayPushImmutable)(obj, ["properties", propertyName, "conditionals"], {
        ...condition,
        value,
    });
}
exports.setProperty = setProperty;
function setProperties(obj, propertiesToSet, condition) {
    for (const key in propertiesToSet) {
        obj = setProperty(obj, key, propertiesToSet[key], condition);
    }
    return obj;
}
exports.setProperties = setProperties;
function setPropertiesOrCurry(propertiesToSet, arg0, arg1) {
    arg0 = (0, xrpa_utils_1.resolveThunk)(arg0);
    if (isXrpaDataType(arg0)) {
        return setProperties(arg0, propertiesToSet);
    }
    if (!arg1) {
        const condition = arg0;
        return (dataType) => setProperties((0, xrpa_utils_1.resolveThunk)(dataType), propertiesToSet, condition);
    }
    return setProperties((0, xrpa_utils_1.resolveThunk)(arg1), propertiesToSet, arg0);
}
exports.setPropertiesOrCurry = setPropertiesOrCurry;
function isXrpaDataType(thing) {
    return thing != null && thing.__XrpaDataType === true;
}
exports.isXrpaDataType = isXrpaDataType;
function ChainAugments(...augmenters) {
    return (data) => {
        for (const augmenter of augmenters) {
            data = augmenter(data);
        }
        return (0, xrpa_utils_1.resolveThunk)(data);
    };
}
exports.ChainAugments = ChainAugments;
function Augment(dataType, ...augmenters) {
    return ChainAugments(...augmenters)(dataType);
}
exports.Augment = Augment;
function isNamedDataType(thing) {
    return isXrpaDataType(thing) && typeof thing.name === "string";
}
exports.isNamedDataType = isNamedDataType;
function NameType(name, dataType) {
    dataType = (0, xrpa_utils_1.resolveThunk)(dataType);
    if (name === undefined) {
        return dataType;
    }
    return (0, simply_immutable_1.replaceImmutable)(dataType, ["name"], name);
}
exports.NameType = NameType;
////////////////////////////////////////////////////////////////////////////////
// Context stack
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
function runInContext(ctx, callback) {
    pushContext(ctx);
    try {
        return callback(ctx);
    }
    finally {
        popContext(ctx);
    }
}
exports.runInContext = runInContext;
//# sourceMappingURL=XrpaLanguage.js.map
