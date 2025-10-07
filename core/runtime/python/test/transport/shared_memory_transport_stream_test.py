# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import random
import string
import unittest

from arvr.libraries.xred.xrpa.core.runtime.python.test.transport.data_store_reconciler_test import (
    DataStoreReconcilerTest,
)

from arvr.libraries.xred.xrpa.core.runtime.python.test.transport.transport_test import (
    TransportTest,
)

from xrpa_runtime.transport.shared_memory_transport_stream import (
    SharedMemoryTransportStream,
)
from xrpa_runtime.utils.xrpa_types import HashValue, TransportConfig


def gen_config(changelog_byte_count=8192) -> TransportConfig:
    return TransportConfig(
        HashValue(
            0x1111111111111111,
            0x2222222222222222,
            0x3333333333333333,
            0x4444444444444444,
        ),
        changelog_byte_count,
    )


def random_name(length=16):
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(length))


class SharedMemoryTransportStreamTest(unittest.TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_ObjectTests(self):
        config = gen_config()
        name = random_name()

        writer_transport = SharedMemoryTransportStream(name, config)
        reader_transport = SharedMemoryTransportStream(name, config)

        TransportTest.run_transport_object_tests(reader_transport, writer_transport)

        del reader_transport
        del writer_transport

    def test_ReaderTests(self):
        config = gen_config(512)
        name = random_name()

        writer_inbound_transport = SharedMemoryTransportStream(name + "Inbound", config)
        writer_outbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )

        reader_inbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )
        reader_outbound_transport = SharedMemoryTransportStream(
            name + "Inbound", config
        )

        DataStoreReconcilerTest.run_read_reconciler_tests(
            reader_inbound_transport,
            reader_outbound_transport,
            writer_inbound_transport,
            writer_outbound_transport,
        )

        del reader_inbound_transport
        del reader_outbound_transport
        del writer_inbound_transport
        del writer_outbound_transport

    def test_ChangedWriterTests(self):
        config = gen_config(512)
        name = random_name()

        def create_writer_transport():
            writer_inbound_transport = SharedMemoryTransportStream(
                name + "Inbound", config
            )
            writer_outbound_transport = SharedMemoryTransportStream(
                name + "Outbound", config
            )
            return writer_inbound_transport, writer_outbound_transport

        reader_inbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )
        reader_outbound_transport = SharedMemoryTransportStream(
            name + "Inbound", config
        )

        DataStoreReconcilerTest.run_read_reconciler_interrupt_tests(
            reader_inbound_transport,
            reader_outbound_transport,
            create_writer_transport,
        )

        del reader_inbound_transport
        del reader_outbound_transport

    def test_WriterTests(self):
        config = gen_config()
        name = random_name()

        writer_inbound_transport = SharedMemoryTransportStream(name + "Inbound", config)
        writer_outbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )

        reader_inbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )
        reader_outbound_transport = SharedMemoryTransportStream(
            name + "Inbound", config
        )

        DataStoreReconcilerTest.run_write_reconciler_tests(
            reader_inbound_transport,
            reader_outbound_transport,
            writer_inbound_transport,
            writer_outbound_transport,
        )

        del reader_inbound_transport
        del reader_outbound_transport
        del writer_inbound_transport
        del writer_outbound_transport

    def test_ReverseFieldsTests(self):
        config = gen_config()
        name = random_name()

        writer_inbound_transport = SharedMemoryTransportStream(name + "Inbound", config)
        writer_outbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )

        reader_inbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )
        reader_outbound_transport = SharedMemoryTransportStream(
            name + "Inbound", config
        )

        DataStoreReconcilerTest.run_reverse_reconciled_fields_tests(
            reader_inbound_transport,
            reader_outbound_transport,
            writer_inbound_transport,
            writer_outbound_transport,
        )

        del reader_inbound_transport
        del reader_outbound_transport
        del writer_inbound_transport
        del writer_outbound_transport

    def test_IndexingTests(self):
        config = gen_config()
        name = random_name()

        writer_inbound_transport = SharedMemoryTransportStream(name + "Inbound", config)
        writer_outbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )

        reader_inbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )
        reader_outbound_transport = SharedMemoryTransportStream(
            name + "Inbound", config
        )

        DataStoreReconcilerTest.run_indexing_tests(
            reader_inbound_transport,
            reader_outbound_transport,
            writer_inbound_transport,
            writer_outbound_transport,
        )

        del reader_inbound_transport
        del reader_outbound_transport
        del writer_inbound_transport
        del writer_outbound_transport

    def test_SignalTransportTests(self):
        config = gen_config()
        name = random_name()

        writer_inbound_transport = SharedMemoryTransportStream(name + "Inbound", config)
        writer_outbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )

        reader_inbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )
        reader_outbound_transport = SharedMemoryTransportStream(
            name + "Inbound", config
        )

        DataStoreReconcilerTest.run_signal_transport_tests(
            reader_inbound_transport,
            reader_outbound_transport,
            writer_inbound_transport,
            writer_outbound_transport,
            False,  # from_ring_buffer=False
        )

        del reader_inbound_transport
        del reader_outbound_transport
        del writer_inbound_transport
        del writer_outbound_transport

    def test_SignalRingBufferTransportTests(self):
        config = gen_config()
        name = random_name()

        writer_inbound_transport = SharedMemoryTransportStream(name + "Inbound", config)
        writer_outbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )

        reader_inbound_transport = SharedMemoryTransportStream(
            name + "Outbound", config
        )
        reader_outbound_transport = SharedMemoryTransportStream(
            name + "Inbound", config
        )

        DataStoreReconcilerTest.run_signal_transport_tests(
            reader_inbound_transport,
            reader_outbound_transport,
            writer_inbound_transport,
            writer_outbound_transport,
            True,  # from_ring_buffer=True
        )

        del reader_inbound_transport
        del reader_outbound_transport
        del writer_inbound_transport
        del writer_outbound_transport
