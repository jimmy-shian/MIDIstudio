import { useProjectStore } from "../store/useProjectStore";
import { selectProjectSnapshot } from "../store/selectors";
import { playProject, stopPlayback } from "../audio/ToneEngine";

// 模組：播放控制。前身寫在 TransportBar onClick 內聯，抽出消除重複。
export function usePlayback() {
  const isPlaying = useProjectStore((s) => s.isPlaying);

  const toggle = async (): Promise<void> => {
    const s = useProjectStore.getState();
    if (s.isPlaying) {
      stopPlayback();
      s.setPlaying(false);
      return;
    }
    s.setPlaying(true);
    await playProject(selectProjectSnapshot(s), () => useProjectStore.getState().setPlaying(false));
  };

  return { isPlaying, toggle, stop: () => { stopPlayback(); useProjectStore.getState().setPlaying(false); } };
}
