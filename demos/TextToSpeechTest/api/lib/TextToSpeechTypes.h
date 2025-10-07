/*
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

// @generated

#pragma once

#include <xrpa-runtime/utils/XrpaTypes.h>

namespace TextToSpeechDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0xb3ea8470cb793950, 0xffedc5431e43e832, 0xbf35dae1bbee3e4a, 0xb26a853effe1153f);
  config.changelogByteCount = 1267264;
  return config;
}

class TextToSpeechReader;

} // namespace TextToSpeechDataStore
