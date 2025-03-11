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

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIdentifier = exports.genCommentLinesWithCommentMarker = exports.removeLastTrailingComma = exports.appendAligned = exports.lowerFirst = exports.upperFirst = exports.deoverlapStringLines = exports.removeSuperfluousEmptyLines = exports.trimTrailingEmptyLines = exports.indentMatch = exports.indent = void 0;
const ArrayUtils_1 = require("./ArrayUtils");
function indent(count, lines) {
    const indentStr = " ".repeat(count * 2);
    const ret = [];
    if (typeof lines === "string") {
        ret.push(indentStr + lines);
    }
    else {
        for (const line of lines) {
            if (Array.isArray(line)) {
                ret.push(...line.map(str => str ? (indentStr + str) : str));
            }
            else {
                ret.push(line ? (indentStr + line) : line);
            }
        }
    }
    return ret;
}
exports.indent = indent;
function indentMatch(str1, str2) {
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
exports.indentMatch = indentMatch;
function trimTrailingEmptyLines(lines) {
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
    }
    return lines;
}
exports.trimTrailingEmptyLines = trimTrailingEmptyLines;
function removeSuperfluousEmptyLines(lines) {
    const linesOut = [];
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
exports.removeSuperfluousEmptyLines = removeSuperfluousEmptyLines;
function deoverlapStringLines(str1, str2, maxCompareLines = 10) {
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
exports.deoverlapStringLines = deoverlapStringLines;
function upperFirst(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}
exports.upperFirst = upperFirst;
function lowerFirst(str) {
    return str.slice(0, 1).toLowerCase() + str.slice(1);
}
exports.lowerFirst = lowerFirst;
function appendAligned(str, suffix, alignment) {
    if (str.length >= alignment) {
        alignment = str.length + 1;
    }
    const padding = new Array(alignment - str.length).fill(' ').join("");
    return str + padding + suffix;
}
exports.appendAligned = appendAligned;
function removeLastTrailingComma(strs) {
    if (!strs.length) {
        return [];
    }
    return strs.slice(0, -1).concat(strs.slice(-1)[0].slice(0, -1));
}
exports.removeLastTrailingComma = removeLastTrailingComma;
function genCommentLinesWithCommentMarker(commentMarker, str) {
    if (str) {
        return [
            ``,
            ...str.split("\n").map(s => `${commentMarker} ${s}`),
        ];
    }
    return [];
}
exports.genCommentLinesWithCommentMarker = genCommentLinesWithCommentMarker;
function normalizeIdentifier(name) {
    return (0, ArrayUtils_1.collapse)(name.split("_").map(s => s.split(/(?=[A-Z][a-z]|(?<=[a-z])[A-Z])/))).filter(s => s.length > 0).map(s => s.toLowerCase());
}
exports.normalizeIdentifier = normalizeIdentifier;
//# sourceMappingURL=StringUtils.js.map
