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

#include "XredDeviceComms.h"

#include <chrono>
#include <iostream>

bool XredDeviceComms::sendPacket() {
  tempSerializeBuffer_.resize(512);
  uint32_t tx_buf_len = xr_protocol_serialize_packet(&outboundPacket_, tempSerializeBuffer_.data());
  tempSerializeBuffer_.resize(tx_buf_len);
  if (!uart_->write(tempSerializeBuffer_)) {
    static bool first = true;
    if (first) {
      std::cerr << "Failed to write to device" << std::endl;
      first = false;
    }
    return false;
  }
  return true;
}

xr_protocol_packet_t* XredDeviceComms::readPacket() {
  // read any bytes that are available from the device
  while (uart_->read(tempSerializeBuffer_)) {
    // concat tempSerializeBuffer_ bytes onto the end of inboundByteBuffer_
    inboundByteBuffer_.insert(
        inboundByteBuffer_.end(), tempSerializeBuffer_.begin(), tempSerializeBuffer_.end());
  }

  // parse the bytes using xr_protocol
  bool foundPacket = false;
  int i = 0;
  for (i = 0; i < inboundByteBuffer_.size(); i++) {
    if (xr_protocol_sm(&inboundParseState_, inboundByteBuffer_[i])) {
      // found a complete packet, stop here and let the caller handle it
      foundPacket = true;
      break;
    }
  }

  // shift off the bytes already read from inboundByteBuffer_
  inboundByteBuffer_.erase(inboundByteBuffer_.begin(), inboundByteBuffer_.begin() + i);

  if (foundPacket) {
    return &inboundParseState_.rx_pkt;
  }
  return nullptr;
}

xr_protocol_packet_t* XredDeviceComms::requestDeviceInfo(uint16_t msgId) {
  outboundPacket_.data_id = XR_DATA_ID_REQUEST;
  outboundPacket_.flags = 0;
  outboundPacket_.type = 0;
  outboundPacket_.data_len = 2;
  outboundPacket_.data[0] = (msgId >> 8) & 0xff;
  outboundPacket_.data[1] = msgId & 0xff;

  if (!sendPacket()) {
    return nullptr;
  }

  // wait for a response, up to 1 second
  auto start = std::chrono::steady_clock::now();
  while (std::chrono::steady_clock::now() - start < std::chrono::seconds(1)) {
    auto pkt = readPacket();
    if (pkt && pkt->data_id == msgId) {
      return pkt;
    }
  }
  return nullptr;
}
