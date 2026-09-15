import type { ProjectState, ToolOp } from "./types.js";
import { SCALES, CHORDS, ROMAN_MAJOR } from "./music-theory.js";

export function validateOps(project: ProjectState, ops: ToolOp[]): string[] {
  const errors: string[] = [];
  const trackIds = new Set(project.tracks.map((t) => t.id));
  for (const op of ops) {
    switch (op.op) {
      case "create_track":
        if (!op.name || !op.kind) errors.push("create_track 需要 name/kind");
        break;
      case "delete_track":
        if (!trackIds.has(op.trackId)) errors.push(`track 不存在: ${op.trackId}`);
        break;
      case "add_notes": {
        if (!trackIds.has(op.trackId)) { errors.push(`track 不存在: ${op.trackId}`); break; }
        if (!op.notes.length) errors.push("add_notes 為空");
        if (op.notes.length > 256) errors.push("單次 add_notes 最多 256 個音");
        for (const n of op.notes) {
          if (n.pitch < 0 || n.pitch > 127) errors.push(`pitch 超界: ${n.pitch}`);
          if (n.durBeat <= 0 || n.durBeat > 16) errors.push(`durBeat 非法: ${n.durBeat}`);
          if (n.startBeat < 0 || n.startBeat > 512) errors.push(`startBeat 非法: ${n.startBeat}`);
          if (n.velocity < 1 || n.velocity > 127) errors.push(`velocity 非法: ${n.velocity}`);
        }
        break;
      }
      case "delete_notes":
        if (!trackIds.has(op.trackId)) errors.push(`track 不存在: ${op.trackId}`);
        break;
      case "update_velocities": {
        if (!trackIds.has(op.trackId)) { errors.push(`track 不存在: ${op.trackId}`); break; }
        if (!op.edits.length) errors.push("update_velocities 為空");
        if (op.edits.length > 256) errors.push("單次 update_velocities 最多 256 個音");
        for (const e of op.edits) {
          if (!e.id) errors.push("update_velocities 缺 id");
          if (e.velocity < 1 || e.velocity > 127) errors.push(`velocity 非法: ${e.velocity}`);
        }
        break;
      }
      case "update_tempo":
        if (op.bpm < 40 || op.bpm > 240) errors.push(`bpm 超界: ${op.bpm}`);
        break;
      case "update_key":
        if (op.keyRoot < 0 || op.keyRoot > 11) errors.push(`keyRoot 須 0-11`);
        if (!SCALES[op.scale]) errors.push(`未知 scale: ${op.scale}`);
        break;
      case "set_chord_progression":
        if (!op.progression.length) errors.push("progression 為空");
        if (op.velocity !== undefined && (op.velocity < 1 || op.velocity > 127)) errors.push(`velocity 非法: ${op.velocity}`);
        if (op.octave !== undefined && (op.octave < 1 || op.octave > 6)) errors.push(`octave 非法: ${op.octave}`);
        for (const r of op.progression) {
          if (!ROMAN_MAJOR[r] && !ROMAN_MAJOR[r.toLowerCase()] && !["i","VI","III","VII"].includes(r))
            errors.push(`未知羅馬數字: ${r}`);
        }
        for (const c of ["major","minor","dominant7","major7","minor7"]) {
          if (!CHORDS[c]) errors.push(`內建和弦缺失: ${c}`);
        }
        break;
    }
  }
  return errors;
}
