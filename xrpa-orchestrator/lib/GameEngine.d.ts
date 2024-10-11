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


import { XrpaCollectionType, XrpaReferenceType } from "./InterfaceTypes";
import { RuntimeEnvironmentContext } from "./RuntimeEnvironment";
import { PropertyCondition, XrpaDataType, XrpaTypeAugmenter } from "./XrpaLanguage";
import { ComponentProperties } from "./shared/DataStore";
import { Thunk } from "./shared/Helpers";
export declare const COMPONENT_BASE_CLASS: string;
export declare const IfGameEngine: PropertyCondition;
export declare const IfNotGameEngine: PropertyCondition;
export interface GameEngineBindingConfig {
    componentBaseClass: string;
    intrinsicPositionProperty: string;
    intrinsicRotationProperty: string;
    intrinsicScaleProperty: string;
    intrinsicParentProperty: string;
    intrinsicGameObjectProperty: string;
}
export declare function GameEngineConfig<T extends RuntimeEnvironmentContext>(ctx: T, config: GameEngineBindingConfig): T;
export declare function getGameEngineConfig(ctx: RuntimeEnvironmentContext): GameEngineBindingConfig | undefined;
export declare function GameComponentParent(dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export declare function GameComponentParent(condition: PropertyCondition): XrpaTypeAugmenter<XrpaReferenceType>;
export declare function GameComponentParent(condition: PropertyCondition, dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export declare function GameComponentOwner(dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export declare function GameComponentOwner(condition: PropertyCondition): XrpaTypeAugmenter<XrpaReferenceType>;
export declare function GameComponentOwner(condition: PropertyCondition, dataType: Thunk<XrpaReferenceType>): XrpaReferenceType;
export declare function HiddenGameComponent(dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function HiddenGameComponent(condition: PropertyCondition): XrpaTypeAugmenter<XrpaCollectionType>;
export declare function HiddenGameComponent(condition: PropertyCondition, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function Ephemeral<T extends XrpaDataType>(dataType: Thunk<T>): T;
export declare function Ephemeral<T extends XrpaDataType>(condition: PropertyCondition): XrpaTypeAugmenter<T>;
export declare function Ephemeral<T extends XrpaDataType>(condition: PropertyCondition, dataType: Thunk<T>): T;
export declare function GameComponentBindingsDisabled(collection: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function GameComponentBindingsDisabled(): undefined;
export declare function GameComponentBinding(dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function GameComponentBinding(condition: PropertyCondition): XrpaTypeAugmenter<XrpaCollectionType>;
export declare function GameComponentBinding(condition: PropertyCondition, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function GameComponentBaseClassOverride(newBaseClass: string, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function GameComponentBaseClassOverride(newBaseClass: string, condition: PropertyCondition): XrpaTypeAugmenter<XrpaCollectionType>;
export declare function GameComponentBaseClassOverride(newBaseClass: string, condition: PropertyCondition, dataType: Thunk<XrpaCollectionType>): XrpaCollectionType;
export declare function generateComponentProperties(ctx: RuntimeEnvironmentContext, collection: XrpaCollectionType): ComponentProperties | undefined;

