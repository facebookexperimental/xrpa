/*
// @generated
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

#include <xrpa-runtime/external_utils/CommandLineUtils.h>

#if defined(WIN32)
#include <Windows.h>
#elif defined(__APPLE__)
#include <mach-o/dyld.h>
#endif

#include <boost/tokenizer.hpp>
#include <filesystem>
#include <fstream>
#include <string>
#include <vector>

namespace Xrpa {

static void parseCommandLineFile(
    std::vector<std::string>& commandLineArgs,
    const std::string& filename) {
  std::ifstream file(filename);
  if (!file.is_open()) {
    return;
  }

  std::string file_contents;
  std::getline(file, file_contents);

  boost::escaped_list_separator<char> separators('\\', ' ', '\"');
  boost::tokenizer<boost::escaped_list_separator<char>> tokenizer(file_contents, separators);
  for (const auto& token : tokenizer) {
    commandLineArgs.push_back(token);
  }
}

std::vector<std::string> processCommandLine(int argc, char** argv) {
  std::vector<std::string> commandLineArgs;

  // get the path of the running executable
  std::string exePath;

#if defined(WIN32)
  char runningFilename[MAX_PATH] = {0};
  GetModuleFileNameA(NULL, runningFilename, MAX_PATH);
  exePath = std::filesystem::path(runningFilename).remove_filename().string();
#elif defined(__APPLE__)
  char runningFilename[PATH_MAX] = {0};
  uint32_t size = PATH_MAX;
  if (_NSGetExecutablePath(runningFilename, &size) == 0) {
    exePath = std::filesystem::path(runningFilename).remove_filename().string();
  }
#endif

  // check for a command line file in the same directory as the running executable
  parseCommandLineFile(commandLineArgs, exePath + "/command_line.txt");

  // check for a command line file in the current directory
  parseCommandLineFile(commandLineArgs, "./command_line.txt");

  // add the actual command line arguments
  for (int i = 1; i < argc; ++i) {
    commandLineArgs.emplace_back(argv[i]);
  }

  // reverse the order of the command line arguments for CLI11
  std::reverse(commandLineArgs.begin(), commandLineArgs.end());
  return commandLineArgs;
}

} // namespace Xrpa
