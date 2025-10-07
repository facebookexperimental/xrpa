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
  Count,
  HiResTimestamp,
  Image,
  Instantiate,
  isDataflowForeignObjectInstantiation,
  Message,
  ObjectField,
  Output,
  ProgramInput,
  String,
  XrpaDataflowConnection,
  XrpaDataType,
  XrpaProgramInterface,
  XrpaProgramParam,
} from "@xrpa/xrpa-orchestrator";

import assert from "assert";
import path from "path";

export const DEFAULT_OCR_MAX_COUNT = 4;

export function getOpticalCharacterRecognitionTypes(
  width = 384,
  height = 384,
  bytesPerPixel = 3
) {
  const ocrImage = Image("OcrImage", {
    expectedWidth: width,
    expectedHeight: height,
    expectedBytesPerPixel: bytesPerPixel,
  });

  return {
    ocrImage,
  };
}

function createOpticalCharacterRecognitionInterface(
  width = 384,
  height = 384,
  bytesPerPixel = 3
) {
  return XrpaProgramInterface("Xred.OpticalCharacterRecognition", path.join(__dirname, "../package.json"), () => {
    const { ocrImage } = getOpticalCharacterRecognitionTypes(width, height, bytesPerPixel);

    const OcrResult = Message("OcrResult", {
      text: String("", "Transcribed text from the image"),
      timestamp: HiResTimestamp("Timestamp of when input image was captured"),
      success: Boolean(false, "Whether OCR processing completed successfully"),
      errorMessage: String("", "Error message if OCR processing failed"),
    });

    ProgramInput("OpticalCharacterRecognition", Collection({
      maxCount: DEFAULT_OCR_MAX_COUNT,
      fields: {
        imageInput: Message("ImageInput", {
          image: ocrImage,
        }),

        triggerId: Count(0, "Increment this value to trigger OCR processing"),

        immediateMode: Boolean(false, "Whether to use immediate mode (true) or triggered mode (false)"),

        ocrResult: Output(OcrResult),
      },
    }));
  });
}

export const XredOpticalCharacterRecognitionInterface = createOpticalCharacterRecognitionInterface();

export function OpticalCharacterRecognition(params: {
  imageInput: XrpaDataflowConnection;
  triggerId?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Count">>;
  immediateMode?: XrpaDataflowConnection | XrpaProgramParam<XrpaDataType<"Boolean">> | boolean;
}) {
  const dataflowNode = Instantiate(
    [bindExternalProgram(XredOpticalCharacterRecognitionInterface), "OpticalCharacterRecognition"],
    {},
  );
  assert(isDataflowForeignObjectInstantiation(dataflowNode));

  dataflowNode.fieldValues.imageInput = params.imageInput;
  if (params.triggerId) {
    dataflowNode.fieldValues.triggerId = params.triggerId;
  }

  dataflowNode.fieldValues.immediateMode = params.immediateMode;

  return {
    ocrResult: ObjectField(dataflowNode, "ocrResult"),
  };
}
