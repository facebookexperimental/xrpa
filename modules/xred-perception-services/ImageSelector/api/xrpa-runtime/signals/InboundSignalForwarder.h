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

#include <xrpa-runtime/signals/InboundSignalData.h>
#include <xrpa-runtime/signals/OutboundSignalData.h>
#include <xrpa-runtime/utils/MemoryAccessor.h>
#include <vector>

namespace Xrpa {

class InboundSignalForwarder : public InboundSignalDataInterface {
 public:
  void addRecipient(OutboundSignalData& recipient) {
    recipients_.push_back(&recipient);
  }

  void onSignalData(uint64_t /*timestamp*/, const MemoryAccessor& memAccessor) override {
    auto inboundPacket = SignalPacket(memAccessor);
    auto frameCount = inboundPacket.getFrameCount();
    auto sampleType = inboundPacket.getSampleType();
    auto numChannels = inboundPacket.getNumChannels();
    auto frameRate = inboundPacket.getFrameRate();

    int32_t sampleSize = 4;
    switch (sampleType) {
      case 0: // float
      case 1: // int32_t
      case 4: // uint32_t
        sampleSize = 4;
        break;

      case 2: // int16_t
      case 5: // uint16_t
        sampleSize = 2;
        break;

      case 3: // int8_t
      case 6: // uint8_t
        sampleSize = 1;
        break;
    }

    for (auto* recipient : recipients_) {
      auto outboundPacket =
          recipient->sendSignalPacket(sampleSize, frameCount, sampleType, numChannels, frameRate);
      outboundPacket.copyChannelDataFrom(inboundPacket);
    }
  }

 private:
  std::vector<OutboundSignalData*> recipients_;
};

} // namespace Xrpa
