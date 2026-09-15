import type { ProjectState } from "@midistudio/shared";

// 模組：快照選擇器。消除 TransportBar / ChatPanel 各自手拼 project 的重複邏輯。
export interface SnapshotSource {
  bpm: number;
  keyRoot: number;
  scale: string;
  timeSig: [number, number];
  tracks: ProjectState["tracks"];
  selectedTrackId: string | null;
}

export function selectProjectSnapshot(s: SnapshotSource): ProjectState {
  return {
    bpm: s.bpm,
    keyRoot: s.keyRoot,
    scale: s.scale,
    timeSig: s.timeSig,
    tracks: s.tracks,
    selectedTrackId: s.selectedTrackId,
  };
}
