import type { ProjectState, ToolOp } from "@midistudio/shared";

// 模組：離線 fallback。前身在 agentLoop.ts 內聯，抽出以便單測/重用。
export function fallbackOps(prompt: string, project: ProjectState): { reply: string; ops: ToolOp[] } {
  const isModification = /修改|調整|刪除|移除|再改|照剛才|延續|續寫|改成|change|edit|delete|continue/i.test(prompt);
  if (isModification) {
    return {
      reply: "離線模式目前只支援建立簡單和弦進行；這項修改需要連接 LLM 才能安全處理，工程未變更。",
      ops: [],
    };
  }

  const ops: ToolOp[] = [];
  let bpm = project.bpm;
  const m = prompt.match(/(\d{2,3})\s*(bpm|拍)/i);
  if (m) {
    bpm = Math.max(40, Math.min(240, Number(m[1])));
    ops.push({ op: "update_tempo", bpm });
  }
  const isMinor = /小調|minor|悲|暗/i.test(prompt);
  const isGmajor = /G大|G major/i.test(prompt);
  const keyRoot = isMinor ? 9 : isGmajor ? 7 : project.keyRoot;
  if (isMinor) ops.push({ op: "update_key", keyRoot, scale: "natural_minor" });
  else if (isGmajor) ops.push({ op: "update_key", keyRoot, scale: "major" });
  const prog = isMinor ? ["i", "VI", "III", "VII"] : ["I", "V", "vi", "IV"];
  const barMatch = prompt.match(/(\d{1,2})\s*(?:小節|bars?|measures?)/i);
  const bars = barMatch ? Math.max(1, Math.min(32, Number(barMatch[1]))) : 4;
  ops.push({ op: "set_chord_progression", root: keyRoot, progression: prog, bars });
  return {
    reply: `離線模式：已寫入 ${bars} 小節 ${prog.join("-")}（${bpm}BPM）；接上 OPENROUTER_API_KEY 可使用完整作曲流程。`,
    ops,
  };
}
