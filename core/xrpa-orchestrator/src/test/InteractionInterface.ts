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


import {
  Augment,
  Boolean,
  Collection,
  Count,
  Distance,
  Enum,
  Ephemeral,
  FixedArray,
  GameComponentBaseClassOverride,
  GameComponentBindingsDisabled,
  GameComponentOwner,
  GameComponentParent,
  HiddenGameComponent,
  IfUnrealEngine,
  Interface,
  Message,
  ObjectTransform,
  Output,
  ProgramInput,
  Quaternion,
  ReferenceTo,
  Signal,
  String,
  Struct,
  UnityCoordinateSystem,
  Vector3,
  XrpaCollectionType,
  XrpaProgramInterface,
  useCoordinateSystem,
} from "../index";

export const SetConfigurationMessage = Message("SetConfiguration", {
  importance: Count,
  userData: String,
});

export const XredInteractionInterface = XrpaProgramInterface("Xred.Interaction", "", () => {
  useCoordinateSystem(UnityCoordinateSystem);

  const Pose = Struct("Pose", {
    position: Vector3,
    orientation: Quaternion,
  });

  const PoseTransform = ObjectTransform({
    position: "position",
    rotation: "orientation",
  }, Pose);

  const PointerEventType = Enum("PointerEventType", ["Hover", "Unhover", "Select", "Unselect", "Move", "Cancel"]);
  const CylinderSurfaceFacing = Enum("CylinderSurfaceFacing", ["Any", "In", "Out"]);

  const IHandDataSource = Interface("IHandDataSource");

  const ISurface = Interface("ISurface", {
    pose: PoseTransform,
  });

  const IInteractor = Interface("IInteractor");

  const IInteractable = Interface("IInteractable", {
    PointerEvent: Output(Message({
      eventType: PointerEventType,
      pose: Pose,
      interactor: ReferenceTo(IInteractor),
      userData: String,
    })),
    SetConfiguration: SetConfigurationMessage,
  });

  const JointRotations = FixedArray(Quaternion, 24);

  ProgramInput("HandDataProducer", HiddenGameComponent(Collection({
    maxCount: 4,
    interfaceType: IHandDataSource,
    fields: {
      pose: Ephemeral(Pose),
      joints: Ephemeral(JointRotations),
      errorSignal: Signal,
      responseSignal: Output(Signal),
    },
  })));

  ProgramInput("HandDataConsumer", Augment<XrpaCollectionType>(Collection({
    maxCount: 16,
    fields: {
      pose: Output(Pose),
      joints: Output(JointRotations),
      handDataSource: GameComponentParent(ReferenceTo(IHandDataSource)),
    },
  }), HiddenGameComponent, GameComponentBaseClassOverride("PoseableMeshComponent", IfUnrealEngine)));

  ProgramInput("CylinderSurface", Collection({
    maxCount: 128,
    interfaceType: ISurface,
    fields: {
      height: Distance,
      radius: Distance,
      facing: CylinderSurfaceFacing,
      tag: String,
    },
  }));

  ProgramInput("RayInteractor", Collection({
    maxCount: 4,
    interfaceType: IInteractor,
    fields: {
      name: String,
      rayOrigin: PoseTransform,
      maxRayLength: Distance(1),
      equalDistanceThreshold: Distance(0.01),
      Select: Message,
      Unselect: Message,
    },
  }));

  ProgramInput("RayInteractable", Collection({
    maxCount: 128,
    interfaceType: IInteractable,
    fields: {
      tiebreakerScore: Count,
      surface: GameComponentOwner(ReferenceTo(ISurface)),
      hasInteraction: Output(Boolean),
    },
  }));

  ProgramInput("TouchInteractor", Augment<XrpaCollectionType>(Collection({
    maxCount: 4,
    interfaceType: IInteractor,
    fields: {
      name: String,
      touchPoint: PoseTransform,
      isTouching: Output(Boolean),
    },
  }), GameComponentBindingsDisabled));
});
