import { Midi } from "./midiLib.js";
import { beatsToSeconds, type ProjectState } from "@midistudio/shared";

// 模組：匯出。前身在 server.ts 內聯，抽出給路由/測試共用。
export function projectToMidiBuffer(project: ProjectState): Buffer {
  const midi = new Midi();
  midi.header.setTempo(project.bpm);
  midi.header.timeSignatures.push({ ticks: 0, timeSignature: project.timeSig ?? [4, 4] });
  for (const t of project.tracks) {
    const track = midi.addTrack();
    track.channel = t.channel ?? 0;
    if (t.kind !== "drums") track.instrument.number = t.program ?? 0;
    for (const n of t.notes) {
      track.addNote({
        midi: n.pitch,
        time: beatsToSeconds(n.startBeat, project.bpm),
        duration: beatsToSeconds(n.durBeat, project.bpm),
        velocity: (n.velocity ?? 90) / 127,
      });
    }
  }
  return Buffer.from(midi.toArray());
}
