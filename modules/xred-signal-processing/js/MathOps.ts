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


import { ISignalNodeType, MathOperationEnum, NumericValue, SignalMathOpType } from "./SignalProcessingTypes";

export function Add(node: ISignalNodeType, ...values: NumericValue[]): ISignalNodeType {
  if (!values.length) {
    return node;
  }
  for (const value of values) {
    if (value === 0) {
      continue;
    }
    node = new SignalMathOpType({
      operation: MathOperationEnum.Add,
      operandA: node,
      operandB: value,
    });
  }
  return node;
}

export function Subtract(operandA: NumericValue, operandB: NumericValue): ISignalNodeType {
  return new SignalMathOpType({
    operation: MathOperationEnum.Subtract,
    operandA,
    operandB,
  });
}

export function Multiply(node: ISignalNodeType, ...values: NumericValue[]): ISignalNodeType {
  if (!values.length) {
    return node;
  }
  for (const value of values) {
    if (value === 1) {
      continue;
    }
    node = new SignalMathOpType({
      operation: MathOperationEnum.Multiply,
      operandA: node,
      operandB: value,
    });
  }
  return node;
}

export function Average(...values: ISignalNodeType[]): ISignalNodeType {
  return Multiply(Add(values[0], ...values.slice(1)), 1 / values.length);
}

export function MultiplyAdd(value: ISignalNodeType, mul: NumericValue, add: NumericValue): ISignalNodeType {
  return Add(Multiply(value, mul), add);
}
