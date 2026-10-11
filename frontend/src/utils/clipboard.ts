import type { NoteEvent } from "@midistudio/shared";
import { beatsToTicks, ticksToBeats } from "@midistudio/shared";
import { useProjectStore } from "../store/useProjectStore";
import { useViewStore } from "../store/viewStore";

// 模組：琴格剪貼簿。複製視窗內音符（含 Tick 精度），貼上至目前視角起點。
// 不進 undo 歷史之外的額外狀態，單純模組級暫存。
export interface ClipboardNotes {
  kind: string;
  notes: Omit<NoteEvent, "id">[];
  spanBeats: number;
}

let clipboard: ClipboardNotes | null = null;

export function getClipboard(): ClipboardNotes | null {
  return clipboard;
}

function noteStartBeat(n: NoteEvent): number {
  return n.startTick !== undefined ? ticksToBeats(n.startTick) : n.startBeat;
}

/** 複製所選軌在目前視窗內的音符；回傳複製數量。 */
export function copyViewNotes(): number {
  const st = useProjectStore.getState();
  const track = st.tracks.find((t) => t.id === st.selectedTrackId) ?? st.tracks[0];
  if (!track) return 0;
  const { startBeat, beatsVisible } = useViewStore.getState();
  const end = startBeat + beatsVisible;
  const picked = track.notes.filter((n) => {
    const s = noteStartBeat(n);
    return s >= startBeat && s < end;
  });
  if (!picked.length) return 0;
  const minStart = Math.min(...picked.map(noteStartBeat));
  clipboard = {
    kind: track.kind,
    spanBeats: end - startBeat,
    notes: picked.map((n) => ({
      pitch: n.pitch,
      startBeat: noteStartBeat(n) - minStart,
      durBeat: n.durationTicks !== undefined ? ticksToBeats(n.durationTicks) : n.durBeat,
      startTick: (n.startTick ?? beatsToTicks(n.startBeat)) - beatsToTicks(minStart),
      durationTicks: n.durationTicks ?? beatsToTicks(n.durBeat),
      velocity: n.velocity,
    })),
  };
  return picked.length;
}

/** 貼上至目前視角起點；回傳貼上數量。 */
export function pasteAtView(): number {
  if (!clipboard) return 0;
  const st = useProjectStore.getState();
  const track = st.tracks.find((t) => t.id === st.selectedTrackId) ?? st.tracks[0];
  if (!track) return 0;
  const { startBeat } = useViewStore.getState();
  const baseTick = beatsToTicks(startBeat);
  st.localApply([
    {
      op: "add_notes",
      trackId: track.id,
      notes: clipboard.notes.map((n) => ({
        pitch: n.pitch,
        startBeat: startBeat + n.startBeat,
        durBeat: n.durBeat,
        startTick: baseTick + (n.startTick ?? beatsToTicks(n.startBeat)),
        durationTicks: n.durationTicks,
        velocity: n.velocity,
      })),
    },
  ]);
  return clipboard.notes.length;
}

/** 重複最後一小節至下一小節；回傳新增數量。 */
export function duplicateLastBar(): number {
  const st = useProjectStore.getState();
  const track = st.tracks.find((t) => t.id === st.selectedTrackId) ?? st.tracks[0];
  if (!track || !track.notes.length) return 0;
  const beatsPerBar = (() => {
    const ts = st.timeSig ?? [4, 4];
    return ts[0] * (4 / ts[1]);
  })();
  let maxEnd = 0;
  for (const n of track.notes) {
    const e = noteStartBeat(n) + (n.durationTicks !== undefined ? ticksToBeats(n.durationTicks) : n.durBeat);
    if (e > maxEnd) maxEnd = e;
  }
  const srcStart = Math.max(0, maxEnd - beatsPerBar);
  const picked = track.notes.filter((n) => {
    const s = noteStartBeat(n);
    return s >= srcStart && s < maxEnd;
  });
  if (!picked.length) return 0;
  st.localApply([
    {
      op: "add_notes",
      trackId: track.id,
      notes: picked.map((n) => {
        const s = noteStartBeat(n);
        const shift = maxEnd - srcStart;
        const ns = s + shift;
        return {
          pitch: n.pitch,
          startBeat: ns,
          durBeat: n.durationTicks !== undefined ? ticksToBeats(n.durationTicks) : n.durBeat,
          startTick: beatsToTicks(ns),
          durationTicks: n.durationTicks ?? beatsToTicks(n.durBeat),
          velocity: n.velocity,
        };
      }),
    },
  ]);
  return picked.length;
}
