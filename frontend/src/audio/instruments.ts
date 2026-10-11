import * as Tone from "tone";
import type { Track, TrackKind } from "@midistudio/shared";
import { buildEffectChain } from "./effects";

// 頻率查表：十二平均律預先計算，O(1) 無物件配置
const FREQ_TABLE: number[] = Array.from(
  { length: 128 },
  (_, m) => 440 * Math.pow(2, (m - 69) / 12)
);

export function midiToFreq(midi: number): number {
  const m = Math.max(0, Math.min(127, Math.round(midi)));
  return FREQ_TABLE[m];
}

/** 混音音量 0-127 → 線性增益。100=0dB(unity)、每格 0.6dB、127≈+6dB、0≈-60dB。 */
export function mixerGain(volume: number): number {
  const v = Math.max(0, Math.min(127, volume));
  const db = v <= 100 ? (v - 100) * 0.6 : ((v - 100) / 27) * 6;
  return Math.pow(10, db / 20);
}

export interface TrackAudioVoice {
  synth: Tone.PolySynth | Tone.MonoSynth;
  channel: Tone.Channel;
  /** 軌道音訊入口：樂器與鼓組都由此進入 Insert FX -> Channel，音量/聲相/靜音/獨奏才會生效 */
  input: Tone.Gain;
  /** 配器簽名：kind/program/effects 變更時重建鏈路 */
  sig: string;
  reverbSend: Tone.Gain;
  delaySend: Tone.Gain;
  cleanup: () => void;
}

/** 軌道是否發聲（app 層 solo/mute 語義）。鼓軌同用，避免依賴 Tone.Channel 全域 solo。 */
export function isTrackAudible(track: Track, anySolo: boolean): boolean {
  if (track.mute) return false;
  if (anySolo) return !!track.solo;
  return true;
}

/** 查詢已建立音軌的入口節點（鼓排程觸發時取得最新鏈路，語音重建後不指向已 dispose 節點）。 */
export function getTrackInput(trackId: string): Tone.Gain | undefined {
  return trackVoices.get(trackId)?.input;
}

/** 音軌獨立音訊實例池 */
const trackVoices = new Map<string, TrackAudioVoice>();
/** 是否有任一軌 solo（建鏈時算 mute 用；Tone.Channel 的 solo 是全域的，會連 Master 一起靜音，故不用）。 */
let anySoloActive = false;

/** 由播放啟動時告知目前 solo 狀態，確保首播建鏈的 mute 正確。 */
export function setSoloScope(anySolo: boolean): void {
  anySoloActive = anySolo;
}
let masterChannel: Tone.Channel | null = null;
let masterComp: Tone.Compressor | null = null;
let masterLimiter: Tone.Limiter | null = null;
// Aux Send/Return 全域匯流排：各軌 Send -> Aux FX -> Master Bus
let auxReverb: Tone.Reverb | null = null;
let auxDelay: Tone.FeedbackDelay | null = null;

export function getMasterBus(): { channel: Tone.Channel; comp: Tone.Compressor; limiter: Tone.Limiter } {
  if (!masterChannel || !masterComp || !masterLimiter) {
    masterLimiter = new Tone.Limiter(-0.3).toDestination();
    masterComp = new Tone.Compressor({ threshold: -12, ratio: 3, attack: 0.01, release: 0.2 });
    masterComp.connect(masterLimiter);
    masterChannel = new Tone.Channel({ volume: 0 });
    masterChannel.connect(masterComp);
  }
  return { channel: masterChannel, comp: masterComp, limiter: masterLimiter };
}

function getAuxBuses(): { reverb: Tone.Reverb; delay: Tone.FeedbackDelay } {
  const { channel: master } = getMasterBus();
  if (!auxReverb) {
    auxReverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 1 });
    auxReverb.connect(master);
  }
  if (!auxDelay) {
    auxDelay = new Tone.FeedbackDelay({ delayTime: 0.375, feedback: 0.35, wet: 1 });
    auxDelay.connect(master);
  }
  return { reverb: auxReverb, delay: auxDelay };
}

/** 依軌種推導預設空間發送量；軌上若有 reverb/delay 效果器則以其 wet 覆寫。 */
function sendAmountsFor(track: Track): { reverb: number; delay: number } {
  let reverb = track.kind === "melody" ? 0.18 : track.kind === "chords" ? 0.22 : 0;
  let delay = track.kind === "melody" ? 0.08 : 0;
  for (const fx of track.effects ?? []) {
    if (fx.enabled === false) continue;
    if (fx.type === "reverb" && fx.params.wet !== undefined) reverb = Math.max(0, Math.min(1, fx.params.wet));
    if (fx.type === "delay" && fx.params.wet !== undefined) delay = Math.max(0, Math.min(1, fx.params.wet));
  }
  return { reverb, delay };
}

/** 依音軌種類建立專屬聲音合成器 */
function createSynthForKind(kind: TrackKind, program = 0): Tone.PolySynth | Tone.MonoSynth {
  if (kind === "bass") {
    // 專用 Bass 合成器：單音 MonoSynth + 緊湊低頻濾波包絡
    return new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4, baseFrequency: 60, octaves: 3 },
    });
  }

  if (kind === "chords") {
    // 專用和弦合成器：柔和 AMSynth 複音
    return new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.5,
      envelope: { attack: 0.04, decay: 0.6, sustain: 0.6, release: 1.2 },
    });
  }

  // 旋律主音：溫暖微柔雙振盪 PolySynth
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle8" },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.9 },
  });
}

/** 獲取或更新指定音軌的音訊鏈路 (Synth -> Insert FX -> Tone.Channel -> MasterBus + Aux Sends) */
export function getOrCreateTrackVoice(track: Track): TrackAudioVoice {
  let existing = trackVoices.get(track.id);
  const { channel: master } = getMasterBus();
  const { reverb: auxRev, delay: auxDel } = getAuxBuses();
  const sig = JSON.stringify({ kind: track.kind, program: track.program ?? 0, effects: track.effects ?? [] });

  if (existing && existing.sig !== sig) {
    // 配器或效果鏈變更：重建合成器與 FX，避免舊鏈殘留。
    try {
      existing.cleanup();
    } catch {}
    trackVoices.delete(track.id);
    existing = undefined;
  }

  if (!existing) {
    const synth = createSynthForKind(track.kind, track.program);
    const volDb = Tone.gainToDb(mixerGain(track.volume ?? 100));
    const channel = new Tone.Channel({
      volume: volDb,
      pan: track.pan ?? 0,
      mute: !isTrackAudible(track, anySoloActive),
      solo: false,
    }).connect(master);

    // 入口節點：合成器與鼓組皆接到此處，之後才進 FX/Channel。
    const input = new Tone.Gain(1);
    synth.connect(input);

    // 效果器鏈（Insert）
    const fxChain = track.effects
      ? buildEffectChain(track.effects.filter((e) => e.type !== "reverb" && e.type !== "delay"))
      : null;
    const postFx: Tone.ToneAudioNode = fxChain ? fxChain.output : input;
    if (fxChain) {
      input.connect(fxChain.input);
      fxChain.output.connect(channel);
    } else {
      input.connect(channel);
    }

    // Aux Send：取 postFx 訊號分流至全域 Reverb/Delay Return
    const sends = sendAmountsFor(track);
    const reverbSend = new Tone.Gain(sends.reverb);
    const delaySend = new Tone.Gain(sends.delay);
    postFx.connect(reverbSend);
    postFx.connect(delaySend);
    reverbSend.connect(auxRev);
    delaySend.connect(auxDel);

    existing = {
      synth,
      channel,
      input,
      sig,
      reverbSend,
      delaySend,
      cleanup: () => {
        try {
          synth.disconnect();
        } catch {}
        try {
          input.disconnect();
        } catch {}
        try {
          postFx.disconnect(channel);
        } catch {}
        try {
          reverbSend.dispose();
        } catch {}
        try {
          delaySend.dispose();
        } catch {}
        synth.dispose();
        input.dispose();
        channel.dispose();
        fxChain?.dispose();
      },
    };
    trackVoices.set(track.id, existing);
  } else {
    // 動態同步音量、聲相與靜音 + Aux 發送量
    const volDb = Tone.gainToDb(mixerGain(track.volume ?? 100));
    existing.channel.volume.value = volDb;
    existing.channel.pan.value = track.pan ?? 0;
    existing.channel.mute = !isTrackAudible(track, anySoloActive);
    existing.channel.solo = false;
    const sends = sendAmountsFor(track);
    existing.reverbSend.gain.value = sends.reverb;
    existing.delaySend.gain.value = sends.delay;
  }

  return existing;
}

/** 同步 Master 音量（0-127 對應增益）與 Master 效果器關鍵參數。 */
export function syncMasterVolume(masterVolume = 100): void {
  const { channel } = getMasterBus();
  channel.volume.value = Tone.gainToDb(mixerGain(masterVolume));
}

/** 即時同步混音狀態（Master 音量＋各軌音量/聲相/靜音/獨奏/輔助發送）。
 *  僅更新「已建立」的語音，未播放時無副作用；新語音於下次播放時自帶最新值。 */
export function syncMixerState(tracks: Track[], masterVolume = 100): void {
  try {
    syncMasterVolume(masterVolume);
  } catch {}
  const anySolo = tracks.some((t) => t.solo);
  anySoloActive = anySolo;
  for (const t of tracks) {
    const voice = trackVoices.get(t.id);
    if (!voice) continue;
    try {
      voice.channel.volume.value = Tone.gainToDb(mixerGain(t.volume ?? 100));
      voice.channel.pan.value = t.pan ?? 0;
      voice.channel.mute = !isTrackAudible(t, anySolo);
      voice.channel.solo = false;
      const sends = sendAmountsFor(t);
      voice.reverbSend.gain.value = sends.reverb;
      voice.delaySend.gain.value = sends.delay;
    } catch {}
  }
}

/** 同步 Master FX（compressor/limiter 閾值與比值）。 */
export function syncMasterEffects(effects?: Track["effects"]): void {
  if (!effects) return;
  const { comp, limiter } = getMasterBus();
  for (const fx of effects) {
    if (fx.enabled === false) continue;
    if (fx.type === "compressor") {
      if (fx.params.threshold !== undefined) comp.threshold.value = fx.params.threshold;
      if (fx.params.ratio !== undefined) comp.ratio.value = fx.params.ratio;
    }
    if (fx.type === "limiter" && fx.params.threshold !== undefined) {
      limiter.threshold.value = fx.params.threshold;
    }
  }
}

/** 移除已刪除音軌的語音，避免記憶體洩漏。 */
export function pruneTrackVoices(activeIds: Set<string>): void {
  for (const [id, voice] of trackVoices) {
    if (!activeIds.has(id)) {
      try {
        voice.cleanup();
      } catch {}
      trackVoices.delete(id);
    }
  }
}

export function cleanupAllTrackVoices(): void {
  for (const v of trackVoices.values()) {
    try {
      v.cleanup();
    } catch {}
  }
  trackVoices.clear();
}
