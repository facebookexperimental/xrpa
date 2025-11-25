---
oncalls: ['xred_swes']
---

Guide for setting up Xrpa modules with C++ or Python native implementations.

## Core Concepts

**Xrpa Module**: Self-contained component with TypeScript schema, codegen, and
native implementation (C++/Python).

**Field Types**:

- **State** (default): Persistent data, sends final value per tick
- **Messages**: Fire-and-forget events, sends all changes
- **Signals**: Streaming data (audio/sensor) at fixed rate

**Direction**:

- `ProgramInput`: Module reads
- `ProgramOutput`: Module writes
- `Output()`: Field within input that module writes
- `Input()`: Field within output that module reads

**Collections**: Fixed-capacity object sets with input/output fields

---

## Module Structure

Pattern: `modules/xred-<module-name>/`

```
├── package.json, tsconfig.json, .eslintrc.json, .gitignore
├── js/
│   ├── ExampleInterface.ts  # Schema definition
│   └── index.ts
├── scripts/
│   └── ExampleStandalone.ts  # Codegen/build runner
└── ExampleModule/           # Native implementation
    ├── src/                 # C++ files
    ├── BUCK                 # C++ build file
    ├── api/                 # C++ generated bindings
    ├── main.py              # Python entry point
    ├── environment.yaml     # Python conda env
    └── xrpa/                # Python generated bindings
```

---

## Setup Steps

### 1. Boilerplate

```bash
mkdir modules/xred-example-module && cd modules/xred-example-module
cp ../xred-audio-input/{package.json,tsconfig.json,.eslintrc.json,.gitignore} .
# Edit package.json: change name, scripts references
cd ../.. && yarn  # Install deps and link module
```

### 2. Schema Definition

**Reference Examples**:

- C++ module:
  `/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/modules/xred-audio-input/js/AudioInputInterface.ts`
- Python module:
  `/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/modules/xred-audio-transcription/js/AudioTranscriptionInterface.ts`

**Types**: `Boolean`, `Count`, `Float`, `String`, `HiResTimestamp`, `Signal`,
`Message`
**References**: `ReferenceTo(Collection)` for inter-collection references

### 3. Codegen Script

**Reference Examples**:

- C++ module:
  `/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/modules/xred-audio-input/scripts/AudioInputStandalone.ts`
- Python module:
  `/Users/conorwdickinson/fbsource/arvr/libraries/xred/xrpa/modules/xred-audio-transcription/scripts/TranscriptionStandalone.ts`

Run: `yarn codegen` (generates bindings in `ExampleModule/api/lib/` for C++ or
`ExampleModule/xrpa/` for Python)

---

## Python Implementation

### `ExampleModule/environment.yaml`

```yaml
name: example-module
channels: [conda-forge, defaults]
dependencies:
  - python=3.12 # Use 3.11 or 3.10 if needed
  - pip
  - pip: [numpy]
```

### `ExampleModule/main.py`

```python
import sys, threading
import xrpa_runtime, xrpa_runtime.utils.xrpa_module
from xrpa.example_data_store import ReconciledExampleProcessor
from xrpa.example_application_interface import ExampleApplicationInterface

TICK_RATE = 30

class ExampleProcessor(ReconciledExampleProcessor):
    def __init__(self, id, collection):
        super().__init__(id, collection)
        self.on_signal_data = self._handle_input_signal
        try:
            self.on_input_data(self)
        except Exception as e:
            print(f"ERROR: {e}")

    def _handle_input_signal(self, timestamp: int, mem_accessor):
        if mem_accessor is None:
            return
        packet = xrpa_runtime.signals.signal_shared.SignalPacket(mem_accessor)
        frame_count = packet.get_frame_count()
        num_channels = packet.get_num_channels()
        # Process signal...

    def tick(self):
        if self.get_process_enabled():
            # Process data
            self.set_status("Processing complete")

def tick(module):
    for obj in module.example_data_store.ExampleProcessor.get_enumerator():
        obj.tick()

def main():
    # Create module instance
    module = ExampleApplicationInterface()

    # Setup keyboard interrupt handler
    input_thread = threading.Thread(target=stop_on_enter_keypress, args=(module,))
    input_thread.daemon = True
    input_thread.start()

    # Register factory for creating processor instances
    module.example_data_store.ExampleProcessor.set_create_delegate(
        lambda id, _, collection: ExampleProcessor(id, collection)
    )

    # Run main loop
    module.run(TICK_RATE, lambda: tick(module))

if __name__ == "__main__":
    main()
    sys.exit(0)
```

**API**:

```python
# Access collections
module.example_data_store.ExampleProcessor
module.example_data_store.ExampleDevice

# Read/write fields
obj.get_process_enabled()
obj.set_status("text")

# Add objects
device = module.example_data_store.ExampleDevice.create_object()
device.set_device_name("Device 1")
module.example_data_store.ExampleDevice.add_object(device)

# Signals
packet = xrpa_runtime.signals.signal_shared.SignalPacket(mem_accessor)
frame_count = packet.get_frame_count()
channel_data = packet.access_channel_data("float")
channel_data.read_channel_data(0, audio_data, 0, frame_count)
```

Run: `yarn ExampleModule`

---

## C++ Implementation

### `ExampleModule/BUCK`

```python
load("//arvr/tools/build_defs:oxx.bzl", "oxx_static_library")

oncall("xred_swes")

oxx_static_library(
    name = "ExampleModule",
    srcs = glob(["src/*.cpp"]),
    compatible_with = [
        "ovr_config//os:macos",
        "ovr_config//os:windows",
    ],
    public_include_directories = ["src"],
    raw_headers = glob(["src/*.h"]),
    visibility = ["PUBLIC"],
    deps = [
        "//arvr/libraries/xred/xrpa/modules/xred-example-module/ExampleModule/api/lib:ExampleModule",
        "//arvr/libraries/xred/xrpa/modules/xred-example-module/ExampleModule/api/xrpa-runtime:external_utils",
        # Add your C++ dependencies here
    ],
)
```

### `ExampleModule/src/EntryPoint.cpp`

```cpp
#include <lib/ExampleModule.h>
#include "ExampleProcessor.h"

constexpr int kMainLoopPeriod = 16;  // 60 Hz
constexpr int kUpdateRate = 1000 / kMainLoopPeriod;

void EntryPoint(ExampleModule* moduleData) {
    ExampleProcessor::registerDelegate(moduleData->exampleDataStore);

    auto device = moduleData->exampleDataStore->ExampleDevice->createObject();
    device->setDeviceName("Device 1");
    device->setIsActive(true);
    moduleData->exampleDataStore->ExampleDevice->addObject(device);

    moduleData->run(kUpdateRate, [&]() {
        for (auto& processor : *moduleData->exampleDataStore->ExampleProcessor) {
            if (auto custom = std::dynamic_pointer_cast<ExampleProcessor>(processor)) {
                custom->tick();
            }
        }
    });
}
```

### `ExampleModule/src/ExampleProcessor.h`

```cpp
#pragma once
#include <lib/ExampleDataStore.h>
#include <memory>

class ExampleProcessor : public ExampleDataStore::ExampleProcessor {
public:
    static void registerDelegate(const std::shared_ptr<ExampleDataStore>& dataStore) {
        dataStore->ExampleProcessor->setCreateObjectDelegate(
            [](Xrpa::DSIdentifier id, const void*, void* collection) {
                return std::make_shared<ExampleProcessor>(
                    id, static_cast<ExampleDataStore::ExampleProcessorCollection*>(collection)
                );
            }
        );
    }

    ExampleProcessor(Xrpa::DSIdentifier id, ExampleDataStore::ExampleProcessorCollection* collection)
        : ExampleDataStore::ExampleProcessor(id, collection) {
        onInputData([this](auto timestamp, auto accessor) {
            handleInputSignal(timestamp, accessor);
        });
    }

    void tick() {
        if (!getProcessEnabled()) return;
        processData();
        setStatus("Processing complete");
    }

private:
    void handleInputSignal(uint64_t timestamp, const Xrpa::MemoryAccessor& accessor) {
        // Process signal using Xrpa::InboundSignalData
    }

    void processData() {
        // Implement algorithm
    }
};
```

**API**:

```cpp
#include <lib/ExampleModule.h>
#include <reconciler/InboundSignalData.h>
#include <reconciler/OutboundSignalData.h>

// Access
auto dataStore = moduleData->exampleDataStore;
auto processors = dataStore->ExampleProcessor;

// Iterate
for (auto& processor : *processors) {
    bool enabled = processor->getProcessEnabled();
    processor->setStatus("Processing");
}

// Signals
Xrpa::InboundSignalData signal(accessor);
uint32_t frameCount = signal.getFrameCount();
std::vector<float> data(frameCount);
signal.getChannelData<float>(0, data.data(), frameCount);
```

Run: `yarn build` then `yarn ExampleModule`

---

## Checklist

**Setup**:

- Create `modules/xred-<name>`
- Copy `package.json`, `tsconfig.json`, `.eslintrc.json`, `.gitignore`
- Run `yarn` at repo root
- Define schema in `js/`
- Create `scripts/` with standalone runner
- Run `yarn codegen`

**Python**:

- Create `environment.yaml` and `main.py`
- Implement custom classes extending generated bases
- Run `yarn <ModuleName>`

**C++**:

- Create `src/` with `EntryPoint.cpp` and `BUCK`
- Implement custom classes
- Run `yarn build` then `yarn <ModuleName>`

---

## Common Patterns

### Enum Types

```typescript
bindTo: Enum('DeviceBindingType', ['Device', 'DeviceByName', 'SystemAudio']);
```

### Helper Functions

Create helper functions in your interface to simplify module usage:

```typescript
export function CreateProcessor(params: {
  enabled: boolean;
  data: XrpaDataflowConnection;
}) {
  const node = Instantiate(
    [bindExternalProgram(XredExampleInterface), 'ExampleProcessor'],
    {},
  );

  assert(isDataflowForeignObjectInstantiation(node));

  node.fieldValues = {
    processEnabled: params.enabled,
    inputData: params.data,
  };

  return {
    outputSignal: ObjectField(node, 'outputSignal'),
    status: ObjectField(node, 'status'),
  };
}
```

## Troubleshooting

- **"Cannot find module"**: Run `yarn` at repo root
- **Stale bindings**: Run `yarn codegen` after schema changes

**Resources**: `core/xrpa-orchestrator/src/InterfaceTypes.ts` for types,
`core/xrpa-orchestrator/` for API, `modules/` for examples
