// 琴格：視窗化渲染（視角走 viewStore），滾輪左右平移；加音吃設定（snap/預設力度）。
// 效能：noteMap 只建窗內音，O(1)/格。
import { Fragment, useMemo } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useViewStore } from "../store/viewStore";
import { useSettingsStore } from "../store/settingsStore";
import { midiToName } from "@midistudio/shared";
import { velocityColor } from "../utils/velocity";
import { beatsInView, pitchesInView, snapQuantize } from "../utils/grid";
import { colors } from "../styles/theme";
import PianoRollControls from "./PianoRollControls";

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

  if (!track) return <div>無音軌</div>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: colors.surface }}>
      <PianoRollControls />
      <div
        style={{ flex: 1, overflow: "auto", padding: 12 }}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) pan(e.deltaX > 0 ? 4 : -4);
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${cols.length}, 28px)`, gap: 2 }}>
          <div />
          {cols.map((b) => <div key={b} style={{ textAlign: "center", fontSize: 10, color: colors.tertiary }}>{b % 4 === 0 ? `:${b / 4 + 1}` : b}</div>)}
          {rows.map((p) => (
            <Fragment key={p}>
              <div style={{ fontSize: 10, color: p % 12 === 0 ? colors.text : colors.tertiary, fontWeight: p % 12 === 0 ? 600 : 400 }}>
                {midiToName(p)}
              </div>
              {cols.map((b) => {
                const n = noteMap.get(`${p}:${b}`);
                const barStart = b % 4 === 0;
                return (
                  <div key={`${p}-${b}`}
                    onClick={() => {
                      if (n) localApply([{ op: "delete_notes", trackId: track.id, noteIds: [n.id] }]);
                      else localApply([{ op: "add_notes", trackId: track.id, notes: [{ pitch: p, startBeat: snapQuantize(b, snap), durBeat: snap, velocity: defaultVelocity[track.kind] }] }]);
                    }}
                    style={{
                      width: 28, height: 18, cursor: "pointer", borderRadius: 3,
                      background: n ? velocityColor(n.velocity) : p % 12 === 0 ? "#f3f4f6" : colors.surface,
                      border: `1px solid ${n ? velocityColor(n.velocity) : barStart ? colors.borderStrong : colors.border}`,
                    }} />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
