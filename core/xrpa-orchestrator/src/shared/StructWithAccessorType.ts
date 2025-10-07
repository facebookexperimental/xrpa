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


import { EXCLUDE_NAMESPACE } from "@xrpa/xrpa-utils";

import { ClassSpec } from "./ClassSpec";
import { IncludeAggregator } from "./Helpers";
import { StructType } from "./StructType";
import { TargetCodeGenImpl, TypeSpec } from "./TargetCodeGen";
import { StructSpec, StructTypeDefinition, StructWithAccessorTypeDefinition, typeIsMessageData, typeIsReference, typeIsStruct, TypeMetaType } from "./TypeDefinition";

export class StructWithAccessorType extends StructType implements StructWithAccessorTypeDefinition {
  constructor(
    codegen: TargetCodeGenImpl,
    name: string,
    apiname: string,
    readonly objectUuidType: StructType,
    parentType: StructTypeDefinition | undefined,
    fields: StructSpec,
    localTypeOverride?: TypeSpec,
  ) {
    super(
      codegen,
      name,
      apiname,
      parentType,
      fields,
      localTypeOverride,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public genTypeDefinition(_includes: IncludeAggregator|null): string[] | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public genLocalTypeDefinition(_inNamespace: string, _includes: IncludeAggregator|null): string[] | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected genReadWriteValueFunctions(_classSpec: ClassSpec): void {
    // no-op
  }

  private getBaseAccessorTypeName(inNamespace: string, includes: IncludeAggregator|null): string {
    includes?.addFile({
      filename: this.codegen.getDataStoreHeaderName(this.getApiName()),
      typename: this.getInternalType("", null),
    });

    const dsType = this.getInternalType(inNamespace, null);
    const rawType = this.codegen.nsQualify(dsType, EXCLUDE_NAMESPACE).slice(2);
    const fullType = this.codegen.nsJoin(this.codegen.getDataStoreHeaderNamespace(this.getApiName()), rawType);
    return this.codegen.nsQualify(fullType, inNamespace);
  }

  public getReadAccessorType(inNamespace: string, includes: IncludeAggregator|null): string {
    return this.getBaseAccessorTypeName(inNamespace, includes) + "Reader";
  }

  public getWriteAccessorType(inNamespace: string, includes: IncludeAggregator|null): string {
    return this.getBaseAccessorTypeName(inNamespace, includes) + "Writer";
  }

  public genReadAccessorDefinition(inNamespace: string, includes: IncludeAggregator|null): ClassSpec | null {
    if (this.getMetaType() === TypeMetaType.INTERFACE) {
      return null;
    }

    const classSpec = new ClassSpec({
      name: this.getReadAccessorType(inNamespace, null),
      namespace: inNamespace,
      includes,
    });

    const fieldOffsetVar = this.codegen.makeObjectAccessor({
      classSpec,
      isWriteAccessor: false,
      isMessageStruct: typeIsMessageData(this),
      objectUuidType: this.objectUuidType.getLocalType(inNamespace, includes),
    });

    const fields = this.getStateFields();

    for (const fieldName in fields) {
      const fieldSpec = fields[fieldName];
      this.codegen.genFieldGetter(classSpec, {
        apiname: this.apiname,
        fieldName,
        fieldType: fieldSpec.type,
        fieldToMemberVar: () => {
          const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
          const accessorIsStruct = typeIsStruct(fieldSpec.type) || typeIsReference(fieldSpec.type);
          return this.codegen.genReadValue({
            accessor,
            accessorIsStruct,
            fieldOffsetVar,
            memAccessorVar: this.codegen.genDeref("", this.codegen.privateMember("memAccessor")),
          });
        },
        convertToLocal: true,
        description: fieldSpec.description,
        isConst: false,
      });
    }

    this.genStaticAccessorFields(classSpec);

    return classSpec;
  }

  public genWriteAccessorDefinition(inNamespace: string, includes: IncludeAggregator|null): ClassSpec | null {
    if (this.getMetaType() === TypeMetaType.INTERFACE) {
      return null;
    }

    const classSpec = new ClassSpec({
      name: this.getWriteAccessorType(inNamespace, null),
      namespace: inNamespace,
      includes,
      superClass: this.getReadAccessorType(inNamespace, null),
    });

    const fieldOffsetVar = this.codegen.makeObjectAccessor({
      classSpec,
      isWriteAccessor: true,
      isMessageStruct: typeIsMessageData(this),
      objectUuidType: this.objectUuidType.getLocalType(inNamespace, includes),
    });

    const fields = this.getStateFields();

    for (const fieldName in fields) {
      const fieldSpec = fields[fieldName];
      this.codegen.genFieldSetter(classSpec, {
        fieldName,
        fieldType: fieldSpec.type,
        valueToMemberWrite: value => {
          const accessor = fieldSpec.type.getInternalType(inNamespace, includes);
          const accessorIsStruct = typeIsStruct(fieldSpec.type) || typeIsReference(fieldSpec.type);
          return this.codegen.genWriteValue({
            accessor,
            accessorIsStruct,
            fieldOffsetVar,
            memAccessorVar: this.codegen.genDeref("", this.codegen.privateMember("memAccessor")),
            value,
          });
        },
        convertFromLocal: true,
      });
    }

    return classSpec;
  }

  public getCollectionId(): number {
    return -1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected genStaticAccessorFields(_classSpec: ClassSpec): void {
    // inherited
  }
}
