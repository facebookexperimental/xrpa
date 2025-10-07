/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import { PulsarSTOStandalone } from "./PulsarSTOModule";

if (require.main === module) {
  PulsarSTOStandalone.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
