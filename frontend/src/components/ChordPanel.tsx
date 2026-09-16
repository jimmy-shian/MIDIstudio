import { useProjectStore } from "../store/useProjectStore";
import { useSettingsStore } from "../store/settingsStore";
import { PROGRESSIONS } from "@midistudio/shared";
import controls from "../styles/controls.module.css";
import styles from "./ChordPanel.module.css";
import Collapsible from "./Collapsible";

// 模組：和弦進行一鍵寫入。收合動畫走共用 Collapsible（與下拉選單同規範）。
export default function ChordPanel() {
  const localApply = useProjectStore((s) => s.localApply);
  const chordVelocity = useSettingsStore((s) => s.chordVelocity);
  const chordOctave = useSettingsStore((s) => s.chordOctave);
  return (
    <Collapsible title="和弦進行" subtitle="一鍵寫入 Chords 軌" defaultOpen>
      <div className={styles.grid}>
        {Object.entries(PROGRESSIONS).map(([name, prog]) => (
          <button key={name} title={prog.join("-")} className={controls.btn}
            onClick={() => localApply([{ op: "set_chord_progression", root: 0, progression: prog, bars: prog.length, velocity: chordVelocity, octave: chordOctave }])}>
            {name} · {prog.join("-")}
          </button>
        ))}
      </div>
    </Collapsible>
  );
}
