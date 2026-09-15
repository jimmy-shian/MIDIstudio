// 薄編排層：排程只做 beats->秒 + 分派，合成細節在 ./instruments.ts ./drums.ts。
import * as Tone from "tone";
import type { ProjectState } from "@midistudio/shared";
import { beatsToSeconds } from "@midistudio/shared";
import { getMelodicSynth, midiToFreq } from "./instruments";
import { triggerDrum } from "./drums";

export async function playProject(project: ProjectState, onDone: () => void): Promise<void> {
  await Tone.start();
  const synth = getMelodicSynth();
  Tone.getTransport().cancel();
  Tone.getTransport().bpm.value = project.bpm;

  for (const track of project.tracks) {
    for (const n of track.notes) {
      const t = beatsToSeconds(n.startBeat, project.bpm);
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
  // 計算尾端：舊寫法 flatMap 會為全工程建一次性大陣列；改為迴圈累積，零額外配置
  let lastBeat = 4;
  for (const track of project.tracks) {
    for (const n of track.notes) {
      const end = n.startBeat + n.durBeat;
      if (end > lastBeat) lastBeat = end;
    }
  }
  Tone.getTransport().schedule(() => {
    Tone.getTransport().stop();
    onDone();
  }, beatsToSeconds(lastBeat + 0.5, project.bpm));
  Tone.getTransport().start();
}

export function stopPlayback(): void {
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
}
