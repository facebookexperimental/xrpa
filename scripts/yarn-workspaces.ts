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

import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

interface PackageInfo {
  name: string;
  path: string;
  packageJsonPath: string;
  packageJson: Record<string, any>;
}

export class YarnWorkspaceBuildOrderGenerator {
  public rootPath: string;
  public packages: Map<string, PackageInfo> = new Map();
  public dependencyGraph: Map<string, Set<string>> = new Map();

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Discover all workspace packages
   */
  discoverPackages() {
    const rootPackageJson = JSON.parse(
      fs.readFileSync(path.join(this.rootPath, 'package.json'), 'utf8')
    );

    console.log('🔍 Discovering workspace packages...\n');

    for (const workspacePattern of rootPackageJson.workspaces) {
      this.expandWorkspacePattern(workspacePattern).forEach(dir => {
        const packageJsonPath = path.join(this.rootPath, dir, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = fs.readJsonSync(packageJsonPath);
            if (packageJson.name) {
              this.packages.set(packageJson.name, {
                name: packageJson.name,
                path: dir,
                packageJsonPath: packageJsonPath,
                packageJson: packageJson
              });
              console.log(`  📦 Found: ${packageJson.name} (${dir})`);
            }
          } catch (error) {
            console.warn(`⚠️  Warning: Could not parse ${packageJsonPath}: ${String(error)}`);
          }
        }
      });
    }

    console.log(`\n✅ Discovered ${this.packages.size} packages total\n`);
  }

  /**
   * Expand workspace patterns like "core/*" to actual directories
   */
  expandWorkspacePattern(pattern: string) {
    const directories: string[] = [];

    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      const fullPath = path.join(this.rootPath, basePath);

      if (fs.existsSync(fullPath)) {
        fs.readdirSync(fullPath, { withFileTypes: true })
          .filter(entry => entry.isDirectory())
          .forEach(entry => {
            directories.push(path.join(basePath, entry.name));
          });
      }
    } else {
      directories.push(pattern);
    }

    return directories;
  }

  /**
   * Build dependency graph from package.json dependencies
   */
  buildDependencyGraph() {
    console.log('🔗 Building dependency graph...\n');

    for (const [packageName, packageInfo] of this.packages) {
      const deps: Set<string> = new Set();

      // Check all dependency types for workspace packages
      ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
        if (packageInfo.packageJson[depType]) {
          Object.keys(packageInfo.packageJson[depType]).forEach(depName => {
            if (this.packages.has(depName)) {
              deps.add(depName);
              // console.log(`  ${packageName} depends on ${depName}`);
            }
          });
        }
      });

      this.dependencyGraph.set(packageName, deps);
    }

    console.log('\n');
  }

  /**
   * Perform topological sort to get build order
   */
  getTopologicalOrder() {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (packageName: string) => {
      if (visiting.has(packageName)) {
        throw new Error(`❌ Circular dependency detected involving: ${packageName}`);
      }

      if (visited.has(packageName)) {
        return;
      }

      visiting.add(packageName);

      const deps = this.dependencyGraph.get(packageName) || new Set();
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(packageName);
      visited.add(packageName);
      order.push(packageName);
    };

    // Visit all packages to ensure complete ordering
    for (const packageName of this.packages.keys()) {
      visit(packageName);
    }

    return order;
  }

  /**
   * Generate yarn workspace build commands in dependency order
   */
  executeCommand(command: string[]) {
    this.discoverPackages();
    this.buildDependencyGraph();

    const buildOrder = this.getTopologicalOrder();
    for (const packageName of buildOrder) {
      const packageInfo = this.packages.get(packageName);
      if (packageInfo) {
        const packagePath = path.join(this.rootPath, packageInfo.path);
        console.log(`${packageName}> yarn ${command.join(' ')}`);
        execSync(`yarn ${command.join(' ')}`, { stdio: 'inherit', cwd: packagePath });
      }
    }
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: yarn-workspaces <command>');
    process.exit(1);
  }
  const workspacePath = process.cwd();

  console.log(`📂 Working directory: ${workspacePath}\n`);

  try {
    const generator = new YarnWorkspaceBuildOrderGenerator(workspacePath);
    generator.executeCommand(args);
  } catch (error) {
    console.error(`\n❌ Error: ${String(error)}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
