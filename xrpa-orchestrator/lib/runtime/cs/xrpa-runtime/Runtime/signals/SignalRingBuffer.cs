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

using System;
using System.Collections.Generic;
using System.Threading;

namespace Xrpa
{
    public class SignalRingBuffer<SampleType> : System.IDisposable where SampleType : unmanaged
    {
        private readonly object _mutex = new object();
        private AllocatedMemory _ringBufferMem;
        private AllocatedMemory _tempBufferMem;
        private MemoryArray<SampleType> _ringBuffer;
        private MemoryArray<SampleType> _tempBuffer;
        private int _ringBufferReadPos = 0;
        private int _ringBufferWritePos = 0;
        private int _numChannels = 1;
        private int _ringBufferSize = 0;
        private int _warmupFrameCount = 0;
        private bool _isWarmingUp = true;

        public void Initialize(int frameCount, int warmupFrameCount, int numChannels)
        {
            int sampleSize = MemoryUtils.GetTypeSize<SampleType>();
            _ringBufferSize = frameCount * numChannels;
            _ringBufferMem = new AllocatedMemory(_ringBufferSize * sampleSize);
            _tempBufferMem = new AllocatedMemory(_ringBufferSize * sampleSize);
            _ringBuffer = _ringBufferMem.Accessor.GetArray<SampleType>();
            _tempBuffer = _tempBufferMem.Accessor.GetArray<SampleType>();
            for (int i = 0; i < _ringBufferSize; i++)
            {
                _ringBuffer[i] = default(SampleType);
            }
            _warmupFrameCount = warmupFrameCount;
            _numChannels = numChannels;
            _ringBufferReadPos = 0;
            _ringBufferWritePos = 0;
        }

        public void Dispose()
        {
            _tempBufferMem.Dispose();
            _ringBufferMem.Dispose();
        }

        public int GetReadFramesAvailable()
        {
            return GetRingBufferAvailableForRead() / _numChannels;
        }

        public int GetWriteFramesAvailable()
        {
            return GetRingBufferAvailableForWrite() / _numChannels;
        }

        // returns false if it underflowed the ring buffer
        public bool ReadInterleavedData(MemoryArray<SampleType> outputBuffer, int framesNeeded)
        {
            lock (_mutex)
            {
                int readFramesAvailable = GetReadFramesAvailable();
                bool didUnderflow = false;

                // if we're warming up, don't return any samples until we've reached the threshold
                if (_isWarmingUp)
                {
                    if (readFramesAvailable < _warmupFrameCount)
                    {
                        readFramesAvailable = 0;
                    }
                    else
                    {
                        _isWarmingUp = false;
                    }
                }
                else if (readFramesAvailable < framesNeeded)
                {
                    _isWarmingUp = true;
                    didUnderflow = true;
                }

                // copy samples from ring buffer to output buffer, filling in 0s for any remaining samples
                int framesFromRingBuffer = Math.Min(readFramesAvailable, framesNeeded);
                int ringSamples = _numChannels * framesFromRingBuffer;
                int totalSamples = _numChannels * framesNeeded;

                int endRingPos = _ringBufferReadPos + ringSamples;

                if (endRingPos > _ringBufferSize)
                {
                    // the range straddles the end of the ring buffer, so we need to copy in two batches
                    outputBuffer.CopyFrom(0, _ringBuffer, _ringBufferReadPos, _ringBufferSize - _ringBufferReadPos);
                    outputBuffer.CopyFrom(_ringBufferSize - _ringBufferReadPos, _ringBuffer, 0, endRingPos - _ringBufferSize);
                    _ringBufferReadPos = (endRingPos - _ringBufferSize) % _ringBufferSize;
                }
                else
                {
                    // the range is entirely within the ring buffer, so we can copy it in one go
                    outputBuffer.CopyFrom(0, _ringBuffer, _ringBufferReadPos, ringSamples);
                    _ringBufferReadPos = endRingPos % _ringBufferSize;
                }

                if (ringSamples < totalSamples)
                {
                    // fill in the remaining samples with 0s
                    for (int i = ringSamples; i < totalSamples; i++)
                    {
                        outputBuffer[i] = default(SampleType);
                    }
                }

                return !didUnderflow;
            }
        }

        public bool ReadDeinterleavedData(MemoryArray<SampleType> outputBuffer, int framesNeeded, int outputStride)
        {
            bool filled = ReadInterleavedData(_tempBuffer, framesNeeded);

            int srcIndex = 0;
            for (int frameIdx = 0; frameIdx < framesNeeded; frameIdx++)
            {
                for (int channelIdx = 0; channelIdx < _numChannels; channelIdx++)
                {
                    outputBuffer[channelIdx * outputStride + frameIdx] = _tempBuffer[srcIndex];
                    srcIndex++;
                }
            }

            return filled;
        }

        // returns the number of frames actually written to the ring buffer (<= framesToWrite)
        public int WriteInterleavedData(MemoryArray<SampleType> inputBuffer, int framesToWrite)
        {
            lock (_mutex)
            {
                int writeFramesAvailable = GetWriteFramesAvailable();

                int framesToRingBuffer = Math.Min(framesToWrite, writeFramesAvailable);
                int ringSamples = _numChannels * framesToRingBuffer;

                int endRingPos = _ringBufferWritePos + ringSamples;

                if (endRingPos > _ringBufferSize)
                {
                    // the range straddles the end of the ring buffer, so we need to copy in two batches
                    int firstBatchSamples = _ringBufferSize - _ringBufferWritePos;
                    int secondBatchSamples = endRingPos - _ringBufferSize;

                    _ringBuffer.CopyFrom(_ringBufferWritePos, inputBuffer, 0, firstBatchSamples);
                    _ringBuffer.CopyFrom(0, inputBuffer, firstBatchSamples, secondBatchSamples);
                    _ringBufferWritePos = secondBatchSamples;
                }
                else
                {
                    // the range is entirely within the ring buffer, so we can copy it in one go
                    _ringBuffer.CopyFrom(_ringBufferWritePos, inputBuffer, 0, ringSamples);
                    _ringBufferWritePos = endRingPos % _ringBufferSize;
                }

                return framesToRingBuffer;
            }
        }

        public int WriteInterleavedData(SampleType[] inputBuffer, int framesToWrite)
        {
            int totalSamples = framesToWrite * _numChannels;
            for (int i = 0; i < totalSamples; i++)
            {
                _tempBuffer[i] = inputBuffer[i];
            }
            return WriteInterleavedData(_tempBuffer, framesToWrite);
        }

        private int GetRingBufferAvailableForRead()
        {
            if (_ringBufferWritePos >= _ringBufferReadPos)
            {
                return _ringBufferWritePos - _ringBufferReadPos;
            }
            else
            {
                return _ringBufferWritePos + _ringBufferSize - _ringBufferReadPos;
            }
        }

        private int GetRingBufferAvailableForWrite()
        {
            if (_ringBufferWritePos >= _ringBufferReadPos)
            {
                return _ringBufferSize - (_ringBufferWritePos - _ringBufferReadPos);
            }
            else
            {
                return _ringBufferReadPos - _ringBufferWritePos;
            }
        }
    }
}
