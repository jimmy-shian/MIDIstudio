// 薄編排層：排程只做 beats->秒 + 分派，合成細節在 ./instruments.ts ./drums.ts。
// 進度真相：beats（與 shared/midi-utils 同源）；秒數只做顯示/排程。
import * as Tone from "tone";
import type { ProjectState } from "@midistudio/shared";
import { beatsToSeconds } from "@midistudio/shared";
import { getMelodicSynth, midiToFreq } from "./instruments";
import { triggerDrum } from "./drums";

/** 工程總拍數（尾端，含 0.5 拍尾韻；無音時保底 4 拍）。播放/進度條共用，禁各自重算。 */
export function projectEndBeat(project: ProjectState): number {
  let lastBeat = 4;
  for (const track of project.tracks) {
    for (const n of track.notes) {
      const end = n.startBeat + n.durBeat;
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
  const synth = getMelodicSynth();
  Tone.getTransport().cancel();
  Tone.getTransport().bpm.value = project.bpm;

  const endBeat = projectEndBeat(project);
  const startAt = Math.max(0, Math.min(fromBeat, endBeat - 0.1));
  const totalBeats = Math.max(0.1, endBeat - startAt);
  const durationSec = beatsToSeconds(totalBeats, project.bpm);

  for (const track of project.tracks) {
    for (const n of track.notes) {
      const noteEnd = n.startBeat + n.durBeat;
      if (noteEnd <= startAt) continue;
      const t = beatsToSeconds(Math.max(0, n.startBeat - startAt), project.bpm);
      const d = beatsToSeconds(n.durBeat, project.bpm);
      if (track.kind === "drums") {
        const pitch = n.pitch;
        const vel = n.velocity;
        Tone.getTransport().schedule((time) => triggerDrum(pitch, time, vel), t);
      } else {
        const freq = midiToFreq(n.pitch);
        const vel = n.velocity / 127;
        Tone.getTransport().schedule((time) => {
          synth.triggerAttackRelease(freq, d, time, vel);
        }, t);
      }
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
