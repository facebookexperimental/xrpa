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

#include <NatNetCAPI.h>
#include <NatNetClient.h>
#include <NatNetTypes.h>
#include <xrpa-runtime/utils/SimpleReconciler.h>
#include <functional>
#include <iostream>
#include <string>

#include "TrackedRigidBody.h"

class OptiTrackConnection {
 public:
  using TrackedRigidBodyReconciler = Xrpa::SimpleReconciler<std::string, TrackedRigidBody>;

  explicit OptiTrackConnection(TrackedRigidBodyReconciler* reconciler) : reconciler_(reconciler) {
    std::cout << "Looking for Motive server..." << std::endl;
    natNetClient_ = std::make_unique<NatNetClient>();
    natNetClient_->SetFrameReceivedCallback(frameReceivedCallback, this);
    NatNet_CreateAsyncServerDiscovery(&discovery_, serverDiscoveredCallback, this);
  }

  ~OptiTrackConnection() {
    NatNet_FreeAsyncServerDiscovery(discovery_);
    natNetClient_->Disconnect();
  }

 private:
  TrackedRigidBodyReconciler* reconciler_;
  NatNetDiscoveryHandle discovery_;
  std::unique_ptr<NatNetClient> natNetClient_;
  sNatNetClientConnectParams connectParams_;
  bool bReceivingData_ = false;
  std::unordered_map<int, std::string> rigidBodyNames_;

  static void frameReceivedCallback(sFrameOfMocapData* data, void* userContext) {
    reinterpret_cast<OptiTrackConnection*>(userContext)->onFrameReceived(data);
  }

  static void serverDiscoveredCallback(
      const sNatNetDiscoveredServer* discoveredServer,
      void* userContext) {
    reinterpret_cast<OptiTrackConnection*>(userContext)->onServerDiscovered(discoveredServer);
  }

  void onServerDiscovered(const sNatNetDiscoveredServer* discoveredServer) {
    if (discoveredServer->serverDescription.bConnectionInfoValid) {
      connectParams_.connectionType = discoveredServer->serverDescription.ConnectionMulticast
          ? ConnectionType_Multicast
          : ConnectionType_Unicast;
      connectParams_.serverCommandPort = discoveredServer->serverCommandPort;
      connectParams_.serverDataPort = discoveredServer->serverDescription.ConnectionDataPort;
      connectParams_.serverAddress = discoveredServer->serverAddress;
      connectParams_.localAddress = discoveredServer->localAddress;
      connectParams_.multicastAddress = NATNET_DEFAULT_MULTICAST_ADDRESS;
    } else {
      // We're missing some info because it's a legacy server.
      // Guess the defaults and make a best effort attempt to connect.
      connectParams_.connectionType = ConnectionType_Multicast;
      connectParams_.serverCommandPort = discoveredServer->serverCommandPort;
      connectParams_.serverDataPort = 0;
      connectParams_.serverAddress = discoveredServer->serverAddress;
      connectParams_.localAddress = discoveredServer->localAddress;
      connectParams_.multicastAddress = NULL;
    }

    // TODO this is pretty dumb, just connects to any server it finds
    connectToServer();
  }

  void connectToServer() {
    natNetClient_->Disconnect();

    std::cout << "Connecting to server " << connectParams_.serverAddress << std::endl;
    bReceivingData_ = false;
    int retCode = natNetClient_->Connect(connectParams_);
    if (retCode != ErrorCode_OK) {
      std::cout << "Failed to connect to server" << std::endl;
      return;
    }

    sDataDescriptions* pDataDefs = NULL;
    retCode = natNetClient_->GetDataDescriptionList(&pDataDefs);
    if (retCode != ErrorCode_OK || pDataDefs == NULL) {
      std::cout << "Unable to retrieve Data Descriptions" << std::endl;
    } else {
      std::cout << "Connected" << std::endl;
      rigidBodyNames_.clear();
      for (int i = 0; i < pDataDefs->nDataDescriptions; i++) {
        if (pDataDefs->arrDataDescriptions[i].type == Descriptor_RigidBody) {
          auto pRB = pDataDefs->arrDataDescriptions[i].Data.RigidBodyDescription;
          std::cout << "Found RigidBody: " << pRB->szName << std::endl;
          rigidBodyNames_.emplace(pRB->ID, std::string(pRB->szName));
        }
      }
    }
  }

  void onFrameReceived(const sFrameOfMocapData* data) {
    if (!bReceivingData_) {
      bReceivingData_ = true;
      std::cout << "Receiving data" << std::endl;
    }

    reconciler_->reconcile([&](auto& accessor) {
      for (int i = 0; i < data->nRigidBodies; i++) {
        auto& trackedBody = data->RigidBodies[i];

        auto nameIter = rigidBodyNames_.find(trackedBody.ID);
        if (nameIter == rigidBodyNames_.end()) {
          continue;
        }
        auto& name = nameIter->second;

        auto rigidBodyPtr = accessor.get(name);
        if (rigidBodyPtr == nullptr) {
          accessor.create(name, TrackedRigidBody(name));
          rigidBodyPtr = accessor.get(name);
        }
        rigidBodyPtr->update(trackedBody);
      }
    });
  }
};
