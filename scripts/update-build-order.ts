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
              console.log(`  ${packageName} depends on ${depName}`);
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
  generateBuildCommands() {
    console.log('⚙️  Generating build commands...\n');

    this.discoverPackages();
    this.buildDependencyGraph();

    const buildOrder = this.getTopologicalOrder();

    // Separate core and modules based on directory structure
    const corePackages = buildOrder.filter(name => {
      const pkg = this.packages.get(name);
      return pkg && pkg.path.startsWith('core/');
    });

    const modulePackages = buildOrder.filter(name => {
      const pkg = this.packages.get(name);
      return pkg && pkg.path.startsWith('modules/');
    });

    console.log('📋 Build Order Analysis:');
    console.log('\n🏗️  Core packages (in dependency order):');
    corePackages.forEach((name, i) => {
      const pkg = this.packages.get(name);
      pkg && console.log(`  ${i + 1}. ${name} (${pkg.path})`);
    });

    console.log('\n🔧 Module packages (in dependency order):');
    modulePackages.forEach((name, i) => {
      const pkg = this.packages.get(name);
      pkg && console.log(`  ${i + 1}. ${name} (${pkg.path})`);
    });

    // Generate yarn workspace commands
    const commands = {
      'build:core': corePackages.map(name => `yarn workspace ${name} run build`).join(' && '),
      'build:modules': modulePackages.map(name => `yarn workspace ${name} run build`).join(' && ')
    };

    console.log('\n🚀 Generated Commands:');
    console.log(`\nbuild:core:`);
    console.log(`${commands['build:core']}`);
    console.log(`\nbuild:modules:`);
    console.log(`${commands['build:modules']}`);

    return {
      buildOrder,
      corePackages,
      modulePackages,
      commands
    };
  }

  /**
   * Update package.json with generated commands
   */
  updatePackageJson() {
    const result = this.generateBuildCommands();
    const packageJsonPath = path.join(this.rootPath, 'package.json');
    const packageJson = fs.readJsonSync(packageJsonPath);

    // Store original commands for comparison
    const originalCore = packageJson.scripts['build:core'];
    const originalModules = packageJson.scripts['build:modules'];

    // Update the build commands
    packageJson.scripts['build:core'] = result.commands['build:core'];
    packageJson.scripts['build:modules'] = result.commands['build:modules'];

    // Write back with proper formatting
    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

    console.log('\n✅ Updated package.json successfully!');

    // Show what changed
    if (originalCore !== result.commands['build:core']) {
      console.log('\n📝 Changes made to build:core command');
    } else {
      console.log('\n📝 No changes needed for build:core (already correct)');
    }

    if (originalModules !== result.commands['build:modules']) {
      console.log('📝 Changes made to build:modules command');
    } else {
      console.log('📝 No changes needed for build:modules (already correct)');
    }

    return result;
  }

  /**
   * Add a convenient script to package.json for future updates
   */
  addUpdateScript() {
    const packageJsonPath = path.join(this.rootPath, 'package.json');
    const packageJson = fs.readJsonSync(packageJsonPath);

    // Add the update script if it doesn't exist
    if (!packageJson.scripts['update-build-order']) {
      packageJson.scripts['update-build-order'] = 'node scripts/update-build-order.js --update';
      fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
      console.log('\n➕ Added "update-build-order" script for future use');
    }
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const shouldUpdate = args.includes('--update');
  const workspacePath = process.cwd();

  console.log('🚀 XRPA Workspace Build Order Generator\n');
  console.log(`📂 Working directory: ${workspacePath}\n`);

  const generator = new YarnWorkspaceBuildOrderGenerator(workspacePath);

  try {
    if (shouldUpdate) {
      const result = generator.updatePackageJson();
      generator.addUpdateScript();
      console.log('\n🎉 Build order has been automatically updated!');
      console.log('\n💡 Next time, you can run: yarn update-build-order');
    } else {
      generator.generateBuildCommands();
      console.log('\n💡 To update package.json, run: node scripts/update-build-order.js --update');
    }
  } catch (error) {
    console.error(`\n❌ Error: ${String(error)}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
