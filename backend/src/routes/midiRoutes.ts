import { Router } from "express";
import { projectToMidiBuffer } from "../midi/exporter.js";
import { midiBufferToProject } from "../midi/importer.js";

// 模組：MIDI 路由。前身在 server.ts 內聯匯出，現補上匯入並拆出。
export const midiRoutes = Router();

midiRoutes.post("/midi/export", (req, res) => {
  try {
    const buf = projectToMidiBuffer(req.body.project);
    res.setHeader("Content-Type", "audio/midi");
    res.setHeader("Content-Disposition", `attachment; filename="midistudio.mid"`);
    res.send(buf);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 匯入：Content-Type: application/octet-stream，body 為 .mid 二進位
midiRoutes.post("/midi/import", (req, res) => {
  try {
    const buf = req.body as Buffer;
    if (!Buffer.isBuffer(buf) || buf.length < 20) {
      res.status(400).json({ error: "empty file, use application/octet-stream" });
      return;
    }
    res.json({ project: midiBufferToProject(buf) });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
