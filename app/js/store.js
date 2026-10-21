// Lưu dữ liệu trong localStorage của trình duyệt. Không có máy chủ.
import { normalizeState, pruneByRetention, emptyState } from './engine.js';

const KEY = 'sen.v1';
let memory = null; // dự phòng khi trình duyệt chặn localStorage (ví dụ chế độ riêng tư)

export function load() {
  let raw = memory;
  try {
    const text = localStorage.getItem(KEY);
    if (text) raw = JSON.parse(text);
  } catch { /* dùng bản trong bộ nhớ */ }
  return pruneByRetention(normalizeState(raw));
}

export function save(state) {
  memory = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clear() {
  memory = null;
  try { localStorage.removeItem(KEY); } catch { /* không có gì để xóa */ }
  return emptyState();
}
