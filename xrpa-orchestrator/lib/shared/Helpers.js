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

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainAsyncThunk = exports.resolveAsyncThunk = exports.chainThunk = exports.resolveThunk = exports.recursiveDirScan = exports.isDirectory = exports.nsExtractWithSeparator = exports.nsJoinWithSeparator = exports.nsQualifyWithSeparator = exports.genCommentLinesWithCommentMarker = exports.removeLastTrailingComma = exports.runProcess = exports.pushUnique = exports.isExcluded = exports.filterToNumberArray = exports.filterToNumber = exports.filterToStringPairArray = exports.filterToStringArray = exports.filterToString = exports.assertIsKeyOf = exports.throwBadValue = exports.absurd = exports.recordZip = exports.arrayZip = exports.objectIsEmpty = exports.hashCheck = exports.HashValue = exports.clone = exports.appendAligned = exports.lowerFirst = exports.upperFirst = exports.removeSuperfluousEmptyLines = exports.trimTrailingEmptyLines = exports.indentMatch = exports.indent = exports.safeDeepFreeze = exports.augmentInPlace = exports.augment = exports.mapAndCollapse = exports.collapseAndMap = exports.collapse = exports.getRuntimeSrcPath = exports.EXCLUDE_NAMESPACE = void 0;
const assert_1 = __importDefault(require("assert"));
const child_process_1 = __importDefault(require("child_process"));
const crypto_1 = __importDefault(require("crypto"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const simply_immutable_1 = require("simply-immutable");
exports.EXCLUDE_NAMESPACE = "EXCLUDE_NAMESPACE";
let runtimeSrcRootPath = path_1.default.join(__dirname, "../runtime");
if (!fs_extra_1.default.pathExistsSync(runtimeSrcRootPath)) {
    runtimeSrcRootPath = path_1.default.join(__dirname, "../../../runtime");
}
function getRuntimeSrcPath(target) {
    return path_1.default.join(runtimeSrcRootPath, target, "xrpa-runtime");
}
exports.getRuntimeSrcPath = getRuntimeSrcPath;
function collapse(values) {
    const ret = [];
    for (const value of values) {
        if (Array.isArray(value)) {
            ret.push(...value);
        }
        else {
            ret.push(value);
        }
    }
    return ret;
}
exports.collapse = collapse;
function collapseAndMap(values, mapFunc) {
    return collapse(values).map(mapFunc);
}
exports.collapseAndMap = collapseAndMap;
function mapAndCollapse(values, mapFunc, ...args) {
    return collapse(values.map(v => mapFunc(v, ...args)));
}
exports.mapAndCollapse = mapAndCollapse;
function augment(obj, props) {
    const ret = (0, simply_immutable_1.shallowCloneMutable)(obj);
    for (const key in props) {
        ret[key] = props[key];
    }
    return safeDeepFreeze(ret);
}
exports.augment = augment;
function augmentInPlace(obj, props) {
    for (const key in props) {
        obj[key] = props[key];
    }
    return obj;
}
exports.augmentInPlace = augmentInPlace;
function safeDeepFreeze(o) {
    if (Array.isArray(o)) {
        if (!(0, simply_immutable_1.isFrozen)(o)) {
            Object.freeze(o);
            for (let i = 0; i < o.length; ++i) {
                safeDeepFreeze(o[i]);
            }
        }
    }
    else if (typeof o === "object" && o !== null) {
        if (!(0, simply_immutable_1.isFrozen)(o)) {
            Object.freeze(o);
            for (const key in o) {
                safeDeepFreeze(o[key]);
            }
        }
    }
    return o;
}
exports.safeDeepFreeze = safeDeepFreeze;
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
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.clone = clone;
class HashValue {
    constructor(str) {
        const hash = crypto_1.default.createHash("sha256");
        hash.update(str);
        const hexHash = hash.digest("hex");
        (0, assert_1.default)(hexHash.length === 64);
        this.values = [
            hexHash.slice(0, 16),
            hexHash.slice(16, 32),
            hexHash.slice(32, 48),
            hexHash.slice(48, 64),
        ];
    }
}
exports.HashValue = HashValue;
function hashCheck(a, b) {
    const hashA = crypto_1.default.createHash("sha256");
    hashA.update(a);
    const hashB = crypto_1.default.createHash("sha256");
    hashB.update(b);
    return hashA.digest("hex") === hashB.digest("hex");
}
exports.hashCheck = hashCheck;
function objectIsEmpty(obj) {
    for (const key in obj) {
        return false;
    }
    return true;
}
exports.objectIsEmpty = objectIsEmpty;
function arrayZip(a, b) {
    if (a.length !== b.length) {
        throw new Error("arrayZip length mismatch, got " + a.length + " vs " + b.length);
    }
    const ret = [];
    for (let i = 0; i < a.length; i++) {
        ret.push([a[i], b[i]]);
    }
    return ret;
}
exports.arrayZip = arrayZip;
function recordZip(a, b) {
    if (a.length !== b.length) {
        throw new Error("recordZip length mismatch, got " + a.length + " vs " + b.length);
    }
    const ret = {};
    for (let i = 0; i < a.length; i++) {
        ret[a[i]] = b[i];
    }
    return ret;
}
exports.recordZip = recordZip;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function absurd(v) {
    // this function intentionally left blank
}
exports.absurd = absurd;
function throwBadValue(val, expected) {
    throw new Error(`expected ${expected}, found ${val} (${typeof val})`);
}
exports.throwBadValue = throwBadValue;
function assertIsString(val) {
    if (typeof val !== "string") {
        throwBadValue(val, "string type");
    }
}
function assertIsKeyOf(val, enumOrLookup) {
    assertIsString(val);
    const keys = Object.keys(enumOrLookup);
    if (!keys.includes(val)) {
        throwBadValue(val, keys.join("|"));
    }
}
exports.assertIsKeyOf = assertIsKeyOf;
function filterToString(val) {
    return typeof val === "string" ? val : undefined;
}
exports.filterToString = filterToString;
function filterToStringArray(val, minLength = 0) {
    if (!Array.isArray(val)) {
        return undefined;
    }
    if (val.length < minLength) {
        return undefined;
    }
    for (const v of val) {
        if (typeof v !== "string") {
            return undefined;
        }
    }
    return val;
}
exports.filterToStringArray = filterToStringArray;
function filterToStringPairArray(val, minLength = 0) {
    if (!Array.isArray(val)) {
        return undefined;
    }
    if (val.length < minLength) {
        return undefined;
    }
    const ret = [];
    for (const v of val) {
        const tuple = filterToStringArray(v, 2);
        if (tuple) {
            ret.push(tuple);
        }
    }
    return ret;
}
exports.filterToStringPairArray = filterToStringPairArray;
function filterToNumber(val) {
    return typeof val === "number" ? val : undefined;
}
exports.filterToNumber = filterToNumber;
function filterToNumberArray(val, minLength = 0) {
    if (!Array.isArray(val)) {
        return undefined;
    }
    if (val.length < minLength) {
        return undefined;
    }
    for (const v of val) {
        if (typeof v !== "number") {
            return undefined;
        }
    }
    return val;
}
exports.filterToNumberArray = filterToNumberArray;
function isExcluded(key, includeList, excludeList) {
    if (includeList && !includeList.includes(key)) {
        return true;
    }
    if (excludeList && excludeList.includes(key)) {
        return true;
    }
    return false;
}
exports.isExcluded = isExcluded;
function pushUnique(arr, val) {
    const idx = arr.indexOf(val);
    if (idx >= 0) {
        return idx;
    }
    return arr.push(val);
}
exports.pushUnique = pushUnique;
async function runProcess(params) {
    const p = new Promise((resolve, reject) => {
        const child = child_process_1.default.spawn(params.filename, params.args, { cwd: params.cwd });
        const dataLines = [];
        let dataString = "";
        let errorString = "";
        child.stdout.on('data', (data) => {
            dataString = dataString + data.toString().replace(/\r\n/g, "\n");
            if (dataString.includes("\n")) {
                const lines = dataString.split("\n");
                dataString = lines.pop() ?? "";
                dataLines.push(...lines);
                params.onLineReceived && lines.forEach(params.onLineReceived);
            }
        });
        child.stderr.on('data', (data) => {
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
            }
            else {
                if (dataString) {
                    dataLines.push(dataString);
                    dataString = "";
                }
                resolve(dataLines.join("\n"));
            }
        });
        process.stdin.pipe(child.stdin);
    });
    return p;
}
exports.runProcess = runProcess;
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
function nsQualifyWithSeparator(nsSep, qualifiedName, inNamespace) {
    if (inNamespace === exports.EXCLUDE_NAMESPACE) {
        const idx = qualifiedName.lastIndexOf(nsSep);
        if (idx < 0) {
            return qualifiedName;
        }
        return qualifiedName.slice(idx + nsSep.length);
    }
    if (!inNamespace) {
        return qualifiedName;
    }
    const nameSplit = qualifiedName.split(nsSep);
    const namespaceSplit = inNamespace.split(nsSep);
    const qCount = Math.min(nameSplit.length - 1, namespaceSplit.length);
    for (let i = 0; i < qCount; ++i) {
        if (nameSplit[i] !== namespaceSplit[i]) {
            return nameSplit.slice(i).join(nsSep);
        }
    }
    return nameSplit.slice(qCount).join(nsSep);
}
exports.nsQualifyWithSeparator = nsQualifyWithSeparator;
function nsJoinWithSeparator(nsSep, names) {
    return names.filter(str => Boolean(str)).join(nsSep);
}
exports.nsJoinWithSeparator = nsJoinWithSeparator;
function nsExtractWithSeparator(nsSep, qualifiedName, nonNamespacePartCount = 0) {
    qualifiedName = qualifiedName.split("<")[0];
    const nameSplit = qualifiedName.split(nsSep).slice(0, -(1 + nonNamespacePartCount));
    return nameSplit.join(nsSep);
}
exports.nsExtractWithSeparator = nsExtractWithSeparator;
async function isDirectory(pathname) {
    try {
        const stat = await fs_extra_1.default.stat(pathname);
        return stat.isDirectory();
    }
    catch (e) {
        return false;
    }
}
exports.isDirectory = isDirectory;
async function recursiveDirScan(fullpath, filenames) {
    if (await isDirectory(fullpath)) {
        const files = await fs_extra_1.default.readdir(fullpath);
        for (const filename of files) {
            await recursiveDirScan(path_1.default.join(fullpath, filename), filenames);
        }
    }
    else {
        filenames.push(fullpath);
    }
}
exports.recursiveDirScan = recursiveDirScan;
function resolveThunk(value) {
    if (typeof value === "function") {
        return value();
    }
    return value;
}
exports.resolveThunk = resolveThunk;
function chainThunk(value, next) {
    return () => next(resolveThunk(value));
}
exports.chainThunk = chainThunk;
async function resolveAsyncThunk(value) {
    if (typeof value === "function") {
        return value();
    }
    return value;
}
exports.resolveAsyncThunk = resolveAsyncThunk;
function chainAsyncThunk(value, next) {
    return () => resolveAsyncThunk(value).then(next);
}
exports.chainAsyncThunk = chainAsyncThunk;
//# sourceMappingURL=Helpers.js.map
