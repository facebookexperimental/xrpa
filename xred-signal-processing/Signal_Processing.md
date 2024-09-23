# Signal Processing

The xred-signal-processing module provides functionality to define and run signal processing dataflow programs, aka "effects". These can output signals to haptic and audio devices.

The module consists of a signal processing runtime (a Xrpa Native Program) and a custom signal processing DSL (domain-specific language) which is used to describe the signal processing graph and event logic used in the runtime.

At compile time, Xrpa will convert the effect descriptions into C# (for Unity) or C++ (for Unreal Engine) code which communicates with the runtime. It will also generate game engine components (attachable to game objects) that can set parameters and run and/or spawn the effects.

Note: the signal processing DSL functions must be called within a XrpaDataflowProgram callback. See the example below.

## Example

To define an effect:

```js
export const HapticClick = XrpaDataflowProgram("HapticClick", () => {
  const gainChannel0 = ProgramInput("GainChannel0", Scalar(1, "Gain for the first LRA"));
  const gainChannel1 = ProgramInput("GainChannel1", Scalar(0, "Gain for the second LRA"));

  const amplitudeCurve = TrapezoidCurve({
    softCurve: true,
    lowValue: 0,
    highValue: 0.5,
    rampUpTime: 0.05,
    highHoldTime: 0.05,
    rampDownTime: 0.05,
  });

  // create a sine wave with the trapezoid curve as the amplitude, so it pulses
  const sinePulse = SineWave({frequency: 170, amplitude: amplitudeCurve});

  // kill the graph when the pulse is done
  DoneWhen(amplitudeCurve.onDone());

  // output to the HDK (waveform multiplied by the gain parameters)
  OutputToDevice({
    deviceName: strStartsWith("HDK"),
    source: StackChannels(
      Multiply(sinePulse, gainChannel0),
      Multiply(sinePulse, gainChannel1),
    ),
  });
});
```

To bind it into Unity (which will generate a MonoBehaviour for spawning/running the effect):

```js
await UnityProject(path.join(__dirname, ".."), "MyUnityProject", () => {
  bindExternalProgram(HapticClick);
});
```

## DSL vs visual editing

In this section I want to briefly talk about the pros and cons of using a DSL to describe a signal processing graph, rather than a visual editor built on top of a structured data format (such as JSON). Visual editors are great for visualizing data flow, and simple to get started with. They also allow for integrated visual debugging, so you can inspect the signal at various places in the graph. However, they become very difficult to use when doing anything more complicated, and take a significant amount of work to develop, maintain, and extend.

By contrast, a programming language such as this DSL scales much better. You can easily wrap up subgraphs by using functions, and provide a lot of configurability by using function parameters, loops, and conditionals. These functions can be bundled up into standard npm modules for reuse and sharing. This DSL is built in TypeScript, and we leverage the type checker to catch all kinds of errors that would have to be hand-coded if it was a visual editing environment. When we add new features, we don't have to build any UI so extending the DSL is cheap and fast. The downside, of course, is that there is no visual debugger (yet).

The following is an example of the encapsulation power that using a DSL provides. We can use existing API functions to create a configurable multi-tap delay:

```js
export function MultiTapDelay(
  source: ISignalNodeType,
  taps: Array<{ delayTimeMs: number, attenuation: number }>,
) {
  let output = source;
  for (const tap of taps) {
    output = MultiplyAdd(
      Delay(source, tap.delayTimeMs),
      tap.attenuation,
      output,
    );
  }
  return output;
}
```

Or, alternatively:

```js
export function MultiTapDelay(
  source: ISignalNodeType,
  taps: Array<{ delayTimeMs: number, attenuation: number }>,
) {
  return Add(source, ...taps.map(tap => Multiply(Delay(source, tap.delayTimeMs), tap.attenuation)));
}
```

You can make a library of convenience functions like this one, publish it to npm, and reuse it as many times as you want using an established software ecosystem.

## Signal Processing DSL

### Types
Here are some types you will see specified in the API below:
* `ISignalNodeType`
  * this type outputs a time-varying signal, processed in time slices (usually 10ms at a time), with a sample rate which the targeted output device requests
  * all signal processing functions return an `ISignalNodeType`
* `NonSignalNumericValue`
  * either a hardcoded number or a numeric program input (effect parameter)
* `NumericValue`
  * either an `ISignalNodeType` or a `NonSignalNumericValue`
* `FiresEvent`
  * this is an event-firing type, either a `SignalEvent` or a `SignalEventCombiner`
* `FiresDoneEvent`
  * an `ISignalNodeType` which fires a Done event when completed (ie curves, sequences)
  * these nodes have a function `onDone()` which will return a `FiresEvent` type that can be passed to
* `AcceptsStartEvent`
  * an `ISignalNodeType` which accepts an event parameter that will start the node's processing
  * these nodes have a function `setStartEvent` which takes a `FiresEvent` type and an optional autoStart boolean (the default behavior is to not start until the event fires, if a start event node is specified)

### Output and Lifecycle

`OutputToDevice()`
* Connects a signal to an output device (audio or haptic).
* Notes:
  * Use the String Matching functions to create a `StringFilter` for matching to an output device.
  * The optional `channelOffset` parameter specifies the channel index to map the source channel 0 onto. This is especially handy when you have a single-channel signal and want to output it to a specific haptic channel.
* Parameters: [params]
  * params: `{}`
    * deviceName: `StringFilter`
    * source: `ISignalNodeType`
    * channelOffset: number (optional, defaults to 0)
* Returns: `void`
---
`DoneWhen()`
* Specifies an event which, when fired, will trigger the effect to self-terminate.
* Notes:
  * This is typically used to terminate an effect after a volume envelope curve (or sequence of curves) is finished.
* Example: `DoneWhen(volumeCurve.onDone())`
* Parameters: [done]
  * done: `FiresEvent`
* Returns: `void`
---

### Parameterization
An effect can be parameterized using Xrpa's program interface functions. Including the relevant ones here for ease of reference.

Parameters defined in the effect definition will be exposed in the game engine. Their values can be changed at/before creation time or dynamically while an effect is running.

---
`ProgramInput()`
* Defines a named input to a program.
* Notes:
  * The return value can be passed into any function parameter that accepts a non-signal numeric type (Multiply, Add, frequency parameters, etc)
* Parameters: [name, dataType]
  * name: `string`
  * dataType: `XrpaDataType`
* Returns: `XrpaDataType` (same subtype as is passed in as the `dataType` parameter)
---
`Scalar()`
* Defines a scalar (unitless real number) data type.
* Parameters: [defaultValue, description]
  * defaultValue: `number` (optional, defaults to 1)
  * description: `string` (optional, if specified this description will be used in generated code and exposed in the game editor)
* Returns: `XrpaDataType`
---
`Count()`
* Defines a count (unitless integer) data type.
* Parameters: [defaultValue, description]
  * defaultValue: `number` (optional, defaults to 0)
  * description: `string` (optional, if specified this description will be used in generated code and exposed in the game editor)
* Returns: `XrpaDataType`
---
`Distance()`
* Defines a distance (a real number using spatial units) data type.
* Notes:
  * In Unity a distance value is specified in meters.
  * In Unreal Engine a distance value is specified in centimeters.
  * Inside the signal processing module a distance value's units will be in meters. If the value comes from Unreal Engine, it will automatically get converted from centimeters to meters.
* Parameters: [defaultValue, description]
  * defaultValue: `number` (optional, defaults to 0)
  * description: `string` (optional, if specified this description will be used in generated code and exposed in the game editor)
* Returns: `XrpaDataType`
---

### Waveform Generation
These functions generate signal waveforms which can be output to a device or further manipulated.

`SineWave()`
* Generates a sine wave signal.
* Parameters: [params]
  * params: `{}`
    * channelCount: `number` (optional, defaults to 1)
    * frequency: `NumericValue` (optional, defaults to 440)
    * amplitude: `NumericValue` (optional, defaults to 1)
    * bias: `NumericValue` (optional, defaults to 0)
* Returns: `ISignalNodeType`
---
`SawtoothWave()`
* Generates a sawtooth wave signal.
* Parameters: [params]
  * params: `{}`
    * channelCount: `number` (optional, defaults to 1)
    * frequency: `NumericValue` (optional, defaults to 440)
    * amplitude: `NumericValue` (optional, defaults to 1)
    * bias: `NumericValue` (optional, defaults to 0)
* Returns: `ISignalNodeType`
---
`TriangleWave`
* Generates a triangle wave signal.
* Parameters: [params]
  * params: `{}`
    * channelCount: `number` (optional, defaults to 1)
    * frequency: `NumericValue` (optional, defaults to 440)
    * amplitude: `NumericValue` (optional, defaults to 1)
    * bias: `NumericValue` (optional, defaults to 0)
* Returns: `ISignalNodeType`
---
`SquareWave()`
* Generates a sawtooth signal.
* Notes:
  * The `pulseWidth` parameter specifies the ration between the high-value and low-value regions of the square wave period.
  * The default `pulseWidth` of 0.5 means that half of the period is spent at the high value and the other half at the low value. A value of 0.75 means that 75% of the period is spent at the high value and 25% at the low value.
* Parameters: [params]
  * params: `{}`
    * channelCount: `number` (optional, defaults to 1)
    * frequency: `NumericValue` (optional, defaults to 440)
    * pulseWidth: `NumericValue` (optional, defaults to 0.5)
    * amplitude: `NumericValue` (optional, defaults to 1)
    * bias: `NumericValue` (optional, defaults to 0)
* Returns: `ISignalNodeType`
---
`WhiteNoise()`
* Generates a random white noise.
* Parameters: [params]
  * params: `{}`
    * channelCount: `number` (optional, defaults to 1)
    * amplitude: `NumericValue` (optional, defaults to 1)
    * bias: `NumericValue` (optional, defaults to 0)
* Returns: `ISignalNodeType`
---
`CustomWave()`
* Generates a signal with a custom repeating waveform.
* Notes:
  * Use `waveShape` array to specify control points for the shape of the waveform.
  * You can use any time scale you want in the `waveShape`. The total time of the shape will be discarded and the shape scaled to fit the desired period of the waveform (calculated from the `frequency` parameter).
  * The `softShape` parameter will round out the curve around the `waveShape` control points.
* Parameters: [params]
  * params: `{}`
    * channelCount: `number` (optional, defaults to 1)
    * frequency: `number`
    * amplitude: `number` (optional, defaults to 1)
    * waveShape: `Array<{}>`
      * time: `number`
      * value: `number`
    * softShape: `boolean` (optional, defaults to false)
* Returns: `ISignalNodeType`
---
`AudioStream()`
* Streams a signal from an audio file on disk.
* Notes:
  * This functionality is currently a bit limited. In the future you will be able to use events to start and stop the playback as well as scrub to a specific playback location.
  * Make sure you specify the correct number of channels that your audio file contains. You will get exactly the number of output channels you specify here.
* Parameters: [filename, params]
  * filename: `string`
  * params: `{}`
    * numChannels: `number` (optional, defaults to 1)
    * autoPlay: `boolean` (optional, defaults to true)
* Returns: `ISignalNodeType`

### Signal Modifiers

`SoftClip()`
* Applies a tanh function to the input signal, to ensure that all samples are within the range of [-1, 1].
* Parameters: [node]
  * node: `ISignalNodeType`
* Returns: `ISignalNodeType`
---
`ParametricEqualizer()`
* Applies a customizable parametric equalizer to the input signal.
* Notes:
  * This function is currently restricted to single or double channel input signals.
  * The `filters` array can contain up to 5 entries.
  * The `FilterTypeEnum` enum has the following options: [Bypass, Peak, LowShelf, HighShelf, LowPass, HighPass, BandPass]
  * The `gainAdjust` parameter optionally applies an overall gain modification to the output.
* Parameters: [params]
  * params: `{}`
    * source: `ISignalNodeType`
    * filters: `Array<{}>`
      * type: `FilterTypeEnum`
      * frequency: `NonSignalNumericValue`
      * q: `NonSignalNumericValue`
      * gain: `NonSignalNumericValue`
    * gainAdjust: `NonSignalNumericValue` (optional)
* Returns: `ISignalNodeType`
---
`LowPassFilter()`
* Applies a simple low-pass filter to the input signal. This is a convenience wrapper around `ParametricEqualizer`.
* Parameters: [signal, cutoffFrequency]
  * signal: `ISignalNodeType`
  * cutoffFrequency: `NonSignalNumericValue`
* Returns: `ISignalNodeType`
---
`HighPassFilter()`
* Applies a simple high-pass filter to the input signal. This is a convenience wrapper around `ParametricEqualizer`.
* Parameters: [signal, cutoffFrequency]
  * signal: `ISignalNodeType`
  * cutoffFrequency: `NonSignalNumericValue`
* Returns: `ISignalNodeType`
---
`BandPassFilter()`
* Applies a simple band-pass filter to the input signal. This is a convenience wrapper around `ParametricEqualizer`.
* Parameters: [signal, centerFrequency, q]
  * signal: `ISignalNodeType`
  * centerFrequency: `NonSignalNumericValue`
  * q: `NonSignalNumericValue` (optional, default value is 6)
* Returns: `ISignalNodeType`
---
`PitchShift()`
* Applies a pitch shift to the input signal.
* Notes:
  * Due to the nature of how realtime pitch shifting works, this node introduces a small amount of delay.
  * The pitch shift processor limits the `semitones` value to a single octave in either direction (range of [-12, 12]).
  * You can chain these together to get a bigger pitch shift, but you will increase the delay on the signal.
* Parameters: [signal, semitones]
  * signal: `ISignalNodeType`
  * semitones: `NonSignalNumericValue`
* Returns: `ISignalNodeType`
---

### Channel Manipulation

`RouteToChannel()`
* This function takes a single-channel input signal and outputs a multi-channel signal, with the input signal routed to a single output channel (or linear interpolated between two adjacent channels).
* Example:
  ```js
  const myOutput = RouteToChannel({
    source: SineWave(),
    channelSelect: 2,
    numOutputChannels: 5,
  });
  ```
  * The myOutput signal created here has 5 channels, with the source sine wave in channel 2 and the other channels with 0 value.
* Notes:
  * A fractional value for the `channelSelect` parameter will cause a linear interpolation of the source signal into channel `floor(channelSelect)` and channel `ceil(channelSelect)` based on the fractional amount.
* Parameters: [params]
  * params: `{}`
    * source: `ISignalNodeType`
    * channelSelect: `NumericValue`
    * numOutputChannels: `number`
* Returns: `ISignalNodeType`
---
`SelectChannel()`
* Extracts a single channel from a multi-channel input signal.
* Parameters: [params]
  * params: `{}`
    * signal: `ISignalNodeType`
    * channelIdx: `number`
* Returns: `ISignalNodeType`
---
`StackChannels()`
* Stacks multiple input signals into a single multi-channel output signal.
* Notes:
  * The input signals can be single channel or multi-channel. The output channel order will be in the same order as the inputs.
* Parameters: [...signals]
  * signals: `ISignalNodeType` (variadic parameter, supports an arbitrary number of input signals)
* Returns: `ISignalNodeType`
---
`RepeatAndStack()`
* Stacks an input signal with itself any number of times. This is a convenience wrapper around `StackChannels`.
* Parameters: [signal, count]
  * signal: `ISignalNodeType`
  * count: `number`
* Returns: `ISignalNodeType`
---

### Curves
These functions generate curves which are typically used as volume envelopes. Curve-generators fire a Done event upon completion, and also support delaying start until a start event is received. The curve will restart each time it receives a start event.

`TrapezoidCurve()`
* Generates a trapezoid-shaped curve, with a single low-value (for the start and end of the curve) and a single high-value.
* Notes:
  * Although they are termed "low-value" and "high-value" because that is how they are typically used, the high-value can actually be less than the low-value.
  * The `softCurve` parameter will round off the corners of the trapezoid curve shape.
  * The `initialHoldTime`, `rampUpTime`, `highHoldTime`, `rampDownTime`, and `finalHoldTime` parameters are all durations in seconds.
* Parameters: [params]
  * params: `{}`
    * softCurve: `boolean` (optional, defaults to false)
    * lowValue: `NonSignalNumericValue` (optional, defaults to 0)
    * highValue: `NonSignalNumericValue` (optional, defaults to 1)
    * initialHoldTime: `NonSignalNumericValue` (optional, defaults to 0)
    * rampUpTime: `NonSignalNumericValue` (optional, defaults to 0.25)
    * highHoldTime: `NonSignalNumericValue` (optional, defaults to 0.5)
    * rampDownTime: `NonSignalNumericValue` (optional, defaults to 0.25)
    * finalHoldTime: `NonSignalNumericValue` (optional, defaults to 0)
    * startEvent: `FiresEvent` (optional)
* Returns: `ISignalNodeType & AcceptsStartEvent & FiresDoneEvent`
---
`AdsrEnvelope()`
* Generates a curve using ADSR (attack, decay, sustain, release) parameters.
* Notes:
  * The `attackTime`, `decayTime`, `sustainTime`, and `releaseTime` parameters are all durations in seconds.
* Parameters: [params]
  * params: `{}`
    * attackTime: `NonSignalNumericValue` (optional, defaults to 0)
    * decayTime: `NonSignalNumericValue` (optional, defaults to 0.25)
    * sustainLevel: `NonSignalNumericValue` (optional, defaults to 0.8)
    * sustainTime: `NonSignalNumericValue` (optional, defaults to 0.5)
    * releaseTime: `NonSignalNumericValue` (optional, defaults to 0.25)
    * startEvent: `FiresEvent` (optional)
* Returns: `ISignalNodeType & AcceptsStartEvent & FiresDoneEvent`
---
`ClickPulse()`
* Generates a single square wave pulse and then ends. This is a convenience curve for when you want to output a simple hard click.
* Notes:
  * `preDelay` will optionally delay the pulse by some amount of time (in seconds)
  * `pulseWidth` is the duration (in seconds) that the pulse should stay at the high value of 1
  * `startEvent` is an optional event that should trigger this pulse. If specified, the pulse will not fire until it receives the event. Repeated events will fire the pulse each time.
* Parameters: [params]
  * params: `{}`
    * preDelay: `NonSignalNumericValue` (optional, defaults to 0)
    * pulseWidth: `NonSignalNumericValue` (optional, defaults to 0.05)
    * startEvent: `FiresEvent` (optional)
* Returns: `ISignalNodeType & AcceptsStartEvent & FiresDoneEvent`
---
`Sequence()`
* Orders curve-generators so that they execute in sequence.
* Notes:
  * Internally this uses a multiplexer to select a single input curve value at a time, and connects the curve-generator start and done events to each other to make them work in sequence.
  * The `loop` parameter will cause the sequence to start over when the last curve ends.
  * The `autoStart` parameter will cause the sequence to start automatically when the effect starts. This defaults to false if there is a `startEvent` specified, otherwise it defaults to true.
* Parameters: [params]
  * params: `{}`
    * elements: `Array<ISignalNodeType & AcceptsStartEvent & FiresDoneEvent>`
    * loop: `boolean` (optional, defaults to false)
    * startEvent: `FiresEvent` (optional)
    * autoStart: `boolean` (optional, see notes)
* Returns: `ISignalNodeType & FiresDoneEvent`
---

### Delay and Feedback

`Delay()`
* Delays a signal by some amount of time.
* Parameters: [source, delayTimeMs]
  * source: `ISignalNodeType`
  * delayTimeMs: `NonSignalNumericValue`
* Returns: `ISignalNodeType`
---
`Feedback()`
* Creates a buffer for feeding back a signal to an earlier part of the signal processing graph.
* Notes:
  * Signal processing is a directed-acyclic graph, which normally means you cannot create cycles. This processing node allows you to feedback a signal by introducing a single-frame delay buffer.
  * The delay introduced by the Feedback node is 10ms, which is the size of a single frame of signal processing.
  * To use feedback: create a Feedback node, use it as the source for some processing, and then later in the effect definition you can call `setSource()` on the feedback node to feed a signal into the buffer.
* Example:
  ```js
  // create a feedback-delay loop for echo
  const feedback = Feedback();
  const outputSignal = MultiplyAdd(feedback, 0.25, SineWave()); // decay the feedback signal and add to the source signal
  feedback.setSource(Delay(outputSignal, 500)); // delay the resulting output signal by 500ms and feed it back
  ```
* Parameters: []
* Returns: `ISignalNodeType & { setSource(source: ISignalNodeType): void }`
---

### Signal Math Operations

`Add()`
* Sums all input signal and numeric values together.
* Parameters: [node, ...values]
  * node: `ISignalNodeType`
  * values: `Array<NumericValue>` (variadic argument, supporting an arbitrary number of values)
* Returns: `ISignalNodeType`
---
`Subtract()`
* Subtracts one signal or numeric value from another.
  * Parameters: [operandA, operandB]
    * operandA: `NumericValue`
    * operandB: `NumericValue`
* Returns: `ISignalNodeType`
---
`Multiply()`
* Multiplies all input signal and numeric values together.
* Parameters: [node, ...values]
  * node: `ISignalNodeType`
  * values: `Array<NumericValue>` (variadic argument, supporting an arbitrary number of values)
* Returns: `ISignalNodeType`
---
`MultiplyAdd()`
* Multiplies two input signal and numeric values together and sums that with another signal or numeric value.
* Parameters: [value, mul, add]
  * value: `ISignalNodeType`
  * mul: `NumericValue`
  * add: `NumericValue`
* Returns: `ISignalNodeType`
---
`Average()`
* Sums all input signals together, then divides by the number of inputs.
* Parameters: [...values]
  * values: `Array<ISignalNodeType>` (variadic argument, supporting an arbitrary number of values)
* Returns: `ISignalNodeType`
---

### String Matching
These functions are used to generate string-matching expressions used for OutputToDevice.

---
`strStartsWith()`
* Creates a `StringFilter` for any string starting with the specified prefix.
* Parameters: [prefix]
  * prefix: `string`
* Returns: `StringFilter`
---
`strEndsWith()`
* Creates a `StringFilter` for any string ending with the specified suffix.
* Parameters: [suffix]
  * suffix: `string`
* Returns: `StringFilter`
---
`strContains()`
* Creates a `StringFilter` for any string containint the specified substr.
* Parameters: [substr]
  * substr: `string`
* Returns: `StringFilter`
---
`strEquals()`
* Creates a `StringFilter` for any string exactly equal to the specified str.
* Parameters: [str]
  * str: `string`
* Returns: `StringFilter`
---
