import { McpServer } from "@modelcontextprotocol/server";
import { MUSIC_KNOWLEDGE_TEXT, SCALES_TEXT, CHORDS_TEXT } from "../llm/musicKnowledge.js";

// 模組：MCP resources。模型可訂閱的樂理表，不必每次調 tool。
export function registerResources(server: McpServer): void {
  server.registerResource(
    "cheatsheet",
    "music-theory://cheatsheet",
    { title: "MIDIstudio 樂理總表", description: "音階/和弦/進行/鼓/力度一次看", mimeType: "text/plain" },
    async (uri) => ({ contents: [{ uri: uri.href, text: MUSIC_KNOWLEDGE_TEXT }] })
  );
  server.registerResource(
    "scales",
    "music-theory://scales",
    { title: "音階表", mimeType: "text/plain" },
    async (uri) => ({ contents: [{ uri: uri.href, text: SCALES_TEXT }] })
  );
  server.registerResource(
    "chords",
    "music-theory://chords",
    { title: "和弦表", mimeType: "text/plain" },
    async (uri) => ({ contents: [{ uri: uri.href, text: CHORDS_TEXT }] })
  );
}
