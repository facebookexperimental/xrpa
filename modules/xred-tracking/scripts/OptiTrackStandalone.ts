/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 */

import { OptiTrackStandalone } from "./OptiTrackModule";

if (require.main === module) {
  OptiTrackStandalone.smartExecute().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(() => {
    process.exit(0);
  });
}
