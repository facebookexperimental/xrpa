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

import { exec } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function findEnvironmentYaml(moduleName: string): Promise<string> {
  const moduleDir = path.join(__dirname, '..', 'modules', moduleName);
  const subdirs = await fs.readdir(moduleDir);

  for (const subdir of subdirs) {
    const envPath = path.join(moduleDir, subdir, 'environment.yaml');
    if (await fs.pathExists(envPath)) return envPath;
  }

  throw new Error(`Could not find environment.yaml for module ${moduleName}`);
}

async function getEnvName(yamlPath: string): Promise<string> {
  const content = await fs.readFile(yamlPath, 'utf-8');
  const match = content.match(/^name:\s*(.+)$/m);
  if (!match) throw new Error(`Could not extract environment name from ${yamlPath}`);
  return match[1].trim();
}

async function packageEnv(moduleName: string, platform: string, bucket: string, force: boolean) {
  console.log(`\nPackaging ${moduleName} for ${platform}...`);

  const envPath = await findEnvironmentYaml(moduleName);
  const envName = await getEnvName(envPath);
  const platformName = platform === 'mac_universal' ? 'osx-arm64' : 'win-64';
  const archiveName = `${platformName}-latest.tar.gz`;
  const manifoldPath = `tree/conda_envs/${moduleName}/${archiveName}`;
  const localPath = path.join(os.tmpdir(), archiveName);

  console.log(`Environment: ${envName}`);

  // Check if exists
  if (!force) {
    try {
      await execPromise(`manifold ls ${bucket}/${manifoldPath}`);
      console.log(`✓ Already exists: manifold://${bucket}/${manifoldPath}`);
      console.log('Use --force to rebuild');
      return;
    } catch (error: any) {
      // File doesn't exist or other error - log and continue
      if (error.message && !error.message.includes('not found')) {
        console.log(`Warning: Could not check manifold (${error.message}), proceeding with build...`);
      }
    }
  }

  // Remove existing env
  try {
    const { stdout } = await execPromise('conda env list --json');
    const envList = JSON.parse(stdout);
    const exactMatch = envList.envs.some((e: string) => path.basename(e) === envName);
    if (exactMatch) {
      console.log('Removing existing environment...');
      await execPromise(`conda env remove -n ${envName} -y`);
    }
  } catch (error: any) {
    console.log(`Warning: Could not check for existing environment (${error.message})`);
  }

  // Create environment
  console.log('Creating conda environment...');
  const { stdout, stderr } = await execPromise(`conda env create -f ${envPath}`);
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);

  // Package
  console.log('Packaging with conda-pack...');
  const packResult = await execPromise(`conda pack -n ${envName} -o ${localPath} --force`);
  if (packResult.stdout) console.log(packResult.stdout);
  if (packResult.stderr) console.error(packResult.stderr);

  // Upload
  console.log('Uploading to Manifold...');
  const uploadResult = await execPromise(`manifold put ${localPath} ${bucket}/${manifoldPath}`);
  if (uploadResult.stdout) console.log(uploadResult.stdout);
  if (uploadResult.stderr) console.error(uploadResult.stderr);

  // Cleanup
  try {
    await fs.remove(localPath);
  } catch (error: any) {
    console.log(`Warning: Could not remove temporary file ${localPath}: ${error.message}`);
  }

  console.log(`\n✓ Success: manifold://${bucket}/${manifoldPath}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: tsx scripts/package-conda-env.ts <module-name> [options]

Options:
  --platform <name>   mac_universal (default) or windows
  --bucket <name>     Manifold bucket (default: xrpa_build_installers)
  --force             Force rebuild

Examples:
  tsx scripts/package-conda-env.ts xred-audio-transcription
  tsx scripts/package-conda-env.ts xred-gesture-detection --force
    `);
    process.exit(0);
  }

  const moduleName = args[0];
  let platform = 'mac_universal';
  let bucket = 'xrpa_build_installers';
  let force = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--platform') {
      if (!args[i + 1]) throw new Error('--platform requires a value');
      platform = args[++i];
    } else if (args[i] === '--bucket') {
      if (!args[i + 1]) throw new Error('--bucket requires a value');
      bucket = args[++i];
    } else if (args[i] === '--force') {
      force = true;
    }
  }

  try {
    await packageEnv(moduleName, platform, bucket, force);
  } catch (error) {
    console.error(`\n✗ Error: ${error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
