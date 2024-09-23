# Signal Processing Tutorial

In this tutorial, we will set up a Unity project and then write some signal processing effects.

## Create a Unity project

Use Unity Hub to create a new Unity project. You can also use an existing project if you like.

## Setup Xrpa

Xrpa is a framework which facilitates connecting disparate software components together at a high level. The signal processing module is built to be used within this framework.

From the root directory of your Unity project, run the following PowerShell commands to download the necessary configuration files for using Xrpa and the signal processing module:
```
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/facebookexperimental/xrpa/main/xrpa-init/package.json" -OutFile ./package.json
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/facebookexperimental/xrpa/main/xrpa-init/tsconfig.json" -OutFile ./tsconfig.json
mkdir js
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/facebookexperimental/xrpa/main/xrpa-init/index.ts" -OutFile ./js/index.ts
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/facebookexperimental/xrpa/main/xrpa-init/TestEffect.ts" -OutFile ./js/TestEffect.ts
Add-Content -Path .gitignore -Value "/node_modules/"
```

Open package.json in a text editor and change the name and description to something relevant to your project. Then run the following PowerShell commands from the root directory of your project:
```
yarn
git add .
git commit -m "Setup xrpa config and install dependencies"
```

## Unity binding

The files you downloaded in the previous step already tell Xrpa about your project, but let's take a look at what is going on. Open `js/index.ts` in VSCode or any other code editor.

```js
import path from "path";
import { XredSignalOutputInterface } from "@xrpa/xred-signal-output";
import { bindExternalProgram, UnityProject } from "@xrpa/xrpa-orchestrator";

import { TestEffect } from "./TestEffect";

const UnityEffects = [
  // Put your effects here, for them to show up as Unity components
  TestEffect,
];

UnityProject(path.join(__dirname, ".."), "your-project-name", () => {
  bindExternalProgram(XredSignalOutputInterface);

  for (const effect of UnityEffects) {
    console.log(`Binding effect ${effect.interfaceName}...`);
    bindExternalProgram(effect);
  }
}).catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
```

The call to `UnityProject()` does most of the heavy lifting here. The first parameter is the path to the root of the Unity project. The second parameter is a string specifying the name of your project. Change this to match your Unity project name. The third parameter is a closure in which you define what you want Xrpa to integrate into your project.

The first `bindExternalProgram()` call within the callback scope tells Xrpa to generate MonoBehaviour classes for binding with the xred-signal-output module. Adding one of these components to your game objects will allow you to receive HDK-1 capacitive touch events.

Next, the code loops over all desired audio/haptic effects and instructs Xrpa to generate MonoBehaviour classes for them. These MonoBehaviours will allow you to run and/or spawn the effects at runtime. We will look at those MonoBehaviours inside Unity later in this tutorial.

## Your first audio/haptic effect

So what are these effects? Let's create a simple effect to explore what they are.

`js/Effect1.ts`
```js
import { XrpaDataflowProgram } from "@xrpa/xrpa-orchestrator";

import {
  DoneWhen,
  Multiply,
  OutputToDevice,
  SineWave,
  strStartsWith,
  TrapezoidCurve,
} from "@xrpa/xred-signal-processing";

export const Effect1 = XrpaDataflowProgram("Effect1", () => {
  const hapticWaveform = SineWave({
    channelCount: 1,
    frequency: 170,
  });

  const gainCurve = TrapezoidCurve({
    softCurve: true,
    lowValue: 0,
    highValue: 1,
    highHoldTime: 0.5,
    rampUpTime: 0.25,
    rampDownTime: 0.25,
  });

  DoneWhen(gainCurve.onDone());

  OutputToDevice({
    deviceName: strStartsWith("HDK-1"),
    source: Multiply(hapticWaveform, gainCurve),
  });
});
```

Effects are defined as signal processing graphs, with routing to output a generated/processed signal to one or more devices. They support events to do things like sequencing and self-termination.

```js
export const Effect1 = XrpaDataflowProgram("Effect1", () => {
});
```

The signal processing effects are created by using the `XrpaDataflowProgram()` function, which takes a name as the first parameter and a closure as the second parameter. The name you specify here is what will show up in Unity for the component name. The signal processing graph specification is built within the closure.

```js
const hapticWaveform = SineWave({
  channelCount: 1,
  frequency: 170,
});
```

This snippet uses the SineWave signal generator to create a single-channel, 170hz sine waveform.

```js
const gainCurve = TrapezoidCurve({
  softCurve: true,
  lowValue: 0,
  highValue: 1,
  highHoldTime: 0.5,
  rampUpTime: 0.25,
  rampDownTime: 0.25,
});
```

This snippet defines a gain envelope using a trapezoidal shape. It will start at value 0, ramp up to value 1 over a quarter second, hold the value of 1 for half a second, then ramp down to 0 over a quarter second. The `softCurve` boolean will ease-in and ease-out of the control points of the trapezoid to soften it.

```js
DoneWhen(gainCurve.onDone());
```

This tells Xrpa to terminate the effect when the gain envelope is completed. Without this, you would need to manually terminate the effect execution from Unity. Even with this call, you still can terminate the effect execution early if you want. For spawned effects, however, this allows you to fire-and-forget without needing to worry about keeping track of effect handles.

```js
OutputToDevice({
  deviceName: strStartsWith("HDK-1"),
  source: Multiply(hapticWaveform, gainCurve),
});
```

Finally, we need to tell the signal processor where to output this effect. For this effect we will output to an HDK-1. The `strStartsWith()` call creates a string-matcher for any device that has a name starting with the specified name. The `source` parameter specifies the signal to output; in this case we multiply the sine wave against the gain curve value to get our output.

To get this effect into Unity, first import it into `js/index.ts` and add it to the `UnityEffects` array:

```js
import { Effect1 } from "./Effect1";
import { TestEffect } from "./TestEffect";

const UnityEffects = [
  // Put your effects here, for them to show up as Unity components
  Effect1,
  TestEffect,
];
```

Now run `yarn update` from a PowerShell prompt at the root folder of your project. This will run the Xrpa code generator and create the desired Unity code.

## Using your effect

Load up your project in Unity. Create an object in your scene, select it, then click "Add Component". Type "Effect" into the search box and select "Effect 1 Component".

This effect has no parameters, so the only option on the property sheet for the component is "Auto Run". Enabling this will cause the component to call `Run()` when the game object is created, which is useful for on-spawn effects or background effects.

The component class itself exposes control functions:
* `Run()`
  * starts the component's managed effect, stopping the currently running managed effect, if running
  * parameters on the component are synced to the managed effect and updated as they change
* `Stop()`
  * stops the component's managed effect, if running
* `Spawn()`
  * starts a new effect that is unmanaged by the component
  * if the effect is self-terminating you may call this function as a fire-and-forget, otherwise you are responsible for managing the return value and calling `Terminate()` on it when done
  * the current effect parameters set on the component are copied to the new effect, but not synced from future changes

## Runtime execution
In order for effects to play, you need to have the SignalProcessing module and the SignalOutput module running. From a PowerShell prompt, simply navigate to the root directory and run `yarn SignalOutput` and `yarn SignalProcessing` (in separate PowerShell windows). To exit those modules, just press the enter key with the window in focus. In the future these modules will be embedded as dlls within the Unity project, but for now they need to be run as standalone processes.

## Effect with parameters and multiple outputs

Effects can be parameterized so that you can adjust them at runtime. They can also output to multiple devices, which is useful for combining haptics and audio. Let's take a look!

`js/Effect2.ts`
```js
import { ProgramInput, Scalar, XrpaDataflowProgram } from "@xrpa/xrpa-orchestrator";

import {
  DoneWhen,
  Multiply,
  OutputToDevice,
  SineWave,
  strStartsWith,
  TrapezoidCurve,
} from "@xrpa/xred-signal-processing";

export const Effect2 = XrpaDataflowProgram("Effect2", () => {
  const lowFreq = ProgramInput("LowFrequency", Scalar(260, "Low audio frequency, in Hz"));
  const highFreq = ProgramInput("HighFrequency", Scalar(580, "High audio frequency, in Hz"));

  const audioWaveform = SineWave({
    channelCount: 1,
    frequency: TrapezoidCurve({
      softCurve: true,
      lowValue: lowFreq,
      highValue: highFreq,
      highHoldTime: 0,
      rampUpTime: 0.5,
      rampDownTime: 0.5,
    }),
  });

  const hapticWaveform = SineWave({
    channelCount: 1,
    frequency: 170,
  });

  const gainCurve = TrapezoidCurve({
    softCurve: true,
    lowValue: 0,
    highValue: 1,
    highHoldTime: 0.5,
    rampUpTime: 0.25,
    rampDownTime: 0.25,
  });

  DoneWhen(gainCurve.onDone());

  OutputToDevice({
    deviceName: strStartsWith("HDK-1"),
    source: Multiply(hapticWaveform, gainCurve),
  });

  OutputToDevice({
    deviceName: strStartsWith("Headphones"),
    source: Multiply(audioWaveform, gainCurve),
  });
});
```

This effect is a modified version of Effect1, adding an audio signal output.

```js
const lowFreq = ProgramInput("LowFrequency", Scalar(260, "Low audio frequency, in Hz"));
```

This line defines an input to the effect by calling `ProgramInput()`. The first parameter defines the name of the input, which will be exposed out to Unity in the MonoBehaviour. The second parameter defines the type of the input, in this case a scalar (unitless floating point value), with a default value of 260 and a description that will be shown as the tooltip for the field in the Unity editor. The description is optional but recommended.

```js
const audioWaveform = SineWave({
  channelCount: 1,
  frequency: TrapezoidCurve({
    softCurve: true,
    lowValue: lowFreq,
    highValue: highFreq,
    highHoldTime: 0,
    rampUpTime: 0.5,
    rampDownTime: 0.5,
  }),
});
```

This snippet is generating a sine wave just like for haptics, but the frequency of the sine wave is set to vary over time by using a TrapezoidCurve to ramp it up from the low frequency parameter value to the high frequency value, and back down again.

```js
OutputToDevice({
  deviceName: strStartsWith("Headphones"),
  source: Multiply(audioWaveform, gainCurve),
});
```

Finally, we add an additional output, this time to a system audio device called "Headphones". Make sure that this matches to the name of an actual system audio devices on your computer, or it will not play anywhere.

Add this effect to the `UnityEffects` array in `index.ts`, then run `yarn update` again to generate the Unity code for the effect. Add the new component to a game object and you will see that the LowFrequency and HighFrequency parameters are now exposed in the Unity editor and at runtime!

## Aside - renaming audio devices
In Windows you can change the name of your audio devices, which is helpful if you want to use effects on multiple computers but they have different audio devices. Simply rename the audio devices using the Windows control panel so that they all match.
1. Press Win-i to open Settings.
2. Click "System"
3. Click "Sound"
4. Click "Device properties" in the Output section.
5. Type a new name, and click "Rename".

## Sequencing

So far we have seen only one place where event handling is used: the `DoneWhen()` call which self-terminates an effect on completion of a curve function. Another place they are used is for sequencing, to make more complicated envelopes. Luckily this is pretty easy to do using the convenience `Sequence()` function.

```js
import { ProgramInput, Scalar, XrpaDataflowProgram } from "@xrpa/xrpa-orchestrator";

import {
  ClickPulse,
  OutputToDevice,
  Sequence,
  SineWave,
  strStartsWith,
  TrapezoidCurve,
} from "@xrpa/xred-signal-processing";

export const Metronome = XrpaDataflowProgram("Metronome", () => {
  const silenceLengthSeconds = ProgramInput("ClickPeriod", Scalar(0.1, "Metronome period, in seconds"));

  const gainEnvelope = Sequence({
    elements: [
      ClickPulse({
        pulseWidth: 0.001,
      }),
      TrapezoidCurve({
        lowValue: 0,
        highValue: 0,
        rampUpTime: 0,
        rampDownTime: 0,
        highHoldTime: silenceLengthSeconds,
      }),
    ],
    loop: true,
  });

  OutputToDevice({
    deviceName: strStartsWith("Headphones"),
    source: SineWave({ channelCount: 1, frequency: 280, amplitude: gainEnvelope }),
  });
});
```

The `Sequence` function accepts an `elements` parameter which contains an array of `SignalCurveType` nodes. The `TrapezoidCurve`, `AdsrEnvelope`, and `ClickPulse` functions all return nodes of this type. The resulting sequence will play the curves in order, and in this case will loop back to the start when finished (because of the `loop` parameter being set to true). Note that this effect does not self-terminate, as it is meant to be a constant metronome.

## Feedback and Delay

A signal processing effect creates a directed-acyclic graph, which normally means you cannot create a feedback loop. The `Feedback()` processing node allows you to feedback a signal by introducing a single-frame delay buffer. You can also use the `Delay()` node to buffer a signal for an arbitrary amount of time. These two nodes together allow you to create an echo effect.

```js
import { XrpaDataflowProgram } from "@xrpa/xrpa-orchestrator";

import {
  AudioStream,
  Delay,
  Feedback,
  MultiplyAdd,
  OutputToDevice,
  strStartsWith,
} from "@xrpa/xred-signal-processing";

import path from "path";

export const EchoTest = XrpaDataflowProgram("EchoTest", () => {
  const audioSource = AudioStream(path.join(__dirname, "assets/test.wav"), { autoPlay: true, numChannels: 2 });

  const feedback = Feedback();
  const audioWithEcho = MultiplyAdd(feedback, 0.25, audioSource);
  feedback.setSource(Delay(audioWithEcho, 0.2));

  OutputToDevice({
    deviceName: strStartsWith("Headphones"),
    source: audioWithEcho,
  });
});
```

For this effect we will stream audio from a wav file, then add an echo to it.

```js
const audioSource = AudioStream(path.join(__dirname, "assets/test.wav"), { autoPlay: true, numChannels: 2 });
```

This line creates the audio streaming node. Note that you have to specify the number of channels the audio file contains.

```js
const feedback = Feedback();
```

Here we create a Feedback node. Note that we don't give it a source until later, because we need to create a cycle in the processing and we don't have the necessary source signal yet.

```js
const audioWithEcho = MultiplyAdd(feedback, 0.25, audioSource);
```

Now we decay the feedback signal by 25% and add it to the audio signal coming from the wav file.

```js
feedback.setSource(Delay(audioWithEcho, 0.2));
```

Finally we set up the feedback signal, which is the combined audio + feedback signal from the previous line, delayed by 200ms.

## Custom waveform shapes

In addition to standard waveform generators such as `SineWave()`, `SawtoothWave()`, `TriangleWave()`, `SquareWave()`, and `WhiteNoise()`, you can also generate a waveform with a custom shape using `CustomWave()`.

```js
import { XrpaDataflowProgram } from "@xrpa/xrpa-orchestrator";

import {
  CustomWave,
  OutputToDevice,
  StackChannels,
  strStartsWith,
} from "@xrpa/xred-signal-processing";

export const CustomWaveTest = XrpaDataflowProgram("CustomWaveTest", () => {
  const buzz0 = CustomWave({
    channelCount: 1,
    frequency: 100,
    waveShape: [
      {time: 0, value: 0},
      {time: 1, value: 1},
      {time: 1.001, value: 0},
      {time: 3, value: 0},
    ],
  });

  const buzz1 = CustomWave({
    channelCount: 1,
    frequency: 100,
    waveShape: [
      {time: 0, value: 0},
      {time: 1, value: 0},
      {time: 2, value: 1},
      {time: 2.001, value: 0},
      {time: 3, value: 0},
    ],
  });

  const buzz2 = CustomWave({
    channelCount: 1,
    frequency: 100,
    waveShape: [
      {time: 0, value: 0},
      {time: 2, value: 0},
      {time: 3, value: 1},
    ],
  });

  OutputToDevice({
    deviceName: strStartsWith("HDK-1"),
    source: StackChannels(
      buzz0,
      buzz1,
      buzz2,
    ),
  });
});
```

This effect generates a custom wave for each of the first 3 LRAs of the HDK-1. For the first LRA, it ramps up from 0-1 in the first third of the wave shape, then drops back to 0 for the last two thirds. The second LRA waveform ramps up in the middle third, and the third LRA ramps up in the last third. So the overall effect is a constant cycling through the first three LRAs with a kind of ramming action.

Note that when defining the wave shape for `CustomWave()`, you can use any time values you want. In this case I made it 3 units long because that was convenient for dividing it into thirds. The time values of the wave shape will be scaled to fit the specified frequency, so you can use whatever is convenient for the shape you are trying to create.
