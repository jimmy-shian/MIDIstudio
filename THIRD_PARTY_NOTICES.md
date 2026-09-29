# 第三方參考與授權聲明（THIRD-PARTY NOTICES）

> 結論先行：本專案 `frontend/ shared/ backend/` 全部為原創程式碼，**零複製**以下任何專案的原始碼，
> 僅參考架構概念。因此不觸發 GPL 傳染、Apache 附加條款亦未生效（生效條件是「使用其軟體/程式碼」）。
> 本文件把「參考了什麼→落在我方哪個檔案」逐條寫死，任何人可逐條驗證。

## 0. 誠實對照：真的有參考嗎？（概念 → 我方檔案，可驗證）

| 參考專案 | 拿走的概念 | 落在我方哪裡 | 沒拿的東西 |
|---|---|---|---|
| K.G.Studio（Apache-2.0+附加條款）| LLM 用 tool calling 直接改 Track/Note；全域 Chord/Tempo/Key 軌；project-aware（把工程摘要餵給模型省 token）| `shared/tools.ts` 8 個 op、`shared/types.ts` ToolOp、`backend/llm/projectContext.ts`、`backend/llm/agentLoop.ts` 三輪迴圈 | 它的任何原始碼、Region/OPFS/確認框流程都沒拿 |
| MidiEditor AI（GPL-3.0）| MidiPilot 式 Agent loop＋工具校驗失敗塞回重試；「MCP server 讓外部模型調 MIDI」這個點子 | `backend/llm/agentLoop.ts` validate→重試、`backend/src/mcp/` 16 tools | 它的 32 個工具實作、Qt/C++ 碼一行沒碰 |
| OpenDaw（GPL-3.0）| 反面參考：完整 DAW 工程量太大，第一版只做 MIDI AI（README 排序第⑤即此意）| `README.md` 的排序決策 | 全部都沒拿 |
| ComposeYogi（MIT）| React＋Tone.js＋Zustand；`components/store/hooks/api` 分層 | `frontend/package.json` 技術選型、`frontend/src/` 目錄結構 | 它的 Next.js 頁面、64 樂器、錄音程式碼都沒拿 |
| Boundless MIDI Editor（MIT）| 極簡 Piano Roll＋MIDI 匯出入＋Tone.js 播放 | `frontend/src/components/PianoRoll.tsx`、`frontend/src/api/midiClient.ts`、`frontend/src/audio/ToneEngine.ts` | 它的 Canvas 實作、FastAPI/Basic Pitch 後端都沒拿 |
| nexu-io/open-design（Apache-2.0）| DESIGN.md＋tokens.css 包形；minimal／notion 包的淺色 token 哲學（hairline 邊、黑即品牌色、微陰影）| 根目錄 `DESIGN.md`、前端主題（色值為自寫對齊，未複製其檔案；linear-app 深色系棄用）| 未複製任何檔案 |

驗證方法：全 repo 搜特徵字串（`KGStudio`、`K.G.Studio`、`MidiPilot`、`Tracktion`、`ComposeYogi`、`basic-pitch`）應只出現在本文件、`README.md`、`ARCHITECTURE.md` 的授權段落，`frontend/ shared/ backend/` 原始碼零命中。

## 1. 參考專案授權一覽

| 專案 | 授權 | 生效條件 | 我方狀態 |
|---|---|---|---|
| K.G.Studio https://github.com/KGAudioLab/K.G.Studio | Apache-2.0 ＋附加條款（禁拿去申請專利；公開/商用標 `Powered by K.G.Studio`）| 使用其軟體/程式碼才生效 | 未使用，不生效；若將來移植，須補標示 |
| MidiEditor AI https://github.com/happytunesai/MidiEditor_AI | GPL-3.0 | 複製/衍生才傳染 | 零複製，不傳染 |
| OpenDaw https://github.com/glenwrhodes/OpenDaw | GPL-3.0 | 同上 | 零複製，不傳染 |
| ComposeYogi https://github.com/AppsYogi-com/ComposeYogi | MIT | 複製須保留聲明 | 零複製，無義務 |
| Boundless MIDI Editor https://github.com/Boundless12/midi-editor | MIT | 同上 | 零複製，無義務 |
| nexu-io/open-design https://github.com/nexu-io/open-design | Apache-2.0 | 複製須保留聲明 | 概念參照＋色值區間對齊，未複製檔案，無義務；若將來移植其檔案須補聲明 |

## 2. 實際依賴授權（2026-09-15 由 `node_modules/*/package.json` 實掃，非手寫）

| 套件@版本 | 授權 | 用途 |
|---|---|---|
| react@18.3.1、react-dom@18.3.1 | MIT | UI |
| tone@15.1.22（Tone.js）| MIT | 瀏覽器播放/合成 |
| tonal@5.2.1 | MIT | （備用）JS 樂理；主樂理為自研 `shared/music-theory.ts` |
| zustand@4.5.7 | MIT | React 狀態 |
| vite@5.4.21、@vitejs/plugin-react@4.7.0、typescript@5.9.3（Apache-2.0）、concurrently@9.2.4、tsx@4.23.13 | MIT/Apache-2.0 | 建置工具鏈（不進發佈物）|
| express@4.22.3、cors@2.8.6 | MIT | 後端 |
| dotenv@16.6.1 | BSD-2-Clause | 後端 env |
| zod@4.6.5 | MIT | 校驗＋MCP schema |
| @tonejs/midi@2.0.28 | MIT | 後端 .mid 編解碼 |
| @modelcontextprotocol/server@2.0.0 | MIT | MCP server |

結論：直接依賴全為 MIT / BSD-2-Clause / Apache-2.0，無任何 copyleft（GPL/AGPL/SSPL）套件，與我方 MIT 授權相容。

## 3. 合規規則（給後續開發者，不可刪）

1. **GPL-3.0 紅線**：MidiEditor AI、OpenDaw 的任何原始碼不可貼進本 repo，只能「看完重寫」。違者本專案須整體改 GPL-3.0。
2. **Apache 附加條款**：若將來移植 K.G.Studio 程式碼，UI 須加 `Powered by K.G.Studio`，且不可拿去申請專利。
3. **MIT 保留聲明**：若複製 MIT 專案/函式庫的檔案，須在檔頭保留原作者聲明並回填第 2 節。
4. **新增依賴前**：先查其 `license` 欄，拒絕 GPL/AGPL/SSPL 授權套件進 `package.json`。
5. 本專案自身 MIT（見 `LICENSE`）。

## 4. 查證紀錄

- 2026-09-14：五專案主頁 README / LICENSE badge 初查。
- 2026-09-15：`node_modules` 16 個直接依賴實掃（見第 2 節版本號）；原始碼零複製聲明以第 0 節對照表為準。
