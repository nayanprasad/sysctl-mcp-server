import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import os from "os";

const server = new McpServer({
  name: "System Control MCP",
  version: "1.0.0",
});

server.tool("getRamUsage", {
  description: "Get the current RAM usage of the system",
  parameters: z.object({}),
  handler: async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: {
        bytes: totalMem,
        megabytes: Math.round(totalMem / 1024 / 1024),
        gigabytes: (totalMem / 1024 / 1024 / 1024).toFixed(2),
      },
      free: {
        bytes: freeMem,
        megabytes: Math.round(freeMem / 1024 / 1024),
        gigabytes: (freeMem / 1024 / 1024 / 1024).toFixed(2),
      },
      used: {
        bytes: usedMem,
        megabytes: Math.round(usedMem / 1024 / 1024),
        gigabytes: (usedMem / 1024 / 1024 / 1024).toFixed(2),
      },
      percentUsed: Math.round((usedMem / totalMem) * 100),
    };
  },
});

const transport = new StdioServerTransport();
await server.connect(transport);
