---
oncalls: ['xred_swes']
---

# xred-livestack Module

## Overview
Xrpa module that connects to LiveStack instances via WebSocket and maintains synchronized world state representation. LiveStack is a real-time spatial computing platform processing sensor data for objects, rooms, hands, eye gaze, body poses, and spatial elements.

## Module Location
`fbsource/arvr/libraries/xred/xrpa/modules/xred-livestack/`

## LiveStack Protocol Reference
Binary protocol implementation: `fbsource/arvr/projects/surreal/live_stack/networking/`

## Architecture

### TypeScript Interface (`js/LiveStackInterface.ts`)
- Defines ProgramInterface using Xrpa DSL
- Input: `LiveStackInstance` collection (max 4 concurrent connections)
- Outputs: World state collections (anchors, objects, rooms, doors, hands, eye gaze, body poses)
- Generated bindings via `yarn codegen`

### Python Implementation (`LiveStack/`)
- Entry point: `main.py`
- WebSocket client: `livestack_client/websocket_client.py`
- Binary deserialization: `serialization/deserializers.py`, `serialization/bitstream_reader.py`
- World state management: `world_state_manager.py`
- Generated Xrpa bindings: `xrpa/` (from codegen)

## Key Collections

### Input
- **LiveStackInstance**: Connection configuration (IP, port, subscription flags)
  - Outputs: connectionStatus, lastHeartbeat, serverVersion
  - maxCount: 4

### Outputs (World State)
- **LiveStackAnchor**: Spatial coordinate frames (maxCount: 1024)
- **LiveStackObject**: Detected objects with bounding boxes, labels, poses (maxCount: 2048)
- **LiveStackRoom**: Room geometry with polygons, floor/ceiling heights (maxCount: 256)
- **LiveStackDoor**: Doorways connecting rooms (maxCount: 256)
- **LiveStackHands**: Hand tracking with 21 landmarks per hand (maxCount: 4)
- **LiveStackEyeGaze**: Eye gaze origin and direction (maxCount: 4)
- **LiveStackBodyPose**: Full body skeleton with 24 joints (maxCount: 64)

All collections use `ReferenceTo` for type-safe cross-references (e.g., objects reference anchors and rooms).

## Data Flow
LiveStack Server → WebSocket → Binary Deserialization → World State Manager → Xrpa Collections → Consumer Modules

## Binary Protocol
- Transport: WebSocket with binary messages
- Format: `[topicId][zstd-compressed-payload]`
- Topic IDs: 16-46 for data topics
- Serialization: Custom BitStream format (see LiveStack C++ implementation)
- Delta updates: Add/update/remove operations for stateful collections

## State Management
- WorldStateManager maintains mapping dictionaries (LiveStack UUID → Xrpa ID)
- Handles incremental updates (deltas)
- Clears state on disconnection, rebuilds on reconnection
- Thread-safe: all state updates occur on tick thread

## Development Commands
- `yarn codegen`: Generate Xrpa bindings from TypeScript interface
- `yarn build`: Compile TypeScript and run codegen
- `yarn LiveStack`: Build and run standalone
- `yarn LiveStack:run-only`: Run without rebuild

## Implementation Notes
- Python implementation uses asyncio for WebSocket (separate thread from Xrpa tick)
- Message queue bridges asyncio thread to tick thread
- Zstandard decompression required for all topic messages
- Coordinate frames: all poses relative to anchor coordinate frames
- UUIDs: LiveStack uses (uint64, uint64) pairs, converted to strings for Xrpa
- Connection recovery: exponential backoff with automatic reconnection

## Testing
Test file: `LiveStack/test_livestack.py`
Environment: `LiveStack/environment.yaml` (dependencies: websockets, numpy, zstandard)

## Key Dependencies
- `@xrpa/xrpa-orchestrator`: Xrpa framework
- Python: websockets, numpy, zstandard
- LiveStack server instance for testing

## Extensibility
- Add new topics: Update LiveStackInterface.ts schema, run codegen, implement deserializer
- Additional LiveStack instances: Increase maxCount in LiveStackInstance collection
- New data types: Define Collection in schema, add WorldStateManager methods
