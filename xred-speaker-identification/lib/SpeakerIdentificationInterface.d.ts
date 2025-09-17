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


import { XrpaDataflowConnection, XrpaProgramParam } from "@xrpa/xrpa-orchestrator";
export declare const MAX_REFERENCE_SPEAKERS = 5;
export declare const MAX_AUDIO_FILES_PER_SPEAKER = 3;
export declare const XredSpeakerIdentificationInterface: import("@xrpa/xrpa-orchestrator").ProgramInterface;
export interface ReferenceSpeakerParams {
    speakerId: string;
    speakerName: string;
    filePaths: string[];
}
export interface SpeakerIdentifierParams {
    audioSignal: XrpaDataflowConnection | XrpaProgramParam;
    speakers: ReferenceSpeakerParams[];
}
export declare function SpeakerIdentifier(params: SpeakerIdentifierParams): {
    identifiedSpeakerId: XrpaDataflowConnection;
    identifiedSpeakerName: XrpaDataflowConnection;
    confidenceScore: XrpaDataflowConnection;
    errorMessage: XrpaDataflowConnection;
};

