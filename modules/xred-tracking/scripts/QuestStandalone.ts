/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import { QuestStandalone } from "./QuestModule";

export async function doCodegen() {
  await QuestStandalone.doCodeGen().finalize(QuestStandalone.manifestFilename);
}

export async function doBuild() {
  const { runProcess } = await import("@xrpa/xrpa-file-utils");
  const mode = QuestStandalone.getBuckMode("debug");
  const target = await QuestStandalone.getStandaloneTarget();

  await runProcess({
    filename: "buck2",
    args: ["build", mode, target],
    onLineReceived: line => console.log(line),
  });
}

export async function doRun() {
  const { buckRun } = await import("@xrpa/xrpa-file-utils");

  await buckRun({
    mode: QuestStandalone.getBuckMode("debug"),
    target: await QuestStandalone.getStandaloneTarget(),
    resourceFilenames: (QuestStandalone as any).resourceFilenames || [],
  });
}

export async function doCodegenAndBuild() {
  await doCodegen();
  await doBuild();
}

export async function runStandalone() {
  await QuestStandalone.buckRunDebug();
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--codegen-only')) {
    doCodegen().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else if (args.includes('--build-only')) {
    doBuild().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else if (args.includes('--run-only')) {
    doRun().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else if (args.includes('--codegen-and-build')) {
    doCodegenAndBuild().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  } else {
    runStandalone().catch((e) => {
      console.error(e);
      process.exit(1);
    }).then(() => {
      process.exit(0);
    });
  }
}
