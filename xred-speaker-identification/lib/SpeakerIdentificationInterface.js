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
exports.XredSpeakerIdentificationInterface = exports.MAX_AUDIO_FILES_PER_SPEAKER = exports.MAX_REFERENCE_SPEAKERS = void 0;
exports.ReferenceSpeakerSet = ReferenceSpeakerSet;
exports.SpeakerIdentifier = SpeakerIdentifier;
const xrpa_orchestrator_1 = require("@xrpa/xrpa-orchestrator");
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
exports.MAX_REFERENCE_SPEAKERS = 5;
exports.MAX_AUDIO_FILES_PER_SPEAKER = 3;
exports.XredSpeakerIdentificationInterface = (0, xrpa_orchestrator_1.XrpaProgramInterface)("Xred.SpeakerIdentification", path_1.default.join(__dirname, "../package.json"), () => {
    const ReferenceSpeakerSet = (0, xrpa_orchestrator_1.ProgramInput)("ReferenceSpeakerSet", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 1,
        fields: {},
    }));
    const ReferenceSpeaker = (0, xrpa_orchestrator_1.ProgramInput)("ReferenceSpeaker", (0, xrpa_orchestrator_1.Collection)({
        maxCount: exports.MAX_REFERENCE_SPEAKERS,
        fields: {
            speakerId: (0, xrpa_orchestrator_1.String)("", "Unique identifier for this speaker"),
            speakerName: (0, xrpa_orchestrator_1.String)("", "Human-readable name for this speaker"),
            speakerSet: (0, xrpa_orchestrator_1.ReferenceTo)(ReferenceSpeakerSet, "Reference back to the speaker set this config belongs to"),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("ReferenceSpeakerAudioFile", (0, xrpa_orchestrator_1.Collection)({
        maxCount: exports.MAX_REFERENCE_SPEAKERS * exports.MAX_AUDIO_FILES_PER_SPEAKER,
        fields: {
            filePath: (0, xrpa_orchestrator_1.String)("", "Path to the .mp4 file containing the speaker's voice sample"),
            speaker: (0, xrpa_orchestrator_1.ReferenceTo)(ReferenceSpeaker, "Reference back to the speaker this audio file belongs to"),
        },
    }));
    (0, xrpa_orchestrator_1.ProgramInput)("SpeakerIdentifier", (0, xrpa_orchestrator_1.Collection)({
        maxCount: 1,
        fields: {
            audioSignal: xrpa_orchestrator_1.Signal,
            referenceSpeakerSet: (0, xrpa_orchestrator_1.ReferenceTo)(ReferenceSpeakerSet),
            identifiedSpeakerId: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.String)("", "ID of the identified speaker, empty if no match")),
            identifiedSpeakerName: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.String)("", "Name of the identified speaker, empty if no match")),
            confidenceScore: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.Count)(0, "Confidence score of the match (0-1)")),
            errorMessage: (0, xrpa_orchestrator_1.Output)((0, xrpa_orchestrator_1.String)("", "Error message if identification failed")),
        },
    }));
});
function ReferenceSpeakerSet(speakers) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSpeakerIdentificationInterface), "ReferenceSpeakerSet"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    for (const speakerConfig of speakers) {
        const speakerNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSpeakerIdentificationInterface), "ReferenceSpeaker"], {});
        (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(speakerNode));
        speakerNode.fieldValues = {
            speakerId: speakerConfig.speakerId,
            speakerName: speakerConfig.speakerName,
            speakerSet: dataflowNode,
        };
        for (const filePath of speakerConfig.filePaths) {
            const audioFileNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSpeakerIdentificationInterface), "ReferenceSpeakerAudioFile"], {});
            (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(audioFileNode));
            audioFileNode.fieldValues = {
                filePath: filePath,
                speaker: speakerNode,
            };
        }
    }
    return dataflowNode;
}
function SpeakerIdentifier(params) {
    const dataflowNode = (0, xrpa_orchestrator_1.Instantiate)([(0, xrpa_orchestrator_1.bindExternalProgram)(exports.XredSpeakerIdentificationInterface), "SpeakerIdentifier"], {});
    (0, assert_1.default)((0, xrpa_orchestrator_1.isDataflowForeignObjectInstantiation)(dataflowNode));
    dataflowNode.fieldValues = {
        audioSignal: params.audioSignal,
        referenceSpeakerSet: params.referenceSpeakerSet,
    };
    return {
        identifiedSpeakerId: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "identifiedSpeakerId"),
        identifiedSpeakerName: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "identifiedSpeakerName"),
        confidenceScore: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "confidenceScore"),
        errorMessage: (0, xrpa_orchestrator_1.ObjectField)(dataflowNode, "errorMessage"),
    };
}
//# sourceMappingURL=SpeakerIdentificationInterface.js.map
