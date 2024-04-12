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
exports.DataStoreDefinition = exports.OutputReconcilerDefinition = exports.InputReconcilerDefinition = void 0;
const DataModel_1 = require("./DataModel");
const Helpers_1 = require("./Helpers");
const TypeDefinition_1 = require("./TypeDefinition");
function validateFieldNames(fields, fieldAccessorNameOverrides, componentProps) {
    for (const fieldName in fieldAccessorNameOverrides) {
        (0, Helpers_1.assertIsKeyOf)(fieldName, fields);
    }
    if (componentProps.ephemeralProperties) {
        for (const fieldName of componentProps.ephemeralProperties) {
            (0, Helpers_1.assertIsKeyOf)(fieldName, fields);
        }
    }
    if (componentProps.fieldToPropertyBindings) {
        for (const fieldName in componentProps.fieldToPropertyBindings) {
            (0, Helpers_1.assertIsKeyOf)(fieldName, fields);
        }
    }
}
class BaseReconcilerDefinition {
    constructor(type, inboundFields, outboundFields, fieldAccessorNameOverrides, componentProps) {
        this.type = type;
        this.inboundFields = inboundFields;
        this.outboundFields = outboundFields;
        this.fieldAccessorNameOverrides = fieldAccessorNameOverrides;
        this.componentProps = componentProps;
    }
    isInboundField(fieldName) {
        return (0, Helpers_1.isExcluded)(fieldName, this.outboundFields, this.inboundFields);
    }
    isOutboundField(fieldName) {
        return (0, Helpers_1.isExcluded)(fieldName, this.inboundFields, this.outboundFields);
    }
    getFieldSpec(fieldName) {
        return this.type.getAllFields()[fieldName];
    }
    getFieldPropertyBinding(fieldName) {
        return this.componentProps.fieldToPropertyBindings?.[fieldName];
    }
    isFieldBoundToIntrinsic(fieldName) {
        return Boolean(this.getFieldPropertyBinding(fieldName));
    }
    isEphemeralField(fieldName) {
        const isBoundToIntrinsic = this.isFieldBoundToIntrinsic(fieldName);
        return isBoundToIntrinsic || ((0, Helpers_1.filterToStringArray)(this.componentProps.ephemeralProperties) ?? []).includes(fieldName);
    }
    isClearSetField(fieldName) {
        const isBoundToIntrinsic = this.isFieldBoundToIntrinsic(fieldName);
        return !isBoundToIntrinsic && (0, TypeDefinition_1.typeIsClearSet)(this.getFieldSpec(fieldName).type);
    }
    isSerializedField(fieldName, indexedFieldName) {
        if (this.isInboundField(fieldName)) {
            return fieldName === indexedFieldName;
        }
        return !this.isFieldBoundToIntrinsic(fieldName) && !this.isEphemeralField(fieldName) && !this.isClearSetField(fieldName);
    }
    getInboundChangeBits() {
        let bitMask = 0;
        const fields = this.type.getStateFields();
        for (const fieldName in fields) {
            if (this.isInboundField(fieldName)) {
                bitMask |= this.type.getFieldBitMask(fieldName);
            }
        }
        return bitMask;
    }
    getOutboundChangeBits() {
        let bitMask = 0;
        const fields = this.type.getStateFields();
        for (const fieldName in fields) {
            if (this.isOutboundField(fieldName)) {
                bitMask |= this.type.getFieldBitMask(fieldName);
            }
        }
        return bitMask;
    }
}
class InputReconcilerDefinition extends BaseReconcilerDefinition {
    constructor(type, outboundFields, fieldAccessorNameOverrides, componentProps, useGenericReconciledType = false, indexedReconciled) {
        super(type, null, outboundFields, fieldAccessorNameOverrides, componentProps);
        this.useGenericReconciledType = useGenericReconciledType;
        this.indexedReconciled = indexedReconciled;
        this.inboundFields = null;
        const fields = this.type.getAllFields();
        for (const fieldName of outboundFields) {
            (0, Helpers_1.assertIsKeyOf)(fieldName, fields);
        }
        validateFieldNames(fields, fieldAccessorNameOverrides, componentProps);
        if (this.indexedReconciled) {
            (0, Helpers_1.assertIsKeyOf)(this.indexedReconciled.fieldName, fields);
        }
    }
    shouldGenerateConcreteReconciledType() {
        return Boolean(this.indexedReconciled) || this.useGenericReconciledType;
    }
    getDataStoreAccessorName() {
        return this.type.getName() + "In";
    }
}
exports.InputReconcilerDefinition = InputReconcilerDefinition;
class OutputReconcilerDefinition extends BaseReconcilerDefinition {
    constructor(type, inboundFields, fieldAccessorNameOverrides, componentProps) {
        super(type, inboundFields, null, fieldAccessorNameOverrides, componentProps);
        this.outboundFields = null;
        const fields = this.type.getAllFields();
        for (const fieldName of inboundFields) {
            (0, Helpers_1.assertIsKeyOf)(fieldName, fields);
        }
        validateFieldNames(fields, fieldAccessorNameOverrides, componentProps);
    }
    getDataStoreAccessorName() {
        return this.type.getName() + "Out";
    }
}
exports.OutputReconcilerDefinition = OutputReconcilerDefinition;
class DataStoreDefinition {
    constructor(moduleDef, dataset, typeMap, apiname) {
        this.moduleDef = moduleDef;
        this.dataset = dataset;
        this.typeMap = typeMap;
        this.inputs = [];
        this.outputs = [];
        this.syntheticObjects = {};
        this.apiname = apiname ?? dataset;
        this.datamodel = new DataModel_1.DataModelDefinition(moduleDef, this);
    }
    addInputReconciler(params) {
        const type = typeof params.type === "string" ? this.datamodel.getType(params.type) : params.type;
        if (!type) {
            throw new Error(`Unknown type ${params.type}`);
        }
        if (!(0, TypeDefinition_1.typeIsCollection)(type)) {
            throw new Error(`Type ${params.type} is not a collection`);
        }
        if (params.reconciledTo && params.indexedReconciled) {
            throw new Error("Cannot specify both reconciledTo and indexedReconciled");
        }
        const inputDef = new InputReconcilerDefinition(type, params.outboundFields ?? [], params.fieldAccessorNameOverrides ?? {}, params.componentProps ?? {}, params.useGenericReconciledType ?? false, params.indexedReconciled);
        this.moduleDef.setCollectionAsInbound(type, params.reconciledTo, inputDef.indexedReconciled);
        this.inputs.push(inputDef);
        return inputDef;
    }
    getInputReconcilers() {
        return this.inputs;
    }
    addOutputReconciler(params) {
        const type = typeof params.type === "string" ? this.datamodel.getType(params.type) : params.type;
        if (!type) {
            throw new Error(`Unknown type ${params.type}`);
        }
        if (!(0, TypeDefinition_1.typeIsCollection)(type)) {
            throw new Error(`Type ${params.type} is not a collection`);
        }
        const outputDef = new OutputReconcilerDefinition(type, params.inboundFields ?? [], params.fieldAccessorNameOverrides ?? {}, params.componentProps ?? {});
        this.moduleDef.setCollectionAsOutbound(type, outputDef.componentProps);
        this.outputs.push(outputDef);
        return outputDef;
    }
    getOutputReconcilers() {
        return this.outputs;
    }
    addSyntheticObject(name, objectDef) {
        this.syntheticObjects[name] = objectDef;
    }
    getSyntheticObjects() {
        return this.syntheticObjects;
    }
}
exports.DataStoreDefinition = DataStoreDefinition;
//# sourceMappingURL=DataStore.js.map
