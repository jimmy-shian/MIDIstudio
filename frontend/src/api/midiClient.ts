import type { ProjectState } from "@midistudio/shared";

// 模組：MIDI 檔案傳輸。從 agentClient 拆出，前身 exportMidi 混在 AI client 內。
export async function exportMidi(project: ProjectState): Promise<Blob> {
  const res = await fetch("/api/midi/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  });
  if (!res.ok) throw new Error("export failed");
  return res.blob();
}

export async function importMidi(file: File): Promise<ProjectState> {
  const buf = await file.arrayBuffer();
  const res = await fetch("/api/midi/import", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: buf,
  });
  if (!res.ok) throw new Error(`import failed: ${await res.text()}`);
  const data = await res.json();
  return data.project as ProjectState;
}
