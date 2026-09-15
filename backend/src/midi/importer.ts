import { Midi } from "./midiLib.js";
import { emptyProject, secondsToBeats, type ProjectState } from "@midistudio/shared";
import { newNoteId } from "@midistudio/shared";

// 模組：匯入。補完前版只有匯出、無匯入的缺口。
export function midiBufferToProject(buf: Buffer): ProjectState {
  const midi = new Midi(buf as any);
  const project = emptyProject();
  project.bpm = Math.round(midi.header.tempos[0]?.bpm ?? 120);
  project.tracks = midi.tracks
    .filter((t) => t.notes.length > 0)
    .slice(0, 8)
    .map((t, i) => ({
      id: `t-import-${i}`,
      name: t.name || t.instrument.name || `Track ${i + 1}`,
      kind: t.channel === 9 ? ("drums" as const) : ("melody" as const),
      program: t.instrument.number ?? 0,
      channel: t.channel ?? i,
      notes: t.notes.slice(0, 512).map((n) => ({
        id: newNoteId(),
        pitch: n.midi,
        startBeat: secondsToBeats(n.time, project.bpm),
        durBeat: Math.max(0.125, secondsToBeats(n.duration, project.bpm)),
        velocity: Math.round((n.velocity ?? 0.7) * 127),
      })),
    }));
  if (!project.tracks.length) project.tracks = emptyProject().tracks;
  project.selectedTrackId = project.tracks[0]?.id ?? null;
  return project;
}
