// 琴格：視窗化渲染（視角走 viewStore），滾輪左右平移；加音吃設定（snap/預設力度）。
// 效能：noteMap 只建窗內音，O(1)/格。
import { Fragment, useEffect, useMemo } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useViewStore } from "../store/viewStore";
import { useSettingsStore } from "../store/settingsStore";
import { beatsToTicks, getBeatsPerBar, midiToName, ticksToBeats } from "@midistudio/shared";
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
  const timeSig = useProjectStore((s) => s.timeSig);
  const sections = useProjectStore((s) => s.sections ?? []);
  const { startBeat, beatsVisible, lowPitch, highPitch, pan } = useViewStore();
  const snap = useSettingsStore((s) => s.snap);
  const defaultVelocity = useSettingsStore((s) => s.defaultVelocity);
  const track = tracks.find((t) => t.id === selectedId) ?? tracks[0];
  const beatsPerBar = getBeatsPerBar(timeSig ?? [4, 4]);

  // 選軌垂直對焦：視角中心對齊該軌音域（跨度≥24半音）。
  // 否則選了貝斯（E2 一帶）卻停在 C5 視角，網格看起來是空的。
  useEffect(() => {
    if (!track || track.notes.length === 0) return;
    let min = 127;
    let max = 0;
    for (const n of track.notes) {
      if (n.pitch < min) min = n.pitch;
      if (n.pitch > max) max = n.pitch;
    }
    const span = Math.min(127, Math.max(24, max - min + 8));
    const mid = (min + max) / 2;
    const low = Math.max(0, Math.min(127 - span, Math.round(mid - span / 2)));
    const high = low + span;
    const v = useViewStore.getState();
    if (v.lowPitch !== low || v.highPitch !== high) v.setPitchRange(low, high);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  const addAt = (pitch: number, beat: number) => {
    if (!track) return;
    const sb = snapQuantize(beat, snap);
    localApply([
      {
        op: "add_notes",
        trackId: track.id,
        notes: [
          {
            pitch,
            startBeat: sb,
            durBeat: snap,
            startTick: beatsToTicks(sb),
            durationTicks: Math.max(1, beatsToTicks(snap)),
            velocity: defaultVelocity[track.kind],
          },
        ],
      },
    ]);
  };

  const cols = useMemo(() => beatsInView(startBeat, beatsVisible), [startBeat, beatsVisible]);
  const rows = useMemo(() => pitchesInView(lowPitch, highPitch), [lowPitch, highPitch]);

  // 以絕對 Tick 為鍵，避免 Math.floor 造成同拍細分音符互相覆蓋（DEF-010）。
  // 格子顯示時以 [b, b+1) 拍區間查找，細分音符仍可見且可點選刪除。
  const noteByTick = useMemo(() => {
    const m = new Map<string, NonNullable<typeof track>["notes"][number]>();
    if (!track) return m;
    const end = startBeat + beatsVisible;
    for (const n of track.notes) {
      const sBeat = n.startTick !== undefined ? ticksToBeats(n.startTick) : n.startBeat;
      if (sBeat < startBeat - 16 || sBeat >= end) continue;
      const tick = n.startTick !== undefined ? n.startTick : beatsToTicks(n.startBeat);
      m.set(`${n.pitch}:${tick}`, n);
    }
    return m;
  }, [track, startBeat, beatsVisible]);

  const cellNote = (pitch: number, beat: number) => {
    const cellStart = beatsToTicks(beat);
    const cellEnd = beatsToTicks(beat + 1);
    let best: NonNullable<typeof track>["notes"][number] | undefined;
    for (const n of noteByTick.values()) {
      if (n.pitch !== pitch) continue;
      const tick = n.startTick !== undefined ? n.startTick : beatsToTicks(n.startBeat);
      if (tick >= cellStart && tick < cellEnd) {
        if (!best) best = n;
        else {
          const bestTick = best.startTick !== undefined ? best.startTick : beatsToTicks(best.startBeat);
          if (tick < bestTick) best = n;
        }
      }
    }
    return best;
  };

  if (!track) return <div className={styles.empty}>無音軌</div>;

  return (
    <div className={styles.root}>
      <PianoRollControls />
      {sections.length > 0 && (
        <div className={styles.sectionRuler} aria-label="曲式段落">
          {sections.map((sec) => {
            const sBeat = ticksToBeats(sec.startTick);
            const eBeat = ticksToBeats(sec.startTick + sec.lengthTicks);
            if (eBeat <= startBeat || sBeat >= startBeat + beatsVisible) return null;
            return (
              <span key={sec.id} className={styles.sectionTag} title={`${sec.name} · ${sec.bars} 小節`}>
                {sec.name} {sec.bars}節
              </span>
            );
          })}
        </div>
      )}
      <div
        className={styles.scroll}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pan(e.deltaX > 0 ? 4 : -4);
        }}
      >
        <div className={`${styles.grid} ${colsClass(cols.length)}`}>
          <div />
          {cols.map((b) => <div key={b} className={styles.colLabel}>{b % beatsPerBar === 0 ? `:${Math.floor(b / beatsPerBar) + 1}` : b}</div>)}
          {rows.map((p) => (
            <Fragment key={p}>
              <div className={p % 12 === 0 ? styles.rowLabelC : styles.rowLabel}>
                {midiToName(p)}
              </div>
              {cols.map((b) => {
                const n = cellNote(p, b);
                const barStart = b % beatsPerBar === 0;
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
                      else addAt(p, b);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      if (n) localApply([{ op: "delete_notes", trackId: track.id, noteIds: [n.id] }]);
                      else addAt(p, b);
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
