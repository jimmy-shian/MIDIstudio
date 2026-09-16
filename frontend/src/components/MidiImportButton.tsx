import { useProjectStore } from "../store/useProjectStore";
import { importMidi } from "../api/midiClient";
import styles from "./MidiImportButton.module.css";
import { UploadIcon } from "./icons";

// 模組：MIDI 匯入按鈕。
export default function MidiImportButton() {
  const loadProject = useProjectStore((s) => s.loadProject);

  return (
    <label className={styles.label}>
      <UploadIcon size={14} />匯入 MIDI
      <input type="file" accept=".mid,.midi" hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            loadProject(await importMidi(f));
          } catch (err: any) {
            alert(`匯入失敗: ${err.message}`);
          } finally {
            e.target.value = "";
          }
        }} />
    </label>
  );
}
