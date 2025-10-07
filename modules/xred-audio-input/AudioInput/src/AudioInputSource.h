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

#include <lib/AudioInputModule.h>
#include <xrpa-runtime/utils/StringUtils.h>

#include <iostream>
#include <memory>

class SignalInputDevice;
class SignalInputDeviceStream;

class AudioInputSource : public AudioInputDataStore::ReconciledAudioInputSource {
 public:
  AudioInputSource(
      const Xrpa::ObjectUuid& id,
      Xrpa::IObjectCollection* collection,
      AudioInputDataStore::AudioInputSourceReader source,
      const std::shared_ptr<AudioInputDataStore::AudioInputDataStore>& dataStore)
      : AudioInputDataStore::ReconciledAudioInputSource(id, collection), datastore_(dataStore) {
    std::cout << "AudioInputSource created" << std::endl;
  }

  static void registerDelegate(
      std::shared_ptr<AudioInputDataStore::AudioInputDataStore>& dataStore) {
    dataStore->AudioInputSource->setCreateDelegate(
        [&](const Xrpa::ObjectUuid& id,
            const AudioInputDataStore::AudioInputSourceReader& source,
            Xrpa::IObjectCollection* collection) {
          return std::make_shared<AudioInputSource>(id, collection, source, dataStore);
        });
  }

  ~AudioInputSource() override = default;

  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) override final;

  void tick();

 private:
  std::shared_ptr<AudioInputDataStore::AudioInputDataStore> datastore_;

  std::weak_ptr<SignalInputDevice> inputDevice_;
  std::shared_ptr<class TcpStreamInputDevice> tcpStreamInputDevice_;
  std::shared_ptr<SignalInputDeviceStream> stream_;
  Xrpa::SimpleStringFilter deviceNameFilter_;
};
