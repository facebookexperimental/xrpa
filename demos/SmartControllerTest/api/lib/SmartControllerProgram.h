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

#include "SmartControllerDataStore.h"
#include "SmartControllerTypes.h"
#include <functional>
#include <string>
#include <vector>

namespace XrpaDataflowPrograms {

class SmartControllerProgram {
 public:
  explicit SmartControllerProgram(std::shared_ptr<SmartControllerDataStore::SmartControllerDataStore> datastoreSmartController) : datastoreSmartController_(datastoreSmartController) {
    createObjects();
  }

  ~SmartControllerProgram() {
    destroyObjects();
  }

  const std::vector<SmartControllerDataStore::ColorSRGBA>& getBaseLightColors() const {
    return paramBaseLightColors_;
  }

  void setBaseLightColors(const std::vector<SmartControllerDataStore::ColorSRGBA>& baseLightColors) {
    paramBaseLightColors_ = baseLightColors;
    if (objSmartControllerLightControl1_) {
      objSmartControllerLightControl1_->setLightColors(baseLightColors);
    }
  }

  const std::string& getIpAddress() const {
    return paramIpAddress_;
  }

  void setIpAddress(const std::string& ipAddress) {
    paramIpAddress_ = ipAddress;
    if (objSmartControllerKnobControl0_) {
      objSmartControllerKnobControl0_->setIpAddress(ipAddress);
    }
    if (objSmartControllerLightControl1_) {
      objSmartControllerLightControl1_->setIpAddress(ipAddress);
    }
    if (objSmartControllerLightControl2_) {
      objSmartControllerLightControl2_->setIpAddress(ipAddress);
    }
  }

  const std::vector<SmartControllerDataStore::ColorSRGBA>& getOverlayLightColors() const {
    return paramOverlayLightColors_;
  }

  void setOverlayLightColors(const std::vector<SmartControllerDataStore::ColorSRGBA>& overlayLightColors) {
    paramOverlayLightColors_ = overlayLightColors;
    if (objSmartControllerLightControl2_) {
      objSmartControllerLightControl2_->setLightColors(overlayLightColors);
    }
  }

  float getOverlayLightRotationSpeed() const {
    return paramOverlayLightRotationSpeed_;
  }

  void setOverlayLightRotationSpeed(float overlayLightRotationSpeed) {
    paramOverlayLightRotationSpeed_ = overlayLightRotationSpeed;
    if (objSmartControllerLightControl2_) {
      objSmartControllerLightControl2_->setRotationSpeed(overlayLightRotationSpeed);
    }
  }

  void onKnobChanged(std::function<void(uint64_t, int, int, int)> handler) {
    paramKnobChanged_ = handler;
  }

  void terminate() {
    destroyObjects();
  }

 private:
  void dispatchObjSmartControllerKnobControl0_PositionEvent(uint64_t msgTimestamp, SmartControllerDataStore::PositionEventReader msg) {
    auto position = msg.getPosition();
    auto absolutePosition = msg.getAbsolutePosition();
    auto detentPosition = msg.getDetentPosition();
    if (paramKnobChanged_) {
      paramKnobChanged_(msgTimestamp, position, absolutePosition, detentPosition);
    }
  }

  void createObjects() {
    objSmartControllerKnobControl0_ = datastoreSmartController_->KnobControl->createObject();
    objSmartControllerLightControl1_ = datastoreSmartController_->LightControl->createObject();
    objSmartControllerLightControl2_ = datastoreSmartController_->LightControl->createObject();
    objSmartControllerKnobControl0_->setIpAddress(paramIpAddress_);
    objSmartControllerKnobControl0_->setControlMode(static_cast<SmartControllerDataStore::KnobControlMode>(2));
    objSmartControllerKnobControl0_->setPosition(0);
    objSmartControllerKnobControl0_->setDetentCount(20);
    objSmartControllerLightControl1_->setIpAddress(paramIpAddress_);
    objSmartControllerLightControl1_->setLightColors(paramBaseLightColors_);
    objSmartControllerLightControl1_->setRotationOffset(0.f);
    objSmartControllerLightControl1_->setRotationSpeed(0.f);
    objSmartControllerLightControl1_->setPriority(0);
    objSmartControllerLightControl2_->setIpAddress(paramIpAddress_);
    objSmartControllerLightControl2_->setLightColors(paramOverlayLightColors_);
    objSmartControllerLightControl2_->setRotationOffset(0.f);
    objSmartControllerLightControl2_->setRotationSpeed(paramOverlayLightRotationSpeed_);
    objSmartControllerLightControl2_->setPriority(0);
    objSmartControllerKnobControl0_->onPositionEvent([this](auto p0, auto p1) { dispatchObjSmartControllerKnobControl0_PositionEvent(p0, p1); });
  }

  void destroyObjects() {
    if (objSmartControllerLightControl2_) {
      datastoreSmartController_->LightControl->removeObject(objSmartControllerLightControl2_->getXrpaId());
      objSmartControllerLightControl2_ = nullptr;
    }
    if (objSmartControllerLightControl1_) {
      datastoreSmartController_->LightControl->removeObject(objSmartControllerLightControl1_->getXrpaId());
      objSmartControllerLightControl1_ = nullptr;
    }
    if (objSmartControllerKnobControl0_) {
      datastoreSmartController_->KnobControl->removeObject(objSmartControllerKnobControl0_->getXrpaId());
      objSmartControllerKnobControl0_ = nullptr;
    }
  }

  std::shared_ptr<SmartControllerDataStore::SmartControllerDataStore> datastoreSmartController_;
  std::vector<SmartControllerDataStore::ColorSRGBA> paramBaseLightColors_{SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}};
  std::string paramIpAddress_ = "";
  std::vector<SmartControllerDataStore::ColorSRGBA> paramOverlayLightColors_{SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}, SmartControllerDataStore::ColorSRGBA{255, 255, 255, 255}};
  float paramOverlayLightRotationSpeed_ = 0.f;
  std::function<void(uint64_t, int, int, int)> paramKnobChanged_ = nullptr;
  std::shared_ptr<SmartControllerDataStore::OutboundKnobControl> objSmartControllerKnobControl0_;
  std::shared_ptr<SmartControllerDataStore::OutboundLightControl> objSmartControllerLightControl1_;
  std::shared_ptr<SmartControllerDataStore::OutboundLightControl> objSmartControllerLightControl2_;
};

} // namespace XrpaDataflowPrograms
