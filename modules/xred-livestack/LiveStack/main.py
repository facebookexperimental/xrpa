# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

import asyncio
import ipaddress
import logging
import queue
import sys
import threading
import time
from typing import Optional

import xrpa_runtime.utils.xrpa_module

from livestack_client import (
    ConnectionState,
    LiveStackWebSocketClient,
    MessageParser,
    TOPIC_ANCHOR_GRAPH,
    TOPIC_DOORS,
    TOPIC_EGO_BODY_POSE,
    TOPIC_EXO_BODY_POSE,
    TOPIC_EYE_GAZE,
    TOPIC_HANDS,
    TOPIC_OBJECTS,
    TOPIC_ROOMS,
    TOPIC_SERVER_HEARTBEAT,
)
from serialization.deserializers import LiveStackDeserializers
from world_state_manager import WorldStateManager
from xrpa.live_stack_application_interface import LiveStackApplicationInterface
from xrpa.live_stack_data_store import ReconciledLiveStackInstance
from xrpa_runtime.utils.xrpa_types import ObjectUuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LiveStackModule")


class PerformanceMetrics:
    """
    Track performance metrics for LiveStack connections.
    Measures message rates and latency for monitoring purposes.
    """

    def __init__(self):
        self.message_count = 0
        self.bytes_received = 0
        self.start_time = time.time()
        self.last_metric_log_time = time.time()
        self.metric_log_interval = 30.0  # Log metrics every 30 seconds

        # Per-topic metrics
        self.topic_metrics = {}

    def record_message(self, topic_name: str, message_size: int):
        """Record a received message."""
        self.message_count += 1
        self.bytes_received += message_size

        if topic_name not in self.topic_metrics:
            self.topic_metrics[topic_name] = {
                "count": 0,
                "bytes": 0,
                "last_received": time.time(),
            }

        self.topic_metrics[topic_name]["count"] += 1
        self.topic_metrics[topic_name]["bytes"] += message_size
        self.topic_metrics[topic_name]["last_received"] = time.time()

    def should_log_metrics(self) -> bool:
        """Check if it's time to log metrics."""
        current_time = time.time()
        if current_time - self.last_metric_log_time >= self.metric_log_interval:
            self.last_metric_log_time = current_time
            return True
        return False

    def get_metrics_summary(self) -> str:
        """Get a summary of current metrics."""
        elapsed_time = time.time() - self.start_time
        if elapsed_time == 0:
            return "No data yet"

        msg_rate = self.message_count / elapsed_time
        throughput_kbps = (self.bytes_received * 8) / (elapsed_time * 1000)

        summary = f"Overall: {self.message_count} msgs, {msg_rate:.1f} msg/s, {throughput_kbps:.1f} Kbps"

        if self.topic_metrics:
            summary += "\nPer-topic:"
            for topic_name, metrics in self.topic_metrics.items():
                topic_rate = metrics["count"] / elapsed_time
                summary += f"\n  {topic_name}: {metrics['count']} msgs ({topic_rate:.1f} msg/s)"

        return summary

    def reset(self):
        """Reset all metrics."""
        self.message_count = 0
        self.bytes_received = 0
        self.start_time = time.time()
        self.topic_metrics.clear()


def validate_ip_address(ip_str: str) -> bool:
    """
    Validate an IP address string.

    Args:
        ip_str: IP address string to validate

    Returns:
        True if valid, False otherwise
    """
    try:
        ipaddress.ip_address(ip_str)
        return True
    except ValueError:
        return False


def validate_port(port: int) -> bool:
    """
    Validate a port number.

    Args:
        port: Port number to validate

    Returns:
        True if valid (1-65535), False otherwise
    """
    return 1 <= port <= 65535


class LiveStackInstance(ReconciledLiveStackInstance):
    """
    Reconciler class that manages the lifecycle of a LiveStack connection.
    Creates and manages a WebSocket client, handles incoming messages, and
    updates the Xrpa data store with world state information.

    IMPORTANT: Uses a thread-safe queue to pass messages from the asyncio
    thread to the tick thread, since Xrpa bindings are not thread-safe.
    """

    def __init__(self, id: ObjectUuid, collection) -> None:
        """
        Initialize a LiveStack instance reconciler.

        Args:
            id: Xrpa object ID
            collection: Xrpa collection this instance belongs to
        """
        super().__init__(id, collection)
        self.ws_client: Optional[LiveStackWebSocketClient] = None
        self.message_parser: Optional[MessageParser] = None
        self.asyncio_thread: Optional[threading.Thread] = None
        self.event_loop: Optional[asyncio.AbstractEventLoop] = None
        self._message_queue: queue.Queue = queue.Queue()  # Thread-safe message queue
        self._stop_event: threading.Event = threading.Event()
        self._last_stale_cleanup_time: float = time.time()
        self._stale_cleanup_interval: float = 3600.0  # seconds

        # Create world state manager
        self.world_state_manager: WorldStateManager = WorldStateManager(
            instance_id=id, data_store=collection.get_data_store(), logger=logger
        )

        # Performance metrics tracking
        self.performance_metrics: PerformanceMetrics = PerformanceMetrics()

        logger.info(f"LiveStackInstance created with ID: {id}")

    def _handle_xrpa_fields_changed(self, fields_changed: int) -> None:
        """Handle changes to input fields from the Xrpa interface."""
        # Check if IP address or port changed - requires reconnection
        if self.check_ip_address_changed(fields_changed) or self.check_port_changed(
            fields_changed
        ):
            logger.info("Connection parameters changed - reconnecting")
            self._disconnect()
            self._create_connection()

        # Check if topic subscriptions changed
        if (
            self.check_subscribe_to_objects_changed(fields_changed)
            or self.check_subscribe_to_rooms_changed(fields_changed)
            or self.check_subscribe_to_doors_changed(fields_changed)
            or self.check_subscribe_to_hands_changed(fields_changed)
            or self.check_subscribe_to_eye_gaze_changed(fields_changed)
            or self.check_subscribe_to_body_poses_changed(fields_changed)
            or self.check_subscribe_to_anchors_changed(fields_changed)
        ):
            logger.info("Topic subscriptions changed")
            # Topic subscriptions are registered during connection setup
            # For now, we'll just log this - full implementation will be in Task 2.5

    def _handle_xrpa_delete(self) -> None:
        """Handle deletion of this LiveStack instance."""
        logger.info(f"LiveStackInstance {self.get_id()} being deleted")
        self._disconnect()

    def _create_connection(self):
        """Create and initialize the WebSocket client and asyncio event loop."""
        ip_address = self.get_ip_address()
        port = self.get_port()

        # Validate configuration
        if not ip_address:
            logger.error("Cannot connect: IP address is empty")
            self.set_connection_status("error")
            return

        if not validate_ip_address(ip_address):
            logger.error(f"Cannot connect: Invalid IP address '{ip_address}'")
            self.set_connection_status("error")
            return

        if not validate_port(port):
            logger.error(
                f"Cannot connect: Invalid port number {port} (must be 1-65535)"
            )
            self.set_connection_status("error")
            return

        # Log topic subscription configuration
        subscriptions = []
        if self.get_subscribe_to_objects():
            subscriptions.append("objects")
        if self.get_subscribe_to_rooms():
            subscriptions.append("rooms")
        if self.get_subscribe_to_doors():
            subscriptions.append("doors")
        if self.get_subscribe_to_hands():
            subscriptions.append("hands")
        if self.get_subscribe_to_eye_gaze():
            subscriptions.append("eye_gaze")
        if self.get_subscribe_to_body_poses():
            subscriptions.append("body_poses")
        if self.get_subscribe_to_anchors():
            subscriptions.append("anchors")

        if not subscriptions:
            logger.warning("No topics subscribed - connection will receive no data")
        else:
            logger.info(f"Subscribed topics: {', '.join(subscriptions)}")

        logger.info(f"Creating LiveStack connection to {ip_address}:{port}")

        # Create WebSocket client
        self.ws_client = LiveStackWebSocketClient(ip_address, port)

        # Create message parser
        self.message_parser = MessageParser()

        # Register message handlers for subscribed topics
        self._register_message_handlers()

        # Update connection status
        self.set_connection_status("connecting")

        # Start asyncio event loop in a separate thread
        self._start_asyncio_thread()

    def _register_message_handlers(self):
        """
        Register message handlers for all subscribed topics.

        Handlers run in the asyncio thread and queue messages for processing
        in the tick thread (since Xrpa bindings are not thread-safe).
        """

        async def handle_objects(topic_id, data):
            if self.get_subscribe_to_objects():
                logger.debug(f"Received objects message: {len(data)} bytes")
                self._message_queue.put(("objects", topic_id, data))

        async def handle_rooms(topic_id, data):
            if self.get_subscribe_to_rooms():
                logger.debug(f"Received rooms message: {len(data)} bytes")
                self._message_queue.put(("rooms", topic_id, data))

        async def handle_doors(topic_id, data):
            if self.get_subscribe_to_doors():
                logger.debug(f"Received doors message: {len(data)} bytes")
                self._message_queue.put(("doors", topic_id, data))

        async def handle_hands(topic_id, data):
            if self.get_subscribe_to_hands():
                logger.debug(f"Received hands message: {len(data)} bytes")
                self._message_queue.put(("hands", topic_id, data))

        async def handle_eye_gaze(topic_id, data):
            if self.get_subscribe_to_eye_gaze():
                logger.debug(f"Received eye gaze message: {len(data)} bytes")
                self._message_queue.put(("eye_gaze", topic_id, data))

        async def handle_body_poses_ego(topic_id, data):
            if self.get_subscribe_to_body_poses():
                logger.debug(f"Received ego body pose message: {len(data)} bytes")
                self._message_queue.put(("body_pose_ego", topic_id, data))

        async def handle_body_poses_exo(topic_id, data):
            if self.get_subscribe_to_body_poses():
                logger.debug(f"Received exo body pose message: {len(data)} bytes")
                self._message_queue.put(("body_pose_exo", topic_id, data))

        async def handle_anchors(topic_id, data):
            if self.get_subscribe_to_anchors():
                logger.debug(f"Received anchor graph message: {len(data)} bytes")
                self._message_queue.put(("anchors", topic_id, data))

        async def handle_heartbeat(topic_id, data):
            logger.debug("Received heartbeat")
            # Queue heartbeat for processing in tick thread
            self._message_queue.put(("heartbeat", topic_id, data))

        # Register handlers
        self.ws_client.register_handler(TOPIC_OBJECTS, handle_objects)
        self.ws_client.register_handler(TOPIC_ROOMS, handle_rooms)
        self.ws_client.register_handler(TOPIC_DOORS, handle_doors)
        self.ws_client.register_handler(TOPIC_HANDS, handle_hands)
        self.ws_client.register_handler(TOPIC_EYE_GAZE, handle_eye_gaze)
        self.ws_client.register_handler(TOPIC_EGO_BODY_POSE, handle_body_poses_ego)
        self.ws_client.register_handler(TOPIC_EXO_BODY_POSE, handle_body_poses_exo)
        self.ws_client.register_handler(TOPIC_ANCHOR_GRAPH, handle_anchors)
        self.ws_client.register_handler(TOPIC_SERVER_HEARTBEAT, handle_heartbeat)

        logger.info("Message handlers registered")

    def _start_asyncio_thread(self):
        """Start a new thread running an asyncio event loop for WebSocket communication."""

        def run_event_loop():
            logger.info(
                f"Starting asyncio event loop for {self.get_ip_address()}:{self.get_port()}"
            )
            self.event_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.event_loop)

            try:
                # Start the WebSocket connection
                self.event_loop.run_until_complete(self.ws_client.connect())

                # Keep the event loop running until stopped
                logger.info(
                    "Event loop now running - connection will continue until stopped"
                )
                self.event_loop.run_forever()
            except Exception as e:
                logger.error(f"Fatal error in event loop: {e}", exc_info=True)
            finally:
                # Clean up
                logger.info("Shutting down event loop and cleaning up tasks")
                pending = asyncio.all_tasks(self.event_loop)
                if pending:
                    logger.debug(f"Cancelling {len(pending)} pending tasks")
                    for task in pending:
                        task.cancel()
                    self.event_loop.run_until_complete(
                        asyncio.gather(*pending, return_exceptions=True)
                    )
                self.event_loop.close()
                logger.info("Event loop closed successfully")

        self.asyncio_thread = threading.Thread(target=run_event_loop, daemon=True)
        self.asyncio_thread.start()
        logger.info(
            f"Asyncio thread started for {self.get_ip_address()}:{self.get_port()}"
        )

    def _disconnect(self):
        """Disconnect from the LiveStack server and clean up resources."""
        if not self.ws_client:
            return

        logger.info("Disconnecting from LiveStack server")

        # Clear world state
        self.world_state_manager.clear_state()

        # Signal the client to disconnect
        if self.event_loop and self.event_loop.is_running():
            # Schedule the disconnect coroutine
            asyncio.run_coroutine_threadsafe(
                self.ws_client.disconnect(), self.event_loop
            )

            # Stop the event loop
            self.event_loop.call_soon_threadsafe(self.event_loop.stop)

        # Wait for the thread to finish
        if self.asyncio_thread and self.asyncio_thread.is_alive():
            self.asyncio_thread.join(timeout=2.0)

        self.ws_client = None
        self.event_loop = None
        self.asyncio_thread = None
        self.set_connection_status("disconnected")

        logger.info("Disconnected and cleaned up")

    def process_queued_messages(self):
        """
        Process all queued messages from the asyncio thread.

        IMPORTANT: This must be called from the tick thread, as it updates
        Xrpa collections which are not thread-safe.
        """
        messages_processed = 0
        max_messages_per_tick = 100  # Limit to avoid blocking tick for too long

        while (
            not self._message_queue.empty()
            and messages_processed < max_messages_per_tick
        ):
            try:
                message_type, topic_id, data = self._message_queue.get_nowait()

                if message_type == "heartbeat":
                    self._process_heartbeat(topic_id, data)
                elif message_type == "objects":
                    self._process_objects(topic_id, data)
                elif message_type == "rooms":
                    self._process_rooms(topic_id, data)
                elif message_type == "doors":
                    self._process_doors(topic_id, data)
                elif message_type == "hands":
                    self._process_hands(topic_id, data)
                elif message_type == "eye_gaze":
                    self._process_eye_gaze(topic_id, data)
                elif message_type == "body_pose_ego":
                    self._process_body_pose_ego(topic_id, data)
                elif message_type == "body_pose_exo":
                    self._process_body_pose_exo(topic_id, data)
                elif message_type == "anchors":
                    self._process_anchors(topic_id, data)
                else:
                    logger.warning(f"Unknown message type: {message_type}")

                messages_processed += 1

            except queue.Empty:
                break
            except Exception as e:
                logger.error(f"Error processing message: {e}", exc_info=True)

        if messages_processed > 0:
            logger.debug(f"Processed {messages_processed} messages in tick")

    def _process_heartbeat(self, _topic_id, data):
        """Process heartbeat message and update connection status."""
        self.performance_metrics.record_message("heartbeat", len(data))

        current_time = int(time.time() * 1_000_000)  # microseconds
        self.set_last_heartbeat(current_time)
        if (
            self.ws_client
            and self.ws_client.connection_state == ConnectionState.CONNECTED
        ):
            self.set_connection_status("connected")

        try:
            decompressed_data = self.message_parser.decompress(data)
            heartbeat_data = LiveStackDeserializers.deserialize_heartbeat(
                decompressed_data
            )
            logger.debug(
                f"Heartbeat from server v{heartbeat_data['server_version']}, "
                f"timestamp: {heartbeat_data['timestamp']}"
            )
            self.set_server_version(heartbeat_data["server_version"])
        except Exception as e:
            logger.error(f"Error processing heartbeat: {e}", exc_info=True)

    def _process_objects(self, _topic_id, data):
        """Process objects message and update Xrpa collections."""
        self.performance_metrics.record_message("objects", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            delta_data = LiveStackDeserializers.deserialize_objects(decompressed_data)
            logger.debug(
                f"Objects: {len(delta_data['updated'])} updated, "
                f"{len(delta_data['removed'])} removed"
            )
            self.world_state_manager.update_objects(delta_data)
        except Exception as e:
            logger.error(f"Error processing objects: {e}", exc_info=True)

    def _process_rooms(self, _topic_id, data):
        """Process rooms message and update Xrpa collections."""
        self.performance_metrics.record_message("rooms", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            delta_data = LiveStackDeserializers.deserialize_rooms(decompressed_data)
            logger.debug(
                f"Rooms: {len(delta_data['updated'])} updated, "
                f"{len(delta_data['removed'])} removed"
            )
            self.world_state_manager.update_rooms(delta_data)
        except Exception as e:
            logger.error(f"Error processing rooms: {e}", exc_info=True)

    def _process_doors(self, _topic_id, data):
        """Process doors message and update Xrpa collections."""
        self.performance_metrics.record_message("doors", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            delta_data = LiveStackDeserializers.deserialize_doors(decompressed_data)
            logger.debug(
                f"Doors: {len(delta_data['updated'])} updated, "
                f"{len(delta_data['removed'])} removed"
            )
            self.world_state_manager.update_doors(delta_data)
        except Exception as e:
            logger.error(f"Error processing doors: {e}", exc_info=True)

    def _process_hands(self, _topic_id, data):
        """Process hands message and update Xrpa collections."""
        self.performance_metrics.record_message("hands", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            hands_data = LiveStackDeserializers.deserialize_hands(decompressed_data)
            logger.debug(
                f"Hands: left_tracked={hands_data['is_left_hand_tracked']}, "
                f"right_tracked={hands_data['is_right_hand_tracked']}"
            )
            self.world_state_manager.update_hands(hands_data)
        except Exception as e:
            logger.error(f"Error processing hands: {e}", exc_info=True)

    def _process_eye_gaze(self, _topic_id, data):
        """Process eye gaze message and update Xrpa collections."""
        self.performance_metrics.record_message("eye_gaze", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            gaze_data = LiveStackDeserializers.deserialize_eye_gaze(decompressed_data)
            logger.debug(f"Eye gaze: anchor={gaze_data['anchor_uid']}")
            self.world_state_manager.update_eye_gaze(gaze_data)
        except Exception as e:
            logger.error(f"Error processing eye gaze: {e}", exc_info=True)

    def _process_body_pose_ego(self, _topic_id, data):
        """Process ego body pose message and update Xrpa collections."""
        self.performance_metrics.record_message("body_pose_ego", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            pose_data = LiveStackDeserializers.deserialize_body_poses(decompressed_data)
            logger.debug(
                f"Ego body pose: {len(pose_data['updated'])} updated, "
                f"{len(pose_data['removed'])} removed"
            )
            self.world_state_manager.update_body_poses(pose_data)
        except Exception as e:
            logger.error(f"Error processing ego body pose: {e}", exc_info=True)

    def _process_body_pose_exo(self, _topic_id, data):
        """Process exo body pose message and update Xrpa collections."""
        self.performance_metrics.record_message("body_pose_exo", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            pose_data = LiveStackDeserializers.deserialize_body_poses(decompressed_data)
            logger.debug(
                f"Exo body pose: {len(pose_data['updated'])} updated, "
                f"{len(pose_data['removed'])} removed"
            )
            self.world_state_manager.update_body_poses(pose_data)
        except Exception as e:
            logger.error(f"Error processing exo body pose: {e}", exc_info=True)

    def _process_anchors(self, _topic_id, data):
        """Process anchor graph message and update Xrpa collections."""
        self.performance_metrics.record_message("anchors", len(data))
        try:
            decompressed_data = self.message_parser.decompress(data)
            delta_data = LiveStackDeserializers.deserialize_anchors(decompressed_data)
            logger.debug(
                f"Anchors: {len(delta_data['updated_gravity'])} gravity, "
                f"{len(delta_data['updated_islands'])} islands updated"
            )
            self.world_state_manager.update_anchors(delta_data)
        except Exception as e:
            logger.error(f"Error processing anchors: {e}", exc_info=True)


def tick(module: LiveStackApplicationInterface) -> None:
    """
    Tick function called by the module's run loop.

    Processes queued messages for all LiveStack instances in the tick thread,
    ensuring thread-safe access to Xrpa bindings. Also performs periodic cleanup
    of stale data that hasn't been updated within the timeout period.

    Args:
        module: The LiveStack application interface module
    """
    # Process messages for each LiveStack instance
    for instance in module.live_stack_data_store.LiveStackInstance.get_enumerator():
        instance.process_queued_messages()

        # Run periodic stale data cleanup
        current_time = time.time()
        if (
            current_time - instance._last_stale_cleanup_time
            >= instance._stale_cleanup_interval
        ):
            instance._last_stale_cleanup_time = current_time
            removed_count = instance.world_state_manager.cleanup_stale_data()
            if removed_count > 0:
                logger.info(
                    f"Cleaned up {removed_count} stale objects for {instance.get_ip_address()}:{instance.get_port()}"
                )

        # Log performance metrics periodically
        if instance.performance_metrics.should_log_metrics():
            metrics_summary = instance.performance_metrics.get_metrics_summary()
            logger.info(
                f"Performance metrics for {instance.get_ip_address()}:{instance.get_port()}\n{metrics_summary}"
            )


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    """Thread function to stop the module when Enter is pressed."""
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    module = LiveStackApplicationInterface()

    # Set up the custom reconciler for LiveStack instances
    module.live_stack_data_store.LiveStackInstance.set_create_delegate(
        lambda id, _, collection: LiveStackInstance(id, collection)
    )

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    print("LiveStack module started")
    print("Press Enter to stop...")
    module.run(30, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
