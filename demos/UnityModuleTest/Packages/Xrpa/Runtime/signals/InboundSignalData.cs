/*
// @generated
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


using System;
using System.Collections.Generic;

namespace Xrpa
{
    public interface InboundSignalDataInterface
    {
        void OnSignalData(ulong timestamp, MemoryAccessor memAccessor);
    }

    public class InboundSignalData<SampleType> : InboundSignalDataInterface, System.IDisposable where SampleType : unmanaged
    {
        private readonly SignalRingBuffer<SampleType> _ringBuffer = new();
        private AllocatedMemory _tempBufferMem;
        private MemoryArray<SampleType> _tempData;
        private readonly int _sampleType;
        private readonly int _framesPerSecond;
        private readonly int _numChannels;

        public InboundSignalData(int numChannels, int framesPerSecond, float warmupTimeInSeconds = 0f)
        {
            int sampleSize = MemoryUtils.GetTypeSize<SampleType>();
            _sampleType = SignalTypeInference.InferSampleType<SampleType>();
            _framesPerSecond = framesPerSecond;
            _numChannels = numChannels;

            int warmupFrames = (int)(warmupTimeInSeconds * framesPerSecond);
            int maxFramesInBuffer = Math.Max(warmupFrames * 2, framesPerSecond);
            _ringBuffer.Initialize(maxFramesInBuffer, warmupFrames, numChannels);
            _tempBufferMem = new AllocatedMemory(maxFramesInBuffer * sampleSize);
            _tempData = _tempBufferMem.Accessor.GetArray<SampleType>();
        }

        public void Dispose()
        {
            _tempBufferMem.Dispose();
            _ringBuffer.Dispose();
        }

        public void OnSignalData(ulong timestamp, MemoryAccessor memAccessor)
        {
            var packet = new SignalPacket(memAccessor);
            var sampleType = packet.GetSampleType();
            var framesPerSecond = packet.GetFrameRate();
            var channelDataIn = packet.AccessChannelData<SampleType>();

            if (sampleType != _sampleType || framesPerSecond != _framesPerSecond)
            {
                // TODO T180973550 convert the data
                return;
            }

            // make sure not to overflow the ring buffer (discard extra samples)
            var frameCount = Math.Min(_ringBuffer.GetWriteFramesAvailable(), packet.GetFrameCount());

            // read and interleave the data into a temp buffer
            for (int i = 0; i < _numChannels; i++)
            {
                channelDataIn.ReadChannelData(i, _tempData, i, frameCount, _numChannels);
            }

            // write the interleaved data into the ring buffer
            _ringBuffer.WriteInterleavedData(_tempData, frameCount);
        }

        public int GetReadFramesAvailable()
        {
            return _ringBuffer.GetReadFramesAvailable();
        }

        public bool ReadInterleavedData(SampleType[] outputBuffer, int framesNeeded)
        {
            int totalSamples = _numChannels * framesNeeded;
            bool filled = _ringBuffer.ReadInterleavedData(_tempData, framesNeeded);
            for (int i = 0; i < totalSamples; i++)
            {
                outputBuffer[i] = _tempData[i];
            }
            return filled;
        }

        public bool ReadDeinterleavedData(SampleType[] outputBuffer, int framesNeeded, int outputStride)
        {
            bool filled = _ringBuffer.ReadDeinterleavedData(_tempData, framesNeeded, outputStride);
            for (int frameIdx = 0; frameIdx < framesNeeded; frameIdx++)
            {
                for (int channelIdx = 0; channelIdx < _numChannels; channelIdx++)
                {
                    outputBuffer[channelIdx * outputStride + frameIdx] = _tempData[channelIdx * outputStride + frameIdx];
                }
            }
            return filled;
        }
    }
}
