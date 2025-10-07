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

#include "SmartControllerDevice.h"

#include <algorithm>
#include <chrono>

#include <TcpSocketUart.h>
#include <xrpa-runtime/utils/TimeUtils.h>

static const uint16_t LED_COUNT = 24;

constexpr bool DEBUG = false;

static void xr_protocol_send_smart_knob_config(
    std::unique_ptr<XredDeviceComms>& deviceComms,
    uint8_t axis_id,
    SmartControllerDataStore::KnobControlMode mode,
    uint16_t detent_cnt,
    uint16_t digital_out = 0,
    uint16_t analog_out = 100,
    uint16_t pid_kp = 300,
    uint16_t pid_ki = 0,
    uint16_t pid_kd = 10) {
  deviceComms->beginPacket(XR_DATA_ID_SMART_KNOB_CONFIG);

  // fill in the axis data
  deviceComms->writeValue(axis_id);
  deviceComms->writeValue(static_cast<uint8_t>(mode));
  deviceComms->writeValue(detent_cnt);
  deviceComms->writeValue(pid_kp);
  deviceComms->writeValue(pid_ki);
  deviceComms->writeValue(pid_kd);
  deviceComms->writeValue(digital_out);
  deviceComms->writeValue(analog_out);

  deviceComms->sendPacket();

  if (DEBUG) {
    std::cout << "sent knob config: mode(" << static_cast<uint32_t>(mode) << "), detent_cnt("
              << detent_cnt << ")" << std::endl;
  }
}

static void xr_protocol_send_position_control(
    std::unique_ptr<XredDeviceComms>& deviceComms,
    int32_t position) {
  deviceComms->beginPacket(XR_DATA_ID_SMART_KNOB_POSITION_MOVE);

  uint8_t axes_cnt = 1;
  uint8_t samples_per_axis = 1;
  uint16_t move_period_ms = 0;

  // fill in the axis data
  deviceComms->writeValue(axes_cnt);
  deviceComms->writeValue(samples_per_axis);
  deviceComms->writeValue(move_period_ms);
  deviceComms->writeValue(position);

  deviceComms->sendPacket();

  if (DEBUG) {
    std::cout << "sent position control: position(" << position << ")" << std::endl;
  }
}

static void xr_protocol_send_led_rgbw_control(
    std::unique_ptr<XredDeviceComms>& deviceComms,
    const std::vector<uint8_t>& ledColorsRgbw) {
  deviceComms->beginPacket(XR_DATA_ID_LED_RING_SET_RGBW);

  uint16_t led_group_id = 0;

  // fill in the LED color data
  deviceComms->writeValue(led_group_id);
  deviceComms->writeValue(LED_COUNT);
  deviceComms->writeValue(ledColorsRgbw);

  deviceComms->sendPacket();

  if (DEBUG) {
    std::cout << "sent led rgbw control" << std::endl;
  }
}

SmartControllerDevice::SmartControllerDevice(const std::string& ipAddress)
    : ipAddress_(ipAddress), nextConnectRetry_(std::chrono::steady_clock::now()) {
  ledColors_.resize(LED_COUNT * 4);
  std::fill(ledColors_.begin(), ledColors_.end(), 0);
}

SmartControllerDevice::~SmartControllerDevice() {
  if (deviceComms_) {
    // turn off the knob
    xr_protocol_send_smart_knob_config(
        deviceComms_, 0, SmartControllerDataStore::KnobControlMode::Disabled, 0);

    // turn off the LEDs
    std::fill(ledColors_.begin(), ledColors_.end(), 0);
    xr_protocol_send_led_rgbw_control(deviceComms_, ledColors_);

    // let the TCP link drain
    Xrpa::sleepFor(std::chrono::milliseconds(100));
  }
}

void SmartControllerDevice::tick() {
  // if not connected, try to connect
  auto now = std::chrono::steady_clock::now();
  if (!deviceComms_ && now >= nextConnectRetry_) {
    auto uart = TcpSocketUart::create(ipAddress_, 1717);
    if (uart) {
      deviceComms_ = std::make_unique<XredDeviceComms>(uart);

      // reset the knob control mode
      knobOutControlMode_ = SmartControllerDataStore::KnobControlMode::Disabled;
      xr_protocol_send_smart_knob_config(deviceComms_, 0, knobOutControlMode_, knobOutDetentCount_);

      // notify the controls that they are connected
      for (auto* control : knobControls_) {
        control->setIsConnected(true);
      }
      for (auto* control : lightControls_) {
        control->setIsConnected(true);
      }

      // ignore events for 500ms to allow the device to flush the uart buffer
      ignoreInputUntil_ = now + std::chrono::milliseconds(500);
    } else {
      // try again in 5 seconds
      nextConnectRetry_ = now + std::chrono::seconds(5);
    }
  }

  if (deviceComms_) {
    sendKnobOutputData();
    sendLightOutputData();
    recvInputData();
  }
}

void SmartControllerDevice::sendKnobOutputData() {
  auto knob = knobControls_.size() > 0 ? knobControls_[0] : nullptr;
  if (knob) {
    auto knobControlMode = knob->getControlMode();
    auto knobDetentCount = knob->getDetentCount();
    auto knobPosition = knob->getPosition();

    // send the knob control data
    if (knobOutControlMode_ != knobControlMode || knobOutDetentCount_ != knobDetentCount) {
      knobOutControlMode_ = knobControlMode;
      knobOutDetentCount_ = knobDetentCount;
      xr_protocol_send_smart_knob_config(deviceComms_, 0, knobOutControlMode_, knobOutDetentCount_);
    }

    if (knobOutControlMode_ == SmartControllerDataStore::KnobControlMode::Position &&
        knobOutPosition_ != knobPosition) {
      knobOutPosition_ = knobPosition;
      xr_protocol_send_position_control(deviceComms_, knobOutPosition_);
    }
  } else if (knobOutControlMode_ != SmartControllerDataStore::KnobControlMode::Disabled) {
    knobOutControlMode_ = SmartControllerDataStore::KnobControlMode::Disabled;
    xr_protocol_send_smart_knob_config(deviceComms_, 0, knobOutControlMode_, 0);
  }
}

void SmartControllerDevice::sendLightOutputData() {
  std::vector<uint8_t> newLedColors;
  newLedColors.resize(LED_COUNT * 4);
  std::fill(newLedColors.begin(), newLedColors.end(), 0);

  // sort the light controls by priority, ascending (high priority means it is blended last)
  std::sort(lightControls_.begin(), lightControls_.end(), [](auto& a, auto& b) {
    return a->getPriority() < b->getPriority();
  });

  // alpha blend the light ring control colors
  for (auto* control : lightControls_) {
    const auto controlLightColors = control->getRotatedLightColors();
    for (int i = 0; i < LED_COUNT; ++i) {
      const auto& newColor = controlLightColors[i];
      auto* ledColor = &newLedColors[i * 4];
      float alpha = newColor.a / 255.0f;
      float invAlpha = 1.0f - alpha;
      ledColor[0] = static_cast<uint8_t>(ledColor[0] * invAlpha + newColor.r * alpha);
      ledColor[1] = static_cast<uint8_t>(ledColor[1] * invAlpha + newColor.g * alpha);
      ledColor[2] = static_cast<uint8_t>(ledColor[2] * invAlpha + newColor.b * alpha);
    }
  }

  // convert in place from rgb to rgbw
  for (int i = 0; i < LED_COUNT; ++i) {
    auto* ledColor = &newLedColors[i * 4];
    uint8_t w = std::min(std::min(ledColor[0], ledColor[1]), ledColor[2]);
    ledColor[0] -= w;
    ledColor[1] -= w;
    ledColor[2] -= w;
    ledColor[3] = w;
  }

  // compare the new led colors to the old led colors and send to device if changed
  if (memcmp(newLedColors.data(), ledColors_.data(), newLedColors.size()) != 0) {
    memcpy(ledColors_.data(), newLedColors.data(), newLedColors.size());
    xr_protocol_send_led_rgbw_control(deviceComms_, ledColors_);
  }
}

void SmartControllerDevice::recvInputData() {
  xr_protocol_packet_t* rx_pkt;
  while ((rx_pkt = deviceComms_->readPacket())) {
    if (rx_pkt->data_id != XR_DATA_ID_SMART_KNOB_STATUS) {
      continue;
    }

    // read the control mode
    auto controlMode = static_cast<SmartControllerDataStore::KnobControlMode>(rx_pkt->data[0]);

    // check if the position has changed
    bool sendEvent = false;

    auto absolutePosition = *(int32_t*)&rx_pkt->data[6];
    if (absolutePosition != knobInAbsolutePosition_) {
      knobInAbsolutePosition_ = absolutePosition;
      sendEvent = sendEvent || controlMode == SmartControllerDataStore::KnobControlMode::Disabled;
    }
    auto position = *(int16_t*)&rx_pkt->data[10];
    if (position != knobInPosition_) {
      knobInPosition_ = position;
      sendEvent = sendEvent || controlMode == SmartControllerDataStore::KnobControlMode::Disabled;
    }
    auto detentPosition = *(int16_t*)&rx_pkt->data[12];
    if (detentPosition != knobInDetentPosition_) {
      knobInDetentPosition_ = detentPosition;
      sendEvent = sendEvent || controlMode == SmartControllerDataStore::KnobControlMode::Detent;
    }

    if (ignoreInputUntil_ > std::chrono::steady_clock::now()) {
      continue;
    }

    if (sendEvent) {
      for (auto* control : knobControls_) {
        control->sendPositionEvent(knobInPosition_, knobInAbsolutePosition_, knobInDetentPosition_);
      }
      if (DEBUG) {
        std::cout << "fired position event: position(" << knobInPosition_ << "), absolute_position("
                  << knobInAbsolutePosition_ << "), detent_position(" << knobInDetentPosition_
                  << ")" << std::endl;
      }
    }

    // check if the inputs have changed
    auto inputsState = *(uint16_t*)&rx_pkt->data[2];
    for (int i = 0; i < 16; ++i) {
      uint16_t bitMask = 1 << i;
      uint16_t oldState = inputsState_ & bitMask;
      uint16_t newState = inputsState & bitMask;
      if (newState != oldState) {
        auto type = newState ? SmartControllerDataStore::InputEventType::Press
                             : SmartControllerDataStore::InputEventType::Release;
        for (auto* control : knobControls_) {
          control->sendInputEvent(type, i);
          if (DEBUG) {
            std::cout << "fired input event: key(" << i << ") " << (newState ? "press" : "release")
                      << std::endl;
          }
        }
      }
    }

    inputsState_ = inputsState;
  }
}
