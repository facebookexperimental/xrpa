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
exports.generateComponentProperties = exports.GameComponentBinding = exports.GameComponentBindingsDisabled = exports.Ephemeral = exports.HiddenGameComponent = exports.GameComponentOwner = exports.GameComponentParent = exports.getGameEngineConfig = exports.GameEngineConfig = exports.IfNotGameEngine = exports.IfGameEngine = void 0;
const simply_immutable_1 = require("simply-immutable");
const Coordinates_1 = require("./Coordinates");
const InterfaceTypes_1 = require("./InterfaceTypes");
const ProgramInterface_1 = require("./ProgramInterface");
const XrpaLanguage_1 = require("./XrpaLanguage");
const Helpers_1 = require("./shared/Helpers");
const PARENT_BINDING = "xrpa.gamecomponent.parentBinding";
const GAME_OBJECT_BINDING = "xrpa.gamecomponent.gameObjectBinding";
const HIDE_COMPONENT = "xrpa.gamecomponent.hideComponent";
const EPHEMERAL_PROPERTY = "xrpa.gamecomponent.ephemeral";
const GAME_COMPONENT_BINDING_ENABLED = (0, XrpaLanguage_1.InheritedProperty)("xrpa.gamecomponent.bindingEnabled");
const BINDING_CONFIG = (0, XrpaLanguage_1.InheritedProperty)("xrpa.gamecomponent.bindingConfig");
exports.IfGameEngine = {
    propertyToCheck: BINDING_CONFIG,
    expectedValue: XrpaLanguage_1.TRUTHY,
};
exports.IfNotGameEngine = {
    propertyToCheck: BINDING_CONFIG,
    expectedValue: XrpaLanguage_1.FALSEY,
};
function GameEngineConfig(ctx, config) {
    ctx.properties[BINDING_CONFIG] = config;
    return ctx;
}
exports.GameEngineConfig = GameEngineConfig;
function getGameEngineConfig(ctx) {
    return ctx.properties[BINDING_CONFIG];
}
exports.getGameEngineConfig = getGameEngineConfig;
function GameComponentParent(arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({ [PARENT_BINDING]: true }, arg0, arg1);
}
exports.GameComponentParent = GameComponentParent;
function GameComponentOwner(arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({ [GAME_OBJECT_BINDING]: true }, arg0, arg1);
}
exports.GameComponentOwner = GameComponentOwner;
function HiddenGameComponent(arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({ [HIDE_COMPONENT]: true }, arg0, arg1);
}
exports.HiddenGameComponent = HiddenGameComponent;
function Ephemeral(arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({ [EPHEMERAL_PROPERTY]: true }, arg0, arg1);
}
exports.Ephemeral = Ephemeral;
function GameComponentBindingsDisabled(collection) {
    if (collection) {
        return (0, XrpaLanguage_1.setProperty)((0, Helpers_1.resolveThunk)(collection), GAME_COMPONENT_BINDING_ENABLED, false);
    }
    else {
        const ctx = (0, ProgramInterface_1.getProgramInterfaceContext)();
        ctx.properties[GAME_COMPONENT_BINDING_ENABLED] = false;
    }
}
exports.GameComponentBindingsDisabled = GameComponentBindingsDisabled;
function GameComponentBinding(arg0, arg1) {
    return (0, XrpaLanguage_1.setPropertiesOrCurry)({ [GAME_COMPONENT_BINDING_ENABLED]: true }, arg0, arg1);
}
exports.GameComponentBinding = GameComponentBinding;
function getFieldBindings(config, fieldToPropertyBindings, fieldPath, dataType) {
    if ((0, InterfaceTypes_1.isStructDataType)(dataType)) {
        for (const [fieldName, fieldDataType] of Object.entries(dataType.fields)) {
            fieldToPropertyBindings = getFieldBindings(config, fieldToPropertyBindings, [...fieldPath, fieldName], fieldDataType);
        }
    }
    else {
        const transformBinding = (0, Coordinates_1.getObjectTransformBinding)(dataType);
        if (dataType.properties[PARENT_BINDING]) {
            fieldToPropertyBindings = (0, simply_immutable_1.replaceImmutable)(fieldToPropertyBindings, fieldPath, config.intrinsicParentProperty);
        }
        else if (dataType.properties[GAME_OBJECT_BINDING]) {
            fieldToPropertyBindings = (0, simply_immutable_1.replaceImmutable)(fieldToPropertyBindings, fieldPath, config.intrinsicGameObjectProperty);
        }
        else if (transformBinding === "position") {
            fieldToPropertyBindings = (0, simply_immutable_1.replaceImmutable)(fieldToPropertyBindings, fieldPath, config.intrinsicPositionProperty);
        }
        else if (transformBinding === "rotation") {
            fieldToPropertyBindings = (0, simply_immutable_1.replaceImmutable)(fieldToPropertyBindings, fieldPath, config.intrinsicRotationProperty);
        }
        else if (transformBinding === "scale") {
            fieldToPropertyBindings = (0, simply_immutable_1.replaceImmutable)(fieldToPropertyBindings, fieldPath, config.intrinsicScaleProperty);
        }
    }
    return fieldToPropertyBindings;
}
function generateComponentProperties(ctx, collection) {
    if ((0, InterfaceTypes_1.getUseGenericImplementation)(collection)) {
        return undefined;
    }
    const config = getGameEngineConfig(ctx);
    if (!config) {
        return undefined;
    }
    // the default is true, so explicitly check for false
    if ((0, XrpaLanguage_1.evalProperty)(collection.properties, GAME_COMPONENT_BINDING_ENABLED) === false) {
        return undefined;
    }
    let fieldToPropertyBindings = {};
    if (collection.interfaceType) {
        fieldToPropertyBindings = getFieldBindings(config, fieldToPropertyBindings, [], collection.interfaceType.fieldsStruct);
    }
    fieldToPropertyBindings = getFieldBindings(config, fieldToPropertyBindings, [], collection.fieldsStruct);
    return {
        basetype: config.componentBaseClass,
        fieldToPropertyBindings,
        internalOnly: collection.properties[HIDE_COMPONENT] === true,
        ephemeralProperties: Object.keys(collection.fieldsStruct.fields).filter(k => (0, XrpaLanguage_1.evalProperty)(collection.fieldsStruct.fields[k].properties, EPHEMERAL_PROPERTY) === true),
    };
}
exports.generateComponentProperties = generateComponentProperties;
//# sourceMappingURL=GameEngine.js.map
