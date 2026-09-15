// 純函數狀態運算：前後端共用，保證 LLM 回傳的 ops 兩端行為一致。
// 薄編排層：ID 與羅馬數字邏輯已拆到 ./ids.ts ./roman.ts，本檔只做 apply。
import type { NoteEvent, OpReport, ProjectState, ToolOp } from "./types.js";
import { chordNotes } from "./music-theory.js";
import { clampPitch, clampVelocity } from "./midi-utils.js";
import { CHORD_DEFAULT_OCTAVE, CHORD_DEFAULT_VELOCITY } from "./op-defaults.js";
import { newNoteId, newTrackId } from "./ids.js";
import { romanToRootChord } from "./roman.js";

export function applyOps(project: ProjectState, ops: ToolOp[]): { project: ProjectState; reports: OpReport[] } {
  // Copy-on-write：避免 JSON.parse(JSON.stringify()) 全量深拷貝。
  // 舊寫法每點一格、每拖一像素力度就複製整個工程（含 JSON 字串中間物），GC 壓力大。
  // 新寫法只複製被碰到的 track / note，其餘共用引用（唯讀不改即安全）。
  const next: ProjectState = {
    ...project,
    timeSig: [project.timeSig[0], project.timeSig[1]],
    tracks: project.tracks.slice(),
  };
  const reports: OpReport[] = [];
  // 已獨佔（可直接 mutate notes 陣列本身，但 note 物件仍需個別複製後取代）的 track id
  const owned = new Set<string>();

  const mutableTrack = (id: string) => {
    const idx = next.tracks.findIndex((t) => t.id === id);
    if (idx < 0) return undefined;
    const t = next.tracks[idx];
    if (!owned.has(t.id)) {
      const copy = { ...t, notes: t.notes.slice() };
      next.tracks[idx] = copy;
      owned.add(t.id);
      return copy;
    }
    return t;
  };

  for (const op of ops) {
    switch (op.op) {
      case "create_track": {
        const id = newTrackId();
        const channel = op.kind === "drums" ? 9 : next.tracks.length % 16;
        next.tracks.push({ id, name: op.name, kind: op.kind, program: op.program ?? 0, channel, notes: [] });
        if (!next.selectedTrackId) next.selectedTrackId = id;
        reports.push({ ok: true, message: `建立音軌 ${op.name} (${id})` });
        break;
      }
      case "delete_track": {
        next.tracks = next.tracks.filter((t) => t.id !== op.trackId);
        if (next.selectedTrackId === op.trackId) next.selectedTrackId = next.tracks[0]?.id ?? null;
        reports.push({ ok: true, message: `刪除音軌 ${op.trackId}` });
        break;
      }
      case "add_notes": {
        const t = mutableTrack(op.trackId);
        if (!t) { reports.push({ ok: false, message: `找不到 ${op.trackId}` }); break; }
        const made: NoteEvent[] = op.notes.map((n) => ({
          id: newNoteId(), pitch: clampPitch(n.pitch),
          startBeat: Math.max(0, n.startBeat), durBeat: Math.min(16, Math.max(0.125, n.durBeat)),
          velocity: clampVelocity(n.velocity),
        }));
        t.notes.push(...made);
        t.notes.sort((a, b) => a.startBeat - b.startBeat);
        reports.push({ ok: true, message: `加入 ${made.length} 個音到 ${t.name}` });
        break;
      }
      case "delete_notes": {
        const t = mutableTrack(op.trackId);
        if (!t) { reports.push({ ok: false, message: `找不到 ${op.trackId}` }); break; }
        const s = new Set(op.noteIds);
        const before = t.notes.length;
        // filter 產生新陣列，直接取代獨佔副本的 notes，不污染輸入工程
        t.notes = t.notes.filter((n) => !s.has(n.id));
        reports.push({ ok: true, message: `刪除 ${before - t.notes.length} 個音` });
        break;
      }
      case "update_velocities": {
        const t = mutableTrack(op.trackId);
        if (!t) { reports.push({ ok: false, message: `找不到 ${op.trackId}` }); break; }
        const map = new Map(op.edits.map((e) => [e.id, clampVelocity(e.velocity)]));
        let hit = 0;
        // 只取代有變化的 note 物件，避免全軌複製；未變化者繼續共用引用
        for (let i = 0; i < t.notes.length; i++) {
          const n = t.notes[i];
          const v = map.get(n.id);
          if (v !== undefined && n.velocity !== v) { t.notes[i] = { ...n, velocity: v }; hit++; }
          else if (v !== undefined) { hit++; }
        }
        reports.push({ ok: true, message: `更新力度 ${hit} 個音（${t.name}）` });
        break;
      }
      case "update_tempo":
        next.bpm = op.bpm;
        reports.push({ ok: true, message: `速度 -> ${op.bpm} BPM` });
        break;
      case "update_key":
        next.keyRoot = op.keyRoot; next.scale = op.scale;
        reports.push({ ok: true, message: `調性 -> ${op.keyRoot} ${op.scale}` });
        break;
      case "set_chord_progression": {
        let t = op.trackId ? mutableTrack(op.trackId) : undefined;
        if (!t && !op.trackId) {
          const existing = next.tracks.find((x) => x.kind === "chords");
          if (existing) t = mutableTrack(existing.id);
        }
        if (!t) {
          const id = newTrackId();
          t = { id, name: "Chords", kind: "chords", program: 0, channel: 0, notes: [] };
          next.tracks.push(t);
          owned.add(id);
        }
        const bars = op.bars ?? op.progression.length;
        const vel = op.velocity !== undefined ? clampVelocity(op.velocity) : CHORD_DEFAULT_VELOCITY;
        const oct = op.octave ?? CHORD_DEFAULT_OCTAVE;
        for (let i = 0; i < bars; i++) {
          const roman = op.progression[i % op.progression.length];
          const { root, chord } = romanToRootChord(next.keyRoot, roman, oct);
          const pitches = chordNotes(root, chord);
          for (const p of pitches) {
            t.notes.push({ id: newNoteId(), pitch: p, startBeat: i * 4, durBeat: 4, velocity: vel });
          }
        }
        t.notes.sort((a, b) => a.startBeat - b.startBeat);
        reports.push({ ok: true, message: `寫入進行 ${op.progression.join("-")} 共 ${bars} 小節` });
        break;
      }
    }
  }
  return { project: next, reports };
}

export function emptyProject(): ProjectState {
  return {
    bpm: 120, keyRoot: 0, scale: "major", timeSig: [4, 4],
    selectedTrackId: "t-melody",
    tracks: [
      { id: "t-melody", name: "Melody", kind: "melody", program: 0, channel: 0, notes: [] },
      { id: "t-chords", name: "Chords", kind: "chords", program: 0, channel: 1, notes: [] },
      { id: "t-bass", name: "Bass", kind: "bass", program: 32, channel: 2, notes: [] },
    ],
  };
}
