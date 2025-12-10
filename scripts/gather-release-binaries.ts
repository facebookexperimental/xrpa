/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { recursiveDirScan } from "@xrpa/xrpa-file-utils";
import fs from "fs-extra";
import path from "path";


async function copyBinFiles(src: string, dst: string) {
  await fs.remove(dst);

  const filenames: string[] = [];
  console.log("Scanning for bin files in " + src);
  await recursiveDirScan(src, filenames);

  for (const fullpath of filenames) {
    const relativePath = path.relative(src, fullpath);
    const pathSegments = relativePath.split(path.sep);

    if (pathSegments[1] === "bin") {
      pathSegments.splice(1, 1);
      const dstRelativePath = pathSegments.join(path.sep);
      const dstPath = path.join(dst, dstRelativePath);
      console.log("Copying " + fullpath + " to " + dstPath);
      await fs.ensureDir(path.dirname(dstPath));
      await fs.copy(fullpath, dstPath);
    }
  }
}

async function main() {
  if (process.platform === "darwin") {
    const root = process.env.HOME || process.env.USERPROFILE || "";
    await copyBinFiles(
      path.join(root, "fbsource/arvr/libraries/xred/xrpa/modules/"),
      path.join(root, "/xrpabin/"),
    );
  } else if (process.platform === "win32") {
    await copyBinFiles(
      "C:\\open\\fbsource\\arvr\\libraries\\xred\\xrpa\\modules\\",
      "C:\\open\\xrpabin\\",
    );
  } else {
    console.error("Unsupported platform");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
