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

using System.Collections.Generic;

namespace Xrpa
{
    public class InboundSignalForwarder : InboundSignalDataInterface
    {
        private readonly List<OutboundSignalData> _recipients = new();

        public void AddRecipient(OutboundSignalData recipient)
        {
            _recipients.Add(recipient);
        }

        public void OnSignalData(ulong timestamp, MemoryAccessor memAccessor)
        {
            var inboundPacket = new SignalPacket(memAccessor);
            var frameCount = inboundPacket.GetFrameCount();
            var sampleType = inboundPacket.GetSampleType();
            var numChannels = inboundPacket.GetNumChannels();
            var frameRate = inboundPacket.GetFrameRate();

            int sampleSize = 4;
            switch (sampleType)
            {
                case 0: // float
                case 1: // int
                case 4: // uint
                    sampleSize = 4;
                    break;

                case 2: // short
                case 5: // ushort
                    sampleSize = 2;
                    break;

                case 3: // sbyte
                case 6: // byte
                    sampleSize = 1;
                    break;
            }

            foreach (var recipient in _recipients)
            {
                var outboundPacket = recipient.SendSignalPacket(sampleSize, frameCount, sampleType, numChannels, frameRate);
                outboundPacket.CopyChannelDataFrom(inboundPacket);
            }
        }
    }
}
