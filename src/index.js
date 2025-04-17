import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getProcessByPort, getRamUsage, killProcessByPort } from "./utils.js";
import { z } from "zod";

const server = new McpServer({
  name: "System Control MCP",
  version: "1.0.0",
});

server.tool("getRamUsage", {}, getRamUsage);
server.tool(
  "getProcessByPort",
  {
    port: z.any(),
  },
  async ({ port }) => await getProcessByPort(port),
);
server.tool(
  "killProcessByPort",
  {
    port: z.any(),
    force: z.optional(z.boolean()),
  },
  async ({ port, force }) => await killProcessByPort({ port, force }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
