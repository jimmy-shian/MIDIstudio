// 琴格：視窗化渲染（視角走 viewStore），滾輪左右平移；加音吃設定（snap/預設力度）。
// 效能：noteMap 只建窗內音，O(1)/格。
import { Fragment, useMemo } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useViewStore } from "../store/viewStore";
import { useSettingsStore } from "../store/settingsStore";
import { midiToName } from "@midistudio/shared";
import { beatsInView, pitchesInView, snapQuantize } from "../utils/grid";
import styles from "./PianoRoll.module.css";
import PianoRollControls from "./PianoRollControls";

// 力度分級（與 velocity.ts 閾值一致，樣式走 CSS class，不用 inline background）
function velocityClass(v: number): string {
  if (v >= 100) return styles.vel4;
  if (v >= 85) return styles.vel3;
  if (v >= 65) return styles.vel2;
  return styles.vel1;
}

function colsClass(n: number): string {
  if (n <= 4) return styles.cols4;
  if (n <= 8) return styles.cols8;
  if (n <= 16) return styles.cols16;
  if (n <= 32) return styles.cols32;
  return styles.cols64;
}

export default function PianoRoll() {
  const tracks = useProjectStore((s) => s.tracks);
  const selectedId = useProjectStore((s) => s.selectedTrackId);
  const localApply = useProjectStore((s) => s.localApply);
  const { startBeat, beatsVisible, lowPitch, highPitch, pan } = useViewStore();
  const snap = useSettingsStore((s) => s.snap);
  const defaultVelocity = useSettingsStore((s) => s.defaultVelocity);
  const track = tracks.find((t) => t.id === selectedId) ?? tracks[0];

  const cols = useMemo(() => beatsInView(startBeat, beatsVisible), [startBeat, beatsVisible]);
  const rows = useMemo(() => pitchesInView(lowPitch, highPitch), [lowPitch, highPitch]);

  const noteMap = useMemo(() => {
    const m = new Map<string, NonNullable<typeof track>["notes"][number]>();
    if (!track) return m;
    const end = startBeat + beatsVisible;
    for (const n of track.notes) {
      if (n.startBeat < startBeat - 16 || n.startBeat >= end) continue;
      m.set(`${n.pitch}:${Math.floor(n.startBeat)}`, n);
    }
    return m;
  }, [track, startBeat, beatsVisible]);

  if (!track) return <div className={styles.empty}>無音軌</div>;

  return (
    <div className={styles.root}>
      <PianoRollControls />
      <div
        className={styles.scroll}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pan(e.deltaX > 0 ? 4 : -4);
        }}
      >
        <div className={`${styles.grid} ${colsClass(cols.length)}`}>
          <div />
          {cols.map((b) => <div key={b} className={styles.colLabel}>{b % 4 === 0 ? `:${b / 4 + 1}` : b}</div>)}
          {rows.map((p) => (
            <Fragment key={p}>
              <div className={p % 12 === 0 ? styles.rowLabelC : styles.rowLabel}>
                {midiToName(p)}
              </div>
              {cols.map((b) => {
                const n = noteMap.get(`${p}:${b}`);
                const barStart = b % 4 === 0;
                const cls = [
                  styles.cell,
                  n ? velocityClass(n.velocity) : "",
                  !n && p % 12 === 0 ? styles.cellPitchC : "",
                  !n && barStart ? styles.cellBar : "",
                ].filter(Boolean).join(" ");
                return (
                  <div key={`${p}-${b}`}
                    role="button"
                    tabIndex={0}
                    aria-label={n ? `刪除 ${midiToName(p)} 第 ${b} 拍` : `在 ${midiToName(p)} 第 ${b} 拍加音`}
                    onClick={() => {
                      if (n) localApply([{ op: "delete_notes", trackId: track.id, noteIds: [n.id] }]);
                      else localApply([{ op: "add_notes", trackId: track.id, notes: [{ pitch: p, startBeat: snapQuantize(b, snap), durBeat: snap, velocity: defaultVelocity[track.kind] }] }]);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      if (n) localApply([{ op: "delete_notes", trackId: track.id, noteIds: [n.id] }]);
                      else localApply([{ op: "add_notes", trackId: track.id, notes: [{ pitch: p, startBeat: snapQuantize(b, snap), durBeat: snap, velocity: defaultVelocity[track.kind] }] }]);
                    }}
                    className={cls} />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
