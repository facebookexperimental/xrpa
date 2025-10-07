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

#include "LightControl.h"

#include "SmartControllerDevice.h"
#include "SmartControllerManager.h"

LightControl::~LightControl() {
  if (device_) {
    device_->removeLightControl(this);
  }
}

void LightControl::tick(SmartControllerManager& deviceManager) {
  const auto& ipAddress = getIpAddress();

  if (ipAddress.empty()) {
    if (device_) {
      device_->removeLightControl(this);
      device_.reset();
    }
    if (getIsConnected()) {
      setIsConnected(false);
    }
  } else if (!device_ || device_->getIpAddress() != ipAddress) {
    if (device_) {
      device_->removeLightControl(this);
    }
    device_ = deviceManager.getOrCreateController(ipAddress);
    device_->addLightControl(this);
    std::cout << "LightControl: " << ipAddress << std::endl;
  }

  // update rotation
  auto now = std::chrono::steady_clock::now();
  float deltaTime = std::chrono::duration<float>(now - lastUpdateTime_).count();
  lastUpdateTime_ = now;
  curRotationRadians_ += deltaTime * getRotationSpeed();

  // handle wrap-around
  if (curRotationRadians_ >= 2.0f * M_PI) {
    curRotationRadians_ -= 2.0f * M_PI;
  } else if (curRotationRadians_ < 0.0f) {
    curRotationRadians_ += 2.0f * M_PI;
  }
}

void LightControl::handleXrpaFieldsChanged(uint64_t fieldsChanged) {
  if (checkRotationOffsetChanged(fieldsChanged)) {
    curRotationRadians_ = getRotationOffset();
    lastUpdateTime_ = std::chrono::steady_clock::now();
  }
}

std::vector<SmartControllerDataStore::ColorSRGBA> LightControl::getRotatedLightColors() {
  const auto& lightColors = getLightColors();
  std::vector<SmartControllerDataStore::ColorSRGBA> result;
  result.resize(lightColors.size());

  // Calculate how many positions to rotate based on the angle
  const size_t numLights = lightColors.size();
  const float anglePerLight = 2.0f * M_PI / static_cast<float>(numLights);

  // Convert rotation angle to number of positions (can be fractional)
  float rotationPositions = curRotationRadians_ / anglePerLight;

  // For each LED in the result, calculate which source LED color to use
  for (size_t i = 0; i < numLights; ++i) {
    // Calculate source position with rotation applied
    // We add numLights and use modulo to ensure positive values
    float sourcePos = numLights + static_cast<float>(i) - rotationPositions;

    // Handle fractional positions by interpolating between adjacent LEDs
    size_t sourcePosLower = static_cast<size_t>(std::floor(sourcePos)) % numLights;
    size_t sourcePosUpper = static_cast<size_t>(std::ceil(sourcePos)) % numLights;
    float fraction = sourcePos - std::floor(sourcePos);

    // If positions are the same (no fractional part), just copy the color
    if (sourcePosLower == sourcePosUpper) {
      result[i] = lightColors[sourcePosLower];
    } else {
      // Interpolate between the two adjacent colors
      const auto& colorLower = lightColors[sourcePosLower];
      const auto& colorUpper = lightColors[sourcePosUpper];

      // Linear interpolation for each color component
      result[i].r =
          static_cast<uint8_t>(colorLower.r * (1.0f - fraction) + colorUpper.r * fraction);
      result[i].g =
          static_cast<uint8_t>(colorLower.g * (1.0f - fraction) + colorUpper.g * fraction);
      result[i].b =
          static_cast<uint8_t>(colorLower.b * (1.0f - fraction) + colorUpper.b * fraction);
      result[i].a =
          static_cast<uint8_t>(colorLower.a * (1.0f - fraction) + colorUpper.a * fraction);
    }
  }

  return result;
}
