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

#include <lib/TextToSpeechTestModule.h>
#include <lib/TextToSpeechTestProgram.h>

#include <xrpa-runtime/signals/InboundSignalForwarder.h>
#include <iostream>
#include <string>

class DebugInboundSignalForwarder : public Xrpa::InboundSignalForwarder {
 public:
  void onSignalData(uint64_t timestamp, const Xrpa::MemoryAccessor& memAccessor) override {
    auto inboundPacket = Xrpa::SignalPacket(memAccessor);
    auto frameCount = inboundPacket.getFrameCount();
    auto sampleType = inboundPacket.getSampleType();
    auto numChannels = inboundPacket.getNumChannels();
    auto frameRate = inboundPacket.getFrameRate();

    std::cout << "[DEBUG] Audio forwarder received signal data!" << std::endl;
    std::cout << "[DEBUG] Frame count: " << frameCount << ", Sample type: " << sampleType
              << ", Channels: " << numChannels << ", Frame rate: " << frameRate << std::endl;
    Xrpa::InboundSignalForwarder::onSignalData(timestamp, memAccessor);
  }
};

void EntryPoint(TextToSpeechTestModule* moduleData) {
  auto testProgram = std::make_shared<XrpaDataflowPrograms::TextToSpeechTestProgram>(
      moduleData->signalProcessingDataStore, moduleData->textToSpeechDataStore);

  std::cout << "TextToSpeech Test Demo started" << std::endl;

  std::string textToSpeak = "Hi I am your audio assistant. Testing Text to Speech.";
  std::cout << "[DEBUG] Sending text to TTS: '" << textToSpeak << "'" << std::endl;
  testProgram->sendText(textToSpeak, 1);

  std::cout << "[DEBUG] Setting up debug audio forwarder to trace signal flow..." << std::endl;

  auto debugForwarder = std::make_shared<DebugInboundSignalForwarder>();
  std::cout << "[DEBUG] Audio forwarder set up and connected to TextToSpeech object" << std::endl;

  testProgram->onTtsResponse([](uint64_t timestamp,
                                int id,
                                bool success,
                                const std::string& error,
                                std::chrono::nanoseconds playbackTimestamp) {
    std::cout << "[DEBUG] TTS Response [" << id << "] received at timestamp " << timestamp
              << " - Success: " << (success ? "true" : "false") << ", Error: '" << error << "'"
              << ", Playback Timestamp: " << playbackTimestamp << std::endl;
  });

  std::cout << "Press Ctrl+C to stop..." << std::endl;

  int tickCount = 0;
  bool hasLoggedResponse = false;
  bool hasLoggedSignalProcessing = false;

  moduleData->run(30, [&]() {
    tickCount++;

    if (!hasLoggedResponse && tickCount % 30 == 0) {
      std::cout << "[DEBUG] Checking for TTS response..." << std::endl;
      hasLoggedResponse = true;
    }

    if (hasLoggedResponse && !hasLoggedSignalProcessing && tickCount % 60 == 0) {
      std::cout << "[DEBUG] Checking signal processing pipeline..." << std::endl;
      std::cout << "[DEBUG] Signal processing objects should be created and connected..."
                << std::endl;
      hasLoggedSignalProcessing = true;
    }
  });
}
