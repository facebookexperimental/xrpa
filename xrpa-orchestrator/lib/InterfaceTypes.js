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
exports.propagateInheritableProperties = exports.walkTypeTree = exports.ReferenceTo = exports.isReferenceDataType = exports.hasFieldsStruct = exports.Collection = exports.isCollectionDataType = exports.Interface = exports.isInterfaceDataType = exports.MessageRate = exports.Message = exports.isMessageDataType = exports.Image = exports.Struct = exports.isStructDataType = exports.ByteArray = exports.isByteArrayDataType = exports.FixedArray = exports.isFixedArrayDataType = exports.Enum = exports.isEnumDataType = exports.isBuiltinDataType = exports.Signal = exports.ColorLinear = exports.ColorSRGBA = exports.Float3 = exports.String = exports.HiResTimestamp = exports.Timestamp = exports.Scalar = exports.BitField = exports.Count = exports.Boolean = exports.LateBindingType = exports.isFieldIndexKey = exports.IndexKey = exports.isFieldPrimaryKey = exports.PrimaryKey = exports.getFieldDefaultValue = exports.getFieldDescription = exports.Description = exports.IS_IMAGE_TYPE = exports.MESSAGE_RATE = exports.FIELD_DEFAULT = exports.FIELD_DESCRIPTION = void 0;
const xrpa_utils_1 = require("@xrpa/xrpa-utils");
const assert_1 = __importDefault(require("assert"));
const simply_immutable_1 = require("simply-immutable");
const ProgramInterface_1 = require("./ProgramInterface");
const XrpaLanguage_1 = require("./XrpaLanguage");
const BuiltinTypes_1 = require("./shared/BuiltinTypes");
exports.FIELD_DESCRIPTION = "xrpa.description";
exports.FIELD_DEFAULT = "xrpa.defaultValue";
const PRIMARY_KEY = "xrpa.primaryKey";
const INDEX_KEY = "xrpa.indexKey";
exports.MESSAGE_RATE = "xrpa.messageRate";
exports.IS_IMAGE_TYPE = "xrpa.isImageType";
function Description(description, dataType) {
    dataType = (0, xrpa_utils_1.resolveThunk)(dataType);
    if (description === undefined) {
        return dataType;
    }
    return (0, XrpaLanguage_1.setProperty)(dataType, exports.FIELD_DESCRIPTION, description);
}
exports.Description = Description;
function getFieldDescription(dataType) {
    return dataType.properties[exports.FIELD_DESCRIPTION];
}
exports.getFieldDescription = getFieldDescription;
function getFieldDefaultValue(dataType) {
    return dataType.properties[exports.FIELD_DEFAULT];
}
exports.getFieldDefaultValue = getFieldDefaultValue;
function PrimaryKey(arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({
        [PRIMARY_KEY]: true,
        [INDEX_KEY]: true,
    }, arg0, arg1);
}
exports.PrimaryKey = PrimaryKey;
function isFieldPrimaryKey(dataType) {
    return (0, XrpaLanguage_1.evalProperty)(dataType.properties, PRIMARY_KEY) === true;
}
exports.isFieldPrimaryKey = isFieldPrimaryKey;
function IndexKey(arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({ [INDEX_KEY]: true }, arg0, arg1);
}
exports.IndexKey = IndexKey;
function isFieldIndexKey(dataType) {
    return (0, XrpaLanguage_1.evalProperty)(dataType.properties, INDEX_KEY) === true;
}
exports.isFieldIndexKey = isFieldIndexKey;
////////////////////////////////////////////////////////////////////////////////
// Primitive data types
function LateBindingType(defaultValue, description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "LateBindingType",
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.LateBindingType = LateBindingType;
function Boolean(defaultValue, description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Boolean,
        properties: {
            [exports.FIELD_DEFAULT]: defaultValue,
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Boolean = Boolean;
function Count(defaultValue, description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Count,
        properties: {
            [exports.FIELD_DEFAULT]: defaultValue,
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Count = Count;
function BitField(description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.BitField,
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.BitField = BitField;
function Scalar(defaultValue, description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Scalar,
        properties: {
            [exports.FIELD_DEFAULT]: defaultValue,
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Scalar = Scalar;
function Timestamp(description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Timestamp,
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Timestamp = Timestamp;
function HiResTimestamp(description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.HiResTimestamp,
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.HiResTimestamp = HiResTimestamp;
function String(defaultValue, description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.String,
        properties: {
            [exports.FIELD_DEFAULT]: defaultValue,
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.String = String;
function Float3(defaultValue, description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Float3,
        properties: {
            [exports.FIELD_DEFAULT]: defaultValue,
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Float3 = Float3;
function ColorSRGBA(description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.ColorSRGBA,
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.ColorSRGBA = ColorSRGBA;
function ColorLinear(description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.ColorLinear,
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.ColorLinear = ColorLinear;
function Signal(description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: BuiltinTypes_1.BuiltinType.Signal,
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
    });
}
exports.Signal = Signal;
function isBuiltinDataType(dataType) {
    return dataType.typename in BuiltinTypes_1.BuiltinType;
}
exports.isBuiltinDataType = isBuiltinDataType;
function isEnumDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "Enum";
}
exports.isEnumDataType = isEnumDataType;
function Enum(name, enumValues, description) {
    (0, assert_1.default)(enumValues.length > 0, "Enum must have at least one value");
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "Enum",
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
        name,
        enumValues,
    });
}
exports.Enum = Enum;
function isFixedArrayDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "FixedArray";
}
exports.isFixedArrayDataType = isFixedArrayDataType;
function FixedArray(innerType, arraySize, description) {
    (0, assert_1.default)(arraySize > 0, "FixedArray count must be greater than 0");
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "FixedArray",
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
        innerType: (0, xrpa_utils_1.resolveThunk)(innerType),
        arraySize,
    });
}
exports.FixedArray = FixedArray;
function isByteArrayDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "ByteArray";
}
exports.isByteArrayDataType = isByteArrayDataType;
function ByteArray(expectedSize = 256, description) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "ByteArray",
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
        expectedSize,
    });
}
exports.ByteArray = ByteArray;
function isStructDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "Struct";
}
exports.isStructDataType = isStructDataType;
function extractNameAndValue(arg0, arg1) {
    const name = (typeof arg0 !== "string") ? undefined : arg0;
    const value = (typeof arg0 === "string" || arg0 === undefined) ? arg1 : arg0;
    return [name, value];
}
function Struct(arg0, arg1) {
    const [name, fieldDefs] = extractNameAndValue(arg0, arg1);
    const fields = {};
    for (const key in fieldDefs) {
        fields[key] = (0, xrpa_utils_1.resolveThunk)(fieldDefs[key]);
        const typename = fields[key].typename;
        if (typename === "Collection" || typename === "Interface") {
            // TODO this might be better checked when fully realizing the types, as then we would have a full name-path to the field.
            // As it is, we have the call stack, but it takes some effort to find the right line in the stack because of the nesting.
            throw new Error(`Struct field "${key}" cannot be a Collection or Interface, use a Reference instead`);
        }
    }
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "Struct",
        properties: {},
        name: name ?? "",
        fields,
    });
}
exports.Struct = Struct;
function resolveStruct(name, thing) {
    if (thing === undefined) {
        return Struct(name, {});
    }
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) ? (0, XrpaLanguage_1.NameType)(name, thing) : Struct(name, thing);
}
function Image(arg0, arg1) {
    const [name, params] = extractNameAndValue(arg0, arg1);
    (0, assert_1.default)(params);
    const ret = (0, XrpaLanguage_1.setProperty)(Struct(name, {
        width: Count(params.expectedWidth, "Image width"),
        height: Count(params.expectedHeight, "Image height"),
        format: Enum("ImageFormat", ["RGB8", "BGR8", "RGBA8", "Y8"]),
        encoding: Enum("ImageEncoding", ["Raw", "Jpeg"]),
        orientation: Enum("ImageOrientation", ["Oriented", "RotatedCW", "RotatedCCW", "Rotated180"]),
        gain: Scalar(1.0, "Image gain"),
        exposureDuration: HiResTimestamp("Image exposure duration, if available"),
        timestamp: HiResTimestamp("Capture timestamp, if available"),
        data: ByteArray(Math.ceil(params.expectedWidth * params.expectedHeight * params.expectedBytesPerPixel), "Image data"),
    }), exports.IS_IMAGE_TYPE, true);
    if (params.description) {
        return Description(params.description, ret);
    }
    return ret;
}
exports.Image = Image;
function isMessageDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "Message";
}
exports.isMessageDataType = isMessageDataType;
function Message(arg0, arg1) {
    const [name, fields] = extractNameAndValue(arg0, arg1);
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "Message",
        properties: {},
        name: name ?? "",
        fieldsStruct: resolveStruct(name, fields),
    });
}
exports.Message = Message;
function MessageRate(expectedRatePerSecond, arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({ [exports.MESSAGE_RATE]: expectedRatePerSecond }, arg0, arg1);
}
exports.MessageRate = MessageRate;
function isInterfaceDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "Interface";
}
exports.isInterfaceDataType = isInterfaceDataType;
function Interface(name, fields) {
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "Interface",
        properties: {},
        name: name ?? "",
        fieldsStruct: resolveStruct(name, fields),
    });
}
exports.Interface = Interface;
function isCollectionDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "Collection";
}
exports.isCollectionDataType = isCollectionDataType;
function Collection(arg0, arg1) {
    const [name, config] = extractNameAndValue(arg0, arg1);
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "Collection",
        properties: {},
        name: name ?? "",
        fieldsStruct: resolveStruct(name, config?.fields),
        maxCount: config?.maxCount ?? 16,
        interfaceType: config?.interfaceType,
    });
}
exports.Collection = Collection;
function hasFieldsStruct(dataType) {
    return isCollectionDataType(dataType) || isInterfaceDataType(dataType) || isMessageDataType(dataType);
}
exports.hasFieldsStruct = hasFieldsStruct;
function isReferenceDataType(thing) {
    return (0, XrpaLanguage_1.isXrpaDataType)(thing) && thing.typename === "Reference";
}
exports.isReferenceDataType = isReferenceDataType;
function ReferenceTo(targetType, description) {
    if ((0, ProgramInterface_1.isXrpaProgramParam)(targetType)) {
        targetType = targetType.dataType;
    }
    return (0, xrpa_utils_1.safeDeepFreeze)({
        __XrpaDataType: true,
        typename: "Reference",
        properties: {
            [exports.FIELD_DESCRIPTION]: description,
        },
        targetType,
    });
}
exports.ReferenceTo = ReferenceTo;
function walkTypeTree(visitor, fieldPath, dataType, parentProperties, isSubStruct = false) {
    if (visitor.allTypes) {
        dataType = visitor.allTypes(dataType, fieldPath, parentProperties, isSubStruct);
    }
    // stop recursion at builtin (non-named) types
    if (!(0, XrpaLanguage_1.isNamedDataType)(dataType)) {
        return dataType;
    }
    if (visitor.preRecursion) {
        dataType = visitor.preRecursion(dataType, fieldPath, isSubStruct);
    }
    // recurse into struct fields
    if (isStructDataType(dataType)) {
        const newFields = {};
        for (const key in dataType.fields) {
            newFields[key] = walkTypeTree(visitor, [...fieldPath, key], dataType.fields[key], dataType.properties);
        }
        dataType = (0, simply_immutable_1.updateImmutable)(dataType, ["fields"], newFields);
    }
    if (isCollectionDataType(dataType)) {
        if (dataType.interfaceType) {
            dataType = (0, simply_immutable_1.replaceImmutable)(dataType, ["interfaceType"], walkTypeTree(visitor, fieldPath, dataType.interfaceType, dataType.properties, true));
        }
    }
    // recurse into substructs
    if (hasFieldsStruct(dataType)) {
        const newFieldsStruct = walkTypeTree(visitor, [...fieldPath, dataType.name], dataType.fieldsStruct, dataType.properties, true);
        dataType = (0, simply_immutable_1.replaceImmutable)(dataType, ["fieldsStruct"], newFieldsStruct);
    }
    if (visitor.postRecursion) {
        dataType = visitor.postRecursion(dataType, fieldPath, isSubStruct);
    }
    return dataType;
}
exports.walkTypeTree = walkTypeTree;
const PropertyPropagator = {
    allTypes(dataType, _fieldPath, parentProperties) {
        return (0, simply_immutable_1.replaceImmutable)(dataType, ["properties"], (0, simply_immutable_1.updateImmutable)((0, XrpaLanguage_1.getInheritableProperties)(parentProperties), dataType.properties));
    }
};
function propagateInheritableProperties(dataType, parentProperties) {
    return walkTypeTree(PropertyPropagator, [], dataType, parentProperties);
}
exports.propagateInheritableProperties = propagateInheritableProperties;
//# sourceMappingURL=InterfaceTypes.js.map
