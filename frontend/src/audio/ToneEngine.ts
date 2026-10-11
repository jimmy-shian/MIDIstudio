// 薄編排層：排程只做 beats->秒 + 分派，合成細節在 ./instruments.ts ./drums.ts。
// 進度真相：beats（與 shared/midi-utils 同源）；秒數只做顯示/排程。
import * as Tone from "tone";
import type { NoteEvent, ProjectState } from "@midistudio/shared";
import { beatsToSeconds, ticksToBeats } from "@midistudio/shared";
import { getOrCreateTrackVoice, getTrackInput, midiToFreq, pruneTrackVoices, setSoloScope, syncMasterEffects, syncMasterVolume } from "./instruments";
import { triggerDrum } from "./drums";

function noteStartBeat(n: NoteEvent): number {
  if (n.startTick !== undefined) return ticksToBeats(n.startTick);
  return n.startBeat;
}

function noteDurBeat(n: NoteEvent): number {
  if (n.durationTicks !== undefined) return ticksToBeats(n.durationTicks);
  return n.durBeat;
}

/** 工程總拍數（尾端，含 0.5 拍尾韻；無音時保底 4 拍）。播放/進度條共用，禁各自重算。 */
export function projectEndBeat(project: ProjectState): number {
  let lastBeat = 4;
  for (const track of project.tracks) {
    for (const n of track.notes) {
      const s = n.startTick !== undefined ? ticksToBeats(n.startTick) : n.startBeat;
      const d =
        n.durationTicks !== undefined ? ticksToBeats(n.durationTicks) : n.durBeat;
      const end = s + d;
      if (end > lastBeat) lastBeat = end;
    }
  }
  return lastBeat + 0.5;
}

export interface PlaybackHandle {
  durationSec: number;
  totalBeats: number;
}

export async function playProject(
  project: ProjectState,
  onDone: () => void,
  fromBeat = 0,
): Promise<PlaybackHandle> {
  await Tone.start();
  try {
    syncMasterVolume(project.masterVolume ?? 100);
    syncMasterEffects(project.masterEffects);
  } catch {}
  pruneTrackVoices(new Set(project.tracks.map((t) => t.id)));
  // 確保每軌獨立音訊鏈路已建立（Synth -> Insert FX -> Channel -> Master）。
  // 鼓軌同樣建鏈並由鼓合成器接入其入口節點，音量/聲相/mute/solo 對鼓同樣生效。
  const anySolo = project.tracks.some((t) => t.solo);
  setSoloScope(anySolo);
  for (const t of project.tracks) {
    try {
      getOrCreateTrackVoice(t);
    } catch (e) {
      console.warn("音軌語音建立失敗:", t.id, e);
    }
  }
  Tone.getTransport().cancel();
  Tone.getTransport().bpm.value = project.bpm;

  const endBeat = projectEndBeat(project);
  const startAt = Math.max(0, Math.min(fromBeat, endBeat - 0.1));
  const totalBeats = Math.max(0.1, endBeat - startAt);
  const durationSec = beatsToSeconds(totalBeats, project.bpm);

  // Solo 語義：任一軌 solo 時只播 solo 軌；否則跳過 mute 軌。
  const audible = (track: ProjectState["tracks"][number]): boolean => {
    if (track.mute) return false;
    if (anySolo) return !!track.solo;
    return true;
  };

  for (const track of project.tracks) {
    if (!audible(track)) continue;
    if (track.kind === "drums") {
      for (const n of track.notes) {
        const s = noteStartBeat(n);
        const d = noteDurBeat(n);
        const noteEnd = s + d;
        if (noteEnd <= startAt) continue;
        const t = beatsToSeconds(Math.max(0, s - startAt), project.bpm);
        const pitch = n.pitch;
        const vel = n.velocity;
        Tone.getTransport().schedule((time) => {
          // 觸發當下才取入口節點：播放中改效果器重建鏈路後仍指向最新 Channel。
          try {
            triggerDrum(pitch, time, vel, getTrackInput(track.id));
          } catch (e) {
            console.warn("鼓聲觸發失敗:", e);
          }
        }, t);
      }
      continue;
    }
    let voice;
    try {
      voice = getOrCreateTrackVoice(track);
    } catch {
      continue;
    }
    const synth = voice.synth;
    for (const n of track.notes) {
      const s = noteStartBeat(n);
      const d = noteDurBeat(n);
      const noteEnd = s + d;
      if (noteEnd <= startAt) continue;
      const t = beatsToSeconds(Math.max(0, s - startAt), project.bpm);
      const dur = Math.max(0.05, beatsToSeconds(d, project.bpm));
      const freq = midiToFreq(n.pitch);
      const vel = n.velocity / 127;
      Tone.getTransport().schedule((time) => {
        try {
          (synth as Tone.PolySynth).triggerAttackRelease(freq, dur, time, vel);
        } catch (e) {
          console.warn("合成發聲失敗:", e);
        }
      }, t);
    }
  }
  Tone.getTransport().schedule(() => {
    Tone.getTransport().stop();
    onDone();
  }, durationSec);
  Tone.getTransport().start();
  return { durationSec, totalBeats };
}

/** 目前播放秒數（Transport 時間）。失敗/未播時回 0，不拋錯。 */
export function getPlaybackSeconds(): number {
  try {
    const s = Tone.getTransport().seconds;
    return Number.isFinite(s) && s >= 0 ? s : 0;
  } catch {
    return 0;
  }
}

export function stopPlayback(): void {
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
}

/** 秒 -> m:ss（進度條時間顯示共用）。 */
export function formatPlaybackTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rest = Math.floor(s % 60);
  return `${m}:${String(rest).padStart(2, "0")}`;
}
