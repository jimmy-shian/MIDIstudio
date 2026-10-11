// 純函數狀態運算：前後端共用，保證 LLM 回傳的 ops 兩端行為一致。
import type { NoteEvent, OpReport, ProjectState, ToolOp, Track } from "./types.js";
import { chordNotes } from "./music-theory.js";
import {
  clampPitch,
  clampVelocity,
  getBeatsPerBar,
  getMeasureTicks,
  beatsToTicks,
  ticksToBeats,
  quantizeTick,
} from "./midi-utils.js";
import { CHORD_DEFAULT_OCTAVE, CHORD_DEFAULT_VELOCITY } from "./op-defaults.js";
import { newNoteId, newTrackId } from "./ids.js";
import { romanToRootChord } from "./roman.js";
import { compileMusicSpec, generateDrumPatternNotes } from "./music-compiler.js";

export function applyOps(
  project: ProjectState,
  ops: ToolOp[]
): { project: ProjectState; reports: OpReport[] } {
  let next: ProjectState = {
    ...project,
    timeSig: [project.timeSig[0], project.timeSig[1]],
    tracks: project.tracks.slice(),
    sections: project.sections ? project.sections.slice() : [],
    masterEffects: project.masterEffects ? project.masterEffects.slice() : [],
  };
  const reports: OpReport[] = [];
  const owned = new Set<string>();

  const mutableTrack = (id: string): Track | undefined => {
    const idx = next.tracks.findIndex((t) => t.id === id);
    if (idx < 0) return undefined;
    const t = next.tracks[idx];
    if (!owned.has(t.id)) {
      const copy: Track = {
        ...t,
        notes: t.notes.slice(),
        effects: t.effects ? t.effects.slice() : [],
      };
      next.tracks[idx] = copy;
      owned.add(t.id);
      return copy;
    }
    return t;
  };

  for (const op of ops) {
    switch (op.op) {
      case "create_composition": {
        next = compileMusicSpec(op.spec, next);
        reports.push({
          ok: true,
          message: `已編譯完整風格作曲 (${op.spec.genre ?? "pop"}, ${op.spec.tempo ?? 120} BPM, ${next.timeSig[0]}/${next.timeSig[1]})`,
        });
        break;
      }

      case "update_time_signature": {
        const num = Math.max(1, Math.min(32, Math.round(op.numerator)));
        const den = [2, 4, 8, 16].includes(op.denominator) ? op.denominator : 4;
        next.timeSig = [num, den];
        reports.push({ ok: true, message: `拍號 -> ${num}/${den}` });
        break;
      }

      case "create_track": {
        const id = newTrackId();
        const channel = op.kind === "drums" ? 9 : next.tracks.length % 16;
        next.tracks.push({
          id,
          name: op.name,
          kind: op.kind,
          program: op.program ?? 0,
          channel,
          volume: 100,
          pan: 0,
          mute: false,
          solo: false,
          effects: [],
          notes: [],
        });
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
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        const made: NoteEvent[] = op.notes.map((n) => {
          const startBeat = Math.max(0, n.startBeat ?? 0);
          const durBeat = Math.min(64, Math.max(0.0625, n.durBeat ?? 1));
          const startTick = n.startTick !== undefined ? n.startTick : beatsToTicks(startBeat);
          const durationTicks = n.durationTicks !== undefined ? n.durationTicks : beatsToTicks(durBeat);
          return {
            id: newNoteId(),
            pitch: clampPitch(n.pitch),
            startBeat,
            durBeat,
            startTick,
            durationTicks,
            velocity: clampVelocity(n.velocity ?? 90),
            muted: n.muted ?? false,
          };
        });
        t.notes.push(...made);
        t.notes.sort((a, b) => (a.startTick ?? 0) - (b.startTick ?? 0));
        reports.push({ ok: true, message: `加入 ${made.length} 個音符到 ${t.name}` });
        break;
      }

      case "delete_notes": {
        const t = mutableTrack(op.trackId);
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        const s = new Set(op.noteIds);
        const before = t.notes.length;
        t.notes = t.notes.filter((n) => !s.has(n.id));
        reports.push({ ok: true, message: `刪除 ${before - t.notes.length} 個音符` });
        break;
      }

      case "update_velocities": {
        const t = mutableTrack(op.trackId);
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        const map = new Map(op.edits.map((e) => [e.id, clampVelocity(e.velocity)]));
        let hit = 0;
        for (let i = 0; i < t.notes.length; i++) {
          const n = t.notes[i];
          const v = map.get(n.id);
          if (v !== undefined) {
            t.notes[i] = { ...n, velocity: v };
            hit++;
          }
        }
        reports.push({ ok: true, message: `更新 ${hit} 個音符力度（${t.name}）` });
        break;
      }

      case "update_tempo":
        next.bpm = Math.max(40, Math.min(240, Math.round(op.bpm)));
        reports.push({ ok: true, message: `速度 -> ${next.bpm} BPM` });
        break;

      case "update_key":
        next.keyRoot = op.keyRoot;
        next.scale = op.scale;
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
          t = {
            id,
            name: "Chords",
            kind: "chords",
            program: 4,
            channel: 1,
            volume: 85,
            pan: 0,
            mute: false,
            solo: false,
            effects: [],
            notes: [],
          };
          next.tracks.push(t);
          owned.add(id);
        }
        const bars = op.bars ?? op.progression.length;
        const vel = op.velocity !== undefined ? clampVelocity(op.velocity) : CHORD_DEFAULT_VELOCITY;
        const oct = op.octave ?? CHORD_DEFAULT_OCTAVE;
        const beatsPerBar = getBeatsPerBar(next.timeSig);
        const measureTicks = getMeasureTicks(next.timeSig);

        for (let i = 0; i < bars; i++) {
          const roman = op.progression[i % op.progression.length];
          const { root, chord } = romanToRootChord(next.keyRoot, roman, oct, next.scale);
          const pitches = chordNotes(root, chord);
          const startBeat = i * beatsPerBar;
          const startTick = i * measureTicks;
          for (const p of pitches) {
            t.notes.push({
              id: newNoteId(),
              pitch: p,
              startBeat,
              durBeat: beatsPerBar,
              startTick,
              durationTicks: measureTicks,
              velocity: vel,
            });
          }
        }
        t.notes.sort((a, b) => (a.startTick ?? 0) - (b.startTick ?? 0));
        reports.push({
          ok: true,
          message: `寫入進行 ${op.progression.join("-")} 共 ${bars} 小節 (每小節 ${beatsPerBar} 拍)`,
        });
        break;
      }

      case "generate_drum_pattern": {
        let t = op.trackId ? mutableTrack(op.trackId) : undefined;
        if (!t) {
          const existing = next.tracks.find((x) => x.kind === "drums");
          if (existing) t = mutableTrack(existing.id);
        }
        if (!t) {
          const id = newTrackId();
          t = {
            id,
            name: "Drums",
            kind: "drums",
            program: 0,
            channel: 9,
            volume: 100,
            pan: 0,
            mute: false,
            solo: false,
            effects: [],
            notes: [],
          };
          next.tracks.push(t);
          owned.add(id);
        }
        const startTick =
          op.startTick !== undefined
            ? op.startTick
            : op.startBeat !== undefined
            ? beatsToTicks(op.startBeat)
            : 0;
        const drumNotes = generateDrumPatternNotes(op.pattern, op.bars, next.timeSig, startTick);
        t.notes.push(...drumNotes);
        t.notes.sort((a, b) => (a.startTick ?? 0) - (b.startTick ?? 0));
        reports.push({
          ok: true,
          message: `為 ${t.name} 編 ${op.pattern} 鼓組（底鼓/小鼓/踩鈸分工，共 ${op.bars} 小節，${drumNotes.length} 音）`,
        });
        break;
      }

      case "create_section": {
        const measureTicks = getMeasureTicks(next.timeSig);
        const existingTotal =
          (next.sections ?? []).reduce((sum, s) => sum + (s.lengthTicks ?? 0), 0);
        const startTick =
          op.startTick !== undefined
            ? op.startTick
            : op.startBeat !== undefined
            ? beatsToTicks(op.startBeat)
            : existingTotal;
        const lengthTicks = op.bars * measureTicks;
        if (!next.sections) next.sections = [];
        next.sections.push({
          id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: op.name,
          startTick,
          lengthTicks,
          bars: op.bars,
        });
        reports.push({ ok: true, message: `建立段落 ${op.name} (${op.bars} 小節)` });
        break;
      }

      case "clear_region": {
        const t = mutableTrack(op.trackId);
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        const startTick =
          op.startTick !== undefined
            ? op.startTick
            : op.startBeat !== undefined
            ? beatsToTicks(op.startBeat)
            : 0;
        const endTick =
          op.endTick !== undefined
            ? op.endTick
            : op.endBeat !== undefined
            ? beatsToTicks(op.endBeat)
            : Number.MAX_SAFE_INTEGER;
        const before = t.notes.length;
        t.notes = t.notes.filter((n) => {
          const st = n.startTick ?? beatsToTicks(n.startBeat);
          return st < startTick || st >= endTick;
        });
        reports.push({ ok: true, message: `已清空 ${t.name} 區間內 ${before - t.notes.length} 個音符` });
        break;
      }

      case "transpose_region": {
        const t = mutableTrack(op.trackId);
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        const startTick =
          op.startTick !== undefined
            ? op.startTick
            : op.startBeat !== undefined
            ? beatsToTicks(op.startBeat)
            : 0;
        const endTick =
          op.endTick !== undefined
            ? op.endTick
            : op.endBeat !== undefined
            ? beatsToTicks(op.endBeat)
            : Number.MAX_SAFE_INTEGER;
        let count = 0;
        for (let i = 0; i < t.notes.length; i++) {
          const n = t.notes[i];
          const st = n.startTick ?? beatsToTicks(n.startBeat);
          if (st >= startTick && st < endTick) {
            t.notes[i] = { ...n, pitch: clampPitch(n.pitch + op.semitones) };
            count++;
          }
        }
        reports.push({ ok: true, message: `已將 ${t.name} ${count} 個音符移調 ${op.semitones} 半音` });
        break;
      }

      case "quantize_region": {
        const t = mutableTrack(op.trackId);
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        const gridTicks =
          op.gridTicks !== undefined
            ? op.gridTicks
            : op.gridBeat !== undefined
            ? beatsToTicks(op.gridBeat)
            : 240; // 預設 16 分音符
        let count = 0;
        for (let i = 0; i < t.notes.length; i++) {
          const n = t.notes[i];
          const st = n.startTick ?? beatsToTicks(n.startBeat);
          const quantized = quantizeTick(st, gridTicks);
          t.notes[i] = {
            ...n,
            startTick: quantized,
            startBeat: ticksToBeats(quantized),
          };
          count++;
        }
        t.notes.sort((a, b) => (a.startTick ?? 0) - (b.startTick ?? 0));
        reports.push({ ok: true, message: `已量化 ${t.name} ${count} 個音符` });
        break;
      }

      case "humanize_region": {
        const t = mutableTrack(op.trackId);
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        const velVar = op.velocityVariance ?? 6;
        const timeVar = op.timingVarianceTicks ?? 20;
        for (let i = 0; i < t.notes.length; i++) {
          const n = t.notes[i];
          const dV = Math.floor((Math.random() - 0.5) * 2 * velVar);
          const dT = Math.floor((Math.random() - 0.5) * 2 * timeVar);
          const newVel = clampVelocity(n.velocity + dV);
          const newTick = Math.max(0, (n.startTick ?? beatsToTicks(n.startBeat)) + dT);
          t.notes[i] = {
            ...n,
            velocity: newVel,
            startTick: newTick,
            startBeat: ticksToBeats(newTick),
          };
        }
        t.notes.sort((a, b) => (a.startTick ?? 0) - (b.startTick ?? 0));
        reports.push({ ok: true, message: `已人性化 ${t.name} ${t.notes.length} 個音符` });
        break;
      }

      case "set_track_mixer": {
        const t = mutableTrack(op.trackId);
        if (!t) {
          reports.push({ ok: false, message: `找不到音軌: ${op.trackId}` });
          break;
        }
        if (op.volume !== undefined) t.volume = Math.max(0, Math.min(127, Math.round(op.volume)));
        if (op.pan !== undefined) t.pan = Math.max(-1, Math.min(1, op.pan));
        if (op.mute !== undefined) t.mute = Boolean(op.mute);
        if (op.solo !== undefined) t.solo = Boolean(op.solo);
        reports.push({ ok: true, message: `已更新 ${t.name} 混音設定` });
        break;
      }

      case "set_effect": {
        const targetList =
          op.target === "master"
            ? (next.masterEffects = next.masterEffects ? next.masterEffects.slice() : [])
            : mutableTrack(op.trackId ?? "")?.effects;
        if (!targetList) {
          reports.push({ ok: false, message: `找不到目標效果器鏈` });
          break;
        }
        const existingIdx = op.effectId
          ? targetList.findIndex((e) => e.id === op.effectId)
          : targetList.findIndex((e) => e.type === op.type);
        if (existingIdx >= 0) {
          targetList[existingIdx] = {
            ...targetList[existingIdx],
            params: { ...targetList[existingIdx].params, ...op.params },
            enabled: op.enabled ?? targetList[existingIdx].enabled,
          };
        } else {
          targetList.push({
            id: op.effectId ?? `fx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: op.type,
            enabled: op.enabled ?? true,
            params: op.params,
          });
        }
        reports.push({ ok: true, message: `已套用效果器 ${op.type} (${op.target})` });
        break;
      }
    }
  }
  return { project: next, reports };
}

export function emptyProject(): ProjectState {
  return {
    schemaVersion: 3,
    bpm: 120,
    keyRoot: 0,
    scale: "major",
    timeSig: [4, 4],
    selectedTrackId: "t-melody",
    masterVolume: 100,
    masterEffects: [
      { id: "m-comp", type: "compressor", enabled: true, params: { threshold: -12, ratio: 3 } },
      { id: "m-limiter", type: "limiter", enabled: true, params: { threshold: -0.3 } },
    ],
    sections: [
      { id: "sec-main", name: "Main", startTick: 0, lengthTicks: 4 * 3840, bars: 4 },
    ],
    tracks: [
      {
        id: "t-melody",
        name: "Melody",
        kind: "melody",
        program: 0,
        channel: 0,
        volume: 100,
        pan: 0,
        mute: false,
        solo: false,
        effects: [{ id: "fx-rev", type: "reverb", enabled: true, params: { decay: 2.0, wet: 0.25 } }],
        notes: [],
      },
      {
        id: "t-chords",
        name: "Chords",
        kind: "chords",
        program: 4,
        channel: 1,
        volume: 85,
        pan: -0.15,
        mute: false,
        solo: false,
        effects: [{ id: "fx-chorus", type: "chorus", enabled: true, params: { rate: 1.5, depth: 0.5, wet: 0.3 } }],
        notes: [],
      },
      {
        id: "t-bass",
        name: "Bass",
        kind: "bass",
        program: 32,
        channel: 2,
        volume: 102,
        pan: 0,
        mute: false,
        solo: false,
        effects: [{ id: "fx-eq", type: "eq3", enabled: true, params: { low: 2, mid: -1, high: -3 } }],
        notes: [],
      },
      {
        id: "t-drums",
        name: "Drums",
        kind: "drums",
        program: 0,
        channel: 9,
        volume: 98,
        pan: 0.1,
        mute: false,
        solo: false,
        effects: [{ id: "fx-comp", type: "compressor", enabled: true, params: { threshold: -16, ratio: 4 } }],
        notes: [],
      },
    ],
  };
}

/** 工程遷移 v1/v2 -> v3：補齊拍號、段落、Master、混音欄與 Tick，舊快取/舊 SQLite 可直接升級。 */
export function migrateProject(raw: any): ProjectState {
  const base = emptyProject();
  if (!raw || typeof raw !== "object") return base;
  const timeSig: [number, number] =
    Array.isArray(raw.timeSig) && raw.timeSig.length === 2 ? [raw.timeSig[0], raw.timeSig[1]] : [4, 4];
  const tracks = Array.isArray(raw.tracks) && raw.tracks.length ? raw.tracks : base.tracks;
  const migratedTracks = tracks.map((t: any, i: number) => ({
    id: typeof t.id === "string" ? t.id : `t-mig-${i}`,
    name: typeof t.name === "string" ? t.name : `Track ${i + 1}`,
    kind: ["melody", "chords", "bass", "drums"].includes(t.kind) ? t.kind : "melody",
    program: Number.isFinite(t.program) ? Math.max(0, Math.min(127, Math.round(t.program))) : 0,
    channel: t.kind === "drums" || t.channel === 9 ? 9 : Number.isFinite(t.channel) ? t.channel : i % 16,
    volume: Number.isFinite(t.volume) ? Math.max(0, Math.min(127, Math.round(t.volume))) : 100,
    pan: Number.isFinite(t.pan) ? Math.max(-1, Math.min(1, t.pan)) : 0,
    mute: !!t.mute,
    solo: !!t.solo,
    effects: Array.isArray(t.effects) ? t.effects : [],
    notes: Array.isArray(t.notes)
      ? t.notes.map((n: any) => {
          const startBeat = Number.isFinite(n.startBeat) ? Math.max(0, n.startBeat) : 0;
          const durBeat = Number.isFinite(n.durBeat) && n.durBeat > 0 ? Math.min(64, n.durBeat) : 1;
          return {
            id: typeof n.id === "string" ? n.id : newNoteId(),
            pitch: clampPitch(n.pitch ?? 60),
            startBeat,
            durBeat,
            startTick: Number.isFinite(n.startTick) ? Math.max(0, Math.round(n.startTick)) : beatsToTicks(startBeat),
            durationTicks:
              Number.isFinite(n.durationTicks) && n.durationTicks > 0
                ? Math.round(n.durationTicks)
                : beatsToTicks(durBeat),
            velocity: clampVelocity(n.velocity ?? 90),
            muted: !!n.muted,
          };
        })
      : [],
  }));
  const sections =
    Array.isArray(raw.sections) && raw.sections.length
      ? raw.sections.map((s: any, i: number) => ({
          id: typeof s.id === "string" ? s.id : `sec-mig-${i}`,
          name: typeof s.name === "string" ? s.name : `Part ${i + 1}`,
          startTick: Number.isFinite(s.startTick) ? s.startTick : i * 4 * getMeasureTicks(timeSig),
          lengthTicks: Number.isFinite(s.lengthTicks) ? s.lengthTicks : (s.bars ?? 4) * getMeasureTicks(timeSig),
          bars: Number.isFinite(s.bars) ? s.bars : 4,
        }))
      : base.sections;
  return {
    schemaVersion: 3,
    bpm: Number.isFinite(raw.bpm) ? Math.max(40, Math.min(240, Math.round(raw.bpm))) : 120,
    keyRoot: Number.isFinite(raw.keyRoot) ? Math.max(0, Math.min(11, Math.round(raw.keyRoot))) : 0,
    scale: typeof raw.scale === "string" ? raw.scale : "major",
    timeSig,
    sections,
    masterVolume: Number.isFinite(raw.masterVolume) ? raw.masterVolume : 100,
    masterEffects: Array.isArray(raw.masterEffects) ? raw.masterEffects : base.masterEffects,
    tracks: migratedTracks,
    selectedTrackId:
      typeof raw.selectedTrackId === "string" &&
      migratedTracks.some((t: Track) => t.id === raw.selectedTrackId)
        ? raw.selectedTrackId
        : migratedTracks[0]?.id ?? null,
  };
}
