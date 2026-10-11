import { useProjectStore } from "../store/useProjectStore";
import type { ToolOp } from "@midistudio/shared";
import controls from "../styles/controls.module.css";
import styles from "./TrackList.module.css";
import { MusicIcon, PlusIcon, TrashIcon } from "./icons";

function hasFx(track: { effects?: { type: string; enabled: boolean }[] }, type: string): boolean {
  return !!track.effects?.some((e) => e.type === type && e.enabled !== false);
}

export default function TrackList() {
  const tracks = useProjectStore((s) => s.tracks);
  const selected = useProjectStore((s) => s.selectedTrackId);
  const masterVolume = useProjectStore((s) => s.masterVolume ?? 100);

  const apply = (ops: ToolOp[]) => useProjectStore.getState().localApply(ops);

  return (
    <div className={styles.panel}>
      <h4 className={styles.title}>音軌 · 混音</h4>
      <div className={styles.masterRow}>
        <span className={styles.masterLabel}>Master {masterVolume}</span>
        <input
          type="range" min={0} max={127} value={masterVolume}
          aria-label="Master 音量"
          className={styles.slider}
          onChange={(e) => {
            const v = Number(e.target.value);
            useProjectStore.setState({ masterVolume: v });
            // 防抖由 persistence 統一存檔；此處直接改狀態避免每格一條 undo
          }}
        />
      </div>
      {tracks.map((t) => {
        const active = t.id === selected;
        const vol = t.volume ?? 100;
        const pan = t.pan ?? 0;
        return (
          <div key={t.id}
            onClick={() => useProjectStore.setState({ selectedTrackId: t.id })}
            className={styles.item}
            data-active={active}>
            <div className={styles.nameRow}>
              <MusicIcon size={14} />
              <span className={styles.name}>{t.name}</span>
              <button
                className={`${styles.msBtn} ${t.mute ? styles.msOn : ""}`}
                title={t.mute ? "取消靜音" : "靜音"}
                onClick={(e) => { e.stopPropagation(); apply([{ op: "set_track_mixer", trackId: t.id, mute: !t.mute }]); }}>
                M
              </button>
              <button
                className={`${styles.msBtn} ${t.solo ? styles.msOn : ""}`}
                title={t.solo ? "取消獨奏" : "獨奏"}
                onClick={(e) => { e.stopPropagation(); apply([{ op: "set_track_mixer", trackId: t.id, solo: !t.solo }]); }}>
                S
              </button>
            </div>
            <div className={styles.meta}>{t.kind} · {t.notes.length} 音 · CH{t.channel}</div>
            <label className={styles.ctlRow}>
              <span className={styles.ctlLabel}>音量 {vol}</span>
              <input
                type="range" min={0} max={127} value={vol}
                aria-label={`${t.name} 音量`}
                className={styles.slider}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => apply([{ op: "set_track_mixer", trackId: t.id, volume: Number(e.target.value) }])}
              />
            </label>
            <label className={styles.ctlRow}>
              <span className={styles.ctlLabel}>聲相 {pan.toFixed(1)}</span>
              <input
                type="range" min={-1} max={1} step={0.1} value={pan}
                aria-label={`${t.name} 聲相`}
                className={styles.slider}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => apply([{ op: "set_track_mixer", trackId: t.id, pan: Number(e.target.value) }])}
              />
            </label>
            <div className={styles.fxRow}>
              <button
                className={`${styles.fxBtn} ${hasFx(t, "reverb") ? styles.fxOn : ""}`}
                title="空間殘響發送 (Aux Reverb)"
                onClick={(e) => {
                  e.stopPropagation();
                  const on = hasFx(t, "reverb");
                  apply([{ op: "set_effect", target: "track", trackId: t.id, type: "reverb", params: { decay: 2.5, wet: on ? 0 : 0.3 }, enabled: !on }]);
                }}>
                空間
              </button>
              <button
                className={`${styles.fxBtn} ${hasFx(t, "delay") ? styles.fxOn : ""}`}
                title="回音發送 (Aux Delay)"
                onClick={(e) => {
                  e.stopPropagation();
                  const on = hasFx(t, "delay");
                  apply([{ op: "set_effect", target: "track", trackId: t.id, type: "delay", params: { delayTime: 0.375, feedback: 0.35, wet: on ? 0 : 0.25 }, enabled: !on }]);
                }}>
                回音
              </button>
            </div>
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
