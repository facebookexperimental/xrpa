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

#include "OVRSession.h"

#include <iostream>
#include <string>
#include <vector>

static const std::string kSystemLibovrInstallDir{
    "C:\\Program Files\\Oculus\\Support\\oculus-runtime"};

static const std::string kLibOVR_DLL_DIR_EnvVar{"LIBOVR_DLL_DIR"};

#define THROW_IF_ERROR(res, func)                                                                \
  do {                                                                                           \
    if (!OVR_SUCCESS(res)) {                                                                     \
      ovrErrorInfo errorInfo;                                                                    \
      ovr_GetLastErrorInfo(&errorInfo);                                                          \
      std::cout << "OVR error calling " << func << ": " << res << " " << errorInfo.Result << " " \
                << errorInfo.ErrorString << std::endl;                                           \
      throw std::runtime_error("Error in OVR: " + std::to_string((int)res));                     \
    }                                                                                            \
  } while (0)

std::string GetEnvironmentVarString(char const* envVarName) {
  // Get required size
  size_t requiredSize;
  if (getenv_s(&requiredSize, NULL, 0, envVarName) != 0 || requiredSize == 0) {
    return {}; // Failed or no current value; return empty string
  }

  // Allocate space and get value.
  std::vector<char> env(requiredSize);
  int err = getenv_s(&requiredSize, env.data(), requiredSize, envVarName);
  if (err != 0) {
    std::cout << "getenv_s failed: " << err << std::endl;
    return {}; // Failure
  }

  return std::string(env.data());
}

OVRSession::OVRSession() {
  std::cout << "OVRVersion: " << OVR_VERSION_STRING << std::endl;
  ovrInitParams initParams = {0};
  initParams.Flags |=
      ovrInit_Invisible; // Initialize ovr in "invisible" mode (do not render to HMD)
  initParams.Flags |= ovrInit_RequestVersion;
  initParams.RequestedMinorVersion = 50;

  auto result = ovr_Initialize(&initParams);
  if (!OVR_SUCCESS(result)) {
    ovrErrorInfo errorInfo;
    ovr_GetLastErrorInfo(&errorInfo);
    std::cout << "Failed to load dll: " << errorInfo.Result << " " << errorInfo.ErrorString
              << std::endl;
    std::cout << "Trying again from " << kSystemLibovrInstallDir << std::endl;

    // Store off original value in case there is one
    std::string oldLibOvrDllDir = GetEnvironmentVarString(kLibOVR_DLL_DIR_EnvVar.c_str());

    // Force ovr_Initialize to load the DLL from where we think it gets installed normally.
    // If this path ever changes then this plugin will start failing when running from an RTech
    // megabin folder.
    _putenv((kLibOVR_DLL_DIR_EnvVar + "=" + kSystemLibovrInstallDir).c_str());

    // Initialize attempt #2
    result = ovr_Initialize(&initParams);

    // Restore old env var value
    _putenv((kLibOVR_DLL_DIR_EnvVar + "=" + oldLibOvrDllDir).c_str());
    THROW_IF_ERROR(result, "ovr_Initialize");
  }

  // Create session. ovrGraphicsLuid is unused as we're assuming "invisible" app
  ovrGraphicsLuid luid;
  result = ovr_Create(&session, &luid);
  THROW_IF_ERROR(result, "ovr_Create");
}

OVRSession::~OVRSession() {
  ovr_Destroy(session);
  session = nullptr;
}
