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

#include "AudioOutputDevice.h"

#include <xrpa-runtime/external_utils/UuidGen.h>

#include <portaudio.h>
#include <iostream>

AudioSystemHandle::AudioSystemHandle() {
  auto err = Pa_Initialize();
  initalized_ = (err == paNoError);
}

AudioSystemHandle::~AudioSystemHandle() {
  if (initalized_) {
    Pa_Terminate();
  }
}

std::vector<std::shared_ptr<AudioOutputDevice>> AudioOutputDevice::createAudioDevices(
    const AudioSystemHandle& audioSystem) {
  std::vector<std::shared_ptr<AudioOutputDevice>> deviceList;
  if (!audioSystem.isInitialized()) {
    return deviceList;
  }

  int primaryDeviceIdx = Pa_GetDefaultOutputDevice();
  int numDevices = Pa_GetDeviceCount();
  for (int i = 0; i < numDevices; i++) {
    auto paDeviceInfo = Pa_GetDeviceInfo(i);

    if (paDeviceInfo->maxOutputChannels == 0 || strlen(paDeviceInfo->name) == 0) {
      continue;
    }

    deviceList.emplace_back(std::make_shared<AudioOutputDevice>(i, i == primaryDeviceIdx));
  }

  return deviceList;
}

AudioOutputDevice::AudioOutputDevice(int deviceIdx, bool isSystemDefault) : deviceIdx_(deviceIdx) {
  auto paDeviceInfo = Pa_GetDeviceInfo(deviceIdx);
  int numChannels = paDeviceInfo->maxOutputChannels;
  int frameRate = paDeviceInfo->defaultSampleRate;

  setName(paDeviceInfo->name);
  setDeviceType(SignalOutputDataStore::SignalOutputDeviceType::Audio);
  setNumChannels(numChannels);
  setFrameRate(frameRate);
  setIsSystemAudioOutput(isSystemDefault);
}

AudioOutputDevice::~AudioOutputDevice() {
  if (stream_ != nullptr) {
    auto err = Pa_AbortStream(stream_);
    if (err == paNoError) {
      err = Pa_CloseStream(stream_);
      if (err != paNoError) {
        std::cout << "PortAudio failed to close stream with error " << err << std::endl;
      }
    } else {
      std::cout << "PortAudio failed to abort stream with error " << err << std::endl;
    }
  }
  stream_ = nullptr;
}

static int audioFillCallback(
    const void* inputBuffer,
    void* outputBuffer,
    unsigned long framesPerBuffer,
    const PaStreamCallbackTimeInfo* timeInfo,
    PaStreamCallbackFlags statusFlags,
    void* userData) {
  auto outputDevice = static_cast<AudioOutputDevice*>(userData);
  outputDevice->readInterleavedData(static_cast<float*>(outputBuffer), framesPerBuffer);
  return 0;
}

// open stream if not already open
void AudioOutputDevice::tick() {
  int framesAvailable = getReadFramesAvailable();
  if (!framesAvailable || stream_ != nullptr) {
    return;
  }

  auto paDeviceInfo = Pa_GetDeviceInfo(deviceIdx_);

  PaStreamParameters streamParameters;
  streamParameters.channelCount = getNumChannels();
  streamParameters.device = deviceIdx_;
  streamParameters.hostApiSpecificStreamInfo = nullptr;
  streamParameters.sampleFormat = paFloat32;
  streamParameters.suggestedLatency = paDeviceInfo->defaultLowOutputLatency;

  auto err = Pa_OpenStream(
      &stream_,
      nullptr,
      &streamParameters,
      getFrameRate(),
      getFrameRate() / 100,
      paNoFlag,
      audioFillCallback,
      this);

  if (err == paNoError) {
    std::cout << "PortAudio opened stream for " << getName() << ": "
              << streamParameters.channelCount << " channels, " << getFrameRate() << " frame rate"
              << std::endl;
    err = Pa_StartStream(stream_);
    if (err != paNoError) {
      std::cout << "PortAudio failed to start stream with error " << err << std::endl;
      Pa_CloseStream(stream_);
      stream_ = nullptr;
    }
  } else {
    std::cout << "PortAudio failed to open stream with error " << err << std::endl;
    stream_ = nullptr;
  }
}
