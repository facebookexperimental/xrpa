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

export enum EmotionType {
  Neutral = 0,
  Happy = 1,
  Ecstatic = 2,
  Surprised = 3,
  Shocked = 4,
  Horrified = 5,
  Angry = 6,
  Sad = 7,
}

export function getVisualEmotionDetectionTypes(
  width = 1920,
  height = 1080,
  bytesPerPixel = 4
) {
  const emotionImage = Image("EmotionImage", {
    expectedWidth: width,
    expectedHeight: height,
    expectedBytesPerPixel: bytesPerPixel,
  });

  return {
    emotionImage,
  };
}

function createVisualEmotionDetectionInterface(
  width = 1920,
  height = 1080,
  bytesPerPixel = 4
) {
  return XrpaProgramInterface("Xred.VisualEmotionDetection", path.join(__dirname, "../package.json"), () => {
    const EmotionTypeEnum = Enum("EmotionType", [
      "Neutral",
      "Happy",
      "Ecstatic",
      "Surprised",
      "Shocked",
      "Horrified",
      "Angry",
      "Sad"
    ]);

    const { emotionImage } = getVisualEmotionDetectionTypes(width, height, bytesPerPixel);

    ProgramInput("VisualEmotionDetection", Collection({
      maxCount: 1,
      fields: {
        imageInput: Message("ImageInput", {
          image: emotionImage,
        }),
        apiKey: String,

        emotionResult: Output(Message("EmotionResult", {
          timestamp: HiResTimestamp,
          emotion: EmotionTypeEnum,
          faceDetected: Boolean,
          confidence: Scalar,
          valence: Scalar,
          arousal: Scalar,
        })),
      },
    }));
  });
}

export const XredVisualEmotionDetectionInterface = createVisualEmotionDetectionInterface();

export function VisualEmotionDetection(params: {
  imageInput: XrpaDataflowConnection;
  apiKey: string;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredVisualEmotionDetectionInterface), "VisualEmotionDetection"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues.imageInput = params.imageInput;
  dataflowNode.fieldValues.apiKey = params.apiKey;

  return {
    emotionResult: ObjectField(dataflowNode, "emotionResult"),
  };
}
