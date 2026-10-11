import type { TrackKind } from "./types.js";

export interface InstrumentProfile {
  name: string;
  kind: TrackKind;
  program: number;
  physicalMin: number;
  physicalMax: number;
  recommendedLow: number;
  recommendedHigh: number;
  centerOctave: number;
  isMonophonic?: boolean;
}

export const INSTRUMENT_REGISTRY: Record<string, InstrumentProfile> = {
  piano: {
    name: "Acoustic Grand Piano",
    kind: "melody",
    program: 0,
    physicalMin: 21, // A0
    physicalMax: 108, // C8
    recommendedLow: 36, // C2
    recommendedHigh: 96, // C7
    centerOctave: 4,
  },
  rhodes: {
    name: "Electric Piano (Rhodes)",
    kind: "chords",
    program: 4,
    physicalMin: 28,
    physicalMax: 103,
    recommendedLow: 48,
    recommendedHigh: 84,
    centerOctave: 4,
  },
  strings: {
    name: "String Ensemble",
    kind: "chords",
    program: 48,
    physicalMin: 36,
    physicalMax: 100,
    recommendedLow: 48,
    recommendedHigh: 88,
    centerOctave: 4,
  },
  electric_bass: {
    name: "Electric Bass (Fingered)",
    kind: "bass",
    program: 33,
    physicalMin: 28, // E1
    physicalMax: 67, // G4
    recommendedLow: 28, // E1
    recommendedHigh: 55, // G3
    centerOctave: 2,
    isMonophonic: true,
  },
  synth_bass: {
    name: "Synth Bass",
    kind: "bass",
    program: 38,
    physicalMin: 24, // C1
    physicalMax: 72, // C5
    recommendedLow: 24, // C1
    recommendedHigh: 48, // C3
    centerOctave: 2,
    isMonophonic: true,
  },
  synth_lead: {
    name: "Lead Synth",
    kind: "melody",
    program: 80,
    physicalMin: 36,
    physicalMax: 108,
    recommendedLow: 60, // C4
    recommendedHigh: 96, // C7
    centerOctave: 5,
  },
  warm_pad: {
    name: "Warm Pad",
    kind: "chords",
    program: 88,
    physicalMin: 36,
    physicalMax: 96,
    recommendedLow: 48, // C3
    recommendedHigh: 76, // E5
    centerOctave: 4,
  },
  drums: {
    name: "Standard Drums",
    kind: "drums",
    program: 0,
    physicalMin: 35,
    physicalMax: 81,
    recommendedLow: 36,
    recommendedHigh: 51,
    centerOctave: 3,
  },
};

export function getInstrumentProfile(kind: TrackKind, program = 0): InstrumentProfile {
  if (kind === "drums") return INSTRUMENT_REGISTRY.drums;
  if (kind === "bass") {
    return program === 38 || program === 39
      ? INSTRUMENT_REGISTRY.synth_bass
      : INSTRUMENT_REGISTRY.electric_bass;
  }
  if (kind === "chords") {
    if (program === 48 || program === 49) return INSTRUMENT_REGISTRY.strings;
    if (program === 88 || program === 89) return INSTRUMENT_REGISTRY.warm_pad;
    return INSTRUMENT_REGISTRY.rhodes;
  }
  if (program >= 80 && program <= 87) return INSTRUMENT_REGISTRY.synth_lead;
  return INSTRUMENT_REGISTRY.piano;
}
