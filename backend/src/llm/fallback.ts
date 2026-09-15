import type { ProjectState, ToolOp } from "@midistudio/shared";

// 模組：離線 fallback。前身在 agentLoop.ts 內聯，抽出以便單測/重用。
export function fallbackOps(prompt: string, project: ProjectState): { reply: string; ops: ToolOp[] } {
  const ops: ToolOp[] = [];
  let bpm = project.bpm;
  const m = prompt.match(/(\d{2,3})\s*(bpm|拍)/i);
  if (m) {
    bpm = Math.max(40, Math.min(240, Number(m[1])));
    ops.push({ op: "update_tempo", bpm });
  }
  const isMinor = /小調|minor|悲|暗/i.test(prompt);
  if (isMinor) ops.push({ op: "update_key", keyRoot: 9, scale: "natural_minor" });
  else if (/G大|G major/i.test(prompt)) ops.push({ op: "update_key", keyRoot: 7, scale: "major" });
  const prog = isMinor ? ["i", "VI", "III", "VII"] : ["I", "V", "vi", "IV"];
  ops.push({ op: "set_chord_progression", root: project.keyRoot, progression: prog, bars: 4 });
  return {
    reply: `離線模式：已寫入 ${prog.join("-")}（${bpm}BPM），接上 OPENROUTER_API_KEY 可用完整 LLM。`,
    ops,
  };
}
