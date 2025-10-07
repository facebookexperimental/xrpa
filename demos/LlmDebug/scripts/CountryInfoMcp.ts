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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

const DEFAULT_PORT = 3120;

interface CountryInfo {
  name: string;
  capital: string;
  population: number;
  sizeInSqKm: number;
}

// Hardcoded database of country information
const countryDatabase: Record<string, CountryInfo> = {
  "usa": {
    name: "United States of America",
    capital: "Washington, D.C.",
    population: 331900000,
    sizeInSqKm: 9833520
  },
  "france": {
    name: "France",
    capital: "Paris",
    population: 67750000,
    sizeInSqKm: 551695
  },
  "saudi arabia": {
    name: "Saudi Arabia",
    capital: "Riyadh",
    population: 35950000,
    sizeInSqKm: 2149690
  }
};

function createServer() {
  const server = new McpServer({
    name: "country-info",
    version: "1.0.0"
  });

  server.registerTool(
    "get_country_info",
    {
      title: "Country Information",
      description: "Get basic information about a country including capital city, population, and size.",
      inputSchema: { country: z.string() },
    },
    async ({ country }) => {
      const countryName = (country as string).toLowerCase();
      console.log("get_country_info", country);

      if (!countryDatabase[countryName]) {
        return {
          content: [{
            type: "text",
            text: `Error: Country not found. Available countries: USA, France, Saudi Arabia`
          }],
          isError: true
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(countryDatabase[countryName], null, 2) }],
      };
    },
  );

  return server;
}

// below is boilerplate, not sure why they don't make a helper function for this
export function runMcpServer(port: number): void {
  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req, res) => {
    try {
      const server = createServer();
      const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on('close', () => {
        console.log('Request closed');
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // SSE notifications not supported in stateless mode
  app.get('/mcp', async (req, res) => {
    console.log('Received GET MCP request');
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    }));
  });

  // Session termination not needed in stateless mode
  app.delete('/mcp', async (req, res) => {
    console.log('Received DELETE MCP request');
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    }));
  });

  app.listen(port, (error) => {
    if (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
    console.log(`country-info MCP server listening on port ${port}`);
  });
}

// If this file is run directly, start the server
if (require.main === module) {
  runMcpServer(DEFAULT_PORT);
}
