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


import assert from "assert";
import child_process from "child_process";
import crypto from "crypto";
import fs from "fs-extra";
import path from "path";

export class HashValue {
  public readonly values: string[];

  constructor(str: string | Buffer) {
    const hash = crypto.createHash("sha256");
    hash.update(str);
    const hexHash = hash.digest("hex");

    assert(hexHash.length === 64);
    this.values = [
      hexHash.slice(0, 16),
      hexHash.slice(16, 32),
      hexHash.slice(32, 48),
      hexHash.slice(48, 64),
    ];
  }
}

export function hashCheck(a: string | Buffer, b: string | Buffer): boolean {
  const hashA = crypto.createHash("sha256");
  hashA.update(a);

  const hashB = crypto.createHash("sha256");
  hashB.update(b);

  return hashA.digest("hex") === hashB.digest("hex");
}

export async function runProcess(params: {
  filename: string;
  args?: string[];
  cwd?: string;
  onLineReceived?: (line: string) => void;
  pipeStdout?: boolean;
}) {
  const p = new Promise<string>((resolve, reject) => {
    const child = child_process.spawn(params.filename, params.args, { cwd: params.cwd });

    const dataLines: string[] = [];
    let dataString = "";
    let errorString = "";

    child.stdout.on('data', (data: Buffer) => {
      dataString = dataString + data.toString().replace(/\r\n/g, "\n");

      if (dataString.includes("\n")) {
        const lines = dataString.split("\n");
        dataString = lines.pop() ?? "";
        dataLines.push(...lines);
        params.onLineReceived && lines.forEach(params.onLineReceived);
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      errorString = errorString + data.toString();

      if (errorString.includes("\n")) {
        const lines = errorString.split("\n");
        errorString = lines.pop() ?? "";
        params.onLineReceived && lines.forEach(params.onLineReceived);
      }
    });

    child.on('error', error => {
      reject(error);
    });

    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`${params.filename} exited with code ${code}`));
      } else {
        if (dataString) {
          dataLines.push(dataString);
          dataString = "";
        }
        resolve(dataLines.join("\n"));
      }
    });

    process.stdin.pipe(child.stdin);
    if (params.pipeStdout) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }
  });

  return p;
}

export async function isDirectory(pathname: string): Promise<boolean> {
  try {
    const stat = await fs.stat(pathname);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}

export async function recursiveDirScan(fullpath: string, filenames: string[]): Promise<void> {
  if (await isDirectory(fullpath)) {
    const files = await fs.readdir(fullpath);
    for (const filename of files) {
      await recursiveDirScan(path.join(fullpath, filename), filenames);
    }
  } else {
    filenames.push(fullpath);
  }
}

export async function stripDebugAsserts(dirPath: string): Promise<void> {
  console.log(`Stripping debug asserts from files in ${dirPath}...`);

  const filenames: string[] = [];
  await recursiveDirScan(dirPath, filenames);

  const runtimeFiles = filenames.filter(file =>
    file.endsWith('.cpp') ||
    file.endsWith('.h') ||
    file.endsWith('.cs') ||
    file.endsWith('.py')
  );

  for (const file of runtimeFiles) {
    let content = await fs.readFile(file, 'utf8');

    // Strip C++ debug asserts
    content = content.replace(/^\s*xrpaDebugBoundsAssert\([^)]*\);?\s*\n/gm, '');
    content = content.replace(/^\s*xrpaDebugAssert\([^)]*\);?\s*\n/gm, '');

    // Strip C# debug asserts
    content = content.replace(/^\s*XrpaUtils\.BoundsAssert\([^)]*\);?\s*\n/gm, '');
    content = content.replace(/^\s*XrpaUtils\.DebugAssert\([^)]*\);?\s*\n/gm, '');

    // Strip Python debug asserts
    content = content.replace(/^\s*xrpa_debug_bounds_assert\([^)]*\);?\s*\n/gm, '');
    content = content.replace(/^\s*xrpa_debug_assert\([^)]*\);?\s*\n/gm, '');

    // Strip multiline debug asserts (for longer assert statements that span multiple lines)
    content = content.replace(/^\s*xrpaDebugBoundsAssert\([\s\S]*?\);?\s*\n/gm, '');
    content = content.replace(/^\s*xrpaDebugAssert\([\s\S]*?\);?\s*\n/gm, '');
    content = content.replace(/^\s*XrpaUtils\.BoundsAssert\([\s\S]*?\);?\s*\n/gm, '');
    content = content.replace(/^\s*XrpaUtils\.DebugAssert\([\s\S]*?\);?\s*\n/gm, '');
    content = content.replace(/^\s*xrpa_debug_bounds_assert\([\s\S]*?\);?\s*\n/gm, '');
    content = content.replace(/^\s*xrpa_debug_assert\([\s\S]*?\);?\s*\n/gm, '');

    await fs.writeFile(file, content, 'utf8');
  }

  console.log(`Finished stripping debug asserts from ${runtimeFiles.length} files.`);
}
