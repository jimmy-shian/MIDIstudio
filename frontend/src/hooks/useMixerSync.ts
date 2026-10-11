import { useEffect } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { syncMixerState } from "../audio/instruments";

// 混音即時同步：音量/聲相/靜音/獨奏一改就套用到音訊鏈，
// 不必等下次按播放（playProject 只在啟動時同步一次，這是播放中拖滑桿無效的根因）。
export function useMixerSync(): void {
  useEffect(() => {
    const unsub = useProjectStore.subscribe((s, prev) => {
      if (s.tracks === prev.tracks && s.masterVolume === prev.masterVolume) return;
      try {
        syncMixerState(s.tracks, s.masterVolume ?? 100);
      } catch {}
    });
    return unsub;
  }, []);
}
