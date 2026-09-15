# MIDIstudio — React 三層完整架構

## 1. 前端 UI 操作層 `frontend/`（React + Vite + Zustand + Tone.js）
- 風格：淺灰極簡 SaaS（`src/styles/theme.ts` tokens＋`src/styles/index.css` 基座）；圖示一律 `src/components/icons.tsx` 內聯 SVG，禁 emoji／字元圖示
- `src/App.tsx` 版面：TransportBar / ChordPanel＋SettingsPanel / TrackList＋琴格卡＋ChatPanel
- `src/App.tsx` 版面：TransportBar / ChordPanel / TrackList + PianoRoll + ChatPanel
- `src/store/useProjectStore.ts`：zustand 全域工程狀態＋currentProjectId/projectName；`src/store/selectors.ts`：快照選擇器；`src/store/history.ts`：undo/redo 純函數（50 步上限，只存工程欄位）
- `src/store/viewStore.ts`：琴格視角（起始拍/顯示拍數/音域，不進 undo 不進存檔，偏好記 localStorage）；`src/store/settingsStore.ts`：操作客製化（snap/各軌預設力度/和弦力度八度，記 localStorage）
- `src/persistence/storage.ts`：離線快取（含舊版升級）；`src/hooks/usePersistence.ts`：真相在後端 SQLite，啟動載最新、800ms 防抖 PUT，斷線退回快取
- `src/hooks/useUndoShortcuts.ts`：Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y（輸入框不攔截，復原前停播）
- `src/audio/`：`ToneEngine.ts` 薄編排 + `instruments.ts` 旋律合成 + `drums.ts` 鼓合成（36 kick/38 snare/hats）
- `src/api/`：`agentClient.ts` 只留 POST /api/agent；`midiClient.ts` 管 export/import；`projectApi.ts` 管工程 CRUD
- `src/hooks/`：`useAgent.ts` 對話邏輯、`usePlayback.ts` 播放控制（前身在組件內聯）
- `src/utils/download.ts`：blob 下載共用
- `src/components/`：
  - TransportBar：ProjectSwitcher + 播放/停止 + 復原/重做 + BPM/匯出 MIDI + 匯入按鈕 + 自動存檔指示
  - TrackList：選軌、加旋律/鼓軌、刪軌
  - PianoRoll：視窗渲染（預設 16 拍 C3–C5，可捲動縮放，格數/snap 可調），點格加音、點音刪音（音塊色=力度）
  - PianoRollControls：◀▶/＋－/音域/snap/小節顯示；VelocityLane 只顯示窗內音
  - ChordPanel：一鍵寫入進行（吃設定的力度/八度）；SettingsPanel：力度/網格/和弦客製化（收合式）
  - ProjectSwitcher：工程下拉切換＋新工程＋刪除＋改名（走 SQLite）
  - ChatPanel：自然語言作曲（經 useAgent）
  - MidiImportButton：.mid 匯入（POST /api/midi/import）

跑：`npm run dev --workspace=@midistudio/frontend` -> http://localhost:5173

## 2. 中間轉接/端口/邏輯層 `shared/`（前後端共用，唯一真相）
- `types.ts`：ProjectState / Track / NoteEvent / ToolOp（8 個端口）
  - create_track / delete_track / add_notes / delete_notes / update_velocities / update_tempo / update_key / set_chord_progression
- `music-theory.ts`：FL Scores 對應表 SCALES / CHORDS / PROGRESSIONS + midi<->音名
- `midi-utils.ts`：beats<->秒、量化、pitch clamp
- `tools.ts`：TOOL_SCHEMAS，OpenRouter function calling 定義，前後端同源
- `validation.ts`：validateOps， pitch/拍/速度/級數邊界檢查
- `project-ops.ts`：薄編排，只做 applyOps + emptyProject
- `ids.ts`：newNoteId/newTrackId/newProjectId（前身在 project-ops 全域 seq）
- `op-defaults.ts`：VELOCITY_DEFAULTS / CHORD_DEFAULT_VELOCITY+OCTAVE / SNAP（前端設定、後端共用）
- `roman.ts`：romanToRootChord（前身在 project-ops 內聯）
- `gm.ts`：GM_PROGRAMS / DRUM_MAP / KIND_PROGRAM（鼓 36 kick/38 snare/42 hat）
- `form.ts`：FUNCTIONS / NEXT_CHORD / CADENCES / FORMS / RHYTHMS / VELOCITY_GUIDE
- `tool-docs.ts`：TOOL_DOCS，工具說明的唯一來源（tools/MCP/prompt 三端同源）

規則：LLM 只能回 ToolOp[]，必經 validate -> apply 才能進 project。

## 3. 後端 LLM 串接層 `backend/`（Express + OpenRouter + Agent Loop + MCP）
- `src/llm/musicKnowledge.ts`：樂理總表組裝（轉包 shared，prompt 與 MCP resource 同源）
- `src/llm/systemPrompt.ts`：小模型優化版（硬規則置頂、每輪≤2工具、單次≤32音、標準三步 few-shot）
- `src/llm/client.ts`：通用 OpenAI 相容 client（`LLM_BASE_URL/LLM_API_KEY/LLM_MODEL`，預設本地 `127.0.0.1:8765`；不設即回退 OpenRouter；無 KEY 走離線 fallback）
- `src/llm/agentLoop.ts`：session 制（歷史塞回 prompt、存輪、3 輪 tool loop 跑滿；首輪零工具調用只給一次補考 nudge）
- `src/db/conversations.ts`：messages 表，每會話留最近 10 輪、4000 字內，只存人話不存 tool JSON
- `src/routes/agentRoute.ts`：POST /api/agent（收 sessionId、回 sessionId）＋ POST /api/agent/clear（單刪）＋ GET /api/agent/sessions（先看）＋ POST /api/agent/cleanup（批次刪 N 天沒碰的）
- `src/llm/projectContext.ts`：projectToText（省 token 摘要）
- `src/llm/toolConverter.ts`：tool_calls -> ToolOp[]
- `src/llm/fallback.ts`：無 KEY 離線規則
- 處理/回傳：prompt+摘要 -> LLM -> validate -> apply -> {reply,ops,reports,project}
- `src/midi/exporter.ts`：projectToMidiBuffer；`src/midi/importer.ts`：midiBufferToProject；`src/midi/midiLib.ts`：@tonejs/midi UMD interop
- `src/db/database.ts`：SQLite（WAL＋busy_timeout，Express/MCP 共用 `backend/data/midistudio.db`）；`src/db/projects.ts`：工程 CRUD
- `src/routes/agentRoute.ts`：POST /api/agent；`src/routes/midiRoutes.ts`：POST /api/midi/export + POST /api/midi/import(octet-stream)；`src/routes/projectRoutes.ts`：GET/POST /api/projects、GET/PUT/DELETE /api/projects/:id
- `src/server.ts`：薄編排，只掛中介軟體+路由
  - GET /api/health 回 provider/model/hasKey（custom=本地代理，openrouter，none=離線 fallback）
- `src/mcp/`：MCP server（11 tools + 3 resources），見下節

跑：複製 `backend/.env.example` -> `.env` 填 OPENROUTER_API_KEY，`npm run dev --workspace=@midistudio/backend` -> :3001

## 全流程
```
PianoRoll 點改 -> zustand.localApply -> applyOps -> 即時聽(Tone.js)
Chat 輸入 -> POST /api/agent -> systemPrompt+project -> OpenRouter tools
 -> validate -> apply -> 回 {project+解說} -> loadProject -> 播放/匯出.mid
```

根目錄 `npm run dev` 同時起前後端（需 concurrently）。
Windows 一鍵啟動：雙擊 `start.bat`（自動檢查 Node、裝依賴、建 `.env`、開雙服務＋瀏覽器）；`stop.bat` 停全部。
捷徑素材 `Packs.lnk -> D:\FL Studio 20\...` 的音階/和弦已內建進 `shared/music-theory.ts`。

## 4. MCP（所有模型即插即用）
- 跑法：`npm run mcp --workspace=@midistudio/backend`（stdio 開發；正式打包 `npm run mcp:bundle` → `dist/mcp-bundle/server.js`，better-sqlite3 保持 external；opencode 掛載見根目錄 `opencode.json`，改完要重啟 opencode）
- Host 設定範本見根目錄 `mcp.json`（Claude Desktop / VS Code Copilot / Cursor 任選一段貼上；正式用先 `npm run build --workspace=@midistudio/backend` 再指 `dist/mcp/server.js`）
- 16 tools：`get_project / load_project / music_lookup` + 8 個 op + `project_list/open/create/rename/delete`
- 3 resources：`music-theory://cheatsheet / scales / chords`
- 有狀態＋共用 SQLite：MCP 與網頁看到同一批工程；模型先 `project_list`/`get_project` 拿 id 再調 op；校驗失敗回 isError
- 文案同源：tool 描述取自 `shared/tool-docs.ts`，樂理取自 `shared` 數字表經 `llm/musicKnowledge.ts` 組裝，OpenRouter tools 與 MCP 看到同一套

## 授權
- 本專案原創碼採 MIT（`LICENSE`），未複製第三方原始碼。
- 參考專案的授權與紅線見 `THIRD_PARTY_NOTICES.md`：K.G.Studio Apache-2.0+附加條款，ComposeYogi/Boundless MIT，MidiEditor AI/OpenDaw GPL-3.0（不可複製），open-design Apache-2.0（設計參照，未複製檔案）。

## 模組化原則
- 單檔只做一件事：超過 ~60 行或出現第二次的邏輯就拆（ids/roman/gm/form/op-defaults/tool-docs/selectors/download/midiClient/projectApi/hooks/view/settings/grid/instruments/drums/exporter/importer/db/routes/mcp）。
- `server.ts / ToneEngine.ts / agentLoop.ts / project-ops.ts / mcp/server.ts / TransportBar / ChatPanel` 皆為薄編排層。
