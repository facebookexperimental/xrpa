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

#include "TcpSocketUart.h"

#include <boost/asio.hpp>
#include <boost/system/error_code.hpp>
#include <iostream>
#include <memory>
#include <string>

class TcpSocketUartImpl : public TcpSocketUart {
 public:
  TcpSocketUartImpl(
      const std::string& host,
      uint16_t port,
      std::shared_ptr<boost::asio::io_context> io_context,
      std::unique_ptr<boost::asio::ip::tcp::socket> socket)
      : TcpSocketUart(host + ":" + std::to_string(port)),
        io_context_(io_context),
        socket_(std::move(socket)) {}

  ~TcpSocketUartImpl() override {
    try {
      if (socket_ && socket_->is_open()) {
        socket_->close();
      }
    } catch (const std::exception& e) {
      std::cerr << "Error closing socket: " << e.what() << std::endl;
    }
  }

  virtual bool write(const std::vector<uint8_t>& data) override {
    if (!socket_ || !socket_->is_open()) {
      std::cerr << "Socket not connected" << std::endl;
      return false;
    }

    try {
      boost::system::error_code error;
      size_t bytesWritten =
          boost::asio::write(*socket_, boost::asio::buffer(data.data(), data.size()), error);

      if (error) {
        std::cerr << "Write error: " << error.message() << std::endl;
        return false;
      }

      return bytesWritten == data.size();
    } catch (const std::exception& e) {
      std::cerr << "Exception during write: " << e.what() << std::endl;
      return false;
    }
  }

  virtual bool read(std::vector<uint8_t>& data) override {
    if (!socket_ || !socket_->is_open()) {
      std::cerr << "Socket not connected" << std::endl;
      data.resize(0);
      return false;
    }

    try {
      boost::system::error_code error;

      // Check if data is available to read
      size_t available = socket_->available(error);
      if (error) {
        std::cerr << "Error checking available data: " << error.message() << std::endl;
        data.resize(0);
        return false;
      }

      if (available == 0) {
        // No data available
        data.resize(0);
        return false;
      }

      // Resize buffer to accommodate available data
      data.resize(available);

      // Read data
      size_t bytesRead = socket_->read_some(boost::asio::buffer(data.data(), data.size()), error);

      if (error) {
        std::cerr << "Read error: " << error.message() << std::endl;
        data.resize(0);
        return false;
      }

      // Resize to actual bytes read
      data.resize(bytesRead);
      return bytesRead > 0;
    } catch (const std::exception& e) {
      std::cerr << "Exception during read: " << e.what() << std::endl;
      data.resize(0);
      return false;
    }
  }

 private:
  std::shared_ptr<boost::asio::io_context> io_context_; // Keep io_context alive
  std::unique_ptr<boost::asio::ip::tcp::socket> socket_;
};

///////////////////////////////////////////////////////////////////////////////

std::shared_ptr<TcpSocketUart>
TcpSocketUart::create(const std::string& host, uint16_t port, int sendBufferSize) {
  try {
    // Create a shared io_context that will be kept alive by the TcpSocketUartImpl
    auto io_context = std::make_shared<boost::asio::io_context>();
    boost::asio::ip::tcp::resolver resolver(*io_context);
    boost::system::error_code error;

    // Resolve the host name and service
    auto endpoints = resolver.resolve(host, std::to_string(port), error);
    if (error) {
      std::cerr << "Failed to resolve host " << host << ":" << port << " - " << error.message()
                << std::endl;
      return nullptr;
    }

    // Create and connect the socket
    auto socket = std::make_unique<boost::asio::ip::tcp::socket>(*io_context);
    boost::asio::connect(*socket, endpoints, error);
    if (error) {
      std::cerr << "Failed to connect to " << host << ":" << port << " - " << error.message()
                << std::endl;
      return nullptr;
    }

    // Set TCP_NODELAY option (disable Nagle's algorithm) for better responsiveness
    socket->set_option(boost::asio::ip::tcp::no_delay(true), error);
    if (error) {
      std::cerr << "Failed to set TCP_NODELAY option: " << error.message() << std::endl;
      // Continue anyway, this is not critical
    }

    // Set send buffer size if specified (non-zero)
    if (sendBufferSize > 0) {
      socket->set_option(boost::asio::socket_base::send_buffer_size(sendBufferSize), error);
      if (error) {
        std::cerr << "Failed to set send buffer size to " << sendBufferSize
                  << " bytes: " << error.message() << std::endl;
        // Continue anyway, this is not critical
      }
    }

    return std::shared_ptr<TcpSocketUart>(
        new TcpSocketUartImpl(host, port, io_context, std::move(socket)));
  } catch (const std::exception& e) {
    std::cerr << "Exception creating TCP socket: " << e.what() << std::endl;
    return nullptr;
  }
}
