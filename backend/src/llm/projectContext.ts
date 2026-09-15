import type { ProjectState } from "@midistudio/shared";

// 模組：工程摘要。前身在 agentLoop.ts 內聯，抽出以便控制 token。
export function projectToText(p: ProjectState): string {
  const lines = [
    `bpm=${p.bpm} key=${p.keyRoot} scale=${p.scale} time=${p.timeSig[0]}/${p.timeSig[1]}`,
    ...p.tracks.map((t) => {
      const preview = t.notes.slice(0, 20).map((n) => `${n.pitch}@${n.startBeat}+${n.durBeat}`).join(",");
      return `- [${t.kind}] ${t.name} id=${t.id} notes=${t.notes.length} {${preview}}`;
    }),
  ];
  return lines.join("\n");
}
