import type { ProjectState } from "@midistudio/shared";

// 模組：專案 REST。後端 SQLite 為真相；連不上（後端沒開）由呼叫方退回本地快取。
export interface ProjectMeta {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  noteCount: number;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function listProjects(): Promise<{ projects: ProjectMeta[] }> {
  return req("/api/projects");
}

export function createProject(name?: string, data?: ProjectState): Promise<{ id: string; name: string; data: ProjectState }> {
  return req("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  });
}

export function fetchProject(id: string): Promise<{ id: string; name: string; data: ProjectState }> {
  return req(`/api/projects/${id}`);
}

export function saveProject(id: string, data: ProjectState, name?: string): Promise<{ id: string; name: string }> {
  return req(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  });
}

export function deleteProject(id: string): Promise<{ ok: boolean }> {
  return req(`/api/projects/${id}`, { method: "DELETE" });
}
