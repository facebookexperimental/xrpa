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

#include <lib/XredOutputModule.h>
#include <xrpa-runtime/utils/StringUtils.h>

#include <iostream>
#include <memory>

class SignalOutputDevice;

class XredSignalOutputSource : public SignalOutputDataStore::ReconciledSignalOutputSource {
 public:
  XredSignalOutputSource(
      const Xrpa::ObjectUuid& id,
      Xrpa::IObjectCollection* collection,
      SignalOutputDataStore::SignalOutputSourceReader source,
      const std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore>& dataStore)
      : SignalOutputDataStore::ReconciledSignalOutputSource(id, collection), datastore_(dataStore) {
    std::cout << "XredSignalOutputSource created" << std::endl;
  }

  static void registerDelegate(
      std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore>& signalOutputDataStore) {
    signalOutputDataStore->SignalOutputSource->setCreateDelegate(
        [&](const Xrpa::ObjectUuid& id,
            const SignalOutputDataStore::SignalOutputSourceReader& source,
            Xrpa::IObjectCollection* collection) {
          return std::make_shared<XredSignalOutputSource>(
              id, collection, source, signalOutputDataStore);
        });
  }

  virtual ~XredSignalOutputSource() override {
    onSignal(nullptr);
  }

  virtual void handleXrpaFieldsChanged(uint64_t fieldsChanged) override final;

 private:
  std::shared_ptr<SignalOutputDataStore::SignalOutputDataStore> datastore_;

  std::shared_ptr<Xrpa::InboundSignalData<float>> signal_;
  std::weak_ptr<SignalOutputDevice> outputDevice_;
  std::shared_ptr<class TcpStreamOutputDevice> tcpStreamOutputDevice_;
  Xrpa::SimpleStringFilter deviceNameFilter_;
};
