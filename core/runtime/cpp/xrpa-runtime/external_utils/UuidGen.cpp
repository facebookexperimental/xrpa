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

#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>

#include <xrpa-runtime/external_utils/UuidGen.h>

namespace Xrpa {

ObjectUuid generateUuid() {
  boost::uuids::random_generator generator;
  boost::uuids::uuid uuid1 = generator();
  uint64_t high = 0, low = 0;
  std::copy(uuid1.begin(), uuid1.begin() + 8, reinterpret_cast<char*>(&high));
  std::copy(uuid1.begin() + 8, uuid1.end(), reinterpret_cast<char*>(&low));
  return {high, low};
}

} // namespace Xrpa
