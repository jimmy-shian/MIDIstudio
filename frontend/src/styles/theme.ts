// 模組：設計 tokens（JS 側真相；CSS 側真相見 ./tokens.css，兩邊數值需同步）。
// 設計取向見根目錄 DESIGN.md。組件樣式一律走 .module.css＋controls.module.css，
// 本檔不再提供 React.CSSProperties 內聯物件（已遷移，禁新增 style={{...}}）。
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
