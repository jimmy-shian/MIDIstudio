import { useEffect, useMemo, useRef } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useViewStore } from "../store/viewStore";
import { useVelocityEdit } from "../hooks/useVelocityEdit";
import { velocityColor, velocityHeight } from "../utils/velocity";
import { btn, colors, muted } from "../styles/theme";
import { midiToName } from "@midistudio/shared";

// 模組：力度 Lane。只負責顯示+拖曳，狀態走 store，寫入走 useVelocityEdit。
// 效能：pointermove 可達 60~120Hz，舊寫法每次都 localApply（全工程複製+全樹重渲染）。
// 新寫法用 rAF 合併為每幀最多 1 次 store 寫入，大幅降低記憶體配置與 GC。
const LANE_H = 72;

function yToVelocity(y: number): number {
  const ratio = 1 - y / LANE_H;
  return Math.max(1, Math.min(127, Math.round(ratio * 127)));
}

export default function VelocityLane() {
  const track = useProjectStore((s) => s.tracks.find((t) => t.id === s.selectedTrackId) ?? s.tracks[0]);
  const startBeat = useViewStore((s) => s.startBeat);
  const beatsVisible = useViewStore((s) => s.beatsVisible);
  const { setVelocity, setAll } = useVelocityEdit();
  const dragId = useRef<string | null>(null);
  const pending = useRef<{ trackId: string; noteId: string; velocity: number } | null>(null);
  const rafId = useRef<number>(0);

  // 只顯示視窗內的音，並與琴格同窗；排序只在該軌 notes 引用變化時重算
  const notes = useMemo(() => {
    if (!track) return [];
    const end = startBeat + beatsVisible;
    return track.notes
      .filter((n) => n.startBeat >= startBeat && n.startBeat < end)
      .sort((a, b) => a.startBeat - b.startBeat)
      .slice(0, 128);
  }, [track, startBeat, beatsVisible]);

  useEffect(() => () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
  }, []);

  const flushPending = () => {
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
    const p = pending.current;
    pending.current = null;
    if (p) setVelocity(p.trackId, p.noteId, p.velocity);
  };

  const scheduleApply = (trackId: string, noteId: string, velocity: number) => {
    pending.current = { trackId, noteId, velocity };
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      const p = pending.current;
      pending.current = null;
      if (p) setVelocity(p.trackId, p.noteId, p.velocity);
    });
  };

  if (!track) return null;

  const applyAt = (e: React.PointerEvent, noteId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    scheduleApply(track.id, noteId, yToVelocity(e.clientY - rect.top));
  };

  return (
    <div style={{ background: colors.surface, borderTop: `1px solid ${colors.border}`, padding: "8px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <strong style={{ fontSize: 12 }}>力度 {track.name} ({notes.length})</strong>
        <button style={btn} onClick={() => setAll(track.id, 90)}>全部 90</button>
        <button style={btn} onClick={() => setAll(track.id, 70)}>全部 70</button>
        <span style={muted}>上下拖曳色條改力度</span>
      </div>
      <div style={{ display: "flex", gap: 3, overflowX: "auto", alignItems: "flex-end", minHeight: LANE_H }}>
        {notes.length === 0 && <span style={muted}>尚無音符，先在上方琴格點音</span>}
        {notes.map((n) => (
          <div key={n.id} title={`${midiToName(n.pitch)}@${n.startBeat} v=${n.velocity}`}
            onPointerDown={(e) => { dragId.current = n.id; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); applyAt(e, n.id); }}
            onPointerMove={(e) => { if (dragId.current === n.id && e.buttons > 0) applyAt(e, n.id); }}
            onPointerUp={() => { dragId.current = null; flushPending(); }}
            onPointerCancel={() => { dragId.current = null; flushPending(); }}
            style={{
              width: 18, height: LANE_H, background: colors.subtle, cursor: "ns-resize",
              display: "flex", alignItems: "flex-end", border: `1px solid ${colors.border}`, borderRadius: 3,
            }}>
            <div style={{
              width: "100%", height: velocityHeight(n.velocity, LANE_H),
              background: velocityColor(n.velocity), borderRadius: "0 0 2px 2px",
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
