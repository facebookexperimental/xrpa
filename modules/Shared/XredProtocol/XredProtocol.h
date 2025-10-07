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

#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/**************************************************************************************
 * Constants Definition
 *************************************************************************************/
#define XR_DATA_ID_REQUEST 1
#define XR_DATA_ID_DEVINFO 2
#define XR_DATA_ID_DEV_NAME 3
#define XR_DATA_ID_DEV_MANUFACTURER 4
#define XR_DATA_ID_COMMAND_LIST 5
#define XR_DATA_ID_PWM_SAMPLES 10
#define XR_DATA_ID_PWM_INTERLEAVED_SAMPLES 11
#define XR_DATA_ID_CAPTOUCH 20
#define XR_DATA_ID_SMART_KNOB_STATUS 30
#define XR_DATA_ID_SMART_KNOB_CONFIG 31
#define XR_DATA_ID_SMART_KNOB_POSITION_MOVE 32
#define XR_DATA_ID_LED_RING_SET_RGBW 40

/**************************************************************************************
 * Macro Definition
 *************************************************************************************/

/**************************************************************************************
 * Types Definition
 *************************************************************************************/

typedef enum {
  XR_RX_STATE_START_CH0 = 0,
  XR_RX_STATE_START_CH1,
  XR_RX_STATE_LEN_MSB,
  XR_RX_STATE_LEN_LSB,
  XR_RX_STATE_PACKET_TYPE,
  XR_RX_STATE_FLAGS,
  XR_RX_STATE_DATA_ID_MSB,
  XR_RX_STATE_DATA_ID_LSB,
  XR_RX_STATE_DATA,
  XR_RX_STATE_CRC_0,
  XR_RX_STATE_CRC_1,
  XR_RX_STATE_CRC_2,
  XR_RX_STATE_CRC_3
} xr_rx_state_e;

// general packet structure
typedef struct {
  uint8_t type;
  uint16_t flags;
  uint16_t data_id;
  uint16_t data_len;
  uint8_t data[256];
  uint32_t crc32;
} xr_protocol_packet_t;

// general data associated with a communication port
typedef struct {
  xr_rx_state_e rx_parser_state;
  bool rx_esc_active;
  xr_protocol_packet_t rx_pkt;
  uint32_t rx_data_cntr;
  uint32_t rx_crc;
  uint32_t rx_crc_fail_cntr;
} xr_protocol_port_t;

/**************************************************************************************
 * Exported Variables Declaration
 *************************************************************************************/

/**************************************************************************************
 * Exported Functions Prototypes
 *************************************************************************************/

// functions for app use
bool xr_protocol_sm(xr_protocol_port_t* port_p, uint8_t c);
uint32_t xr_protocol_serialize_packet(xr_protocol_packet_t* pkt_p, uint8_t* buf);
uint32_t xr_protocol_print_pkt_detail(xr_protocol_packet_t* pkt_p, uint8_t* buf);

// app provided callbacks
void xr_protocol_crc32_update(uint8_t data);
uint32_t xr_protocol_crc32_finalize(void);
void xr_protocol_crc32_reset(void);

#ifdef __cplusplus
}
#endif
