import * as Tone from "tone";
import type { EffectConfig } from "@midistudio/shared";

export interface EffectNodeWrapper {
  config: EffectConfig;
  input: Tone.ToneAudioNode;
  output: Tone.ToneAudioNode;
  dispose: () => void;
  updateParams: (params: Record<string, number>) => void;
}

export function createEffectNode(config: EffectConfig): EffectNodeWrapper | null {
  try {
    switch (config.type) {
      case "reverb": {
        const decay = config.params.decay ?? 2.0;
        const wet = config.params.wet ?? 0.3;
        const rev = new Tone.Reverb({ decay, preDelay: 0.02, wet });
        return {
          config,
          input: rev,
          output: rev,
          dispose: () => rev.dispose(),
          updateParams: (p) => {
            if (p.wet !== undefined) rev.wet.value = Math.max(0, Math.min(1, p.wet));
          },
        };
      }

      case "delay": {
        const delayTime = config.params.delayTime ?? 0.25;
        const feedback = config.params.feedback ?? 0.4;
        const wet = config.params.wet ?? 0.3;
        const delay = new Tone.FeedbackDelay({ delayTime, feedback, wet });
        return {
          config,
          input: delay,
          output: delay,
          dispose: () => delay.dispose(),
          updateParams: (p) => {
            if (p.delayTime !== undefined) delay.delayTime.value = p.delayTime;
            if (p.feedback !== undefined) delay.feedback.value = Math.max(0, Math.min(0.9, p.feedback));
            if (p.wet !== undefined) delay.wet.value = Math.max(0, Math.min(1, p.wet));
          },
        };
      }

      case "chorus": {
        const rate = config.params.rate ?? config.params.frequency ?? 1.5;
        const depth = config.params.depth ?? 0.6;
        const wet = config.params.wet ?? 0.35;
        const chorus = new Tone.Chorus({ frequency: rate, delayTime: 3.5, depth, wet });
        chorus.start();
        return {
          config,
          input: chorus,
          output: chorus,
          dispose: () => chorus.dispose(),
          updateParams: (p) => {
            if (p.rate !== undefined) chorus.frequency.value = p.rate;
            if (p.depth !== undefined) chorus.depth = p.depth;
            if (p.wet !== undefined) chorus.wet.value = p.wet;
          },
        };
      }

      case "eq3": {
        const low = config.params.low ?? 0;
        const mid = config.params.mid ?? 0;
        const high = config.params.high ?? 0;
        const eq = new Tone.EQ3({ low, mid, high });
        return {
          config,
          input: eq,
          output: eq,
          dispose: () => eq.dispose(),
          updateParams: (p) => {
            if (p.low !== undefined) eq.low.value = p.low;
            if (p.mid !== undefined) eq.mid.value = p.mid;
            if (p.high !== undefined) eq.high.value = p.high;
          },
        };
      }

      case "compressor": {
        const threshold = config.params.threshold ?? -16;
        const ratio = config.params.ratio ?? 4;
        const comp = new Tone.Compressor({ threshold, ratio });
        return {
          config,
          input: comp,
          output: comp,
          dispose: () => comp.dispose(),
          updateParams: (p) => {
            if (p.threshold !== undefined) comp.threshold.value = p.threshold;
            if (p.ratio !== undefined) comp.ratio.value = p.ratio;
          },
        };
      }

      case "distortion": {
        const dist = config.params.distortion ?? 0.4;
        const wet = config.params.wet ?? 0.4;
        const d = new Tone.Distortion({ distortion: dist, wet });
        return {
          config,
          input: d,
          output: d,
          dispose: () => d.dispose(),
          updateParams: (p) => {
            if (p.distortion !== undefined) d.distortion = p.distortion;
            if (p.wet !== undefined) d.wet.value = p.wet;
          },
        };
      }

      case "filter": {
        const frequency = config.params.frequency ?? 2000;
        const filter = new Tone.Filter({ frequency, type: "lowpass" });
        return {
          config,
          input: filter,
          output: filter,
          dispose: () => filter.dispose(),
          updateParams: (p) => {
            if (p.frequency !== undefined) filter.frequency.value = p.frequency;
          },
        };
      }

      case "limiter": {
        const threshold = config.params.threshold ?? -0.3;
        const lim = new Tone.Limiter(threshold);
        return {
          config,
          input: lim,
          output: lim,
          dispose: () => lim.dispose(),
          updateParams: (p) => {
            if (p.threshold !== undefined) lim.threshold.value = p.threshold;
          },
        };
      }

      default:
        return null;
    }
  } catch (err) {
    console.warn("無法初始化效果器:", config.type, err);
    return null;
  }
}

/** 將一組效果器串聯成單一鏈路 */
export function buildEffectChain(
  configs: EffectConfig[]
): { input: Tone.ToneAudioNode; output: Tone.ToneAudioNode; dispose: () => void } | null {
  const activeWrappers = configs
    .filter((c) => c.enabled !== false)
    .map((c) => createEffectNode(c))
    .filter((w): w is EffectNodeWrapper => w !== null);

  if (!activeWrappers.length) return null;

  for (let i = 0; i < activeWrappers.length - 1; i++) {
    activeWrappers[i].output.connect(activeWrappers[i + 1].input);
  }

  return {
    input: activeWrappers[0].input,
    output: activeWrappers[activeWrappers.length - 1].output,
    dispose: () => {
      for (const w of activeWrappers) w.dispose();
    },
  };
}
