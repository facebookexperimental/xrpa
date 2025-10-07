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
    public static class SignalTypeInference
    {
        public static int InferSampleType<T>()
        {
            if (typeof(T) == typeof(float))
            {
                return 0;
            }
            else if (typeof(T) == typeof(int))
            {
                return 1;
            }
            else if (typeof(T) == typeof(short))
            {
                return 2;
            }
            else if (typeof(T) == typeof(sbyte))
            {
                return 3;
            }
            else if (typeof(T) == typeof(uint))
            {
                return 4;
            }
            else if (typeof(T) == typeof(ushort))
            {
                return 5;
            }
            else if (typeof(T) == typeof(byte))
            {
                return 6;
            }
            else
            {
                throw new ArgumentException("Unsupported sample type: " + typeof(T).Name);
            }
        }
    }

    public class SignalChannelData<SampleType> where SampleType : unmanaged
    {
        private readonly MemoryAccessor _memAccessor;
        private readonly int _frameCount;
        private readonly int _numChannels;

        public SignalChannelData(MemoryAccessor memAccessor, int frameCount, int numChannels)
        {
            _memAccessor = memAccessor;
            _frameCount = frameCount;
            _numChannels = numChannels;
        }

        public int GetNumChannels()
        {
            return _numChannels;
        }

        public int GetFrameCount()
        {
            return _frameCount;
        }

        public int GetChannelBufferSize()
        {
            return MemoryUtils.GetTypeSize<SampleType>() * _frameCount;
        }

        public void ReadChannelData(int channelIdx, MemoryArray<SampleType> dst, int dstStartOffset, int dstCount, int dstStride = 1)
        {
            MemoryArray<SampleType> src = AccessChannelBuffer(channelIdx);
            int fillCount = !src.IsNull() ? Math.Min(_frameCount, dstCount) : 0;
            for (int i = 0; i < fillCount; i++)
            {
                dst[dstStartOffset + i * dstStride] = src[i];
            }
            for (int i = fillCount; i < dstCount; i++)
            {
                dst[dstStartOffset + i * dstStride] = default(SampleType);
            }
        }

        public void ReadChannelData(int channelIdx, SampleType[] dst, int dstStartOffset, int dstCount, int dstStride = 1)
        {
            MemoryArray<SampleType> src = AccessChannelBuffer(channelIdx);
            int fillCount = !src.IsNull() ? Math.Min(_frameCount, dstCount) : 0;
            for (int i = 0; i < fillCount; i++)
            {
                dst[dstStartOffset + i * dstStride] = src[i];
            }
            for (int i = fillCount; i < dstCount; i++)
            {
                dst[dstStartOffset + i * dstStride] = default(SampleType);
            }
        }

        public void WriteChannelData(int channelIdx, MemoryArray<SampleType> src, int srcCount)
        {
            MemoryArray<SampleType> dst = AccessChannelBuffer(channelIdx);
            if (!dst.IsNull())
            {
                CopySampleData(src, srcCount, dst, _frameCount);
            }
        }

        public void ConsumeFromRingBuffer(SignalRingBuffer<SampleType> ringBuffer)
        {
            int channelBufferSize = GetChannelBufferSize();
            var outData = _memAccessor.Slice(0, channelBufferSize * _numChannels).GetArray<SampleType>();
            ringBuffer.ReadDeinterleavedData(outData, _frameCount, _frameCount);
        }

        public void ClearUnusedChannels(int startChannelIdx, int usedChannelCount)
        {
            for (int i = 0; i < startChannelIdx; i++)
            {
                MemoryArray<SampleType> dst = AccessChannelBuffer(i);
                if (!dst.IsNull())
                {
                    for (int j = 0; j < _frameCount; j++)
                    {
                        dst[j] = default(SampleType);
                    }
                }
            }

            for (int i = startChannelIdx + usedChannelCount; i < _numChannels; i++)
            {
                MemoryArray<SampleType> dst = AccessChannelBuffer(i);
                if (!dst.IsNull())
                {
                    for (int j = 0; j < _frameCount; j++)
                    {
                        dst[j] = default(SampleType);
                    }
                }
            }
        }

        public MemoryArray<SampleType> AccessChannelBuffer(int channelIdx)
        {
            if (channelIdx < 0 || channelIdx >= GetNumChannels())
            {
                return (new MemoryAccessor()).GetArray<SampleType>();
            }

            int channelBufferSize = GetChannelBufferSize();
            int offset = channelIdx * channelBufferSize;
            return _memAccessor.Slice(offset).GetArray<SampleType>();
        }

        private void CopySampleData(MemoryArray<SampleType> src, int srcCount, MemoryArray<SampleType> dst, int dstCount)
        {
            int copyCount = Math.Min(srcCount, dstCount);
            for (int i = 0; i < copyCount; i++)
            {
                dst[i] = src[i];
            }

            if (srcCount < dstCount)
            {
                for (int i = srcCount; i < dstCount; i++)
                {
                    dst[i] = default(SampleType);
                }
            }
        }
    }

    public class SignalPacket
    {
        private static readonly int HeaderSize = 16;
        private readonly MemoryAccessor _memAccessor;

        public SignalPacket(MemoryAccessor memAccessor)
        {
            _memAccessor = memAccessor;
        }

        public int GetFrameCount()
        {
            var offset = new MemoryOffset(0);
            return _memAccessor.ReadInt(offset);
        }

        public void SetFrameCount(int frameCount)
        {
            var offset = new MemoryOffset(0);
            _memAccessor.WriteInt(frameCount, offset);
        }

        public int GetSampleType()
        {
            var offset = new MemoryOffset(4);
            return _memAccessor.ReadInt(offset);
        }

        public void SetSampleType(int sampleType)
        {
            var offset = new MemoryOffset(4);
            _memAccessor.WriteInt(sampleType, offset);
        }

        public int GetNumChannels()
        {
            var offset = new MemoryOffset(8);
            return _memAccessor.ReadInt(offset);
        }

        public void SetNumChannels(int numChannels)
        {
            var offset = new MemoryOffset(8);
            _memAccessor.WriteInt(numChannels, offset);
        }

        public int GetFrameRate()
        {
            var offset = new MemoryOffset(12);
            return _memAccessor.ReadInt(offset);
        }

        public void SetFrameRate(int framesPerSecond)
        {
            var offset = new MemoryOffset(12);
            _memAccessor.WriteInt(framesPerSecond, offset);
        }

        public SignalChannelData<SampleType> AccessChannelData<SampleType>() where SampleType : unmanaged
        {
            return new SignalChannelData<SampleType>(
                _memAccessor.Slice(HeaderSize), GetFrameCount(), GetNumChannels());
        }

        public void CopyChannelDataFrom(SignalPacket src)
        {
            _memAccessor.Slice(HeaderSize).CopyFrom(src._memAccessor.Slice(HeaderSize));
        }

        public static int CalcPacketSize(int numChannels, int sampleSize, int frameCount)
        {
            return HeaderSize + (numChannels * sampleSize * frameCount);
        }
    }
}
