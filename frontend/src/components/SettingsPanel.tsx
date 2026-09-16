import { useSettingsStore } from "../store/settingsStore";
import { snapLabel } from "../utils/grid";
import type { TrackKind } from "@midistudio/shared";
import controls from "../styles/controls.module.css";
import styles from "./SettingsPanel.module.css";
import Collapsible from "./Collapsible";
import Dropdown from "./Dropdown";
import { SlidersIcon } from "./icons";

// 模組：操作客製化面板。收合走 Collapsible，選單走 Dropdown（皆與下拉動畫同規範）。
const KINDS: { kind: TrackKind; label: string }[] = [
  { kind: "melody", label: "旋律" },
  { kind: "chords", label: "和弦" },
  { kind: "bass", label: "貝斯" },
  { kind: "drums", label: "鼓" },
];

const SNAP_OPTIONS = [1, 0.5, 0.25].map((n) => ({ value: n, label: snapLabel(n) }));
const OCTAVE_OPTIONS = [2, 3, 4, 5].map((n) => ({ value: n, label: `C${n}` }));

export default function SettingsPanel() {
  const s = useSettingsStore();
  return (
    <Collapsible
      title={<><SlidersIcon size={14} />操作設定（力度 / 網格 / 和弦）</>}
    >
      <div className={styles.row}>
        <label className={styles.field}>網格
          <span className={styles.narrow}>
            <Dropdown value={s.snap} options={SNAP_OPTIONS} onChange={(v) => s.setSnap(v)} label="網格" compact />
          </span>
        </label>
        {KINDS.map(({ kind, label }) => (
          <label key={kind} className={styles.field}>{label}力度
            <input type="range" min={1} max={127} value={s.defaultVelocity[kind]}
              onChange={(e) => s.setDefaultVelocity(kind, Number(e.target.value))} />
            {s.defaultVelocity[kind]}
          </label>
        ))}
        <label className={styles.field}>和弦力度
          <input type="range" min={1} max={127} value={s.chordVelocity}
            onChange={(e) => s.setChordVelocity(Number(e.target.value))} />
          {s.chordVelocity}
        </label>
        <label className={styles.field}>和弦八度
          <span className={styles.narrow}>
            <Dropdown value={s.chordOctave} options={OCTAVE_OPTIONS} onChange={(v) => s.setChordOctave(v)} label="和弦八度" compact />
          </span>
        </label>
        <button className={controls.btn} onClick={s.resetSettings}>恢復預設</button>
      </div>
    </Collapsible>
  );
}
