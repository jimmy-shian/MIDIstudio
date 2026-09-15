import { useProjectStore } from "../store/useProjectStore";

// 模組：力度編輯邏輯。UI 只調這裡，不直拼 ops。
// 節流說明：VelocityLane 拖曳會以 pointermove 頻率呼叫，本身已做 rAF 合併；
// 這裡再做「同值跳過」— 力度沒變就不走 localApply（省一次全工程複製 + 一次重渲染）。
export function useVelocityEdit() {
  const setVelocity = (trackId: string, noteId: string, velocity: number) => {
    const st = useProjectStore.getState();
    const v = Math.max(1, Math.min(127, Math.round(velocity)));
    const note = st.tracks.find((t) => t.id === trackId)?.notes.find((n) => n.id === noteId);
    if (!note || note.velocity === v) return;
    // coalesceKey：整段拖曳在 1.5s 窗口內只佔一格 undo，不塞爆 past
    st.localApply(
      [{ op: "update_velocities", trackId, edits: [{ id: noteId, velocity: v }] }],
      { coalesceKey: `vel:${trackId}` },
    );
  };

  const setAll = (trackId: string, velocity: number) => {
    const track = useProjectStore.getState().tracks.find((t) => t.id === trackId);
    if (!track || !track.notes.length) return;
    useProjectStore.getState().localApply([
      {
        op: "update_velocities",
        trackId,
        edits: track.notes.map((n) => ({ id: n.id, velocity })),
      },
    ]);
  };

  return { setVelocity, setAll };
}
