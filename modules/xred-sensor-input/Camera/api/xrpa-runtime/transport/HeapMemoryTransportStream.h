/*
// @generated
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

#pragma once

#include <xrpa-runtime/transport/MemoryTransportStream.h>

namespace Xrpa {

class HeapMemoryTransportStream : public MemoryTransportStream {
 public:
  HeapMemoryTransportStream(const std::string& name, const TransportConfig& config)
      : MemoryTransportStream(name, config) {
    memoryIsOwned_ = true;
    memBuffer_ = static_cast<unsigned char*>(malloc(memSize_));
    if (!initializeMemory(true)) {
      free(memBuffer_);
      memBuffer_ = nullptr;
    }
  }

  HeapMemoryTransportStream(const std::string& name, const TransportConfig& config, void* memBuffer)
      : MemoryTransportStream(name, config) {
    memoryIsOwned_ = false;
    memBuffer_ = static_cast<unsigned char*>(memBuffer);
    if (!initializeMemory(false)) {
      memBuffer_ = nullptr;
    }
  }

  ~HeapMemoryTransportStream() override {
    if (memoryIsOwned_) {
      free(memBuffer_);
    }
  }

  void* getRawMemory() {
    return memBuffer_;
  }

 private:
  bool memoryIsOwned_;
};

} // namespace Xrpa
