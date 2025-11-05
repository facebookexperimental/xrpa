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


namespace Xrpa
{

    public abstract class TransportStreamIterator
    {
        public abstract bool NeedsProcessing();
        public abstract bool HasMissedEntries(TransportStreamAccessor accessor);
        public abstract MemoryAccessor GetNextEntry(TransportStreamAccessor accessor);
    }

    public abstract class TransportStream : System.IDisposable
    {
        public abstract void Dispose();
        public abstract bool Transact(int timeoutMS, System.Action<TransportStreamAccessor> func);
        public abstract TransportStreamIterator CreateIterator();
        public abstract bool NeedsHeartbeat();
    }

}
