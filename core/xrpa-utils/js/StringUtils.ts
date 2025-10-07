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


import { collapse } from "./ArrayUtils";

export function indent(count: number, lines: string | string[] | string[][]): string[] {
  const indentStr = " ".repeat(count * 2);
  const ret: string[] = [];
  if (typeof lines === "string") {
    ret.push(indentStr + lines);
  } else {
    for (const line of lines) {
      if (Array.isArray(line)) {
        ret.push(...line.map(str => str ? (indentStr + str) : str));
      } else {
        ret.push(line ? (indentStr + line) : line);
      }
    }
  }
  return ret;
}

export function indentMatch(str1: string, str2: string): boolean {
  let indent1 = 0;
  for (indent1 = 0; indent1 < str1.length; ++indent1) {
    if (str1.charAt(indent1) !== " ") {
      break;
    }
  }
  let indent2 = 0;
  for (indent2 = 0; indent2 < str2.length; ++indent2) {
    if (str2.charAt(indent2) !== " ") {
      break;
    }
  }

  return indent1 === indent2;
}


export function trimTrailingEmptyLines(lines: string[]): string[] {
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  return lines;
}

export function removeSuperfluousEmptyLines(lines: string[]): string[] {
  const linesOut: string[] = [];
  for (let i = 0; i < lines.length; ++i) {
    const prevLine = linesOut[linesOut.length - 1] ?? "";
    const curLine = lines[i];
    const nextLine = lines[i + 1] ?? "";

    if (!curLine) {
      // decide whether to strip this empty line
      if (!prevLine) {
        continue;
      }
      if (!indentMatch(prevLine, nextLine) && (prevLine.endsWith("{") || nextLine.trimStart().startsWith("}"))) {
        continue;
      }
    }

    linesOut.push(curLine);
  }
  return linesOut;
}

export function deoverlapStringLines(str1: string, str2: string, maxCompareLines = 10): string {
  const str1Lines = str1.split("\n");
  const str2Lines = str2.split("\n");
  if (str1Lines[str1Lines.length - 1] === "") {
    str1Lines.pop();
  }

  const maxOverlap = Math.min(str1Lines.length, str2Lines.length, maxCompareLines);
  for (let overlapCount = 1; overlapCount <= maxOverlap; ++overlapCount) {
    let overlap = true;
    for (let i = 0; i < overlapCount; ++i) {
      const line1 = str1Lines[str1Lines.length - overlapCount + i];
      const line2 = str2Lines[i];
      if (line1 !== line2) {
        overlap = false;
        break;
      }
    }
    if (overlap) {
      return str1Lines.slice(0, -overlapCount).concat(str2Lines).join("\n");
    }
  }

  return str1 + str2;
}

export function upperFirst(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

export function lowerFirst(str: string): string {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

export function appendAligned(str: string, suffix: string, alignment: number): string {
  if (str.length >= alignment) {
    alignment = str.length + 1;
  }
  const padding = new Array(alignment - str.length).fill(' ').join("");
  return str + padding + suffix;
}

export function removeLastTrailingComma(strs: string[]): string[] {
  if (!strs.length) {
    return [];
  }
  return strs.slice(0, -1).concat(strs.slice(-1)[0].slice(0, -1));
}

export function genCommentLinesWithCommentMarker(commentMarker: string, str?: string): string[] {
  if (str) {
    return [
      ``,
      ...str.split("\n").map(s => `${commentMarker} ${s}`),
    ];
  }
  return [];
}

export function normalizeIdentifier(name: string): string[] {
  return collapse<string>(name.split("_").map(s => s.split(/(?=[A-Z][a-z]|(?<=[a-z])[A-Z])/))).filter(s => s.length > 0).map(s => s.toLowerCase());
}
