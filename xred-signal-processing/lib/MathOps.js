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
exports.MultiplyAdd = exports.Average = exports.Multiply = exports.Add = void 0;
const SignalProcessingTypes_1 = require("./SignalProcessingTypes");
function Add(node, ...values) {
    if (!values.length) {
        return node;
    }
    for (const value of values) {
        if (value === 0) {
            continue;
        }
        node = new SignalProcessingTypes_1.SignalMathOpType({
            operation: SignalProcessingTypes_1.MathOperationEnum.Add,
            operandA: node,
            operandB: value,
        });
    }
    return node;
}
exports.Add = Add;
function Multiply(node, ...values) {
    if (!values.length) {
        return node;
    }
    for (const value of values) {
        if (value === 1) {
            continue;
        }
        node = new SignalProcessingTypes_1.SignalMathOpType({
            operation: SignalProcessingTypes_1.MathOperationEnum.Multiply,
            operandA: node,
            operandB: value,
        });
    }
    return node;
}
exports.Multiply = Multiply;
function Average(...values) {
    return Multiply(Add(values[0], ...values.slice(1)), 1 / values.length);
}
exports.Average = Average;
function MultiplyAdd(value, mul, add) {
    return Add(Multiply(value, mul), add);
}
exports.MultiplyAdd = MultiplyAdd;
//# sourceMappingURL=MathOps.js.map
