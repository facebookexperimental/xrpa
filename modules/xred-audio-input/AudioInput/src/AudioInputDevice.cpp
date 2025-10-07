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

#include "AudioInputDevice.h"

#include <xrpa-runtime/external_utils/UuidGen.h>

#include <portaudio.h>
#include <iostream>

class AudioInputDeviceStream : public SignalInputDeviceStream {
 public:
  AudioInputDeviceStream(int deviceIdx, const std::string& name, int numChannels, int frameRate);
  ~AudioInputDeviceStream() override;

 private:
  void* stream_ = nullptr;
};

AudioSystemHandle::AudioSystemHandle() {
  auto err = Pa_Initialize();
  initalized_ = (err == paNoError);
}

AudioSystemHandle::~AudioSystemHandle() {
  if (initalized_) {
    Pa_Terminate();
  }
}

std::vector<std::shared_ptr<AudioInputDevice>> AudioInputDevice::createAudioDevices(
    const AudioSystemHandle& audioSystem) {
  std::vector<std::shared_ptr<AudioInputDevice>> deviceList;
  if (!audioSystem.isInitialized()) {
    return deviceList;
  }

  int primaryDeviceIdx = Pa_GetDefaultInputDevice();
  int numDevices = Pa_GetDeviceCount();
  for (int i = 0; i < numDevices; i++) {
    auto paDeviceInfo = Pa_GetDeviceInfo(i);

    if (paDeviceInfo->maxInputChannels == 0 || strlen(paDeviceInfo->name) == 0) {
      continue;
    }

    deviceList.emplace_back(std::make_shared<AudioInputDevice>(i, i == primaryDeviceIdx));
  }

  return deviceList;
}

std::shared_ptr<SignalInputDeviceStream> AudioInputDevice::openStream(
    int numChannels,
    int frameRate) {
  return std::make_shared<AudioInputDeviceStream>(
      deviceIdx_, getDeviceName(), numChannels, frameRate);
}

AudioInputDevice::AudioInputDevice(int deviceIdx, bool isSystemDefault)
    : SignalInputDevice(Xrpa::generateUuid()), deviceIdx_(deviceIdx) {
  auto paDeviceInfo = Pa_GetDeviceInfo(deviceIdx);
  int numChannels = paDeviceInfo->maxInputChannels;
  int frameRate = paDeviceInfo->defaultSampleRate;

  setDeviceName(paDeviceInfo->name);
  setNumChannels(numChannels);
  setFrameRate(frameRate);
  setIsSystemAudioInput(isSystemDefault);
}

static int audioRecvCallback(
    const void* inputBuffer,
    void* outputBuffer,
    unsigned long framesPerBuffer,
    const PaStreamCallbackTimeInfo* timeInfo,
    PaStreamCallbackFlags statusFlags,
    void* userData) {
  auto audioStream = static_cast<AudioInputDeviceStream*>(userData);
  audioStream->writeInterleavedData(static_cast<const float*>(inputBuffer), framesPerBuffer);
  return 0;
}

AudioInputDeviceStream::AudioInputDeviceStream(
    int deviceIdx,
    const std::string& name,
    int numChannels,
    int frameRate)
    : SignalInputDeviceStream(numChannels, frameRate) {
  auto paDeviceInfo = Pa_GetDeviceInfo(deviceIdx);

  PaStreamParameters streamParameters;
  streamParameters.channelCount = numChannels;
  streamParameters.device = deviceIdx;
  streamParameters.hostApiSpecificStreamInfo = nullptr;
  streamParameters.sampleFormat = paFloat32;
  streamParameters.suggestedLatency = paDeviceInfo->defaultLowOutputLatency;

  auto err = Pa_OpenStream(
      &stream_,
      &streamParameters,
      nullptr,
      frameRate,
      frameRate / 100,
      paNoFlag,
      audioRecvCallback,
      this);

  if (err == paNoError) {
    std::cout << "PortAudio opened stream for " << name << ": " << streamParameters.channelCount
              << " channels, " << frameRate << " frame rate" << std::endl;
    err = Pa_StartStream(stream_);
    if (err != paNoError) {
      errorMessage_ = "PortAudio failed to start stream with error " + std::to_string(err);
      std::cout << errorMessage_ << std::endl;
      Pa_CloseStream(stream_);
      stream_ = nullptr;
    }
  } else {
    errorMessage_ = "PortAudio failed to open stream with error " + std::to_string(err);
    std::cout << errorMessage_ << std::endl;
    stream_ = nullptr;
  }
}

AudioInputDeviceStream::~AudioInputDeviceStream() {
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
