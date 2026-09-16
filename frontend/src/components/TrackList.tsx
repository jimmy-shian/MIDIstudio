import { useProjectStore } from "../store/useProjectStore";
import type { ToolOp } from "@midistudio/shared";
import controls from "../styles/controls.module.css";
import styles from "./TrackList.module.css";
import { MusicIcon, PlusIcon, TrashIcon } from "./icons";

export default function TrackList() {
  const tracks = useProjectStore((s) => s.tracks);
  const selected = useProjectStore((s) => s.selectedTrackId);

  const apply = (ops: ToolOp[]) => useProjectStore.getState().localApply(ops);

  return (
    <div className={styles.panel}>
      <h4 className={styles.title}>音軌</h4>
      {tracks.map((t) => {
        const active = t.id === selected;
        return (
          <div key={t.id}
            onClick={() => useProjectStore.setState({ selectedTrackId: t.id })}
            className={styles.item}
            data-active={active}>
            <div className={styles.nameRow}>
              <MusicIcon size={14} />
              <span className={styles.name}>{t.name}</span>
            </div>
            <div className={styles.meta}>{t.kind} · {t.notes.length} 音</div>
            <div className={styles.delRow}>
              <button className={styles.delBtn}
                onClick={(e) => { e.stopPropagation(); apply([{ op: "delete_track", trackId: t.id }]); }}>
                <TrashIcon size={12} />刪除
              </button>
            </div>
          </div>
        );
      })}
      <div className={styles.addRow}>
        <button className={controls.btn} onClick={() => apply([{ op: "create_track", name: `Melody ${tracks.length + 1}`, kind: "melody" }])}>
          <PlusIcon size={14} />旋律
        </button>
        <button className={controls.btn} onClick={() => apply([{ op: "create_track", name: `Drums ${tracks.length + 1}`, kind: "drums" }])}>
          <PlusIcon size={14} />鼓
        </button>
      </div>
    </div>
  );
}
