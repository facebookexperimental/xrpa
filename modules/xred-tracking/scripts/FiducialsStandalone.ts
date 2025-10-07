/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import { FiducialsStandalone } from "./FiducialsModule";

if (require.main === module) {
  FiducialsStandalone.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
