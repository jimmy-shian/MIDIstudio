// 模組：SVG 圖示庫。線性 1.8px、currentColor，全站取代 emoji／字元圖示。
interface IconProps {
  size?: number;
  title?: string;
}

function Base({ size = 16, title, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={!title}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const PlayIcon = (p: IconProps) => (
  <Base {...p}>
    <polygon points="7 4 20 12 7 20" fill="currentColor" stroke="none" />
  </Base>
);

export const StopIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
  </Base>
);

export const UndoIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5 4 9l4 4" />
    <path d="M4 9h9a7 7 0 0 1 0 14h-2" />
  </Base>
);

export const RedoIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m16 5 4 4-4 4" />
    <path d="M20 9h-9a7 7 0 0 0 0 14h2" />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </Base>
);

export const UploadIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
    <path d="M4 20h16" />
  </Base>
);

export const DownloadIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 20h16" />
  </Base>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m15 6-6 6 6 6" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 6 6 6-6 6" />
  </Base>
);

export const SlidersIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 7h9M18 7h1M5 17h3M12 17h7" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Base>
);

export const MusicIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 18V6l10-2v11" />
    <circle cx="7" cy="18" r="2.5" />
    <circle cx="17" cy="15" r="2.5" />
  </Base>
);

export const ZoomInIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
  </Base>
);

export const ZoomOutIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M8 11h6" />
  </Base>
);
