import { useSettingsStore } from "../store/settingsStore";
import { snapLabel } from "../utils/grid";
import type { TrackKind } from "@midistudio/shared";
import { btn, card, colors, input, muted } from "../styles/theme";
import { SlidersIcon } from "./icons";

// 模組：操作客製化面板。收合式，改的值即時進琴格/和弦/MCP 共用預設。
const KINDS: { kind: TrackKind; label: string }[] = [
  { kind: "melody", label: "旋律" },
  { kind: "chords", label: "和弦" },
  { kind: "bass", label: "貝斯" },
  { kind: "drums", label: "鼓" },
];

export default function SettingsPanel() {
  const s = useSettingsStore();
  return (
    <details style={{ ...card, padding: "8px 12px", fontSize: 12 }}>
      <summary style={{ display: "flex", alignItems: "center", gap: 6, color: colors.secondary }}>
        <SlidersIcon size={14} />操作設定（力度 / 網格 / 和弦）
      </summary>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "8px 0 4px", alignItems: "center" }}>
        <label style={muted}>網格
          <select value={s.snap} onChange={(e) => s.setSnap(Number(e.target.value))} style={{ ...input, marginLeft: 6 }}>
            {[1, 0.5, 0.25].map((n) => <option key={n} value={n}>{snapLabel(n)}</option>)}
          </select>
        </label>
        {KINDS.map(({ kind, label }) => (
          <label key={kind} style={muted}>{label}力度
            <input type="range" min={1} max={127} value={s.defaultVelocity[kind]}
              onChange={(e) => s.setDefaultVelocity(kind, Number(e.target.value))} />
            {s.defaultVelocity[kind]}
          </label>
        ))}
        <label style={muted}>和弦力度
          <input type="range" min={1} max={127} value={s.chordVelocity}
            onChange={(e) => s.setChordVelocity(Number(e.target.value))} />
          {s.chordVelocity}
        </label>
        <label style={muted}>和弦八度
          <select value={s.chordOctave} onChange={(e) => s.setChordOctave(Number(e.target.value))} style={{ ...input, marginLeft: 6 }}>
            {[2, 3, 4, 5].map((n) => <option key={n} value={n}>C{n}</option>)}
          </select>
        </label>
        <button style={btn} onClick={s.resetSettings}>恢復預設</button>
      </div>
    </details>
  );
}
