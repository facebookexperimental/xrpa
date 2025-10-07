/*
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

// @generated

#pragma once

#if defined(WIN32)
  #ifdef BUILDING_MAIN_STANDALONE
    #define DLLEXPORT __declspec(dllexport)
  #else
    #define DLLEXPORT __declspec(dllimport)
  #endif
#elif defined(__APPLE__)
  #ifdef BUILDING_MAIN_STANDALONE
    #define DLLEXPORT __attribute__((visibility("default")))
  #else
    #define DLLEXPORT __attribute__((visibility("default")))
  #endif
#else
  #define DLLEXPORT
#endif

extern "C" {
DLLEXPORT int RunStandalone(int argc, char** argv);
}
