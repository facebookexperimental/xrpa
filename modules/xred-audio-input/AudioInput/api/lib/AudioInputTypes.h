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

namespace AudioInputDataStore {

static inline Xrpa::TransportConfig GenTransportConfig() {
  Xrpa::TransportConfig config;
  config.schemaHash = Xrpa::HashValue(0xdafefb672385aa11, 0xafd6c52b61c6ab45, 0xf591db76082c5299, 0xd7653b0ffaf8bbd9);
  config.changelogByteCount = 1283456;
  return config;
}

class AudioInputDeviceReader;
class AudioInputSourceReader;

enum class DeviceBindingType: uint32_t {
  Device = 0,
  DeviceByName = 1,
  SystemAudio = 2,
  TcpStream = 3,
};

} // namespace AudioInputDataStore
