# MIDIstudio DESIGN.md — 品牌契約（參照 nexu-io/open-design 的 DESIGN.md＋tokens.css 做法）

> 本文件是 agent 與人改 UI 時的最高指導。數值唯一來源是 `frontend/src/styles/tokens.css`
> （CSS 變數）＋ `frontend/src/styles/theme.ts`（JS 側同值對照）；下表是它的文字版，
> 改數值兩邊同步後改下表。組件樣式一律走 `.module.css` 引用共用，禁 inline style。

## 1. 品牌三句話

1. 淺灰為底、白色卡片——資訊密度靠灰階層次，不靠彩色；全站唯一的彩色只出現在音符力度與选中態。
2. Inter＋系統黑體，標題字重 600，不玩展示字體；數字（拍號／力度）用等寬感對齊。
3. Hairline 邊框＋felt-not-seen 陰影——深度要「感覺到，不要看到」（notion 式）。

## 2. 色票（淺灰系）

| token | 值 | 用途 |
|---|---|---|
| `--bg` | `#f3f4f6` | app 底 |
| `--surface` | `#ffffff` | 卡片、頂欄 |
| `--subtle` | `#f9fafb` | 次表面、氣泡（我方） |
| `--border` | `#e5e7eb` | hairline（≈ minimal 的 `#e2e2e2`） |
| `--border-strong` | `#d1d5db` | 輸入框、拍線 |
| `--fg` | `#111827` | 主文字＋主按鈕底（minimal 式黑即品牌色） |
| `--fg-2` | `#6b7280` | 次文字 |
| `--meta` | `#9ca3af` | 第三級、placeholder |
| `--accent` | `#2563eb` | 僅选中軌、我方氣泡描邊（notion 式單一藍） |
| `--danger` | `#dc2626` | 刪除（linear/notion 同值） |

## 3. 字體與字級

- Inter, system-ui, -apple-system, "Segoe UI", "Noto Sans TC"；内文 14px、次要 12–13px。
- 區塊標題 13px/600；不做大字 hero（工具型產品）。

## 4. 間距與圓角

- 8pt 基線（4/8/12/16）；卡片 padding 12、頂欄 10×16。
- radius-sm 6（按鈕/輸入）、radius-md 8（卡片）——取 minimal（2/4）與 notion（4/8）之間，DAW 控制密集、太方顯擠。

## 5. 按鈕層級（只許三種）

1. Primary：深底白字——只給播放、送出 AI（每屏 ≤2 個）。
2. Default：白底灰框——其他操作。
3. Ghost：無框——圖示操作（復原／刪除／縮放）與文字按鈕。
- 禁用態一律 opacity .4，不許另發明。

## 6. 圖示（SVG only）

- `components/icons.tsx` 內聯 SVG，24 格、1.8px 線寬、currentColor；禁 emoji、禁字元圖示（▶↩🗑）。
- 新增圖示先查庫，形近不重複造；裝飾性圖示 `aria-hidden`。

## 7. 無障礙與動效

- 全站 `:focus-visible` 黑色 2px 描邊（鍵盤用戶找得到焦點）。
- 動效：一般 hover 150–200ms ease-out；下拉選單/收合面板依「下拉式選單動畫.txt」用 0.3s ease
  （觸發器 hover 反饋＋箭頭旋轉＋scaleY/opacity/visibility 展開，實作見 `Dropdown`/`Collapsible` 共用模組）。
  播放與拖曳力度條不加動效（跟手優先）。
- 琴格音塊不只靠顏色：C 音列加粗 label＋淺灰底，色盲可辨。

## 出處

- 包形（DESIGN.md＋tokens）與 minimal／notion 的 token 哲學參照 nexu-io/open-design（Apache-2.0，只取概念與數值區間，未複製檔案；linear-app 為深色系，明確棄用）。詳見 `THIRD_PARTY_NOTICES.md`。
