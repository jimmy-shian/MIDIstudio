import { useViewStore } from "../store/viewStore";
import { useSettingsStore } from "../store/settingsStore";
import { snapLabel } from "../utils/grid";
import { btnGhost, colors, input, muted } from "../styles/theme";
import { ChevronLeftIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon } from "./icons";

// 模組：琴格捲動/縮放/snap 控制列。狀態走 viewStore＋settingsStore。
export default function PianoRollControls() {
  const { startBeat, beatsVisible, pan, zoomBeats, shiftPitch, setBeatsVisible, resetView } = useViewStore();
  const snap = useSettingsStore((s) => s.snap);
  const setSnap = useSettingsStore((s) => s.setSnap);
  const barFrom = Math.floor(startBeat / 4) + 1;
  const barTo = Math.floor((startBeat + beatsVisible - 1) / 4) + 1;

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "8px 12px", background: colors.surface, borderBottom: `1px solid ${colors.border}`, fontSize: 12, flexWrap: "wrap" }}>
      <button style={btnGhost} onClick={() => pan(-beatsVisible)} title="左移"><ChevronLeftIcon size={14} /></button>
      <button style={btnGhost} onClick={() => pan(beatsVisible)} title="右移"><ChevronRightIcon size={14} /></button>
      <button style={btnGhost} onClick={() => zoomBeats(-1)} title="放大"><ZoomInIcon size={14} /></button>
      <button style={btnGhost} onClick={() => zoomBeats(1)} title="縮小"><ZoomOutIcon size={14} /></button>
      <select value={beatsVisible} onChange={(e) => setBeatsVisible(Number(e.target.value))} title="顯示拍數" style={input}>
        {[4, 8, 16, 32, 64].map((n) => <option key={n} value={n}>{n} 拍</option>)}
      </select>
      <button style={btnGhost} onClick={() => shiftPitch(12)} title="音域上移">音▲</button>
      <button style={btnGhost} onClick={() => shiftPitch(-12)} title="音域下移">音▼</button>
      <select value={snap} onChange={(e) => setSnap(Number(e.target.value))} title="網格" style={input}>
        {[1, 0.5, 0.25].map((n) => <option key={n} value={n}>{snapLabel(n)}</option>)}
      </select>
      <span style={muted}>第 {barFrom}–{barTo} 小節</span>
      <button style={btnGhost} onClick={resetView} title="回到 16 拍 C3–C5">重置視角</button>
    </div>
  );
}
