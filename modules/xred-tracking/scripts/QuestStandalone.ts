/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import { QuestStandalone } from "./QuestModule";

if (require.main === module) {
  QuestStandalone.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
