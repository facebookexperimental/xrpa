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
  bindExternalProgram,
  CppStandalone,
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

import { ApiProvider, LlmConversation, LlmQuery, McpServerSet, ModelSize } from "@xrpa/xred-perception-services";

const apidir = path.join(__dirname, "..", "api");

const SimpleQuery = XrpaDataflowProgram("SimpleQuery", () => {
  const query = LlmQuery({
    apiKey: ProgramInput("apiKey", String()),
    modelSize: ModelSize.Small,
    apiProvider: ApiProvider.LlamaAPI,
    sysPrompt: `You are a character in an Oscar Wilde play. Respond using appropriate dialect.`,
    Query: ProgramInput("Query"),
  });

  ProgramOutput("Response", query.Response);
});

const SimpleConversation = XrpaDataflowProgram("SimpleConversation", () => {
  const conversation = LlmConversation({
    apiKey: ProgramInput("apiKey", String()),
    modelSize: ModelSize.Large,
    apiProvider: ApiProvider.LlamaAPI,
    sysPrompt: `You are a character in an Oscar Wilde play. Respond using appropriate dialect.`,
    ChatMessage: ProgramInput("ChatMessage"),
    mcpServerSet: McpServerSet([{
      url: "http://127.0.0.1:3120/mcp",
    }]),
  });

  ProgramOutput("ChatResponse", conversation.ChatResponse);
});

//////////////////////////////////////////////////////////////////////////////

const LlmDebugModule = XrpaNativeCppProgram("LlmDebug", apidir, () => {
  useBuck({
    target: "//arvr/libraries/xred/xrpa/demos/LlmDebug:LlmDebug",
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

  bindExternalProgram(SimpleQuery);
  bindExternalProgram(SimpleConversation);
});

const LlmDebugStandalone = new CppStandalone(LlmDebugModule, path.join(apidir, "standalone"), path.join(apidir, "manifest.gen.json"));

if (require.main === module) {
  LlmDebugStandalone.buckRunDebug().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
