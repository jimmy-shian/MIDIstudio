// 模組：淺灰極簡 SaaS 主題 tokens。所有組件只從這裡拿顏色/圓角/陰影，禁手寫色碼。
// 設計取向見根目錄 DESIGN.md（參照 nexu-io/open-design 的 minimal＋notion 包：
// hairline 邊框、黑即品牌色、felt-not-seen 陰影；linear-app 深色系已棄用）。
export const colors = {
  bg: "#f3f4f6",
  surface: "#ffffff",
  subtle: "#f9fafb",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#111827",
  secondary: "#6b7280",
  tertiary: "#9ca3af",
  primary: "#111827",
  primaryText: "#ffffff",
  accent: "#2563eb",
  accentSoft: "#eff6ff",
  danger: "#dc2626",
  success: "#059669",
  shadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
} as const;

export const radius = { sm: 6, md: 8 } as const;

const baseBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  fontSize: 13,
  lineHeight: "20px",
  borderRadius: radius.sm,
  border: `1px solid ${colors.borderStrong}`,
  background: colors.surface,
  color: colors.text,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/** 深色主按鈕（播放、送出） */
export const btnPrimary: React.CSSProperties = {
  ...baseBtn,
  background: colors.primary,
  borderColor: colors.primary,
  color: colors.primaryText,
};

/** 白底次按鈕（預設） */
export const btn: React.CSSProperties = { ...baseBtn };

/** 無框 ghost（圖示按鈕、刪除） */
export const btnGhost: React.CSSProperties = {
  ...baseBtn,
  borderColor: "transparent",
  background: "transparent",
  color: colors.secondary,
  padding: "6px 8px",
};

/** 不可用態（配合 disabled 屬性） */
export const btnDisabled: React.CSSProperties = { opacity: 0.4, cursor: "not-allowed" };

export const input: React.CSSProperties = {
  fontSize: 13,
  padding: "5px 8px",
  borderRadius: radius.sm,
  border: `1px solid ${colors.borderStrong}`,
  background: colors.surface,
  color: colors.text,
};

export const card: React.CSSProperties = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  boxShadow: colors.shadow,
};

export const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: colors.text,
};

export const muted: React.CSSProperties = { fontSize: 12, color: colors.secondary };
