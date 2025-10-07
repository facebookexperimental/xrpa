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

#include <xrpa-runtime/transport/TransportStream.h>
#include <functional>
#include <memory>

namespace DataStoreReconcilerTest {

void RunReadReconcilerTests(
    std::shared_ptr<Xrpa::TransportStream> readerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> readerOutboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerOutboundDataset);

void RunReadReconcilerInterruptTests(
    std::shared_ptr<Xrpa::TransportStream> readerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> readerOutboundDataset,
    const std::function<std::pair<
        std::shared_ptr<Xrpa::TransportStream>,
        std::shared_ptr<Xrpa::TransportStream>>()>& makeWriterDataset);

void RunWriteReconcilerTests(
    std::shared_ptr<Xrpa::TransportStream> readerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> readerOutboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerOutboundDataset);

void RunReverseReconciledFieldsTests(
    std::shared_ptr<Xrpa::TransportStream> readerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> readerOutboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerOutboundDataset);

void RunSignalTransportTests(
    std::shared_ptr<Xrpa::TransportStream> readerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> readerOutboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerOutboundDataset,
    bool fromRingBuffer);

void RunIndexingTests(
    std::shared_ptr<Xrpa::TransportStream> readerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> readerOutboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerInboundDataset,
    std::shared_ptr<Xrpa::TransportStream> writerOutboundDataset);

} // namespace DataStoreReconcilerTest
