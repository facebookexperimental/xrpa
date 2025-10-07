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


import { objectIsEmpty } from "@xrpa/xrpa-utils";

import { ClassSpec } from "./ClassSpec";
import { IncludeAggregator } from "./Helpers";
import { StructType } from "./StructType";
import { StructWithAccessorType } from "./StructWithAccessorType";
import { TargetCodeGenImpl } from "./TargetCodeGen";
import {
  MessageDataTypeDefinition,
  StructSpec,
  TypeMetaType,
} from "./TypeDefinition";

export class MessageDataType extends StructWithAccessorType implements MessageDataTypeDefinition {
  constructor(
    codegen: TargetCodeGenImpl,
    name: string,
    apiname: string,
    objectUuidType: StructType,
    fields: StructSpec,
    readonly expectedRatePerSecond: number,
  ) {
    super(codegen, name, apiname, objectUuidType, undefined, fields);
  }

  public getMetaType(): TypeMetaType.MESSAGE_DATA {
    return TypeMetaType.MESSAGE_DATA;
  }

  public hasFields(): boolean {
    return !objectIsEmpty(this.fields);
  }

  public genReadAccessorDefinition(inNamespace: string, includes: IncludeAggregator|null): ClassSpec | null {
    return this.hasFields() ? super.genReadAccessorDefinition(inNamespace, includes) : null;
  }

  public genWriteAccessorDefinition(inNamespace: string, includes: IncludeAggregator|null): ClassSpec | null {
    return this.hasFields() ? super.genWriteAccessorDefinition(inNamespace, includes) : null;
  }

  public genTypeDefinition(includes: IncludeAggregator|null): string[] | null {
    return this.hasFields() ? super.genTypeDefinition(includes) : null;
  }

  public genLocalTypeDefinition(inNamespace: string, includes: IncludeAggregator|null): string[] | null {
    return this.hasFields() ? super.genLocalTypeDefinition(inNamespace, includes) : null;
  }

  public getExpectedRatePerSecond(): number {
    return this.expectedRatePerSecond;
  }
}
