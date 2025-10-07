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

import path from "path";

import {
  addSetting,
  bindExternalProgram,
  Count,
  CppStandalone,
  mapInterfaceType,
  ProgramInput,
  ProgramOutput,
  String,
  UnityCoordinateSystem,
  useBuck,
  useCoordinateSystem,
  useEigenTypes,
  XrpaDataflowProgram,
  XrpaNativeCppProgram,
} from "@xrpa/xrpa-orchestrator";

import { ImageWindow } from "@xrpa/xred-debug";
import { LlmTriggeredQuery, ImageSelector, ObjectRecognition, ModelSize } from "@xrpa/xred-perception-services";
import { AriaGlasses, XredAriaInterface } from "@xrpa/xred-sensor-input";

import {
  OutputToDevice,
  SignalStream,
  strContains,
} from "@xrpa/xred-signal-processing";

import { z } from 'zod';

const apidir = path.join(__dirname, "..", "api");

const debugOutput = true;

const AriaDebugProgram = XrpaDataflowProgram("AriaDebugProgram", () => {
  const aria = AriaGlasses({
    ipAddress: ProgramInput("ipAddress", String()),
    isFlashlight: true,
  });
  const rgbImage = ImageSelector({
    pickOneEveryNBasedOnMotion: 2,
    rgbCamera: aria.rgbCamera,
    poseDynamics: aria.poseDynamics,
  });

  const objectDetection = ObjectRecognition({
    rgbImage,
  });

  const queryResult = LlmTriggeredQuery({
    apiKey: ProgramInput("apiKey", String()),
    modelSize: ModelSize.Large,
    sysPrompt: "You are an image recognizing AI that examines images and answers questions about the objects detected.",
    userPrompt: `
Describe this scene in json formt. The json will describe all objects in the image in a lot of detail. Make sure you describe all the objects you detect.

Here is an example json blob of a theoretical scene:
{ "scene": { "name": "Living Room", "description": "A cozy living room with a couch, coffee table, and TV.", "objects": [ { "id": 1, "name": "Couch", "material": "Fabric", "colors": ["#964B00", "#FFC080"], "relative_importance": 0.8, "visual_description": "A plush, three-seater couch with rolled arms and a tufted back. The cushions are a warm, earthy brown color with cream-colored accent pillows." }, { "id": 2, "name": "Coffee Table", "material": "Wood", "colors": ["#786C3B"], "relative_importance": 0.4, "visual_description": "A simple, low-slung coffee table made of dark-stained wood. The surface is smooth and unadorned, with a subtle grain visible in the wood." }, { "id": 3, "name": "TV", "material": "Electronic", "colors": ["#000000", "#333333"], "relative_importance": 0.9, "visual_description": "A large, flat-screen TV with a sleek black frame and a glossy finish. The screen is a deep, rich black when turned off, and displays vibrant colors when turned on." } ] } }
`,
    jsonSchema: z.object({
      scene: z.object({
        name: z.string(),
        description: z.string(),
        objects: z.array(z.object({
          id: z.number(),
          name: z.string(),
          material: z.string(),
          colors: z.array(z.string()),
          relative_importance: z.number(),
          visual_description: z.string(),
        })),
      }),
    }),
    RgbImageFeed: rgbImage,
    triggerId: ProgramInput("queryId", Count())
  });

  ProgramOutput("pose", aria.pose);
  ProgramOutput("coordinateFrameId", aria.coordinateFrameId);
  ProgramOutput("objectDetection", objectDetection);
  ProgramOutput("queryResponse", queryResult.Response);

  if (debugOutput) {
    // show the images from the Aria glasses
    ImageWindow({ windowTitle: "Aria RGB", image: aria.rgbCamera });
    ImageWindow({ windowTitle: "Aria SLAM1", image: aria.slamCamera1 });
    ImageWindow({ windowTitle: "Aria SLAM2", image: aria.slamCamera2 });

    ImageWindow({ windowTitle: "Selected RGB", image: rgbImage });

    OutputToDevice({
      deviceName: strContains("Headphones"),
      source: SignalStream(aria.audio),
    });
  }
});

//////////////////////////////////////////////////////////////////////////////

const AriaDebugModule = XrpaNativeCppProgram("AriaDebug", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/AriaDebug:AriaDebug",
    oncall: "xred_swes",
    modes: {
      windows: {
        debug: "@arvr/mode/win/debug",
        release: "@arvr/mode/win/release",
      },
      macos: {
        debug: "@arvr/mode/mac/dbg",
        release: "@arvr/mode/mac-arm/opt",
      },
    },
  });

  useCoordinateSystem(UnityCoordinateSystem);
  useEigenTypes();

  // a little hacky, but we need the types to match between the modules (because C++ is nominally typed instead of structurally typed)
  mapInterfaceType(XredAriaInterface, "DataPoseDynamics", {
    typename: "ImageSelectorDataStore::DataPoseDynamics",
    headerFile: "<lib/ImageSelectorTypes.h>",
  });

  bindExternalProgram(AriaDebugProgram);

  addSetting("ipAddress", String("", "IP address of the Aria glasses, or empty to use USB"));
});

const AriaDebugStandalone = new CppStandalone(AriaDebugModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

AriaDebugStandalone.smartExecute().catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
