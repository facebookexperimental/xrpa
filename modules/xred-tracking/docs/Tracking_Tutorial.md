# Tracking Tutorial

In this tutorial, we will set up a Unity project and integrate tracking for an STO tracker.

## Create a Unity project

Use Unity Hub to create a new Unity project. You can also use an existing project if you like.

## Setup Xrpa

Xrpa is a framework which facilitates connecting disparate software components together at a high level. The signal processing module is built to be used within this framework.

From the root directory of your Unity project, run the following PowerShell commands to download the necessary configuration files for using Xrpa and the signal processing module:
```
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/facebookexperimental/xrpa/main/xrpa-init/package.json" -OutFile ./package.json
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/facebookexperimental/xrpa/main/xrpa-init/tsconfig.json" -OutFile ./tsconfig.json
mkdir js
Add-Content -Path .gitignore -Value "/node_modules/"
```

Create a new file `js/index.ts` in VSCode or any other code editor. Fill it with the following contents:

`js/index.ts`
```js
import path from "path";
import { XredTrackingInterface } from "@xrpa/xred-tracking";
import { bindExternalProgram, UnityProject } from "@xrpa/xrpa-orchestrator";

UnityProject(path.join(__dirname, ".."), "your-project-name", () => {
  bindExternalProgram(XredTrackingInterface);
}).catch((e) => {
  console.error(e);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
```

The call to `UnityProject()` does most of the heavy lifting here. The first parameter is the path to the root of the Unity project. The second parameter is a string specifying the name of your project. Change this to match your Unity project name. The third parameter is a closure in which you define what you want Xrpa to integrate into your project.

The `bindExternalProgram()` call within the callback scope tells Xrpa to generate MonoBehaviour classes for binding with the xred-tracking module. Adding one of these components to your game objects will bind the object's transform to the incoming tracking information from a connected STO.

Open package.json in a text editor and change the name and description to something relevant to your project. Then run the following PowerShell commands from the root directory of your project:
```
yarn
yarn update
git add .
git commit -m "Setup xrpa config and install dependencies"
```

### Adding tracking to an existing Xrpa setup (optional)

If you are adding tracking to an existing Xrpa-enabled project, you just need to add the single `bindExternalProgram(XredTrackingInterface)` call to your `js/index.ts` file. For example, if you have a project already using signal processing, your index.ts will look something like this:

`js/index.ts`
```js
import path from "path";
import { XredSignalOutputInterface } from "@xrpa/xred-signal-output";
import { XredTrackingInterface } from "@xrpa/xred-tracking";
import { bindExternalProgram, UnityProject } from "@xrpa/xrpa-orchestrator";

import { TestEffect } from "./TestEffect";

const UnityEffects = [
  // Put your effects here, for them to show up as Unity components
  TestEffect,
];

UnityProject(path.join(__dirname, ".."), "your-project-name", () => {
  bindExternalProgram(XredSignalOutputInterface);
  bindExternalProgram(XredTrackingInterface);

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

Then run `yarn update` from a PowerShell window at the root directory of your project to make Xrpa generate the tracking binding classes.

## Tracking Runtime
Tracking information comes from the xred-tracking module. Currently you need to start this module manually and leave it running in the background. In the future the module will be embedded as a dll into your Unity project and you won't need to do this, but for now it needs to be run as standalone process.

From a PowerShell window (**not administrator mode**), simply navigate to the root directory of your project and run `yarn STO`. This window will display information about connectivity with the STO and dongle, so this is a good place to verify that your STO is connected and working.

To exit this module, just press the enter key with the window in focus. Rerun it at any time if you accidentally exit.

## Add tracking in Unity

Load up your project in Unity. Create an object in your scene, select it, then click "Add Component". Type "Tracked" into the search box and select "Tracked Object Component".

In the object properties for the Tracked Object Component, type "STO1" in the "Name" field to have it bind the the first STO tracker (use "STO2" for the second, if connected).

Make sure that the tracking module is running (from the `yarn STO` PowerShell command), then run the game. Move your STO around and you will see the game object moving around to match.

Note that the identity pose for the tracker is determined based on the position and orientation of the physical tracker when the tracking module is started. You can also call the `ResetPose()` function on the MonoBehaviour to set the current physical pose as identity in Unity.
