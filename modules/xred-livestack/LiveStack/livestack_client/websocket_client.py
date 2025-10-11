# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

import asyncio
import logging
import struct
from enum import Enum
from typing import Callable, Dict, Optional

import websockets
from websockets.exceptions import WebSocketException


class ConnectionState(Enum):
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"


class LiveStackWebSocketClient:
    """
    WebSocket client for connecting to LiveStack instances.
    Handles connection lifecycle, message routing, and reconnection logic.
    """

    def __init__(self, ip_address: str, port: int) -> None:
        """
        Initialize a new LiveStack WebSocket client.

        Args:
            ip_address: IP address of the LiveStack server
            port: Port number for WebSocket connection
        """
        self.ip_address: str = ip_address
        self.port: int = port
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.connection_task: Optional[asyncio.Task] = None
        self.receive_task: Optional[asyncio.Task] = None
        self.message_handlers: Dict[int, Callable] = {}
        self.is_running: bool = False
        self.connection_state: ConnectionState = ConnectionState.DISCONNECTED
        self.logger: logging.Logger = logging.getLogger(
            f"LiveStackClient-{ip_address}:{port}"
        )

        # Reconnection parameters
        self.reconnect_delay: float = 1.0  # Initial delay in seconds
        # Max delay between reconnection attempts
        self.max_reconnect_delay: float = 30.0
        self.reconnect_backoff: float = 2.0  # Exponential backoff multiplier

    def register_handler(self, topic_id: int, handler: Callable) -> None:
        """
        Register a message handler for a specific topic ID.

        Args:
            topic_id: LiveStack topic ID to handle
            handler: Async callback function to invoke when messages arrive
        """
        self.message_handlers[topic_id] = handler

    async def connect(self) -> None:
        """
        Establish WebSocket connection to LiveStack server.
        Starts the connection loop which will automatically handle reconnections.
        """
        if self.is_running:
            self.logger.warning("Client is already running")
            return

        self.is_running = True
        self.connection_task = asyncio.create_task(self._connection_loop())

    async def disconnect(self) -> None:
        """
        Close WebSocket connection and clean up all resources.
        Cancels all running tasks and ensures proper shutdown.
        """
        self.is_running = False

        if self.receive_task:
            self.receive_task.cancel()
            try:
                await self.receive_task
            except asyncio.CancelledError:
                pass
            self.receive_task = None

        if self.websocket:
            try:
                await self.websocket.close()
            except Exception as e:
                self.logger.error(f"Error closing websocket: {e}")
            self.websocket = None

        if self.connection_task:
            self.connection_task.cancel()
            try:
                await self.connection_task
            except asyncio.CancelledError:
                pass
            self.connection_task = None

        self.connection_state = ConnectionState.DISCONNECTED

    async def send_message(self, topic_id: int, data: bytes) -> None:
        """
        Send a message to the LiveStack server.

        Args:
            topic_id: LiveStack topic ID
            data: Binary message payload (compressed)
        """
        if not self.websocket or self.connection_state != ConnectionState.CONNECTED:
            self.logger.warning("Cannot send message: not connected")
            return

        try:
            # Format: [topic_id: 4 bytes][size: 4 bytes][compressed_data: N bytes]
            header = struct.pack("<II", topic_id, len(data))
            message = header + data
            await self.websocket.send(message)
        except WebSocketException as e:
            self.logger.error(f"Error sending message: {e}")
            self.connection_state = ConnectionState.ERROR

    async def _connection_loop(self) -> None:
        """
        Main connection loop with automatic reconnection.
        Handles exponential backoff and connection retries.
        """
        current_delay: float = self.reconnect_delay
        connection_attempts: int = 0

        while self.is_running:
            connection_attempts += 1
            try:
                self.connection_state = ConnectionState.CONNECTING
                url = f"ws://{self.ip_address}:{self.port}"
                self.logger.info(
                    f"Connection attempt {connection_attempts}: Connecting to {url}"
                )

                async with websockets.connect(
                    url, ping_interval=10, ping_timeout=30, close_timeout=5
                ) as websocket:
                    self.websocket = websocket
                    self.connection_state = ConnectionState.CONNECTED
                    self.logger.info(
                        f"Successfully connected to {url} (attempt {connection_attempts})"
                    )

                    # Reset reconnection delay and attempt counter on successful connection
                    current_delay = self.reconnect_delay
                    connection_attempts = 0

                    # Start receiving messages
                    self.receive_task = asyncio.create_task(self._receive_loop())
                    await self.receive_task

            except asyncio.CancelledError:
                self.logger.info("Connection loop cancelled - shutting down gracefully")
                break
            except WebSocketException as e:
                self.logger.error(
                    f"WebSocket connection failed (attempt {connection_attempts}): {e}",
                    exc_info=True,
                )
                self.connection_state = ConnectionState.ERROR
            except OSError as e:
                self.logger.error(
                    f"Network error connecting to {self.ip_address}:{self.port} (attempt {connection_attempts}): {e}"
                )
                self.connection_state = ConnectionState.ERROR
            except Exception as e:
                self.logger.error(
                    f"Unexpected connection error (attempt {connection_attempts}): {e}",
                    exc_info=True,
                )
                self.connection_state = ConnectionState.ERROR

            # Clean up on connection loss
            if self.websocket:
                self.logger.info(f"Connection to {self.ip_address}:{self.port} lost")
            self.websocket = None

            if self.is_running:
                # Exponential backoff for reconnection
                self.logger.info(
                    f"Will retry connection in {current_delay:.1f} seconds (backoff delay)"
                )
                await asyncio.sleep(current_delay)
                current_delay = min(
                    current_delay * self.reconnect_backoff, self.max_reconnect_delay
                )

    async def _receive_loop(self) -> None:
        """
        Main loop for receiving and processing messages.
        Iterates over incoming WebSocket messages and dispatches to handlers.
        """
        try:
            async for message in self.websocket:
                if isinstance(message, bytes):
                    await self._handle_message(message)
                else:
                    self.logger.warning(f"Received non-binary message: {type(message)}")
        except asyncio.CancelledError:
            self.logger.debug("Receive loop cancelled")
            raise
        except WebSocketException as e:
            self.logger.error(f"WebSocket error in receive loop: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Error in receive loop: {e}")
            raise

    async def _handle_message(self, raw_data: bytes) -> None:
        """
        Handle a received binary message from LiveStack.
        Parses the message header and routes to the appropriate topic handler.

        Args:
            raw_data: Raw binary message from WebSocket
        """
        if len(raw_data) < 8:
            self.logger.warning(
                f"Malformed message: too short ({len(raw_data)} bytes, expected at least 8)"
            )
            return

        try:
            # Parse header
            topic_id, size = struct.unpack("<II", raw_data[:8])

            if len(raw_data) < 8 + size:
                self.logger.warning(
                    f"Incomplete message for topic {topic_id}: expected {8 + size} bytes, got {len(raw_data)}"
                )
                return

            # Extract compressed payload
            compressed_data = raw_data[8 : 8 + size]

            # Route to appropriate handler
            if topic_id in self.message_handlers:
                try:
                    # Pass both topic_id and compressed data to handler
                    await self.message_handlers[topic_id](topic_id, compressed_data)
                except Exception as e:
                    self.logger.error(
                        f"Handler error for topic {topic_id}: {e}", exc_info=True
                    )
            else:
                self.logger.debug(f"No handler registered for topic {topic_id}")

        except struct.error as e:
            self.logger.error(f"Failed to parse message header: {e}", exc_info=True)
        except Exception as e:
            self.logger.error(f"Unexpected error handling message: {e}", exc_info=True)
