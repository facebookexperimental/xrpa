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

// xr protocol

#include "XredProtocol.h"

#include <stdio.h>
#include <string.h>

/**************************************************************************************
 * Local Constants Definition
 *************************************************************************************/
// use SLIP framing for a reliable packet boundary reset
#define XR_SLIP_END (0xC0)
#define XR_SLIP_ESC (0xDB)
#define XR_SLIP_ESCEND (0xDC)
#define XR_SLIP_ESCESC (0xDD)

#define XR_NON_DATA_PKT_LEN_CNT 8
#define XR_TRUNC_DATA_PRINT 0

/**************************************************************************************
 * Local Types Definition
 *************************************************************************************/

/**************************************************************************************
 * Global Variables Declaration
 *************************************************************************************/

/**************************************************************************************
 * Local Variables Declaration
 *************************************************************************************/

/**************************************************************************************
 * Local Functions Declaration
 *************************************************************************************/
static uint8_t* xr_protocol_slip_encode_to_buf(uint8_t* buf, uint8_t c);

/**************************************************************************************
 * Public Functions Code
 *************************************************************************************/

//-----------------------------------------------------------------------------------
// Parse incoming BLE data for packets
bool xr_protocol_sm(xr_protocol_port_t* port_p, uint8_t c) {
  // SLIP framing control
  if (!port_p->rx_esc_active) {
    // reset the parser if END is received
    if (c == XR_SLIP_END) {
      port_p->rx_parser_state = XR_RX_STATE_START_CH0;
      port_p->rx_esc_active = false;
      return false;
    }

    if (c == XR_SLIP_ESC) {
      port_p->rx_esc_active = true;
      return false; // this char isn't data, the next is
    }

  } else {
    // use the escaped char but turn off esc for next time
    port_p->rx_esc_active = false;

    // get the desired char
    if (c == XR_SLIP_ESCEND) {
      c = XR_SLIP_END;
    } else if (c == XR_SLIP_ESCESC) {
      c = XR_SLIP_ESC;
    } else {
      return false; // should never have this case
    }
  }

  // parse char based on state
  switch (port_p->rx_parser_state) {
    case XR_RX_STATE_START_CH0:
      if (c == 'X') {
        port_p->rx_parser_state = XR_RX_STATE_START_CH1;
      }
      break;

    case XR_RX_STATE_START_CH1:
      if (c == 'R') {
        xr_protocol_crc32_reset();
        port_p->rx_parser_state = XR_RX_STATE_LEN_MSB;
      } else {
        port_p->rx_parser_state = XR_RX_STATE_START_CH0;
      }
      break;

    case XR_RX_STATE_LEN_MSB:
      port_p->rx_pkt.data_len = c << 8;
      xr_protocol_crc32_update(c);
      port_p->rx_parser_state = XR_RX_STATE_LEN_LSB;
      break;

    case XR_RX_STATE_LEN_LSB:
      port_p->rx_pkt.data_len |= c;
      port_p->rx_pkt.data_len -= XR_NON_DATA_PKT_LEN_CNT;
      xr_protocol_crc32_update(c);
      port_p->rx_parser_state = XR_RX_STATE_PACKET_TYPE;
      break;

    case XR_RX_STATE_PACKET_TYPE: // (write, current value, etc)
      port_p->rx_pkt.type = c;
      xr_protocol_crc32_update(c);
      port_p->rx_parser_state = XR_RX_STATE_FLAGS;
      break;

    case XR_RX_STATE_FLAGS:
      port_p->rx_pkt.flags = c;
      xr_protocol_crc32_update(c);
      port_p->rx_parser_state = XR_RX_STATE_DATA_ID_MSB;
      break;

    case XR_RX_STATE_DATA_ID_MSB:
      port_p->rx_pkt.data_id = c << 8;
      xr_protocol_crc32_update(c);
      port_p->rx_parser_state = XR_RX_STATE_DATA_ID_LSB;
      break;

    case XR_RX_STATE_DATA_ID_LSB:
      port_p->rx_pkt.data_id |= c;
      xr_protocol_crc32_update(c);
      if (port_p->rx_pkt.data_len > 0) {
        port_p->rx_parser_state = XR_RX_STATE_DATA;
      } else {
        port_p->rx_parser_state = XR_RX_STATE_CRC_0;
      }
      port_p->rx_data_cntr = 0;
      break;

    case XR_RX_STATE_DATA:
      port_p->rx_pkt.data[port_p->rx_data_cntr++] = c;
      xr_protocol_crc32_update(c);
      if (port_p->rx_data_cntr >= port_p->rx_pkt.data_len) {
        port_p->rx_parser_state = XR_RX_STATE_CRC_0;
        port_p->rx_crc = xr_protocol_crc32_finalize();
      }
      break;

    case XR_RX_STATE_CRC_0:
      port_p->rx_pkt.crc32 = (c << 24);
      port_p->rx_parser_state = XR_RX_STATE_CRC_1;
      break;

    case XR_RX_STATE_CRC_1:
      port_p->rx_pkt.crc32 |= (c << 16);
      port_p->rx_parser_state = XR_RX_STATE_CRC_2;
      break;

    case XR_RX_STATE_CRC_2:
      port_p->rx_pkt.crc32 |= (c << 8);
      port_p->rx_parser_state = XR_RX_STATE_CRC_3;
      break;

    case XR_RX_STATE_CRC_3:
      port_p->rx_pkt.crc32 |= c;
      port_p->rx_parser_state = XR_RX_STATE_START_CH0;
      if (port_p->rx_crc == port_p->rx_pkt.crc32) {
        return true; // got a packet!
      } else {
        port_p->rx_crc_fail_cntr++;
      }
      break;

    default:
      break;
  }

  return false;
}

//--------------------------------------------------------------------------
uint32_t xr_protocol_serialize_packet(xr_protocol_packet_t* pkt_p, uint8_t* buf) {
  uint8_t* buf_start = buf;
  uint16_t len =
      pkt_p->data_len + XR_NON_DATA_PKT_LEN_CNT; // 4 post len field header bytes + 4 crc bytes

  // add the frame boundary char to reset the far side parser
  *buf++ = XR_SLIP_END;

  // add the header
  buf = xr_protocol_slip_encode_to_buf(buf, 'X');
  buf = xr_protocol_slip_encode_to_buf(buf, 'R');
  xr_protocol_crc32_reset(); // start CRC here
  buf = xr_protocol_slip_encode_to_buf(buf, (len >> 8) & 0xFF);
  buf = xr_protocol_slip_encode_to_buf(buf, len & 0xFF);
  buf = xr_protocol_slip_encode_to_buf(buf, pkt_p->type);
  buf = xr_protocol_slip_encode_to_buf(buf, pkt_p->flags);
  buf = xr_protocol_slip_encode_to_buf(buf, (pkt_p->data_id >> 8) & 0xFF);
  buf = xr_protocol_slip_encode_to_buf(buf, pkt_p->data_id & 0xFF);

  // add the data payload
  for (int i = 0; i < pkt_p->data_len; i++) {
    buf = xr_protocol_slip_encode_to_buf(buf, pkt_p->data[i]);
  }

  // add the crc32
  pkt_p->crc32 = xr_protocol_crc32_finalize();
  buf = xr_protocol_slip_encode_to_buf(buf, (pkt_p->crc32 >> 24) & 0xFF);
  buf = xr_protocol_slip_encode_to_buf(buf, (pkt_p->crc32 >> 16) & 0xFF);
  buf = xr_protocol_slip_encode_to_buf(buf, (pkt_p->crc32 >> 8) & 0xFF);
  buf = xr_protocol_slip_encode_to_buf(buf, pkt_p->crc32 & 0xFF);

  return buf - buf_start; // return size added to buf
}

/**************************************************************************************
 * Private Functions Code
 *************************************************************************************/

//--------------------------------------------------------------------------
static uint8_t* xr_protocol_slip_encode_to_buf(uint8_t* buf, uint8_t c) {
  xr_protocol_crc32_update(c);

  if (c == XR_SLIP_END) {
    *buf++ = XR_SLIP_ESC;
    *buf++ = XR_SLIP_ESCEND;
  } else if (c == XR_SLIP_ESC) {
    *buf++ = XR_SLIP_ESC;
    *buf++ = XR_SLIP_ESCESC;
  } else {
    *buf++ = c;
  }
  return buf;
}
