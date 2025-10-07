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


import { AsyncThunk, chainAsyncThunk, resolveAsyncThunk , removeSuperfluousEmptyLines } from "@xrpa/xrpa-utils";
import fs from "fs-extra";
import path from "path";

import { hashCheck, recursiveDirScan } from "./FileUtils";

async function writeFileIfUnchanged(filename: string, filedata: Buffer) {
  await fs.ensureFile(filename);

  const oldfiledata = await fs.readFile(filename);
  if (!hashCheck(filedata, oldfiledata)) {
    await fs.writeFile(filename, filedata, "utf-8");
  }
}

function normalizeManifestPath(filename: string) {
  return filename.split("\\").join("/");
}

function linesToBuffer(lines: string[]): Buffer {
  const linesOut = removeSuperfluousEmptyLines(lines);
  if (linesOut[linesOut.length - 1] !== "") {
    linesOut.push("");
  }
  return Buffer.from(linesOut.join("\n"));
}

type PreprocessorFunc = (srcRelPath: string, fileExt: string, fileData: Buffer) => Buffer|null;

export class FileWriter {
  private manifest: Record<string, AsyncThunk<Buffer>> = {};
  private foldersToCopy: Array<{ srcFolder: string, dstFolder: string, preprocessor?: PreprocessorFunc }> = [];

  public writeFile(filename: string, contents: AsyncThunk<string[]>) {
    this.manifest[normalizeManifestPath(filename)] = chainAsyncThunk(contents, linesToBuffer);
  }

  public writeFileBase64(filename: string, data: AsyncThunk<string>) {
    this.manifest[normalizeManifestPath(filename)] = chainAsyncThunk(data, res => Buffer.from(res, "base64"));
  }

  public merge(fileWriter: FileWriter) {
    for (const filename in fileWriter.manifest) {
      this.manifest[filename] = fileWriter.manifest[filename];
    }
    this.foldersToCopy.push(...fileWriter.foldersToCopy);
  }

  public copyFolderContents(srcFolder: string, dstFolder: string, preprocessor?: PreprocessorFunc) {
    this.foldersToCopy.push({ srcFolder, dstFolder, preprocessor });
  }

  public async finalize(manifestFilename: string) {
    for (const {srcFolder, dstFolder, preprocessor} of this.foldersToCopy) {
      const filenames: string[] = [];
      await recursiveDirScan(srcFolder, filenames);
      for (const srcFilename of filenames) {
        const srcRelPath = path.relative(srcFolder, srcFilename);
        const dstFilename = path.join(dstFolder, srcRelPath);
        const fileData = await fs.readFile(srcFilename);
        const fileDataOut = preprocessor ? preprocessor(normalizeManifestPath(srcRelPath), path.extname(srcFilename), fileData) : fileData;
        if (fileDataOut !== null) {
          this.manifest[normalizeManifestPath(dstFilename)] = fileDataOut;
        }
      }
    }

    const baseDir = path.dirname(manifestFilename);
    const newManifest: Record<string, Buffer> = {};
    for (const fullPath in this.manifest) {
      const newKey = normalizeManifestPath(path.relative(baseDir, fullPath));
      const entry = this.manifest[fullPath];
      newManifest[newKey] = await resolveAsyncThunk(entry);
    }

    try {
      const oldManifest = await fs.readJson(manifestFilename);
      for (const filename of oldManifest) {
        if (!(filename in newManifest)) {
          try {
            await fs.remove(path.join(baseDir, filename));
          } catch (err2) {
            // ignore
          }
        }
      }
    } catch (err) {
      // ignore
    }

    for (const relFilename in newManifest) {
      const filedata = newManifest[relFilename];
      const filename = path.join(baseDir, relFilename);
      await writeFileIfUnchanged(filename, filedata);
    }

    const manifestData = JSON.stringify(Object.keys(newManifest).sort(), null, 2);
    await writeFileIfUnchanged(manifestFilename, Buffer.from(manifestData));
  }
}
