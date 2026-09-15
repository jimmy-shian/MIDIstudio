import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import type { ToolOp } from "@midistudio/shared";
import { MCP_SCHEMAS, MCP_DESCRIPTIONS } from "./toolSchemas.js";
import {
  getProject, loadProject, applyToProject,
  listAllProjects, openProject, createNewProject, renameActiveProject, deleteSomeProject,
} from "./projectStore.js";
import { lookupMusic } from "./knowledge.js";
import { registerResources } from "./resources.js";

// MCP server：8 個 op + music_lookup + load/get + 5 個專案工具，共 16 tools。
// 任何 MCP host（Claude Desktop / VS Code Copilot / Cursor / Roo Code）連上即用。

const text = (s: string): { content: [{ type: "text"; text: string }] } => ({
  content: [{ type: "text", text: s }],
});

function summarize(output: { reports: string[] }): string {
  return output.reports.join("；");
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "midistudio", version: "0.1.0" });
  registerResources(server);

  server.registerTool("get_project", { description: MCP_DESCRIPTIONS.get_project, inputSchema: MCP_SCHEMAS.get_project },
    async () => text(JSON.stringify(getProject())));

  const projectTools = [
    { name: "project_list" as const, run: () => JSON.stringify(listAllProjects()) },
    { name: "project_open" as const, run: (a: any) => JSON.stringify(openProject(a.id)) },
    { name: "project_create" as const, run: (a: any) => JSON.stringify(createNewProject(a.name)) },
    { name: "project_rename" as const, run: (a: any) => JSON.stringify(renameActiveProject(a.name)) },
    { name: "project_delete" as const, run: (a: any) => JSON.stringify(deleteSomeProject(a.id)) },
  ];
  for (const t of projectTools) {
    server.registerTool(t.name, { description: MCP_DESCRIPTIONS[t.name], inputSchema: MCP_SCHEMAS[t.name] as any },
      async (args: any) => {
        try {
          return text(t.run(args));
        } catch (e: any) {
          return { content: [{ type: "text" as const, text: e.message }], isError: true };
        }
      });
  }

  server.registerTool("load_project", { description: MCP_DESCRIPTIONS.load_project, inputSchema: MCP_SCHEMAS.load_project },
    async ({ project }) => {
      try {
        return text(summarize(loadProject(project)));
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: e.message }], isError: true };
      }
    });

  server.registerTool("music_lookup", { description: MCP_DESCRIPTIONS.music_lookup, inputSchema: MCP_SCHEMAS.music_lookup },
    async ({ topic }) => text(lookupMusic(topic)));

  const mutating: { name: "create_track" | "add_notes" | "delete_notes" | "update_velocities" | "update_tempo" | "update_key" | "set_chord_progression" | "delete_track" }[] = [
    { name: "create_track" }, { name: "add_notes" }, { name: "delete_notes" },
    { name: "update_velocities" }, { name: "update_tempo" }, { name: "update_key" },
    { name: "set_chord_progression" }, { name: "delete_track" },
  ];
  for (const { name } of mutating) {
    server.registerTool(name, { description: MCP_DESCRIPTIONS[name], inputSchema: MCP_SCHEMAS[name] as any },
      async (args: any) => {
        try {
          const op = toOp(name, args);
          return text(summarize(applyToProject([op])));
        } catch (e: any) {
          return { content: [{ type: "text" as const, text: e.message }], isError: true };
        }
      });
  }
  return server;
}

function toOp(name: string, args: any): ToolOp {
  switch (name) {
    case "set_chord_progression":
      return { op: name, root: getProject().keyRoot, ...args };
    default:
      return { op: name, ...args } as ToolOp;
  }
}

// stdio 入口：stdout 是協議通道，只能 console.error。
serveStdio(createServer);
