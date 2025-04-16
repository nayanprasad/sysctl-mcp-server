import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getRamUsage } from "./utils.js";

const server = new McpServer({
  name: "System Control MCP",
  version: "1.0.0",
});

server.tool("getRamUsage", {}, getRamUsage);

const transport = new StdioServerTransport();
await server.connect(transport);
