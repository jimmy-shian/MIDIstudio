import { Midi } from "./midiLib.js";
import { emptyProject, secondsToBeats, secondsToTicks, type ProjectState } from "@midistudio/shared";
import { newNoteId } from "@midistudio/shared";

// 模組：匯入。補完前版只有匯出、無匯入的缺口。
export function midiBufferToProject(buf: Buffer): ProjectState {
  const midi = new Midi(buf as any);
  const project = emptyProject();
  project.bpm = Math.round(midi.header.tempos[0]?.bpm ?? 120);
  const ts = (midi.header.timeSignatures[0] as any)?.timeSignature;
  if (Array.isArray(ts) && ts.length === 2) {
    const [num, den] = ts as [number, number];
    if (num >= 1 && num <= 32 && [2, 4, 8, 16].includes(den)) {
      project.timeSig = [num, den];
    }
  }
  project.tracks = midi.tracks
    .filter((t) => t.notes.length > 0)
    .slice(0, 8)
    .map((t, i) => ({
      id: `t-import-${i}`,
      name: t.name || t.instrument.name || `Track ${i + 1}`,
      kind: t.channel === 9 ? ("drums" as const) : ("melody" as const),
      program: t.instrument.number ?? 0,
      channel: t.channel ?? i,
      notes: t.notes.slice(0, 512).map((n) => {
        const startBeat = secondsToBeats(n.time, project.bpm);
        const durBeat = Math.max(0.0625, secondsToBeats(n.duration, project.bpm));
        const startTick = secondsToTicks(n.time, project.bpm);
        const durationTicks = Math.max(1, secondsToTicks(n.duration, project.bpm));
        return {
          id: newNoteId(),
          pitch: n.midi,
          startBeat,
          durBeat,
          startTick,
          durationTicks,
          velocity: Math.max(1, Math.min(127, Math.round((n.velocity ?? 0.7) * 127))),
        };
      }),
    }));
  if (!project.tracks.length) project.tracks = emptyProject().tracks;
  project.selectedTrackId = project.tracks[0]?.id ?? null;
  return project;
}
