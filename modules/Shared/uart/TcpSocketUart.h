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

#pragma once

#include <memory>
#include <string>

#include "GenericUart.h"

class TcpSocketUart : public GenericUart {
 public:
  /**
   * Create a TCP socket UART connection
   * @param host The hostname or IP address to connect to
   * @param port The port number to connect to
   * @param sendBufferSize The size of the socket's send buffer in bytes (0 for system default)
   * @return A shared pointer to the created UART object, or nullptr if connection failed
   */
  static std::shared_ptr<TcpSocketUart>
  create(const std::string& host, uint16_t port, int sendBufferSize = 0);

 protected:
  explicit TcpSocketUart(const std::string& id) : GenericUart(id) {}
};
