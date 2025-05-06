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

namespace Xrpa
{
    public delegate void SignalProducerCallback<SampleType>(SignalChannelData<SampleType> dataOut, int framesPerSecond, ulong startFrame) where SampleType : unmanaged;

    public class OutboundSignalData
    {
        private ObjectUuid _id;
        private IObjectCollection _collection;
        private int _messageType = 0;

        private Action<SignalPacket> _signalSource;
        private int _sampleType = 0;
        private int _sampleSize = 4;
        private int _numChannels = 1;
        private int _framesPerSecond = 0;
        private int _framesPerPacket = 1024;

        // internal state management
        private ulong _curReadPos = 0;
        private ulong _prevFrameStartTime;

        public void SetSignalSource<SampleType>(
            SignalProducerCallback<SampleType> source,
            int numChannels,
            int framesPerSecond,
            int framesPerPacket) where SampleType : unmanaged
        {
            // wrapper lambda for the type cast
            _signalSource = (packet) =>
            {
                source(packet.AccessChannelData<SampleType>(), _framesPerSecond, _curReadPos);
            };

            SetSignalSourceShared<SampleType>(numChannels, framesPerSecond, framesPerPacket);
        }

        public void SetSignalSource<SampleType>(
            SignalRingBuffer<SampleType> ringBuffer,
            int numChannels,
            int framesPerSecond,
            int framesPerPacket) where SampleType : unmanaged
        {
            _signalSource = (packet) =>
            {
                packet.AccessChannelData<SampleType>().ConsumeFromRingBuffer(ringBuffer);
            };

            SetSignalSourceShared<SampleType>(numChannels, framesPerSecond, framesPerPacket);
        }

        public void SetRecipient(ObjectUuid id, IObjectCollection collection, int messageType)
        {
            _id = id;
            _collection = collection;
            _messageType = messageType;
        }

        public void Tick()
        {
            var endTimeUs = TimeUtils.GetCurrentClockTimeMicroseconds();
            for (var frameCount = GetNextFrameCount(endTimeUs); frameCount > 0; frameCount = GetNextFrameCount(endTimeUs))
            {
                if (_signalSource != null && _collection != null)
                {
                    var packet = SendSignalPacket(_sampleSize, frameCount, _sampleType, _numChannels, _framesPerSecond);
                    _signalSource(packet);
                }

                _curReadPos += (ulong)frameCount;
            }
        }

        // caller is responsible for filling in the channel data
        public SignalPacket SendSignalPacket(
            int sampleSize,
            int frameCount,
            int sampleType,
            int numChannels,
            int framesPerSecond)
        {
            var packet = new SignalPacket(_collection.SendMessage(
                _id, _messageType, SignalPacket.CalcPacketSize(numChannels, sampleSize, frameCount)));
            packet.SetFrameCount(frameCount);
            packet.SetSampleType(sampleType);
            packet.SetNumChannels(numChannels);
            packet.SetFrameRate(framesPerSecond);
            return packet;
        }

        private void SetSignalSourceShared<SampleType>(int numChannels, int framesPerSecond, int framesPerPacket) where SampleType : unmanaged
        {
            _sampleType = SignalTypeInference.InferSampleType<SampleType>();
            _sampleSize = MemoryUtils.GetTypeSize<SampleType>();
            _numChannels = numChannels;
            _framesPerSecond = framesPerSecond;
            _framesPerPacket = framesPerPacket;

            _prevFrameStartTime = TimeUtils.GetCurrentClockTimeMicroseconds();
        }

        private int GetNextFrameCount(ulong endTimeUs)
        {
            if (_framesPerSecond == 0)
            {
                return 0;
            }

            // generate signal in fixed-size packets of data
            var frameCount = (endTimeUs <= _prevFrameStartTime) ? 0 : _framesPerPacket;

            // do NOT set to current clock time, as that will lead to accumulation of error
            _prevFrameStartTime += ((ulong)frameCount) * 1000000 / ((ulong)_framesPerSecond);

            return frameCount;
        }
    }
}
