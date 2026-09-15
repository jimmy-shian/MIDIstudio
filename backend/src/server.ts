import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { agentRoute } from "./routes/agentRoute.js";
import { midiRoutes } from "./routes/midiRoutes.js";
import { projectRoutes } from "./routes/projectRoutes.js";
import { resolveLlmConfig } from "./llm/client.js";

// 薄編排層：只做中介軟體 + 掛路由，業務已拆到 routes/ llm/ midi/。
dotenv.config();
const app = express();
app.use(cors());
app.use("/api/midi/import", express.raw({ type: "application/octet-stream", limit: "5mb" }));
app.use(express.json({ limit: "2mb" }));

app.use("/api", agentRoute);
app.use("/api", midiRoutes);
app.use("/api", projectRoutes);
app.get("/api/health", (_req, res) => {
  const cfg = resolveLlmConfig();
  res.json({ ok: true, provider: cfg.provider, model: cfg.model || null, hasKey: !!cfg.apiKey });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  const cfg = resolveLlmConfig();
  console.log(`[backend] http://localhost:${port} provider=${cfg.provider} model=${cfg.model || "-"}`);
});
