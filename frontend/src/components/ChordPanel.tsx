import { useProjectStore } from "../store/useProjectStore";
import { useSettingsStore } from "../store/settingsStore";
import { PROGRESSIONS } from "@midistudio/shared";
import { btn, card, muted, sectionTitle } from "../styles/theme";

export default function ChordPanel() {
  const localApply = useProjectStore((s) => s.localApply);
  const chordVelocity = useSettingsStore((s) => s.chordVelocity);
  const chordOctave = useSettingsStore((s) => s.chordOctave);
  return (
    <div style={{ ...card, padding: "10px 12px" }}>
      <h4 style={{ ...sectionTitle, marginBottom: 8 }}>和弦進行 <span style={muted}>一鍵寫入 Chords 軌</span></h4>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(PROGRESSIONS).map(([name, prog]) => (
          <button key={name} title={prog.join("-")} style={btn}
            onClick={() => localApply([{ op: "set_chord_progression", root: 0, progression: prog, bars: prog.length, velocity: chordVelocity, octave: chordOctave }])}>
            {name} · {prog.join("-")}
          </button>
        ))}
      </div>
    </div>
  );
}
