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

#pragma once

#include <stdint.h>
#include <memory>
#include <vector>

#include "GenericUart.h"
#include "XredProtocol.h"

class XredDeviceComms {
 public:
  explicit XredDeviceComms(const std::shared_ptr<GenericUart>& uart) : uart_(uart) {
    memset(&outboundPacket_, 0, sizeof(outboundPacket_));
    memset(&inboundParseState_, 0, sizeof(inboundParseState_));
  }

  std::string getID() {
    return uart_->getID();
  }

  xr_protocol_packet_t* requestDeviceInfo(uint16_t msgId);

  xr_protocol_packet_t* readPacket();

  void beginPacket(uint16_t msgId, uint16_t flags = 0, uint8_t type = 0) {
    outboundPacket_.data_id = msgId;
    outboundPacket_.flags = flags;
    outboundPacket_.type = type;
    outboundPacket_.data_len = 0;
  }

  template <typename T>
  void writeValue(const T& value) {
    if constexpr (std::is_same<T, uint8_t>::value) {
      outboundPacket_.data[outboundPacket_.data_len] = value;
      outboundPacket_.data_len++;
    } else {
      memcpy(&outboundPacket_.data[outboundPacket_.data_len], &value, sizeof(T));
      outboundPacket_.data_len += sizeof(T);
    }
  }

  void writeValue(const std::vector<uint8_t>& values) {
    memcpy(&outboundPacket_.data[outboundPacket_.data_len], values.data(), values.size());
    outboundPacket_.data_len += values.size();
  }

  bool sendPacket();

 private:
  std::shared_ptr<GenericUart> uart_;

  std::vector<uint8_t> tempSerializeBuffer_;
  std::vector<uint8_t> inboundByteBuffer_;

  xr_protocol_packet_t outboundPacket_;
  xr_protocol_port_t inboundParseState_;
};
