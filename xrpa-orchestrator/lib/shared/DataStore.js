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
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const DataModel_1 = require("./DataModel");
const TypeDefinition_1 = require("./TypeDefinition");
class BaseReconcilerDefinition {
    constructor(type, inboundFields, outboundFields, fieldAccessorNameOverrides, componentProps, indexConfigs) {
        this.type = type;
        this.inboundFields = inboundFields;
        this.outboundFields = outboundFields;
        this.fieldAccessorNameOverrides = fieldAccessorNameOverrides;
        this.componentProps = componentProps;
        this.indexConfigs = indexConfigs;
        const fields = this.type.getAllFields();
        for (const fieldName of (inboundFields ?? [])) {
            (0, xrpa_utils_1.assertIsKeyOf)(fieldName, fields);
        }
        for (const fieldName of (outboundFields ?? [])) {
            (0, xrpa_utils_1.assertIsKeyOf)(fieldName, fields);
        }
        for (const fieldName in fieldAccessorNameOverrides) {
            (0, xrpa_utils_1.assertIsKeyOf)(fieldName, fields);
        }
        if (componentProps.ephemeralProperties) {
            for (const fieldName of componentProps.ephemeralProperties) {
                (0, xrpa_utils_1.assertIsKeyOf)(fieldName, fields);
            }
        }
        if (componentProps.fieldToPropertyBindings) {
            for (const fieldName in componentProps.fieldToPropertyBindings) {
                (0, xrpa_utils_1.assertIsKeyOf)(fieldName, fields);
            }
        }
        for (const config of indexConfigs) {
            (0, xrpa_utils_1.assertIsKeyOf)(config.indexFieldName, fields);
        }
    }
    isInboundField(fieldName) {
        return (0, xrpa_utils_1.isExcluded)(fieldName, this.outboundFields, this.inboundFields);
    }
    isOutboundField(fieldName) {
        return (0, xrpa_utils_1.isExcluded)(fieldName, this.inboundFields, this.outboundFields);
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
        return isBoundToIntrinsic || ((0, xrpa_utils_1.filterToStringArray)(this.componentProps.ephemeralProperties) ?? []).includes(fieldName);
    }
    isClearSetField(fieldName) {
        const isBoundToIntrinsic = this.isFieldBoundToIntrinsic(fieldName);
        return !isBoundToIntrinsic && (0, TypeDefinition_1.typeIsClearSet)(this.getFieldSpec(fieldName).type);
    }
    isIndexedField(fieldName) {
        return this.indexConfigs.find(config => config.indexFieldName === fieldName) !== undefined;
    }
    isIndexBoundField(fieldName) {
        return this.indexConfigs.find(config => config.boundClassName !== undefined && config.indexFieldName === fieldName) !== undefined;
    }
    isSerializedField(fieldName) {
        if (this.isInboundField(fieldName)) {
            return this.isIndexBoundField(fieldName);
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
    getOutboundChangeByteCount() {
        let byteCount = 0;
        const fields = this.type.getStateFields();
        for (const fieldName in fields) {
            if (this.isOutboundField(fieldName)) {
                byteCount += fields[fieldName].type.getTypeSize();
            }
        }
        return byteCount;
    }
    getIndexedBitMask() {
        const hasIndexedBinding = this.hasIndexedBinding();
        const indexedFields = new Set(this.indexConfigs.map(config => config.indexFieldName));
        let bitMask = 0;
        const fields = this.type.getStateFields();
        for (const fieldName in fields) {
            if (hasIndexedBinding || indexedFields.has(fieldName)) {
                bitMask |= this.type.getFieldBitMask(fieldName);
            }
        }
        return bitMask;
    }
    hasIndexedBinding() {
        return this.indexConfigs.find(config => config.boundClassName !== undefined) !== undefined;
    }
}
class InputReconcilerDefinition extends BaseReconcilerDefinition {
    constructor(type, outboundFields, fieldAccessorNameOverrides, componentProps, useGenericReconciledType = false, indexConfigs) {
        super(type, null, outboundFields, fieldAccessorNameOverrides, componentProps, indexConfigs);
        this.useGenericReconciledType = useGenericReconciledType;
        this.inboundFields = null;
    }
    shouldGenerateConcreteReconciledType() {
        return this.useGenericReconciledType || this.hasIndexedBinding();
    }
}
exports.InputReconcilerDefinition = InputReconcilerDefinition;
class OutputReconcilerDefinition extends BaseReconcilerDefinition {
    constructor(type, inboundFields, fieldAccessorNameOverrides, componentProps, useGenericReconciledType = false, indexConfigs) {
        super(type, inboundFields, null, fieldAccessorNameOverrides, componentProps, indexConfigs);
        this.useGenericReconciledType = useGenericReconciledType;
        this.outboundFields = null;
    }
    shouldGenerateConcreteReconciledType() {
        return this.useGenericReconciledType;
    }
}
exports.OutputReconcilerDefinition = OutputReconcilerDefinition;
class DataStoreDefinition {
    constructor(moduleDef, dataset, isModuleProgramInterface, typeMap, apiname) {
        this.moduleDef = moduleDef;
        this.dataset = dataset;
        this.isModuleProgramInterface = isModuleProgramInterface;
        this.typeMap = typeMap;
        this.inputs = [];
        this.outputs = [];
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
        const inputDef = new InputReconcilerDefinition(type, params.outboundFields ?? [], params.fieldAccessorNameOverrides ?? {}, params.componentProps ?? {}, params.useGenericReconciledType ?? false, params.indexes ?? []);
        this.moduleDef.setCollectionAsInbound(type, inputDef.componentProps, params.reconciledTo, inputDef.indexConfigs);
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
        const outputDef = new OutputReconcilerDefinition(type, params.inboundFields ?? [], params.fieldAccessorNameOverrides ?? {}, params.componentProps ?? {}, params.useGenericReconciledType ?? false, params.indexes ?? []);
        this.moduleDef.setCollectionAsOutbound(type, outputDef.componentProps);
        this.outputs.push(outputDef);
        return outputDef;
    }
    getOutputReconcilers() {
        return this.outputs;
    }
    getAllReconcilers() {
        return [...this.inputs, ...this.outputs];
    }
}
exports.DataStoreDefinition = DataStoreDefinition;
//# sourceMappingURL=DataStore.js.map
