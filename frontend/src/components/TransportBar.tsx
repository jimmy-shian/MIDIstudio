import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { selectProjectSnapshot } from "../store/selectors";
import { usePlayback } from "../hooks/usePlayback";
import { stopIfPlaying } from "../hooks/useUndoShortcuts";
import { PITCH_CLASS_NAMES } from "@midistudio/shared";
import { exportMidi } from "../api/midiClient";
import { downloadBlob } from "../utils/download";
import controls from "../styles/controls.module.css";
import styles from "./TransportBar.module.css";
import { DownloadIcon, PlayIcon, RedoIcon, StopIcon, UndoIcon } from "./icons";
import MidiImportButton from "./MidiImportButton";
import ProjectSwitcher from "./ProjectSwitcher";
import PlaybackProgress from "./PlaybackProgress";

export default function TransportBar() {
  const { isPlaying, progress, toggle, seek } = usePlayback();
  const bpm = useProjectStore((s) => s.bpm);
  const keyRoot = useProjectStore((s) => s.keyRoot);
  const scale = useProjectStore((s) => s.scale);
  const canUndo = useProjectStore((s) => s.past.length > 0);
  const canRedo = useProjectStore((s) => s.future.length > 0);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);

  // BPM 輸入防抖：本地文字狀態 + 500ms 防抖 + 合法性檢查 + 同值跳過。
  const [bpmText, setBpmText] = useState(String(bpm));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setBpmText(String(bpm)); }, [bpm]);
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const commitBpm = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 40 || v > 240) return;
    const rounded = Math.round(v);
    if (rounded === useProjectStore.getState().bpm) return;
    useProjectStore.getState().localApply([{ op: "update_tempo", bpm: rounded }]);
  };

  const onBpmChange = (raw: string) => {
    setBpmText(raw);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitBpm(raw), 500);
  };

  return (
    <div className={styles.bar}>
      <ProjectSwitcher />
      <button className={isPlaying ? controls.btn : controls.btnPrimary} onClick={toggle}>
        {isPlaying ? <StopIcon size={14} /> : <PlayIcon size={14} />}
        {isPlaying ? "停止" : "播放"}
      </button>
      <PlaybackProgress progress={progress} isPlaying={isPlaying} onSeek={(r) => void seek(r)} />
      <button className={controls.btn} disabled={!canUndo} title="Ctrl+Z"
        onClick={() => { stopIfPlaying(); useProjectStore.getState().undo(); }}>
        <UndoIcon size={14} />復原
      </button>
      <button className={controls.btn} disabled={!canRedo} title="Ctrl+Shift+Z / Ctrl+Y"
        onClick={() => { stopIfPlaying(); useProjectStore.getState().redo(); }}>
        <RedoIcon size={14} />重做
      </button>
      <label className={styles.bpmLabel}>BPM
        <input type="number" value={bpmText} min={40} max={240}
          onChange={(e) => onBpmChange(e.target.value)}
          onBlur={(e) => commitBpm(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commitBpm((e.target as HTMLInputElement).value); }}
          className={`${controls.input} ${styles.bpmInput}`} />
      </label>
      <span className={styles.keyLabel}>調 {PITCH_CLASS_NAMES[keyRoot]} {scale}</span>
      <button className={controls.btn} onClick={async () => {
        const project = selectProjectSnapshot(useProjectStore.getState());
        downloadBlob(await exportMidi(project), "midistudio.mid");
      }}>
        <DownloadIcon size={14} />匯出 MIDI
      </button>
      <MidiImportButton />
      <span className={styles.saved}>
        {lastSavedAt ? `已自動儲存 ${new Date(lastSavedAt).toLocaleTimeString()}` : "尚未存檔"}
      </span>
    </div>
  );
}
