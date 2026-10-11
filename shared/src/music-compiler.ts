// 確定性音樂編譯器：將結構化 MusicSpec 轉譯為標準音符事件、軌道與混音設定。
import type { MusicSpec, NoteEvent, ProjectState, Track } from "./types.js";
import { getBeatsPerBar, getMeasureTicks, PPQ, ticksToBeats } from "./midi-utils.js";
import { romanToRootChord } from "./roman.js";
import { chordNotes, scalePitchClasses } from "./music-theory.js";
import { newNoteId, newTrackId } from "./ids.js";

/** 鼓組 MIDI 映射 (Channel 10) */
const KICK = 36;
const SNARE = 38;
const CLOSED_HAT = 42;
const OPEN_HAT = 46;

/** 生成標準鼓點模式音符 */
export function generateDrumPatternNotes(
  patternName: string,
  bars: number,
  timeSig: [number, number],
  startTick = 0
): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const measureTicks = getMeasureTicks(timeSig);
  const [num, den] = timeSig;

  for (let bar = 0; bar < bars; bar++) {
    const barStartTick = startTick + bar * measureTicks;

    if (num === 3 && den === 4) {
      // 3/4 華爾滋風格 (Bass drum on 1, Hats/Snare on 2, 3)
      // 拍 1: Kick
      notes.push(createNote(KICK, barStartTick, 960, 100));
      // 拍 2: Snare / Rim
      notes.push(createNote(SNARE, barStartTick + 960, 480, 85));
      // 拍 3: Snare / Rim
      notes.push(createNote(SNARE, barStartTick + 1920, 480, 80));
      // 每個四分音符 Hats
      for (let b = 0; b < 3; b++) {
        notes.push(createNote(CLOSED_HAT, barStartTick + b * 960, 240, b === 0 ? 90 : 70));
      }
    } else if (num === 6 && den === 8) {
      // 6/8 慢搖滾/抒情 (2 個附點四分音符拍，每拍 3 個八分音符，八分音符=480 ticks)
      // 拍 1 (Tick 0): Kick
      notes.push(createNote(KICK, barStartTick, 480, 100));
      // 拍 2 (Tick 1440): Snare
      notes.push(createNote(SNARE, barStartTick + 1440, 480, 95));
      // 每八分音符 (480 ticks) 輕打 Hat
      for (let h = 0; h < 6; h++) {
        const vel = h === 0 ? 90 : h === 3 ? 80 : 65;
        notes.push(createNote(CLOSED_HAT, barStartTick + h * 480, 240, vel));
      }
    } else {
      // 4/4 拍 (標準流行 / EDM / 搖滾)
      const isFourOnFloor = patternName.includes("four_on_floor") || patternName.includes("edm");
      const isBoomBap = patternName.includes("boom_bap") || patternName.includes("lofi");

      if (isFourOnFloor) {
        // Kick 每四分拍一聲
        for (let b = 0; b < 4; b++) {
          notes.push(createNote(KICK, barStartTick + b * 960, 480, 105));
        }
        // Snare on 2, 4
        notes.push(createNote(SNARE, barStartTick + 960, 480, 95));
        notes.push(createNote(SNARE, barStartTick + 2880, 480, 98));
        // 16 分音符或 8 分音符 Hats
        for (let h = 0; h < 8; h++) {
          const vel = h % 2 === 0 ? 85 : 70;
          notes.push(createNote(CLOSED_HAT, barStartTick + h * 480, 240, vel));
        }
      } else if (isBoomBap) {
        // Lo-Fi / Boom Bap: Kick on 0 and 2.5 (beat 2.5 = 2400 ticks)
        notes.push(createNote(KICK, barStartTick, 480, 100));
        notes.push(createNote(KICK, barStartTick + 2400, 480, 90));
        // Snare on 1 and 3 (960 and 2880 ticks)
        notes.push(createNote(SNARE, barStartTick + 960, 480, 95));
        notes.push(createNote(SNARE, barStartTick + 2880, 480, 98));
        // 8 分音符搖擺 Hats
        for (let h = 0; h < 8; h++) {
          const vel = h % 2 === 0 ? 80 : 60;
          notes.push(createNote(CLOSED_HAT, barStartTick + h * 480, 240, vel));
        }
      } else {
        // 標準流行 Backbeat: Kick on 0 and 2, Snare on 1 and 3
        notes.push(createNote(KICK, barStartTick, 480, 102));
        notes.push(createNote(KICK, barStartTick + 1920, 480, 96));
        notes.push(createNote(SNARE, barStartTick + 960, 480, 98));
        notes.push(createNote(SNARE, barStartTick + 2880, 480, 100));
        for (let h = 0; h < 8; h++) {
          const vel = h % 2 === 0 ? 85 : 68;
          notes.push(createNote(CLOSED_HAT, barStartTick + h * 480, 240, vel));
        }
      }
    }
  }

  return notes;
}

function createNote(pitch: number, startTick: number, durationTicks: number, velocity: number): NoteEvent {
  return {
    id: newNoteId(),
    pitch,
    startTick,
    durationTicks,
    startBeat: ticksToBeats(startTick),
    durBeat: ticksToBeats(durationTicks),
    velocity,
  };
}

/** 主編譯器：將 MusicSpec 展開為完整多軌 ProjectState */
export function compileMusicSpec(spec: MusicSpec, baseProject?: ProjectState): ProjectState {
  const bpm = spec.tempo ?? 120;
  const timeSig = spec.timeSignature ?? [4, 4];
  const keyRoot = spec.keyRoot ?? 0;
  const scale = spec.scale ?? "major";
  const measureTicks = getMeasureTicks(timeSig);
  const beatsPerBar = getBeatsPerBar(timeSig);

  // 1. 建立或重置音軌
  const melodyTrack: Track = {
    id: "t-melody",
    name: "Melody",
    kind: "melody",
    program: 0, // Acoustic Grand Piano
    channel: 0,
    volume: 100,
    pan: 0,
    mute: false,
    solo: false,
    effects: [{ id: "fx-rev", type: "reverb", enabled: true, params: { decay: 2.0, wet: 0.25 } }],
    notes: [],
  };

  const chordsTrack: Track = {
    id: "t-chords",
    name: "Chords",
    kind: "chords",
    program: 4, // Rhodes or Strings
    channel: 1,
    volume: 85,
    pan: -0.15,
    mute: false,
    solo: false,
    effects: [{ id: "fx-chorus", type: "chorus", enabled: true, params: { rate: 1.5, depth: 0.5, wet: 0.3 } }],
    notes: [],
  };

  const bassTrack: Track = {
    id: "t-bass",
    name: "Bass",
    kind: "bass",
    program: 33, // Electric Bass
    channel: 2,
    volume: 102,
    pan: 0,
    mute: false,
    solo: false,
    effects: [{ id: "fx-eq", type: "eq3", enabled: true, params: { low: 2, mid: -1, high: -3 } }],
    notes: [],
  };

  const drumsTrack: Track = {
    id: "t-drums",
    name: "Drums",
    kind: "drums",
    program: 0,
    channel: 9, // GM Channel 10
    volume: 98,
    pan: 0.1,
    mute: false,
    solo: false,
    effects: [{ id: "fx-comp", type: "compressor", enabled: true, params: { threshold: -16, ratio: 4 } }],
    notes: [],
  };

  // 2. 依段落展開和弦、貝斯、鼓組與旋律
  let currentStartTick = 0;
  const scalePitches = scalePitchClasses(keyRoot, scale);

  for (const section of spec.sections) {
    const bars = Math.max(1, section.bars || 4);
    const progression = section.progression.length > 0 ? section.progression : ["I", "V", "vi", "IV"];

    // 展開鼓組
    const drumNotes = generateDrumPatternNotes(
      section.grooveStyle || spec.genre || "standard",
      bars,
      timeSig,
      currentStartTick
    );
    drumsTrack.notes.push(...drumNotes);

    // 展開和聲與低音
    for (let b = 0; b < bars; b++) {
      const barTick = currentStartTick + b * measureTicks;
      const roman = progression[b % progression.length];
      const { root, chord } = romanToRootChord(keyRoot, roman, 3, scale);
      const pitches = chordNotes(root, chord);

      // 和弦音符
      for (const p of pitches) {
        chordsTrack.notes.push(createNote(p, barTick, measureTicks, 78));
      }

      // 貝斯音符 (低 1-2 個八度，通常以根音為基礎)
      const bassPitch = root - 12; // Octave 2
      if (timeSig[0] === 3) {
        // 3/4 拍貝斯: 拍 1 根音，拍 2, 3 輕音
        bassTrack.notes.push(createNote(bassPitch, barTick, 960, 96));
        bassTrack.notes.push(createNote(bassPitch, barTick + 960, 960, 80));
      } else if (timeSig[0] === 6 && timeSig[1] === 8) {
        // 6/8 拍貝斯: 附點四分音符脈衝
        bassTrack.notes.push(createNote(bassPitch, barTick, 1440, 98));
        bassTrack.notes.push(createNote(bassPitch + 7, barTick + 1440, 1440, 88)); // 屬音過渡
      } else {
        // 4/4 拍貝斯: 根音律動
        bassTrack.notes.push(createNote(bassPitch, barTick, 960, 100));
        bassTrack.notes.push(createNote(bassPitch, barTick + 1440, 480, 85));
        bassTrack.notes.push(createNote(bassPitch, barTick + 1920, 960, 92));
      }

      // 旋律音符動機 (簡潔、調內、富有歌唱性)
      const melodyOctave = 5; // C5 附近
      const chordTonePitches = pitches.map((p) => p + 12);
      const note1 = chordTonePitches[0] || 60 + scalePitches[0];
      const note2 = chordTonePitches[1] || 60 + scalePitches[2];
      const note3 = chordTonePitches[2] || 60 + scalePitches[4];

      if (beatsPerBar >= 4) {
        melodyTrack.notes.push(createNote(note1, barTick, 960, 95));
        melodyTrack.notes.push(createNote(note2, barTick + 960, 960, 88));
        melodyTrack.notes.push(createNote(note3, barTick + 1920, 1920, 92));
      } else {
        melodyTrack.notes.push(createNote(note1, barTick, 960, 95));
        melodyTrack.notes.push(createNote(note2, barTick + 960, measureTicks - 960, 90));
      }
    }

    currentStartTick += bars * measureTicks;
  }

  // 排序音符
  for (const t of [melodyTrack, chordsTrack, bassTrack, drumsTrack]) {
    t.notes.sort((a, b) => (a.startTick ?? 0) - (b.startTick ?? 0));
  }

  return {
    schemaVersion: 3,
    bpm,
    timeSig,
    keyRoot,
    scale,
    selectedTrackId: "t-melody",
    masterVolume: 100,
    masterEffects: [
      { id: "m-comp", type: "compressor", enabled: true, params: { threshold: -12, ratio: 3 } },
      { id: "m-limiter", type: "limiter", enabled: true, params: { threshold: -0.3 } },
    ],
    sections: spec.sections.map((s, idx) => ({
      id: `sec-${idx}`,
      name: s.name,
      startTick: idx * (s.bars || 4) * measureTicks,
      lengthTicks: (s.bars || 4) * measureTicks,
      bars: s.bars || 4,
    })),
    tracks: [melodyTrack, chordsTrack, bassTrack, drumsTrack],
  };
}
