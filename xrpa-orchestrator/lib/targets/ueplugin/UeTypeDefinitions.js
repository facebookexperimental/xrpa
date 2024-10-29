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
exports.StructTypeUe = exports.EnumTypeUe = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const EnumType_1 = require("../../shared/EnumType");
const StructType_1 = require("../../shared/StructType");
const GenBlueprintTypes_1 = require("./GenBlueprintTypes");
const UMETA_ALIGNMENT = 20;
class EnumTypeUe extends EnumType_1.EnumType {
    constructor(codegen, enumName, apiname, enumValues) {
        super(codegen, enumName, apiname, enumValues, { typename: `E${apiname}${enumName}`, headerFile: (0, GenBlueprintTypes_1.getBlueprintTypesHeaderName)(apiname) });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genLocalTypeDefinition(_inNamespace, _includes) {
        return null;
    }
    genTargetSpecificTypeDefinition(inNamespace, includes) {
        includes?.addFile({ filename: "CoreMinimal.h" });
        return [
            `UENUM(BlueprintType)`,
            `enum class ${this.getLocalType(inNamespace, null)}: uint8 {`,
            ...(0, xrpa_utils_1.indent)(1, Object.keys(this.enumValues).map(v => (0, xrpa_utils_1.appendAligned)(`${v} = ${this.enumValues[v]}`, `UMETA(DisplayName="${v}"),`, UMETA_ALIGNMENT))),
            `};`,
        ];
    }
}
exports.EnumTypeUe = EnumTypeUe;
class StructTypeUe extends StructType_1.StructType {
    constructor(codegen, name, apiname, parentType, fields, localTypeOverride) {
        super(codegen, name, apiname, parentType, fields, localTypeOverride ?? { typename: `F${apiname}${name}`, headerFile: (0, GenBlueprintTypes_1.getBlueprintTypesHeaderName)(apiname) });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    genLocalTypeDefinition(_inNamespace, _includes) {
        return null;
    }
    genTargetSpecificTypeDefinition(inNamespace, includes) {
        includes?.addFile({ filename: "CoreMinimal.h" });
        const fieldDefs = [];
        const fields = this.getStateFields();
        for (const fieldName in fields) {
            const fieldSpec = fields[fieldName];
            const userDefault = fieldSpec.type.userDefaultToTypeValue(inNamespace, includes, fieldSpec.defaultValue);
            fieldDefs.push(...this.codegen.genCommentLines(fieldSpec.description), `UPROPERTY(EditAnywhere, BlueprintReadWrite)`, `${fieldSpec.type.declareLocalVar(inNamespace, includes, fieldName, userDefault)};`, ``);
        }
        return [
            `USTRUCT(BlueprintType)`,
            `struct ${this.getLocalType(inNamespace, null)} {`,
            `  GENERATED_BODY()`,
            ``,
            ...(0, xrpa_utils_1.indent)(1, fieldDefs),
            `};`,
        ];
    }
}
exports.StructTypeUe = StructTypeUe;
//# sourceMappingURL=UeTypeDefinitions.js.map
