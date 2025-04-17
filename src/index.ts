import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getProcessByPort, getRamUsage, killProcessByPort } from "./utils.js";
import { z } from "zod";

const server = new McpServer({
  name: "System Control MCP",
  version: "1.0.0",
});

server.tool("getRamUsage", "Get the ram usage of this system", {}, () => {
  const ramInfo = getRamUsage();

  return {
    content: [
      {
        type: "text",
        text: `RAM Usage: ${ramInfo.used.megabytes} MB used out of ${ramInfo.total.megabytes} MB total (${ramInfo.percentUsed}%) \n ${JSON.stringify(ramInfo, null, 2)}`,
        isError: false,
      },
    ],
  };
});

server.tool(
  "getProcessByPort",
  "Get the process using a port",
  {
    port: z.string(),
  },
  async ({ port }) => {
    const portInfo = await getProcessByPort(+port);

    // if (portInfo.error) {
    //   return {
    //     content: [
    //       {
    //         type: "text",
    //         text: portInfo.details,
    //         isError: true,
    //       },
    //     ],
    //   };
    // }

    return {
      content: [
        {
          type: "text",
          text: `Process using port ${port}: ${JSON.stringify(portInfo, null, 2)}`,
          isError: false,
        },
      ],
    };
  },
);

server.tool(
  "killProcessByPort",
  "Kill the process using a port",
  {
    port: z.string(),
    force: z.optional(z.boolean()),
  },
  async ({ port, force }) => {
    const killProcessResponse = await killProcessByPort({ port: +port, force });

    if (!killProcessResponse.success) {
      return {
        content: [
          {
            type: "text",
            text: killProcessResponse.error || "Failed to kill process",
            isError: true,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Process using port ${port} killed successfully`,
          isError: false,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
