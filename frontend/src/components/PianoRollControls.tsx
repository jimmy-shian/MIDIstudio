import { useViewStore } from "../store/viewStore";
import { useSettingsStore } from "../store/settingsStore";
import { useProjectStore } from "../store/useProjectStore";
import { getBeatsPerBar } from "@midistudio/shared";
import { isTripletSnap, snapLabel } from "../utils/grid";
import { copyViewNotes, duplicateLastBar, getClipboard, pasteAtView } from "../utils/clipboard";
import controls from "../styles/controls.module.css";
import styles from "./PianoRollControls.module.css";
import Dropdown from "./Dropdown";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ZoomInIcon, ZoomOutIcon } from "./icons";

// 模組：琴格捲動/縮放/snap 控制列。狀態走 viewStore＋settingsStore，選單走 Dropdown。
const BEATS_OPTIONS = [4, 8, 16, 32, 64].map((n) => ({ value: n, label: `${n} 拍` }));
const SNAP_OPTIONS = [1, 0.5, 1 / 3, 0.25, 1 / 6].map((n) => ({ value: n, label: snapLabel(n) }));

export default function PianoRollControls() {
  const { startBeat, beatsVisible, pan, zoomBeats, shiftPitch, setBeatsVisible, resetView } = useViewStore();
  const snap = useSettingsStore((s) => s.snap);
  const setSnap = useSettingsStore((s) => s.setSnap);
  const timeSig = useProjectStore((s) => s.timeSig);
  const beatsPerBar = getBeatsPerBar(timeSig ?? [4, 4]);
  const barFrom = Math.floor(startBeat / beatsPerBar) + 1;
  const barTo = Math.floor((startBeat + beatsVisible - 1) / beatsPerBar) + 1;

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
      <span className={controls.muted}>第 {barFrom}–{barTo} 小節{isTripletSnap(snap) ? " · 三連音" : ""}</span>
      <button className={controls.btnGhost} onClick={() => copyViewNotes()} title="複製目前視窗音符 (Ctrl+C)">複製</button>
      <button className={controls.btnGhost} onClick={() => pasteAtView()} disabled={!getClipboard()} title="貼上至視角起點 (Ctrl+V)">貼上</button>
      <button className={controls.btnGhost} onClick={() => duplicateLastBar()} title="重複最後一小節到下一小節 (Ctrl+D)">重複小節</button>
      <button className={controls.btnGhost} onClick={resetView} title="回到 16 拍 C3–C5">重置視角</button>
    </div>
  );
}
