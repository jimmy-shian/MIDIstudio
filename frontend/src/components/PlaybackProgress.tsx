import type { PlaybackProgress as Progress } from "../hooks/usePlayback";
import styles from "./PlaybackProgress.module.css";

// 模組：播放進度條。點擊跳轉（播放中有效），鍵盤左右鍵微調；進度走 <progress> 原生屬性。
interface Props {
  progress: Progress;
  isPlaying: boolean;
  onSeek: (ratio: number) => void;
}

export default function PlaybackProgress({ progress, isPlaying, onSeek }: Props) {
  const pct = Math.round(progress.progress * 100);

  const ratioFromEvent = (e: React.MouseEvent<HTMLElement>): number => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  return (
    <div className={styles.wrap} title={isPlaying ? "點擊跳轉播放位置" : "按播放開始"}>
      <progress
        className={styles.bar}
        data-active={isPlaying}
        value={progress.positionSec}
        max={Math.max(progress.durationSec, 0.01)}
        aria-label="播放進度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${progress.positionLabel} / ${progress.durationLabel}`}
        role="progressbar"
        tabIndex={isPlaying ? 0 : -1}
        onClick={(e) => {
          if (!isPlaying) return;
          onSeek(ratioFromEvent(e));
        }}
        onKeyDown={(e) => {
          if (!isPlaying) return;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            onSeek(progress.progress + 0.05);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            onSeek(progress.progress - 0.05);
          }
        }}
      />
      <span className={styles.time}>
        {progress.positionLabel} / {progress.durationLabel}
      </span>
    </div>
  );
}
