import { Router } from "express";
import { z } from "zod";
import { createProject, deleteProject, getProjectRow, listProjects, saveProjectRow } from "../db/projects.js";

// 模組：專案路由。多工程存檔：列表/開/存/刪。data 欄為完整 ProjectState JSON。
export const projectRoutes = Router();

projectRoutes.get("/projects", (_req, res) => {
  res.json({ projects: listProjects() });
});

projectRoutes.post("/projects", (req, res) => {
  try {
    const { name, data } = z.object({ name: z.string().max(80).optional(), data: z.any().optional() }).parse(req.body);
    res.status(201).json(createProject(name ?? "未命名工程", data));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

projectRoutes.get("/projects/:id", (req, res) => {
  const row = getProjectRow(req.params.id);
  if (!row) { res.status(404).json({ error: "project not found" }); return; }
  res.json(row);
});

projectRoutes.put("/projects/:id", (req, res) => {
  try {
    const { name, data } = z.object({ name: z.string().max(80).optional(), data: z.any() }).parse(req.body);
    const row = saveProjectRow(req.params.id, data, name);
    if (!row) { res.status(404).json({ error: "project not found" }); return; }
    res.json(row);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

projectRoutes.delete("/projects/:id", (req, res) => {
  if (!deleteProject(req.params.id)) { res.status(404).json({ error: "project not found" }); return; }
  res.json({ ok: true });
});
