import { SCALES, CHORDS, PROGRESSIONS, DRUM_MAP, FORMS, RHYTHMS } from "@midistudio/shared";
import { SCALES_TEXT, CHORDS_TEXT, MUSIC_KNOWLEDGE_TEXT } from "../llm/musicKnowledge.js";

// 模組：樂理查詢。MCP music_lookup 與 resource 共用同一函式，避免兩套答案。
export function lookupMusic(topic: string): string {
  switch (topic) {
    case "scales": return SCALES_TEXT;
    case "chords": return CHORDS_TEXT;
    case "progressions": return JSON.stringify(PROGRESSIONS);
    case "drums": return Object.entries(DRUM_MAP).map(([k, v]) => `${k}=${v}`).join(" ");
    case "form": return `曲式 ${JSON.stringify(FORMS)} 節奏 ${JSON.stringify(RHYTHMS)}`;
    case "all":
    default: return MUSIC_KNOWLEDGE_TEXT;
  }
}

export function scaleNames(): string[] {
  return Object.keys(SCALES);
}
