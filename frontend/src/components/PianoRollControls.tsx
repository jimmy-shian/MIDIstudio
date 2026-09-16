import { useViewStore } from "../store/viewStore";
import { useSettingsStore } from "../store/settingsStore";
import { snapLabel } from "../utils/grid";
import controls from "../styles/controls.module.css";
import styles from "./PianoRollControls.module.css";
import Dropdown from "./Dropdown";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ZoomInIcon, ZoomOutIcon } from "./icons";

// 模組：琴格捲動/縮放/snap 控制列。狀態走 viewStore＋settingsStore，選單走 Dropdown。
const BEATS_OPTIONS = [4, 8, 16, 32, 64].map((n) => ({ value: n, label: `${n} 拍` }));
const SNAP_OPTIONS = [1, 0.5, 0.25].map((n) => ({ value: n, label: snapLabel(n) }));

export default function PianoRollControls() {
  const { startBeat, beatsVisible, pan, zoomBeats, shiftPitch, setBeatsVisible, resetView } = useViewStore();
  const snap = useSettingsStore((s) => s.snap);
  const setSnap = useSettingsStore((s) => s.setSnap);
  const barFrom = Math.floor(startBeat / 4) + 1;
  const barTo = Math.floor((startBeat + beatsVisible - 1) / 4) + 1;

  return (
    <div className={styles.bar}>
      <button className={controls.btnGhost} onClick={() => pan(-beatsVisible)} title="左移"><ChevronLeftIcon size={14} /></button>
      <button className={controls.btnGhost} onClick={() => pan(beatsVisible)} title="右移"><ChevronRightIcon size={14} /></button>
      <button className={controls.btnGhost} onClick={() => zoomBeats(-1)} title="放大"><ZoomInIcon size={14} /></button>
      <button className={controls.btnGhost} onClick={() => zoomBeats(1)} title="縮小"><ZoomOutIcon size={14} /></button>
      <span className={styles.menu}>
        <Dropdown value={beatsVisible} options={BEATS_OPTIONS} onChange={(v) => setBeatsVisible(v)} label="顯示拍數" compact />
      </span>
      <button className={controls.btnGhost} onClick={() => shiftPitch(12)} title="音域上移">音<ChevronUpIcon size={14} /></button>
      <button className={controls.btnGhost} onClick={() => shiftPitch(-12)} title="音域下移">音<ChevronDownIcon size={14} /></button>
      <span className={styles.menu}>
        <Dropdown value={snap} options={SNAP_OPTIONS} onChange={(v) => setSnap(v)} label="網格" compact />
      </span>
      <span className={controls.muted}>第 {barFrom}–{barTo} 小節</span>
      <button className={controls.btnGhost} onClick={resetView} title="回到 16 拍 C3–C5">重置視角</button>
    </div>
  );
}
