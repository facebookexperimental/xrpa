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
  bindExternalProgram,
  Boolean,
  Collection,
  Enum,
  HiResTimestamp,
  Image,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  Message,
  ObjectField,
  Output,
  ProgramInput,
  Scalar,
  String,
  XrpaDataflowConnection,
  XrpaProgramInterface,
} from "@xrpa/xrpa-orchestrator";

import assert from "assert";
import path from "path";

export const DEFAULT_GESTURE_DETECTION_MAX_COUNT = 1;

export enum GestureType {
  None = 0,
  ClosedFist = 1,
  OpenPalm = 2,
  PointingUp = 3,
  ThumbDown = 4,
  ThumbUp = 5,
  Victory = 6,
  ILoveYou = 7,
  Pinch = 8,
}

export function getGestureDetectionTypes(
  width = 1920,
  height = 1080,
  bytesPerPixel = 3
) {
  const gestureImage = Image("GestureImage", {
    expectedWidth: width,
    expectedHeight: height,
    expectedBytesPerPixel: bytesPerPixel,
  });

  return {
    gestureImage,
  };
}

function createGestureDetectionInterface(
  width = 640,
  height = 480,
  bytesPerPixel = 3
) {
  return XrpaProgramInterface("Xred.GestureDetection", path.join(__dirname, "../package.json"), () => {
    const GestureTypeEnum = Enum("GestureType", [
      "None",
      "ClosedFist",
      "OpenPalm",
      "PointingUp",
      "ThumbDown",
      "ThumbUp",
      "Victory",
      "ILoveYou",
      "Pinch"
    ]);

    const { gestureImage } = getGestureDetectionTypes(width, height, bytesPerPixel);

    const GestureResult = Message("GestureResult", {
      timestamp: HiResTimestamp("Timestamp of when input image was captured"),
      gestureType: GestureTypeEnum,
      confidence: Scalar(0.0, "Confidence score for the detected gesture (0.0 - 1.0)"),
      handDetected: Boolean(false, "Whether a hand was detected in the frame"),
      errorMessage: String("", "Error message if gesture processing failed"),
    });

    ProgramInput("GestureDetection", Collection({
      maxCount: DEFAULT_GESTURE_DETECTION_MAX_COUNT,
      fields: {
        imageInput: Message("ImageInput", {
          image: gestureImage,
        }),

        gestureResult: Output(GestureResult),
      },
    }));
  });
}

export const XredGestureDetectionInterface = createGestureDetectionInterface();

export function GestureDetection(params: {
  imageInput: XrpaDataflowConnection;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredGestureDetectionInterface), "GestureDetection"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues.imageInput = params.imageInput;

  return {
    gestureResult: ObjectField(dataflowNode, "gestureResult"),
  };
}
