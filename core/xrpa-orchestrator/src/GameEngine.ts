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


import { Thunk, resolveThunk } from "@xrpa/xrpa-utils";
import { replaceImmutable } from "simply-immutable";

import { getObjectTransformBinding } from "./Coordinates";
import { XrpaCollectionType, XrpaReferenceType, isStructDataType } from "./InterfaceTypes";
import { getProgramInterfaceContext } from "./ProgramInterface";
import { RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { FALSEY, InheritedProperty, PropertyCondition, TRUTHY, XrpaDataType, XrpaTypeAugmenter, evalProperty, setPropertiesOrCurry, setProperty } from "./XrpaLanguage";

import { ComponentProperties, PropertyBinding } from "./shared/DataStore";

const PARENT_BINDING = "xrpa.gamecomponent.parentBinding";
const GAME_OBJECT_BINDING = "xrpa.gamecomponent.gameObjectBinding";
const HIDE_COMPONENT = "xrpa.gamecomponent.hideComponent";
const EPHEMERAL_PROPERTY = "xrpa.gamecomponent.ephemeral";
const SPAWNABLE_COMPONENT = "xrpa.gamecomponent.spawnable";
const GAME_COMPONENT_BINDING_ENABLED = InheritedProperty("xrpa.gamecomponent.bindingEnabled");

const BINDING_CONFIG = InheritedProperty("xrpa.gamecomponent.bindingConfig");
export const COMPONENT_BASE_CLASS = InheritedProperty("xrpa.gamecomponent.componentBaseClass");
const COMPONENT_BASE_CLASS_OVERRIDE = "xrpa.gamecomponent.componentBaseClassOverride";

export const IfGameEngine: PropertyCondition = {
  propertyToCheck: BINDING_CONFIG,
  expectedValue: TRUTHY,
};

export const IfNotGameEngine: PropertyCondition = {
  propertyToCheck: BINDING_CONFIG,
  expectedValue: FALSEY,
};

export interface GameEngineBindingConfig {
  componentBaseClass: string;
  intrinsicPositionProperty: string;
  intrinsicRotationProperty: string;
  intrinsicScaleProperty: string;
  intrinsicParentProperty: string;
  intrinsicGameObjectProperty: string;
}

export function GameEngineConfig<T extends RuntimeEnvironmentContext>(ctx: T, config: GameEngineBindingConfig): T {
  ctx.properties[BINDING_CONFIG] = config;
  ctx.properties[COMPONENT_BASE_CLASS] = config.componentBaseClass;
  return ctx;
}

export function getGameEngineConfig(ctx: RuntimeEnvironmentContext): GameEngineBindingConfig | undefined {
  return ctx.properties[BINDING_CONFIG] as GameEngineBindingConfig | undefined;
}

export function GameComponentParent(dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export function GameComponentParent(condition: PropertyCondition): XrpaTypeAugmenter<XrpaReferenceType>;
export function GameComponentParent(condition: PropertyCondition, dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export function GameComponentParent(arg0: Thunk<XrpaReferenceType>|PropertyCondition, arg1?: Thunk<XrpaReferenceType>): XrpaReferenceType|XrpaTypeAugmenter<XrpaReferenceType> {
  return setPropertiesOrCurry({[PARENT_BINDING]: true}, arg0, arg1);
}

export function GameComponentOwner(dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export function GameComponentOwner(condition: PropertyCondition): XrpaTypeAugmenter<XrpaReferenceType>;
export function GameComponentOwner(condition: PropertyCondition, dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export function GameComponentOwner(arg0: Thunk<XrpaReferenceType>|PropertyCondition, arg1?: Thunk<XrpaReferenceType>): XrpaReferenceType|XrpaTypeAugmenter<XrpaReferenceType> {
  return setPropertiesOrCurry({[GAME_OBJECT_BINDING]: true}, arg0, arg1);
}

export function HiddenGameComponent(dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export function HiddenGameComponent(condition: PropertyCondition): XrpaTypeAugmenter<XrpaCollectionType>;
export function HiddenGameComponent(condition: PropertyCondition, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export function HiddenGameComponent(arg0: Thunk<XrpaCollectionType>|PropertyCondition, arg1?: Thunk<XrpaCollectionType>): XrpaCollectionType|XrpaTypeAugmenter<XrpaCollectionType> {
  return setPropertiesOrCurry({[HIDE_COMPONENT]: true}, arg0, arg1);
}

export function Ephemeral<T extends XrpaDataType>(dataType: Thunk<T>): T;
export function Ephemeral<T extends XrpaDataType>(condition: PropertyCondition): XrpaTypeAugmenter<T>;
export function Ephemeral<T extends XrpaDataType>(condition: PropertyCondition, dataType: Thunk<T>): T;
export function Ephemeral<T extends XrpaDataType>(arg0: Thunk<T>|PropertyCondition, arg1?: Thunk<T>): T|XrpaTypeAugmenter<T> {
  return setPropertiesOrCurry({[EPHEMERAL_PROPERTY]: true}, arg0, arg1);
}

export function Spawnable<T extends XrpaDataType>(dataType: Thunk<T>): T;
export function Spawnable<T extends XrpaDataType>(condition: PropertyCondition): XrpaTypeAugmenter<T>;
export function Spawnable<T extends XrpaDataType>(condition: PropertyCondition, dataType: Thunk<T>): T;
export function Spawnable<T extends XrpaDataType>(arg0: Thunk<T>|PropertyCondition, arg1?: Thunk<T>): T|XrpaTypeAugmenter<T> {
  return setPropertiesOrCurry({
    [SPAWNABLE_COMPONENT]: true,
    [HIDE_COMPONENT]: true,
  }, arg0, arg1);
}

export function GameComponentBindingsDisabled(collection: Thunk<XrpaCollectionType>): XrpaCollectionType;
export function GameComponentBindingsDisabled(): undefined;
export function GameComponentBindingsDisabled(collection?: Thunk<XrpaCollectionType>) {
  if (collection) {
    return setProperty(resolveThunk(collection), GAME_COMPONENT_BINDING_ENABLED, false);
  } else {
    const ctx = getProgramInterfaceContext();
    ctx.properties[GAME_COMPONENT_BINDING_ENABLED] = false;
  }
}

export function GameComponentBinding(dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export function GameComponentBinding(condition: PropertyCondition): XrpaTypeAugmenter<XrpaCollectionType>;
export function GameComponentBinding(condition: PropertyCondition, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export function GameComponentBinding(arg0: Thunk<XrpaCollectionType>|PropertyCondition, arg1?: Thunk<XrpaCollectionType>): XrpaCollectionType|XrpaTypeAugmenter<XrpaCollectionType> {
  return setPropertiesOrCurry({[GAME_COMPONENT_BINDING_ENABLED]: true}, arg0, arg1);
}

export function GameComponentBaseClassOverride(newBaseClass: string, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export function GameComponentBaseClassOverride(newBaseClass: string, condition: PropertyCondition): XrpaTypeAugmenter<XrpaCollectionType>;
export function GameComponentBaseClassOverride(newBaseClass: string, condition: PropertyCondition, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export function GameComponentBaseClassOverride(newBaseClass: string, arg0: Thunk<XrpaCollectionType>|PropertyCondition, arg1?: Thunk<XrpaCollectionType>): XrpaCollectionType|XrpaTypeAugmenter<XrpaCollectionType> {
  return setPropertiesOrCurry({[COMPONENT_BASE_CLASS_OVERRIDE]: newBaseClass}, arg0, arg1);
}

function getFieldBindings(config: GameEngineBindingConfig, fieldToPropertyBindings: Record<string, PropertyBinding>, fieldPath: string[], dataType: XrpaDataType): Record<string, PropertyBinding> {
  if (isStructDataType(dataType)) {
    for (const [fieldName, fieldDataType] of Object.entries(dataType.fields)) {
      fieldToPropertyBindings = getFieldBindings(config, fieldToPropertyBindings, [...fieldPath, fieldName], fieldDataType);
    }
  } else {
    const transformBinding = getObjectTransformBinding(dataType);
    if (dataType.properties[PARENT_BINDING]) {
      fieldToPropertyBindings = replaceImmutable(fieldToPropertyBindings, fieldPath, config.intrinsicParentProperty);
    } else if (dataType.properties[GAME_OBJECT_BINDING]) {
      fieldToPropertyBindings = replaceImmutable(fieldToPropertyBindings, fieldPath, config.intrinsicGameObjectProperty);
    } else if (transformBinding === "position") {
      fieldToPropertyBindings = replaceImmutable(fieldToPropertyBindings, fieldPath, config.intrinsicPositionProperty);
    } else if (transformBinding === "rotation") {
      fieldToPropertyBindings = replaceImmutable(fieldToPropertyBindings, fieldPath, config.intrinsicRotationProperty);
    } else if (transformBinding === "scale") {
      fieldToPropertyBindings = replaceImmutable(fieldToPropertyBindings, fieldPath, config.intrinsicScaleProperty);
    }
  }

  return fieldToPropertyBindings;
}

export function generateComponentProperties(ctx: RuntimeEnvironmentContext, collection: XrpaCollectionType): ComponentProperties|undefined {
  const config = getGameEngineConfig(ctx);
  if (!config) {
    return undefined;
  }

  // the default is true, so explicitly check for false
  if (evalProperty<boolean>(collection.properties, GAME_COMPONENT_BINDING_ENABLED) === false) {
    return undefined;
  }

  let fieldToPropertyBindings: Record<string, PropertyBinding> = {};
  if (collection.interfaceType) {
    fieldToPropertyBindings = getFieldBindings(config, fieldToPropertyBindings, [], collection.interfaceType.fieldsStruct);
  }
  fieldToPropertyBindings = getFieldBindings(config, fieldToPropertyBindings, [], collection.fieldsStruct);

  return {
    basetype: evalProperty<string>(collection.properties, COMPONENT_BASE_CLASS_OVERRIDE) ?? config.componentBaseClass,
    fieldToPropertyBindings,
    internalOnly: evalProperty<boolean>(collection.properties, HIDE_COMPONENT) === true,
    ephemeralProperties: Object.keys(collection.fieldsStruct.fields).filter(k => evalProperty(collection.fieldsStruct.fields[k].properties, EPHEMERAL_PROPERTY) === true),
    generateSpawner: evalProperty<boolean>(collection.properties, SPAWNABLE_COMPONENT) === true,
  };
}
