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

import asyncio
import json
import queue
import sys
import threading
import time

import numpy as np
import xrpa_runtime
import xrpa_runtime.signals.signal_shared
import xrpa_runtime.utils.xrpa_module
from pupil_labs.realtime_api import Device
from xrpa.eye_tracking_data_store import ReconciledEyeTrackingDevice
from xrpa.eye_tracking_types import EyeEventType, Scale2
from xrpa.pupil_neon_application_interface import PupilNeonApplicationInterface

TICK_RATE = 30


class PupilLabsDeviceHandler(ReconciledEyeTrackingDevice):
    """
    Device handler for Pupil Labs Neon eye tracking glasses.
    Manages device discovery, connection, and multiple data stream threads.
    """

    def __init__(self, id, collection):
        super().__init__(id, collection)

        self._device_info = None
        self._device_info_lock = threading.Lock()
        self._device_ready = False
        self._discovery_thread = None
        self._stream_threads = {}
        self._stop_events = {}
        self._data_queues = {
            "gaze": queue.Queue(maxsize=100),
            "video": queue.Queue(maxsize=10),
            "imu": queue.Queue(maxsize=100),
            "events": queue.Queue(maxsize=50),
            "audio": queue.Queue(maxsize=50),
        }

        # Queue for device status updates from background threads
        self._status_queue = queue.Queue(maxsize=10)

        # Track pending stream states (stream_name -> thread_func)
        # This dict is only accessed from the main thread (tick), so no lock needed
        self._pending_streams = {}

        self._camera_matrix = None
        self._latest_orientation = None
        self._frame_rate_tracker = {
            "count": 0,
            "last_time": time.time(),
            "current_fps": 0,
        }

        # Store gaze data with timestamps for synchronization with video frames
        # Key: timestamp_ns, Value: (x, y) gaze position
        self._gaze_history = {}
        self._max_gaze_history_size = 100  # Keep last 100 gaze samples

        self._is_discovering = False
        self._connection_attempts = 0
        self._max_connection_attempts = 3

        # Queue initial status to be set in tick()
        self._status_queue.put(
            {
                "type": "connection_status",
                "is_connected": False,
                "device_name": "",
                "hardware_version": "",
                "serial_number": "",
                "calibration_json": "",
            }
        )

        # Always request IMU stream (needed for orientation data, regardless of streamImu flag)
        # This will be queued as pending and started when device connects
        self._start_stream("imu", self._imu_stream_thread)

    def handle_xrpa_delete(self):
        """
        Called when the device object is deleted from the collection.
        Cleanup all resources: stop threads, clear queues, release device connections.
        """
        print("[PupilNeon] Cleaning up device handler...")

        # Stop all stream threads
        for stream_name in list(self._stream_threads.keys()):
            self._stop_stream(stream_name)

        # Stop discovery thread if running
        if self._discovery_thread is not None and self._discovery_thread.is_alive():
            # Discovery thread is blocking, so we can't cleanly stop it
            # Just mark it as done and let it finish naturally
            self._is_discovering = False
            print("[PupilNeon] Discovery thread will terminate on next iteration")

        # Clear all data queues
        for data_queue in self._data_queues.values():
            while not data_queue.empty():
                try:
                    data_queue.get_nowait()
                except queue.Empty:
                    break

        # Clear status queue
        while not self._status_queue.empty():
            try:
                self._status_queue.get_nowait()
            except queue.Empty:
                break

        # Clear gaze history
        self._gaze_history.clear()

        # Clear pending streams
        self._pending_streams.clear()

        # Release device info (just metadata, no explicit cleanup needed)
        with self._device_info_lock:
            self._device_info = None

        print("[PupilNeon] Device handler cleanup complete")

    def _start_discovery(self):
        """Start background thread to discover device."""
        if self._discovery_thread is None or not self._discovery_thread.is_alive():
            self._discovery_thread = threading.Thread(target=self._discover_device)
            self._discovery_thread.daemon = True
            self._discovery_thread.start()

    def _discover_device(self):
        """Discover device by address and establish connection."""
        if self._is_discovering:
            return

        self._is_discovering = True
        device_address = self.get_device_address()

        try:
            if device_address:
                # If an address is specified, discover all devices and filter by address
                print(f"[PupilNeon] Discovering device at address: {device_address}")
                from pupil_labs.realtime_api.discovery import discover_devices

                async def find_device_by_address():
                    async for discovered_info in discover_devices(timeout_seconds=15.0):
                        # discovered_info.addresses is a list of IP addresses
                        if device_address in discovered_info.addresses:
                            return discovered_info
                    return None

                discovered_device_info = asyncio.run(find_device_by_address())

                if discovered_device_info is None:
                    print(f"[PupilNeon] No device found at address: {device_address}")
                    self._status_queue.put(
                        {
                            "type": "connection_status",
                            "is_connected": False,
                            "device_name": "",
                            "hardware_version": "",
                            "serial_number": "",
                            "calibration_json": "",
                        }
                    )
                    return
            else:
                # If no address specified, discover any device
                print("[PupilNeon] Discovering any available device...")
                from pupil_labs.realtime_api.discovery import Network

                async def find_any_device():
                    async with Network() as network:
                        return await network.wait_for_new_device(timeout_seconds=15.0)

                discovered_device_info = asyncio.run(find_any_device())

                if discovered_device_info is None:
                    print("[PupilNeon] No Pupil Neon device found")
                    self._status_queue.put(
                        {
                            "type": "connection_status",
                            "is_connected": False,
                            "device_name": "",
                            "hardware_version": "",
                            "serial_number": "",
                            "calibration_json": "",
                        }
                    )
                    return

            # Thread-safe update of device_info (storing DiscoveredDeviceInfo)
            with self._device_info_lock:
                self._device_info = discovered_device_info

            print(
                f"[PupilNeon] Found device at {discovered_device_info.addresses[0]}, attempting to connect..."
            )

            self._connect_device()

        except Exception as e:
            print(f"[PupilNeon] Discovery error: {e}")
            import traceback

            traceback.print_exc()
            self._status_queue.put(
                {
                    "type": "connection_status",
                    "is_connected": False,
                    "device_name": "",
                    "hardware_version": "",
                    "serial_number": "",
                    "calibration_json": "",
                }
            )
        finally:
            self._is_discovering = False

    def _connect_device(self):
        """Connect to the discovered device and fetch metadata."""
        try:

            async def connect():
                async with Device.from_discovered_device(self._device_info) as device:
                    status = await device.get_status()
                    hardware_info = status.hardware

                    device_name = (
                        device.name if hasattr(device, "name") else "Pupil Neon"
                    )
                    hardware_version = (
                        hardware_info.version
                        if hasattr(hardware_info, "version")
                        else "unknown"
                    )
                    serial_number = (
                        hardware_info.serial_number
                        if hasattr(hardware_info, "serial_number")
                        else "unknown"
                    )

                    # Fetch calibration using the already-connected device
                    calibration_json = await self._fetch_calibration(device)

                    # Queue status update to be processed in tick()
                    self._status_queue.put(
                        {
                            "type": "connection_status",
                            "is_connected": True,
                            "device_name": device_name,
                            "hardware_version": hardware_version,
                            "serial_number": serial_number,
                            "calibration_json": calibration_json,
                        }
                    )

                    print(f"[PupilNeon] Connected to device: {device_name}")

            asyncio.run(connect())

        except Exception as e:
            print(f"[PupilNeon] Connection error: {e}")
            self._status_queue.put(
                {
                    "type": "connection_status",
                    "is_connected": False,
                    "device_name": "",
                    "hardware_version": "",
                    "serial_number": "",
                    "calibration_json": "",
                }
            )

    async def _fetch_calibration(self, device=None):
        """Fetch camera calibration data from device and return as JSON string.

        Args:
            device: Optional connected Device instance. If None, creates a new connection.
        """
        try:
            if device is not None:
                # Use the provided device connection
                print(
                    "[PupilNeon] Fetching calibration using existing device connection..."
                )
                calibration = await device.get_calibration()
            else:
                # Create a new connection if no device provided
                print("[PupilNeon] Fetching calibration with new device connection...")
                if self._device_info is None:
                    print("[PupilNeon] Calibration fetch failed: device_info is None")
                    return ""
                async with Device.from_discovered_device(self._device_info) as dev:
                    calibration = await dev.get_calibration()

            if calibration is None:
                print(
                    "[PupilNeon] Calibration fetch failed: device.get_calibration() returned None"
                )
                return ""

            # The calibration object has camera data as direct attributes:
            # - scene_camera_matrix: 3x3 intrinsic matrix
            # - scene_distortion_coefficients: distortion params
            # - scene_extrinsics_affine_matrix: extrinsics
            if not hasattr(calibration, "scene_camera_matrix"):
                print(
                    f"[PupilNeon] Calibration fetch failed: calibration object has no 'scene_camera_matrix' attribute. Available attributes: {dir(calibration)}"
                )
                return ""

            camera_matrix = calibration.scene_camera_matrix
            if camera_matrix is None:
                print(
                    "[PupilNeon] Calibration fetch failed: scene_camera_matrix is None"
                )
                return ""

            print(
                f"[PupilNeon] Raw camera_matrix shape: {camera_matrix.shape if hasattr(camera_matrix, 'shape') else 'N/A'}, type: {type(camera_matrix)}"
            )

            self._camera_matrix = [
                [
                    float(camera_matrix[0][0]),
                    float(camera_matrix[0][1]),
                    float(camera_matrix[0][2]),
                ],
                [
                    float(camera_matrix[1][0]),
                    float(camera_matrix[1][1]),
                    float(camera_matrix[1][2]),
                ],
                [
                    float(camera_matrix[2][0]),
                    float(camera_matrix[2][1]),
                    float(camera_matrix[2][2]),
                ],
            ]

            calibration_data = {
                "camera_matrix": self._camera_matrix,
            }

            print("[PupilNeon] Camera calibration fetched successfully")
            print(
                f"[PupilNeon] Calibration data: fx={self._camera_matrix[0][0]:.2f}, fy={self._camera_matrix[1][1]:.2f}, cx={self._camera_matrix[0][2]:.2f}, cy={self._camera_matrix[1][2]:.2f}"
            )
            return json.dumps(calibration_data)

        except Exception as e:
            print(f"[PupilNeon] Calibration fetch error: {e}")
            import traceback

            traceback.print_exc()

        return ""

    def _handle_xrpa_fields_changed(self, fieldsChanged):
        """Monitor changes to stream enable flags and start/stop streams accordingly."""
        if self.check_stream_gaze_changed(fieldsChanged):
            if self.get_stream_gaze():
                self._start_stream("gaze", self._gaze_stream_thread)
            else:
                self._stop_stream("gaze")

        if self.check_stream_scene_camera_changed(fieldsChanged):
            if self.get_stream_scene_camera():
                self._start_stream("video", self._video_stream_thread)
            else:
                self._stop_stream("video")

        # Note: IMU stream is NOT controlled by streamImu flag here
        # The IMU thread always runs to provide orientation data (needed for gaze direction)
        # The streamImu flag only controls whether raw IMU messages are sent (see _process_imu_data)

        if self.check_stream_eye_events_changed(fieldsChanged):
            if self.get_stream_eye_events():
                self._start_stream("events", self._eye_events_stream_thread)
            else:
                self._stop_stream("events")

        if self.check_stream_audio_changed(fieldsChanged):
            if self.get_stream_audio():
                self._start_stream("audio", self._audio_stream_thread)
            else:
                self._stop_stream("audio")

        self._start_discovery()

    def _start_stream(self, name, thread_func):
        """Start a data stream thread. Only starts if device is ready."""
        # Check if device_info is available before starting stream
        with self._device_info_lock:
            if self._device_info is None:
                print(
                    f"[PupilNeon] Cannot start {name} stream - device not yet discovered"
                )
                # Mark this stream as pending (will start when device connects)
                self._pending_streams[name] = thread_func
                return

        # Remove from pending if it was queued
        self._pending_streams.pop(name, None)

        if name in self._stream_threads and self._stream_threads[name].is_alive():
            return

        self._stop_events[name] = threading.Event()
        self._stream_threads[name] = threading.Thread(target=thread_func)
        self._stream_threads[name].daemon = True
        self._stream_threads[name].start()
        print(f"[PupilNeon] Started {name} stream")

    def _stop_stream(self, name):
        """Stop a data stream thread and clear any pending requests."""
        # Remove from pending streams if it was queued but not yet started
        self._pending_streams.pop(name, None)

        if name in self._stop_events:
            self._stop_events[name].set()

        if name in self._stream_threads and self._stream_threads[name].is_alive():
            self._stream_threads[name].join(timeout=2.0)
            print(f"[PupilNeon] Stopped {name} stream")

    def _gaze_stream_thread(self):
        """Stream gaze data from device."""
        from pupil_labs.realtime_api.streaming.gaze import receive_gaze_data

        async def stream_gaze():
            try:
                # Thread-safe access to device_info
                with self._device_info_lock:
                    device_info = self._device_info

                if device_info is None:
                    print("[PupilNeon] Gaze stream cannot start - device_info is None")
                    return

                async with Device.from_discovered_device(device_info) as device:
                    status = await device.get_status()
                    sensor_gaze = status.direct_gaze_sensor()

                    if not sensor_gaze.connected:
                        print("[PupilNeon] Gaze sensor not connected")
                        return

                    async for gaze in receive_gaze_data(sensor_gaze.url, run_loop=True):
                        if self._stop_events["gaze"].is_set():
                            break

                        self._data_queues["gaze"].put(
                            {
                                "x": gaze.x,
                                "y": gaze.y,
                                "worn": gaze.worn,
                                "pupil_left": getattr(gaze, "pupil_diameter_left", 0.0),
                                "pupil_right": getattr(
                                    gaze, "pupil_diameter_right", 0.0
                                ),
                                "timestamp": gaze.timestamp_unix_ns,
                            }
                        )
            except Exception as e:
                print(f"[PupilNeon] Gaze stream error: {e}")

        asyncio.run(stream_gaze())

    def _video_stream_thread(self):
        """Stream scene camera video from device. Encodes to JPEG in this thread."""
        import cv2
        from pupil_labs.realtime_api.streaming.video import receive_video_frames

        async def stream_video():
            try:
                device_info = self._get_device_info_safe()
                if device_info is None:
                    print("[PupilNeon] Video stream cannot start - device_info is None")
                    return

                async with Device.from_discovered_device(device_info) as device:
                    status = await device.get_status()
                    sensor_world = status.direct_world_sensor()

                    if not sensor_world.connected:
                        print("[PupilNeon] Scene camera sensor not connected")
                        return

                    async for frame in receive_video_frames(
                        sensor_world.url, run_loop=True
                    ):
                        if self._stop_events["video"].is_set():
                            break

                        self._encode_and_queue_frame(frame, cv2)

            except Exception as e:
                print(f"[PupilNeon] Video stream error: {e}")

        asyncio.run(stream_video())

    def _get_device_info_safe(self):
        """Thread-safe access to device_info."""
        with self._device_info_lock:
            return self._device_info

    def _encode_and_queue_frame(self, frame, cv2):
        """Encode frame to JPEG and queue for transmission."""
        bgr_buffer = frame.bgr_buffer()

        # Check if queue is full BEFORE doing expensive processing
        if self._data_queues["video"].full():
            try:
                # Drop oldest frame
                self._data_queues["video"].get_nowait()
            except queue.Empty:
                pass
            # Skip this frame entirely - we're falling behind
            return

        # Store frame metadata
        width = bgr_buffer.shape[1]
        height = bgr_buffer.shape[0]
        timestamp = frame.timestamp_unix_ns

        # Encode to JPEG
        success, jpeg_buffer = cv2.imencode(
            ".jpg", bgr_buffer, [cv2.IMWRITE_JPEG_QUALITY, 85]
        )

        if not success:
            return

        try:
            self._data_queues["video"].put_nowait(
                {
                    "jpeg_bytes": jpeg_buffer.tobytes(),
                    "width": width,
                    "height": height,
                    "timestamp": timestamp,
                }
            )
        except queue.Full:
            pass

    def _imu_stream_thread(self):
        """Stream IMU data from device."""
        from pupil_labs.realtime_api.streaming.imu import receive_imu_data

        async def stream_imu():
            try:
                # Thread-safe access to device_info
                with self._device_info_lock:
                    device_info = self._device_info

                if device_info is None:
                    print("[PupilNeon] IMU stream cannot start - device_info is None")
                    return

                async with Device.from_discovered_device(device_info) as device:
                    status = await device.get_status()
                    sensor_imu = status.direct_imu_sensor()

                    if not sensor_imu.connected:
                        print("[PupilNeon] IMU sensor not connected")
                        return

                    async for imu in receive_imu_data(sensor_imu.url, run_loop=True):
                        if self._stop_events["imu"].is_set():
                            break

                        self._data_queues["imu"].put(
                            {
                                "gyro": (
                                    imu.gyro_data.x,
                                    imu.gyro_data.y,
                                    imu.gyro_data.z,
                                ),
                                "accel": (
                                    imu.accel_data.x,
                                    imu.accel_data.y,
                                    imu.accel_data.z,
                                ),
                                "quat": (
                                    imu.quaternion.x,
                                    imu.quaternion.y,
                                    imu.quaternion.z,
                                    imu.quaternion.w,
                                ),
                                "timestamp": imu.timestamp_unix_ns,
                            }
                        )
            except Exception as e:
                print(f"[PupilNeon] IMU stream error: {e}")

        asyncio.run(stream_imu())

    def _eye_events_stream_thread(self):
        """Stream eye events (blinks, fixations, saccades) from device."""
        from pupil_labs.realtime_api.streaming.eye_events import receive_eye_events_data

        async def stream_events():
            try:
                # Thread-safe access to device_info
                with self._device_info_lock:
                    device_info = self._device_info

                if device_info is None:
                    print(
                        "[PupilNeon] Eye events stream cannot start - device_info is None"
                    )
                    return

                async with Device.from_discovered_device(device_info) as device:
                    status = await device.get_status()
                    sensor_events = status.direct_eye_events_sensor()

                    if not sensor_events.connected:
                        print("[PupilNeon] Eye events sensor not connected")
                        return

                    async for event in receive_eye_events_data(
                        sensor_events.url, run_loop=True
                    ):
                        if self._stop_events["events"].is_set():
                            break

                        event_data = {
                            "type": self._map_event_type(event),
                            "start_time": event.start_time_ns,
                            "end_time": getattr(event, "end_time_ns", 0),
                        }

                        if hasattr(event, "mean_gaze_x"):
                            event_data["mean_gaze_x"] = event.mean_gaze_x
                            event_data["mean_gaze_y"] = event.mean_gaze_y
                            event_data["amplitude"] = event.amplitude_angle_deg
                            event_data["max_velocity"] = getattr(
                                event, "max_velocity", 0.0
                            )

                        self._data_queues["events"].put(event_data)
            except Exception as e:
                print(f"[PupilNeon] Eye events stream error: {e}")

        asyncio.run(stream_events())

    def _audio_stream_thread(self):
        """Stream audio data from device."""
        from pupil_labs.realtime_api.streaming.audio import receive_audio_frames

        async def stream_audio():
            try:
                # Thread-safe access to device_info
                with self._device_info_lock:
                    device_info = self._device_info

                if device_info is None:
                    print("[PupilNeon] Audio stream cannot start - device_info is None")
                    return

                async with Device.from_discovered_device(device_info) as device:
                    status = await device.get_status()
                    sensor_audio = status.direct_audio_sensor()

                    if not sensor_audio.connected:
                        print("[PupilNeon] Audio sensor not connected")
                        return

                    async for audio_frame in receive_audio_frames(
                        sensor_audio.url, run_loop=True
                    ):
                        if self._stop_events["audio"].is_set():
                            break

                        audio_data = audio_frame.to_ndarray()
                        self._data_queues["audio"].put(
                            {
                                "samples": audio_data,
                                "sample_rate": 8000,
                                "timestamp": audio_frame.timestamp_unix_ns,
                            }
                        )
            except Exception as e:
                print(f"[PupilNeon] Audio stream error: {e}")

        asyncio.run(stream_audio())

    def _map_event_type(self, event):
        """Map Pupil Labs event types to our enum."""
        from pupil_labs.realtime_api.streaming.eye_events import (
            BlinkEventData,
            FixationEventData,
            FixationOnsetEventData,
        )

        if isinstance(event, BlinkEventData):
            return "Blink"
        elif isinstance(event, FixationEventData):
            # FixationEventData is used for both fixations and saccades
            # event_type field: 0=saccade, 1=fixation
            if event.event_type == 0:
                return "Saccade"
            else:
                return "Fixation"
        elif isinstance(event, FixationOnsetEventData):
            # FixationOnsetEventData is used for both fixation and saccade onsets
            # event_type field: 2=saccade onset, 3=fixation onset
            if event.event_type == 2:
                return "SaccadeOnset"
            else:
                return "FixationOnset"
        return "Blink"

    def _unproject_gaze_to_direction(self, pixel_x, pixel_y):
        """
        Convert gaze pixel coordinates to a unit direction vector in camera space,
        then transform to world coordinate convention.

        Args:
            pixel_x, pixel_y: Gaze position in scene camera pixels

        Returns:
            (x, y, z) normalized direction vector in world coordinate convention
            World space: X-right, Y-forward, Z-up
        """
        if self._camera_matrix is None:
            return (0.0, 1.0, 0.0)  # Default: looking forward in world coords

        fx = self._camera_matrix[0][0]
        fy = self._camera_matrix[1][1]
        cx = self._camera_matrix[0][2]
        cy = self._camera_matrix[1][2]

        # Unproject pixel to normalized camera coordinates
        # Camera space: X-right, Y-down, Z-forward
        cam_x = (pixel_x - cx) / fx
        cam_y = (pixel_y - cy) / fy
        cam_z = 1.0

        # Transform from camera coords to world coordinate convention
        # Camera: X-right, Y-down, Z-forward
        # World:  X-right, Y-forward, Z-up
        # So: world_x = cam_x, world_y = cam_z, world_z = -cam_y
        world_x = cam_x
        world_y = cam_z  # camera forward -> world forward
        world_z = -cam_y  # camera down -> world up (negated)

        magnitude = np.sqrt(world_x**2 + world_y**2 + world_z**2)

        return (
            world_x / magnitude,
            world_y / magnitude,
            world_z / magnitude,
        )

    def _rotate_vector_by_quaternion(self, vector, quaternion):
        """
        Rotate a 3D vector by a quaternion to transform from camera space to world space.

        Args:
            vector: (x, y, z) tuple representing direction in camera space
            quaternion: (x, y, z, w) tuple representing head orientation

        Returns:
            (x, y, z) tuple representing direction in world space
        """
        v = np.array(vector)
        qx, qy, qz, qw = quaternion

        q_xyz = np.array([qx, qy, qz])
        t = 2.0 * np.cross(q_xyz, np.cross(q_xyz, v) + qw * v)
        v_rotated = v + t

        return (v_rotated[0], v_rotated[1], v_rotated[2])

    def tick(self):
        """Process queued data from all streams. ALL Xrpa setters are called ONLY here."""
        try:
            # Process status updates from background threads FIRST
            self._process_status_updates()

            # Process IMU data BEFORE gaze data to ensure latest orientation is available
            # for gaze direction computation
            self._process_imu_data()

            # Process remaining data streams
            self._process_gaze_data()
            self._process_video_data()
            self._process_eye_events()
            self._process_audio_data()

            self.set_last_update()

        except Exception as e:
            print(f"[PupilNeon] Tick error: {e}")

    def _process_status_updates(self):
        """Process device status updates from discovery/connection threads."""
        while not self._status_queue.empty():
            try:
                status_update = self._status_queue.get_nowait()

                if status_update.get("type") == "connection_status":
                    is_connected = status_update.get("is_connected", False)

                    self.set_is_connected(is_connected)
                    self.set_device_name(status_update.get("device_name", ""))
                    self.set_hardware_version(status_update.get("hardware_version", ""))
                    self.set_serial_number(status_update.get("serial_number", ""))
                    self.set_calibration_json(status_update.get("calibration_json", ""))

                    # If device just became connected, process pending stream requests
                    if is_connected:
                        self._process_pending_stream_requests()

            except queue.Empty:
                break
            except Exception as e:
                print(f"[PupilNeon] Status update processing error: {e}")

    def _process_pending_stream_requests(self):
        """Start any streams that were requested before device was ready."""
        # Get a snapshot of pending streams to avoid modification during iteration
        pending_items = list(self._pending_streams.items())

        for name, thread_func in pending_items:
            # Check if the stream should still be enabled
            should_start = False
            if name == "gaze" and self.get_stream_gaze():
                should_start = True
            elif name == "video" and self.get_stream_scene_camera():
                should_start = True
            elif name == "imu":
                # IMU stream always starts (needed for orientation data)
                should_start = True
            elif name == "events" and self.get_stream_eye_events():
                should_start = True
            elif name == "audio" and self.get_stream_audio():
                should_start = True

            if should_start:
                # Device is ready now, start the stream
                if (
                    name not in self._stream_threads
                    or not self._stream_threads[name].is_alive()
                ):
                    self._stop_events[name] = threading.Event()
                    self._stream_threads[name] = threading.Thread(target=thread_func)
                    self._stream_threads[name].daemon = True
                    self._stream_threads[name].start()
                    print(f"[PupilNeon] Started pending {name} stream")

            # Remove from pending dict (whether started or not)
            self._pending_streams.pop(name, None)

    def _process_gaze_data(self):
        """Process gaze data from queue and store in history for video synchronization."""
        # Drain the queue: store all samples in history, but only process the latest
        latest_gaze_data = None
        while not self._data_queues["gaze"].empty():
            try:
                gaze_data = self._data_queues["gaze"].get_nowait()

                # Store ALL gaze data with timestamp for video sync
                timestamp_ns = gaze_data["timestamp"]
                self._gaze_history[timestamp_ns] = (gaze_data["x"], gaze_data["y"])

                # Limit history size - remove oldest entries
                if len(self._gaze_history) > self._max_gaze_history_size:
                    oldest_key = min(self._gaze_history.keys())
                    del self._gaze_history[oldest_key]

                # Keep track of the latest sample
                latest_gaze_data = gaze_data

            except queue.Empty:
                break

        # Only process the most recent gaze data for expensive computations
        if latest_gaze_data is not None:
            try:
                # Compute gaze direction in world space (expensive)
                if (
                    self._camera_matrix is not None
                    and self._latest_orientation is not None
                ):
                    gaze_dir_camera = self._unproject_gaze_to_direction(
                        latest_gaze_data["x"], latest_gaze_data["y"]
                    )

                    gaze_dir_world = self._rotate_vector_by_quaternion(
                        gaze_dir_camera, self._latest_orientation
                    )

                    from xrpa.eye_tracking_types import UnitVector3

                    gaze_direction = UnitVector3(
                        gaze_dir_world[0], gaze_dir_world[1], gaze_dir_world[2]
                    )
                    self.set_gaze_direction(gaze_direction)

                # Update status fields
                self.set_worn(latest_gaze_data["worn"])

                # convert mm to cm
                self.set_pupil_diameter_left(latest_gaze_data["pupil_left"] * 10)
                self.set_pupil_diameter_right(latest_gaze_data["pupil_right"] * 10)

            except Exception as e:
                print(f"[PupilNeon] Gaze processing error: {e}")

    def _process_video_data(self):
        """Process JPEG-encoded video frames from queue."""
        import xrpa_runtime.utils.image_types

        while not self._data_queues["video"].empty():
            try:
                video_data = self._data_queues["video"].get_nowait()
                frame_timestamp_ns = video_data["timestamp"]

                # Create Image object with JPEG-encoded data
                image = xrpa_runtime.utils.image_types.Image(
                    width=video_data["width"],
                    height=video_data["height"],
                    format=xrpa_runtime.utils.image_types.ImageFormat.RGB8,
                    encoding=xrpa_runtime.utils.image_types.ImageEncoding.Jpeg,
                    orientation=xrpa_runtime.utils.image_types.ImageOrientation.Oriented,
                    gain=1.0,
                    exposure_duration=0,
                    timestamp=frame_timestamp_ns,
                    capture_frame_rate=30.0,
                    data=video_data["jpeg_bytes"],
                )

                # Find the gaze data that matches this frame's timestamp
                gaze_pos = self._find_gaze_for_timestamp(frame_timestamp_ns)

                self.send_scene_camera(image, gaze_pos)

                self._update_frame_rate()

            except queue.Empty:
                break
            except Exception as e:
                print(f"[PupilNeon] Video processing error: {e}")
                import traceback

                traceback.print_exc()

    def _find_gaze_for_timestamp(self, frame_timestamp_ns):
        """Find the gaze data closest to the given frame timestamp."""
        if not self._gaze_history:
            # No gaze data available yet
            return Scale2(0.0, 0.0)

        # Find the gaze timestamp closest to the frame timestamp
        closest_timestamp = min(
            self._gaze_history.keys(), key=lambda t: abs(t - frame_timestamp_ns)
        )

        gaze_x, gaze_y = self._gaze_history[closest_timestamp]
        return Scale2(gaze_x, gaze_y)

    def _update_frame_rate(self):
        """Update frame rate tracking."""
        self._frame_rate_tracker["count"] += 1
        current_time = time.time()
        elapsed = current_time - self._frame_rate_tracker["last_time"]

        if elapsed >= 1.0:
            fps = self._frame_rate_tracker["count"] / elapsed
            self._frame_rate_tracker["current_fps"] = int(fps)
            self.set_scene_camera_frame_rate(int(fps))

            self._frame_rate_tracker["count"] = 0
            self._frame_rate_tracker["last_time"] = current_time

    def _process_imu_data(self):
        """Process IMU data from queue."""
        from xrpa.eye_tracking_types import Quaternion, Vector3

        while not self._data_queues["imu"].empty():
            try:
                imu_data = self._data_queues["imu"].get_nowait()

                quat = Quaternion(
                    imu_data["quat"][0],
                    imu_data["quat"][1],
                    imu_data["quat"][2],
                    imu_data["quat"][3],
                )
                self.set_head_orientation(quat)
                self._latest_orientation = imu_data["quat"]

                if self.get_stream_imu():
                    gyro = Vector3(
                        imu_data["gyro"][0],
                        imu_data["gyro"][1],
                        imu_data["gyro"][2],
                    )

                    accel = Vector3(
                        imu_data["accel"][0],
                        imu_data["accel"][1],
                        imu_data["accel"][2],
                    )

                    self.send_imu_data(imu_data["timestamp"], gyro, accel)

            except queue.Empty:
                break
            except Exception as e:
                print(f"[PupilNeon] IMU processing error: {e}")

    def _process_eye_events(self):
        """Process eye events from queue."""

        while not self._data_queues["events"].empty():
            try:
                event_data = self._data_queues["events"].get_nowait()

                # Convert string event type to enum
                event_type_str = event_data["type"]
                event_type = EyeEventType[event_type_str]  # Convert string to enum

                start_time = event_data["start_time"]
                end_time = event_data["end_time"]

                if "mean_gaze_x" in event_data:
                    mean_gaze = Scale2(
                        event_data["mean_gaze_x"], event_data["mean_gaze_y"]
                    )
                    amplitude = event_data["amplitude"]
                    max_velocity = event_data["max_velocity"]
                else:
                    # For events without gaze data (blinks, onsets), use default values
                    mean_gaze = Scale2(0.0, 0.0)
                    amplitude = 0.0
                    max_velocity = 0.0

                self.send_eye_event(
                    event_type, start_time, end_time, mean_gaze, amplitude, max_velocity
                )

            except queue.Empty:
                break
            except Exception as e:
                print(f"[PupilNeon] Eye event processing error: {e}")

    def _process_audio_data(self):
        """Process audio data from queue and send as 1-channel signal."""
        while not self._data_queues["audio"].empty():
            try:
                audio_data = self._data_queues["audio"].get_nowait()

                # Audio from Pupil Labs is mono 8kHz, float32 numpy array normalized to -1.0 to 1.0
                samples = audio_data["samples"]

                # Flatten to 1D array if needed (Pupil Labs returns shape (1, 1024) -> (1024,))
                if samples.ndim > 1:
                    samples = samples.flatten()

                # Ensure float32 dtype
                samples = samples.astype(np.float32)

                sample_rate = int(audio_data["sample_rate"])  # Ensure int
                frame_count = len(samples)

                # Send audio as 1-channel signal
                # The sample type is inferred from the numpy dtype (float32)
                packet = self.send_audio(
                    frame_count=frame_count,
                    sample_type_name="float",  # numpy float32
                    num_channels=1,  # mono audio
                    frames_per_second=sample_rate,  # 8000 Hz
                )

                # Write the audio samples to channel 0
                # Pass numpy array directly - it supports indexing like a list
                channel_data = packet.access_channel_data("float")
                channel_data.write_channel_data(0, samples, frame_count)

            except queue.Empty:
                break
            except Exception as e:
                print(f"[PupilNeon] Audio processing error: {e}")
                import traceback

                traceback.print_exc()


def tick(module: PupilNeonApplicationInterface):
    """Main tick function called each frame."""
    for device in module.eye_tracking_data_store.EyeTrackingDevice.get_enumerator():
        device.tick()


def stop_on_enter_keypress(module: xrpa_runtime.utils.xrpa_module.XrpaModule):
    """Stop module when user presses enter."""
    while True:
        sys.stdin.readline()
        module.stop()


def main():
    """Main entry point for PupilNeon module."""
    module = PupilNeonApplicationInterface()

    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    module.eye_tracking_data_store.EyeTrackingDevice.set_create_delegate(
        lambda id, _, collection: PupilLabsDeviceHandler(id, collection)
    )

    print("[PupilNeon] Starting module...")
    module.run(TICK_RATE, lambda: tick(module))


if __name__ == "__main__":
    main()
    sys.exit(0)
