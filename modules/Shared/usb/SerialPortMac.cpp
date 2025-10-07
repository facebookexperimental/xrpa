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

#ifdef __APPLE__

#include "SerialPort.h"

#include <array>
#include <iostream>
#include <string>
#include "SerialPortInfo.h"

// Set to 1 to enable debug output, 0 to disable
#define DEBUG_SERIAL_PORT 0

#define INVALID_HANDLE_VALUE nullptr
#include <CoreFoundation/CoreFoundation.h>
#include <IOKit/IOKitLib.h>
#include <IOKit/serial/IOSerialKeys.h>
#include <IOKit/usb/IOUSBLib.h>
#include <IOKit/usb/USBSpec.h>
#include <dirent.h>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <termios.h>
#include <unistd.h>
#include <vector>

// Helper function to debug IORegistry properties
#if DEBUG_SERIAL_PORT
void debugRegistryProperties(io_registry_entry_t device, const char* deviceType) {
  CFMutableDictionaryRef properties = nullptr;
  kern_return_t kr =
      IORegistryEntryCreateCFProperties(device, &properties, kCFAllocatorDefault, kNilOptions);
  if (kr == KERN_SUCCESS) {
    std::cout << "[DEBUG] Properties for " << deviceType << ":\n";
    CFDictionaryApplyFunction(
        properties,
        [](const void* key, const void* value, void* /* context */) {
          if (CFGetTypeID(key) == CFStringGetTypeID()) {
            std::array<char, 256> keyStr{};
            CFStringGetCString(
                (CFStringRef)key, keyStr.data(), keyStr.size(), kCFStringEncodingUTF8);

            std::cout << "[DEBUG]   Key: " << keyStr.data();

            if (CFGetTypeID(value) == CFStringGetTypeID()) {
              std::array<char, 256> valueStr{};
              CFStringGetCString(
                  (CFStringRef)value, valueStr.data(), valueStr.size(), kCFStringEncodingUTF8);
              std::cout << " = " << valueStr.data();
            } else if (CFGetTypeID(value) == CFNumberGetTypeID()) {
              long long num = 0;
              CFNumberGetValue((CFNumberRef)value, kCFNumberLongLongType, &num);
              std::cout << " = " << num;
            }
            std::cout << "\n";
          }
        },
        nullptr);
    CFRelease(properties);
  }
}
#endif

// Helper function to try multiple property names for USB strings
std::string getUSBStringProperty(
    io_registry_entry_t device,
    const std::vector<const char*>& propNames) {
  for (const char* propName : propNames) {
    CFStringRef propNameRef = CFStringCreateWithCString(nullptr, propName, kCFStringEncodingUTF8);
    CFTypeRef propRef =
        IORegistryEntryCreateCFProperty(device, propNameRef, kCFAllocatorDefault, 0);
    CFRelease(propNameRef);

    if (propRef && CFGetTypeID(propRef) == CFStringGetTypeID()) {
      std::array<char, 256> str{};
      if (CFStringGetCString((CFStringRef)propRef, str.data(), str.size(), kCFStringEncodingUTF8)) {
        std::string result(str.data());
        CFRelease(propRef);
#if DEBUG_SERIAL_PORT
        std::cout << "[DEBUG] Found string property '" << propName << "': " << result << "\n";
#endif
        return result;
      }
    }
    if (propRef) {
      CFRelease(propRef);
    }
  }
  return "Unknown";
}

// Helper function to find USB device by vendor/product ID and get strings
std::pair<std::string, std::string> getUSBDeviceStrings(uint16_t vendorId, uint16_t productId) {
  std::string manufacturer = "Unknown";
  std::string product = "Unknown";

  if (vendorId == 0 || productId == 0) {
    return {manufacturer, product};
  }

#if DEBUG_SERIAL_PORT
  std::cout << "[DEBUG] Searching for USB device with VID:0x" << std::hex << vendorId << " PID:0x"
            << productId << std::dec << "\n";
#endif

  // Create matching dictionary for USB devices
  CFMutableDictionaryRef matchingDict = IOServiceMatching(kIOUSBDeviceClassName);
  if (!matchingDict) {
#if DEBUG_SERIAL_PORT
    std::cout << "[DEBUG] Failed to create USB matching dictionary\n";
#endif
    return {manufacturer, product};
  }

  io_iterator_t iterator = 0;
  kern_return_t kr = IOServiceGetMatchingServices(kIOMasterPortDefault, matchingDict, &iterator);
  if (kr != KERN_SUCCESS) {
#if DEBUG_SERIAL_PORT
    std::cout << "[DEBUG] Failed to get USB matching services\n";
#endif
    return {manufacturer, product};
  }

  io_service_t usbDevice = 0;
  while ((usbDevice = IOIteratorNext(iterator))) {
    // Check vendor and product ID
    CFTypeRef vendorRef =
        IORegistryEntryCreateCFProperty(usbDevice, CFSTR("idVendor"), kCFAllocatorDefault, 0);
    CFTypeRef productRef =
        IORegistryEntryCreateCFProperty(usbDevice, CFSTR("idProduct"), kCFAllocatorDefault, 0);

    uint16_t devVendorId = 0;
    uint16_t devProductId = 0;

    if (vendorRef && CFGetTypeID(vendorRef) == CFNumberGetTypeID()) {
      CFNumberGetValue((CFNumberRef)vendorRef, kCFNumberSInt16Type, &devVendorId);
    }
    if (productRef && CFGetTypeID(productRef) == CFNumberGetTypeID()) {
      CFNumberGetValue((CFNumberRef)productRef, kCFNumberSInt16Type, &devProductId);
    }

    if (vendorRef) {
      CFRelease(vendorRef);
    }
    if (productRef) {
      CFRelease(productRef);
    }

    if (devVendorId == vendorId && devProductId == productId) {
#if DEBUG_SERIAL_PORT
      std::cout << "[DEBUG] Found matching USB device! Checking properties...\n";
      debugRegistryProperties(usbDevice, "Matching USB Device");
#endif

      // Try to get manufacturer and product strings
      std::vector<const char*> manufacturerProps = {
          kUSBVendorString, "USB Vendor Name", "Manufacturer", "iManufacturer", "Vendor"};
      std::vector<const char*> productProps = {
          kUSBProductString, "USB Product Name", "Product", "iProduct", "Model"};

      manufacturer = getUSBStringProperty(usbDevice, manufacturerProps);
      product = getUSBStringProperty(usbDevice, productProps);

      IOObjectRelease(usbDevice);
      break;
    }

    IOObjectRelease(usbDevice);
  }

  IOObjectRelease(iterator);
  return {manufacturer, product};
}

HandleContainer openSerialPort(const SerialPortInfo& portInfo, int baudRate) {
  // Open the serial port using POSIX APIs
  int fd = open(portInfo.devicePath_.c_str(), O_RDWR | O_NOCTTY | O_NONBLOCK);
  if (fd == -1) {
    std::cout << "Failed to open " << portInfo.devicePath_ << std::endl;
    return HandleContainer{-1};
  }

  // Configure the serial port
  struct termios options {};
  if (tcgetattr(fd, &options) != 0) {
    std::cout << "Failed to get attributes for " << portInfo.devicePath_ << std::endl;
    close(fd);
    return HandleContainer{-1};
  }

  // Set baud rate
  cfsetispeed(&options, baudRate);
  cfsetospeed(&options, baudRate);

  // Configure 8N1 (8 data bits, no parity, 1 stop bit)
  options.c_cflag &= ~PARENB; // No parity
  options.c_cflag &= ~CSTOPB; // One stop bit
  options.c_cflag &= ~CSIZE; // Clear data size bits
  options.c_cflag |= CS8; // 8 data bits
  options.c_cflag |= CREAD | CLOCAL; // Enable receiver, ignore modem control lines

  // Raw input/output
  options.c_lflag &= ~(ICANON | ECHO | ECHOE | ISIG);
  options.c_iflag &= ~(IXON | IXOFF | IXANY | ICRNL);
  options.c_oflag &= ~OPOST;

  // Set timeouts
  options.c_cc[VMIN] = 0; // Non-blocking read
  options.c_cc[VTIME] = 1; // 0.1 second timeout

  // Apply the configuration
  if (tcsetattr(fd, TCSANOW, &options) != 0) {
    std::cout << "Failed to set attributes for " << portInfo.devicePath_ << std::endl;
    close(fd);
    return HandleContainer{-1};
  }

  // Clear any existing data in the buffers
  tcflush(fd, TCIOFLUSH);

  // Return file descriptor directly for HandleContainer
  return HandleContainer{fd};
}

std::unordered_map<std::string, SerialPortInfo> scanSerialPorts() {
  std::unordered_map<std::string, SerialPortInfo> ports;

  // Use IOKit to enumerate USB serial devices on macOS
#if DEBUG_SERIAL_PORT
  std::cout << "[DEBUG] Starting USB serial device enumeration\n";
#endif
  mach_port_t masterPort{};
  kern_return_t kr = IOMasterPort(MACH_PORT_NULL, &masterPort);
  if (kr != KERN_SUCCESS) {
#if DEBUG_SERIAL_PORT
    std::cout << "[DEBUG] Error creating IOKit master port, kr=" << kr << "\n";
#endif
    return ports;
  }

  // Create a matching dictionary for serial devices
  CFMutableDictionaryRef matchingDict = IOServiceMatching(kIOSerialBSDServiceValue);
  if (!matchingDict) {
#if DEBUG_SERIAL_PORT
    std::cout << "[DEBUG] Error creating matching dictionary\n";
#endif
    return ports;
  }

  // Add property to match only callout devices (cu.* not tty.*)
  CFDictionarySetValue(matchingDict, CFSTR(kIOSerialBSDTypeKey), CFSTR(kIOSerialBSDAllTypes));

  io_iterator_t serialPortIterator{};
  kr = IOServiceGetMatchingServices(masterPort, matchingDict, &serialPortIterator);
  if (kr != KERN_SUCCESS) {
#if DEBUG_SERIAL_PORT
    std::cout << "[DEBUG] Error getting matching services, kr=" << kr << "\n";
#endif
    return ports;
  }

  io_object_t serialService{};
#if DEBUG_SERIAL_PORT
  int foundCount = 0;
#endif
  while ((serialService = IOIteratorNext(serialPortIterator))) {
#if DEBUG_SERIAL_PORT
    std::cout << "[DEBUG] Found serialService object: " << serialService << "\n";
#endif
    CFTypeRef devicePathAsCFString = IORegistryEntryCreateCFProperty(
        serialService, CFSTR(kIOCalloutDeviceKey), kCFAllocatorDefault, 0);

    if (devicePathAsCFString) {
      char devicePath[256];
      Boolean result = CFStringGetCString(
          (CFStringRef)devicePathAsCFString, devicePath, sizeof(devicePath), kCFStringEncodingUTF8);

      if (result) {
#if DEBUG_SERIAL_PORT
        std::cout << "[DEBUG] Device path: " << devicePath << "\n";
#endif
        // Get USB vendor and product IDs by walking up the registry
        uint16_t vendorId = 0;
        uint16_t productId = 0;
        std::string manufacturer = "Unknown";
        std::string description = "Serial Port";

        io_registry_entry_t parent = serialService;
        io_registry_entry_t usbDevice = 0;

        // Walk up the registry tree to find the USB device
        while (IORegistryEntryGetParentEntry(parent, kIOServicePlane, &parent) == KERN_SUCCESS) {
          CFStringRef className = IOObjectCopyClass(parent);
          if (className) {
            std::array<char, 256> classNameStr{};
            if (CFStringGetCString(
                    className, classNameStr.data(), classNameStr.size(), kCFStringEncodingUTF8)) {
#if DEBUG_SERIAL_PORT
              std::cout << "[DEBUG] Parent class: " << classNameStr.data() << "\n";
#endif
              if (strstr(classNameStr.data(), "USB") != nullptr) {
                usbDevice = parent;
#if DEBUG_SERIAL_PORT
                std::cout << "[DEBUG] Found USB device node: " << usbDevice << "\n";
#endif
                CFRelease(className);
                break;
              }
            }
            CFRelease(className);
          }
        }

        // First try to get strings from the serial device itself
        std::vector<const char*> manufacturerProps = {
            "Manufacturer", kUSBVendorString, "USB Vendor Name", "iManufacturer", "Vendor"};
        std::vector<const char*> productProps = {
            "Product", kUSBProductString, "USB Product Name", "iProduct", "Model"};

#if DEBUG_SERIAL_PORT
        std::cout << "[DEBUG] Trying to get properties from serial device first...\n";
        debugRegistryProperties(serialService, "Serial Device");
#endif

        manufacturer = getUSBStringProperty(serialService, manufacturerProps);
        description = getUSBStringProperty(serialService, productProps);

        if (usbDevice) {
#if DEBUG_SERIAL_PORT
          std::cout << "[DEBUG] Also trying USB device properties...\n";
          debugRegistryProperties(usbDevice, "USB Device");
#endif

          CFTypeRef vendorIdRef =
              IORegistryEntryCreateCFProperty(usbDevice, CFSTR("idVendor"), kCFAllocatorDefault, 0);
          CFTypeRef productIdRef = IORegistryEntryCreateCFProperty(
              usbDevice, CFSTR("idProduct"), kCFAllocatorDefault, 0);

          if (vendorIdRef && CFGetTypeID(vendorIdRef) == CFNumberGetTypeID()) {
            CFNumberGetValue((CFNumberRef)vendorIdRef, kCFNumberSInt16Type, &vendorId);
#if DEBUG_SERIAL_PORT
            std::cout << "[DEBUG] Vendor ID: " << vendorId << "\n";
#endif
          } else {
#if DEBUG_SERIAL_PORT
            std::cout << "[DEBUG] Vendor ID not found or wrong type\n";
#endif
          }
          if (vendorIdRef) {
            CFRelease(vendorIdRef);
          }

          if (productIdRef && CFGetTypeID(productIdRef) == CFNumberGetTypeID()) {
            CFNumberGetValue((CFNumberRef)productIdRef, kCFNumberSInt16Type, &productId);
#if DEBUG_SERIAL_PORT
            std::cout << "[DEBUG] Product ID: " << productId << "\n";
#endif
          } else {
#if DEBUG_SERIAL_PORT
            std::cout << "[DEBUG] Product ID not found or wrong type\n";
#endif
          }
          if (productIdRef) {
            CFRelease(productIdRef);
          }

          // If we didn't get strings from the serial device, try the USB device
          if (manufacturer == "Unknown") {
#if DEBUG_SERIAL_PORT
            std::cout << "[DEBUG] Trying manufacturer from USB device...\n";
#endif
            manufacturer = getUSBStringProperty(usbDevice, manufacturerProps);
          }

          if (description == "Unknown" || description == "Serial Port") {
#if DEBUG_SERIAL_PORT
            std::cout << "[DEBUG] Trying product name from USB device...\n";
#endif
            description = getUSBStringProperty(usbDevice, productProps);
          }
        } else {
#if DEBUG_SERIAL_PORT
          std::cout << "[DEBUG] No USB device node found for this serial port\n";
#endif
        }

        // If we still don't have proper strings and we have valid vendor/product IDs,
        // try searching the USB registry directly
        if ((manufacturer == "Unknown" || description == "Unknown" ||
             description == "Serial Port") &&
            vendorId != 0 && productId != 0) {
#if DEBUG_SERIAL_PORT
          std::cout << "[DEBUG] Trying direct USB registry search...\n";
#endif
          auto [usbManufacturer, usbProduct] = getUSBDeviceStrings(vendorId, productId);
          if (usbManufacturer != "Unknown") {
            manufacturer = usbManufacturer;
          }
          if (usbProduct != "Unknown") {
            description = usbProduct;
          }
        }

        // Create the SerialPortInfo and add to the map
        std::string devicePathStr(devicePath);
        ports.emplace(
            devicePathStr,
            SerialPortInfo(
                devicePathStr,
                vendorId,
                productId,
                description,
                manufacturer,
                -1)); // Interface number not available on Mac
#if DEBUG_SERIAL_PORT
        foundCount++;
#endif
      } else {
#if DEBUG_SERIAL_PORT
        std::cout << "[DEBUG] Failed to convert device path CFString to C string\n";
#endif
      }

      CFRelease(devicePathAsCFString);
    } else {
#if DEBUG_SERIAL_PORT
      std::cout << "[DEBUG] No device path property found for serialService object: "
                << serialService << "\n";
#endif
    }

    IOObjectRelease(serialService);
  }

#if DEBUG_SERIAL_PORT
  std::cout << "[DEBUG] Enumeration complete, found " << foundCount << " serial port(s)\n";
#endif
  IOObjectRelease(serialPortIterator);

  return ports;
}

#endif // __APPLE__
