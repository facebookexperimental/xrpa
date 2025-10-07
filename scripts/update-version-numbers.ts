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

import * as fs from "fs-extra";
import * as path from "path";

import { YarnWorkspaceBuildOrderGenerator } from "./update-build-order";

function main() {
  const workspacePath = process.cwd();
  const generator = new YarnWorkspaceBuildOrderGenerator(workspacePath);
  generator.discoverPackages();

  const rootPackageJson = fs.readJsonSync(path.join(workspacePath, "package.json"));
  const version = rootPackageJson.version;

    for (const [_, packageInfo] of generator.packages) {
      // Check all dependency types for workspace packages
      ["dependencies", "devDependencies", "peerDependencies"].forEach(depType => {
        if (packageInfo.packageJson[depType]) {
          Object.keys(packageInfo.packageJson[depType]).forEach(depName => {
            if (generator.packages.has(depName)) {
              packageInfo.packageJson[depType][depName] = `^${version}`;
            }
          });
        }
      });

      packageInfo.packageJson.version = version;
      fs.writeJsonSync(packageInfo.packageJsonPath, packageInfo.packageJson, { spaces: 2 });
    }
}

if (require.main === module) {
  main();
}
