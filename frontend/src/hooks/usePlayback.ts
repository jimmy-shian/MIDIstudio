import { useCallback, useEffect, useRef, useState } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { selectProjectSnapshot } from "../store/selectors";
import {
  projectEndBeat,
  formatPlaybackTime,
  getPlaybackSeconds,
  playProject,
  stopPlayback,
} from "../audio/ToneEngine";
import { beatsToSeconds } from "@midistudio/shared";

// 模組：播放控制＋進度（前身在 TransportBar onClick 內聯）。
// 進度以 100ms 輪詢 Transport 秒數；seek 後顯示沿用全曲總長（offset＋已播）。
export interface PlaybackProgress {
  progress: number;
  positionSec: number;
  durationSec: number;
  positionLabel: string;
  durationLabel: string;
}

const POLL_MS = 100;

export function usePlayback() {
  const isPlaying = useProjectStore((s) => s.isPlaying);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const fullSecRef = useRef(0);
  const offsetSecRef = useRef(0);
  const stoppedRef = useRef(false);

  // 外部停止（undo 快捷鍵等）時歸零進度
  useEffect(() => {
    if (!isPlaying) {
      fullSecRef.current = 0;
      offsetSecRef.current = 0;
      setDurationSec(0);
      setPositionSec(0);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    stoppedRef.current = false;
    const id = window.setInterval(() => {
      if (stoppedRef.current) return;
      const pos = Math.min(offsetSecRef.current + getPlaybackSeconds(), fullSecRef.current || 0);
      setPositionSec(pos);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  const startFrom = useCallback(async (fromBeat: number): Promise<void> => {
    const s = useProjectStore.getState();
    const snapshot = selectProjectSnapshot(s);
    const fullBeats = projectEndBeat(snapshot);
    const fullSec = beatsToSeconds(fullBeats, snapshot.bpm);
    const offsetSec = beatsToSeconds(Math.max(0, Math.min(fromBeat, fullBeats)), snapshot.bpm);
    stoppedRef.current = true;
    stopPlayback();
    stoppedRef.current = false;
    fullSecRef.current = fullSec;
    offsetSecRef.current = offsetSec;
    setDurationSec(fullSec);
    setPositionSec(offsetSec);
    s.setPlaying(true);
    try {
      await playProject(snapshot, () => useProjectStore.getState().setPlaying(false), fromBeat);
    } catch {
      s.setPlaying(false);
    }
  }, []);

  const toggle = useCallback(async (): Promise<void> => {
    const s = useProjectStore.getState();
    if (s.isPlaying) {
      stoppedRef.current = true;
      stopPlayback();
      s.setPlaying(false);
      return;
    }
    await startFrom(0);
  }, [startFrom]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    stopPlayback();
    useProjectStore.getState().setPlaying(false);
  }, []);

  // 播放中點擊進度條：從該比例對應拍數重播（未播時忽略）
  const seek = useCallback(
    async (ratio: number): Promise<void> => {
      const s = useProjectStore.getState();
      if (!s.isPlaying) return;
      const snapshot = selectProjectSnapshot(s);
      const targetBeat = Math.max(0, Math.min(0.99, ratio)) * projectEndBeat(snapshot);
      await startFrom(targetBeat);
    },
    [startFrom],
  );

  const progress: PlaybackProgress = {
    progress: durationSec > 0 ? Math.max(0, Math.min(1, positionSec / durationSec)) : 0,
    positionSec,
    durationSec,
    positionLabel: formatPlaybackTime(positionSec),
    durationLabel: formatPlaybackTime(durationSec),
  };

  return { isPlaying, progress, toggle, stop, seek };
}
