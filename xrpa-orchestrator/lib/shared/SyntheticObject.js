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
exports.XrpaSyntheticObject = exports.XrpaObjectDef = exports.XrpaParamDef = void 0;
const Helpers_1 = require("./Helpers");
class XrpaParamDef {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.__isXrpaParamDef = true;
    }
}
exports.XrpaParamDef = XrpaParamDef;
class XrpaObjectDef {
    constructor(collectionType, name = "", fieldValues = {}, breaksCycles = false) {
        this.collectionType = collectionType;
        this.name = name;
        this.fieldValues = fieldValues;
        this.breaksCycles = breaksCycles;
        this.__isXrpaObjectDef = true;
        this.id = XrpaObjectDef.idCounter++;
        if (!this.name) {
            const prefix = (0, Helpers_1.lowerFirst)(collectionType);
            this.name = `${prefix}${this.id}`;
        }
    }
}
XrpaObjectDef.idCounter = 0;
exports.XrpaObjectDef = XrpaObjectDef;
class XrpaSyntheticObject {
    constructor(objects, selfTerminateEvent) {
        this.selfTerminateEvent = selfTerminateEvent;
        this.paramDefs = {};
        const graphDepths = new Map();
        const params = new Set();
        const paramConnections = {};
        function walkConnections(obj, graphPath, pathBreaksCycles) {
            const name = obj.name;
            const newGraphPath = [...graphPath, name];
            pathBreaksCycles = pathBreaksCycles || obj.breaksCycles;
            // check for cycles and stop recursion if found
            if (graphPath.includes(name)) {
                if (pathBreaksCycles) {
                    return;
                }
                else {
                    throw new Error(`cycle detected: ${newGraphPath.join(" -> ")}`);
                }
            }
            // update node depth
            const oldDepth = graphDepths.get(obj) ?? 0;
            if (newGraphPath.length > oldDepth) {
                graphDepths.set(obj, newGraphPath.length);
            }
            // recurse
            for (const fieldName in obj.fieldValues) {
                const fieldValue = obj.fieldValues[fieldName];
                if (fieldValue instanceof XrpaObjectDef) {
                    walkConnections(fieldValue, newGraphPath, pathBreaksCycles);
                }
                else if (fieldValue instanceof XrpaParamDef) {
                    params.add(fieldValue);
                    const key = [fieldValue.name, obj.name, fieldName];
                    paramConnections[key.join("/")] = [fieldValue.name, { target: obj, fieldName }];
                }
            }
        }
        for (const obj of objects) {
            walkConnections(obj, [], false);
        }
        if (selfTerminateEvent) {
            walkConnections(selfTerminateEvent.target, ["selfTerminateEvent"], false);
        }
        // sort nodes by depth, descending order
        this.objDefs = [...graphDepths.keys()].sort((a, b) => {
            const aDepth = graphDepths.get(a) ?? 0;
            const bDepth = graphDepths.get(b) ?? 0;
            return bDepth - aDepth;
        });
        // verify unique object names amongst nodes
        const objNames = new Set();
        for (const obj of this.objDefs) {
            if (objNames.has(obj.name)) {
                throw new Error(`Duplicate object name: "${obj.name}"`);
            }
            objNames.add(obj.name);
        }
        // sort parameters by name and build connections
        const paramConnectionsArray = Object.values(paramConnections);
        const paramDefs = [...params].sort((a, b) => {
            return a.name.localeCompare(b.name);
        }).map(paramDef => {
            return {
                def: paramDef,
                connections: paramConnectionsArray.filter(connection => connection[0] === paramDef.name).map(connection => connection[1]),
            };
        });
        for (const param of paramDefs) {
            const name = param.def.name;
            if (name in this.paramDefs) {
                throw new Error(`Duplicate parameter name: "${name}"`);
            }
            this.paramDefs[name] = param;
        }
    }
    buildStructSpec(datamodel) {
        const paramsStructSpec = {};
        for (const name in this.paramDefs) {
            paramsStructSpec[name] = datamodel.convertUserTypeSpec(this.paramDefs[name].def.type);
        }
        return paramsStructSpec;
    }
    getParamConnections(paramName) {
        return this.paramDefs[paramName]?.connections ?? [];
    }
}
exports.XrpaSyntheticObject = XrpaSyntheticObject;
//# sourceMappingURL=SyntheticObject.js.map
