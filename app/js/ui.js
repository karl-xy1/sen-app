// Tiện ích giao diện dùng chung cho các màn hình bản web.
import { moodLabel } from './engine.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const GLYPH = {
  bloom: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5C27 13 27.5 26 20 34C12.5 26 13 13 20 5Z" fill="currentColor"/><path d="M20 34C9 33 4 23 5 15C13 17 18.5 25 20 34Z" fill="currentColor" opacity=".72"/><path d="M20 34C31 33 36 23 35 15C27 17 21.5 25 20 34Z" fill="currentColor" opacity=".72"/></svg>',
  seed: '<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="22" rx="8" ry="10" fill="currentColor"/></svg>',
  leaf: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="21" r="14" fill="currentColor"/><path d="M20 21V7M20 21L9 12M20 21L31 12" stroke="var(--ground)" stroke-width="1.6"/></svg>',
  bud: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4C29 13 29.5 27 20 35C10.5 27 11 13 20 4Z" fill="currentColor"/></svg>',
};

export const ICON = {
  lock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
  ai: '<svg viewBox="0 0 28 28" fill="none" stroke="var(--leaf)" stroke-width="1.8" aria-hidden="true"><rect x="5" y="7" width="18" height="14" rx="4"/><circle cx="11" cy="14" r="1.4" fill="var(--leaf)"/><circle cx="17" cy="14" r="1.4" fill="var(--leaf)"/><path d="M14 3v4"/></svg>',
  data: '<svg viewBox="0 0 28 28" fill="none" stroke="var(--leaf)" stroke-width="1.8" aria-hidden="true"><rect x="6" y="12" width="16" height="11" rx="3"/><path d="M9.5 12V9a4.5 4.5 0 0 1 9 0v3"/></svg>',
  people: '<svg viewBox="0 0 28 28" fill="none" stroke="var(--leaf)" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="10" r="3.5"/><circle cx="19" cy="11" r="3"/><path d="M3.5 23c.8-4.5 3.4-7 6.5-7s5.7 2.5 6.5 7M16 17.5c1-.9 2-1.3 3-1.3 2.6 0 4.6 2.2 5.2 6"/></svg>',
};

const DOW_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pad = (n) => String(n).padStart(2, '0');
export const fmtDay = (d) => `${DOW_LONG[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const fmtStamp = (iso) => { const d = new Date(iso); return `${DOW[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1} · ${fmtTime(d)}`; };

let toastTimer;
export function toast(msg, ms = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function confirmDialog({ title, body, ok = 'Đồng ý', danger = false }) {
  const dlg = document.getElementById('dialog');
  dlg.innerHTML = `<form method="dialog"><h2>${esc(title)}</h2><p class="muted">${esc(body)}</p>
    <div class="row-actions"><button class="btn ghost sm" value="cancel">Hủy</button>
    <button class="btn sm ${danger ? 'leaf' : ''}" value="ok" style="${danger ? 'background:var(--crisis);color:var(--on-accent)' : ''}">${esc(ok)}</button></div></form>`;
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
    dlg.showModal();
  });
}

// Biểu đồ tâm trạng theo ngày. days: [{label, date, mood|null}]
export function moodChart(days, { height = 190, width = 560 } = {}) {
  const W = Math.max(260, Math.round(width)), H = height, L = 30, R = 14, T = 12, B = 30;
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.floor((W - L - R) / 34)));
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, days.length - 1);
  const y = (v) => T + ((5 - v) * (H - T - B)) / 4;
  let s = '';
  [1, 3, 5].forEach((v) => {
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" ${v === 3 ? 'stroke-dasharray="3 4"' : ''}/>`;
    s += `<text x="${L - 10}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  });
  days.forEach((d, i) => {
    const last = days.length - 1;
    if ((i % labelEvery === 0 && last - i >= labelEvery) || i === last) {
      const lab = i === last ? 'Nay' : days.length > 7 ? `${d.date.getDate()}/${d.date.getMonth() + 1}` : d.label;
      s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${lab}</text>`;
    }
  });
  for (let i = 1; i < days.length; i++) {
    const a = days[i - 1], b = days[i];
    if (a.mood !== null && b.mood !== null) s += `<line x1="${x(i - 1)}" y1="${y(a.mood)}" x2="${x(i)}" y2="${y(b.mood)}" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round"/>`;
  }
  const lastIdx = days.map((d) => d.mood !== null).lastIndexOf(true);
  days.forEach((d, i) => {
    if (d.mood === null) return;
    const r = i === lastIdx ? 6 : 4;
    const fill = i === lastIdx ? 'var(--lotus)' : 'var(--leaf)';
    const tip = `${d.label} ${d.date.getDate()}/${d.date.getMonth() + 1}: ${moodLabel(Math.round(d.mood))} (${Math.round(d.mood * 10) / 10}/5)`;
    s += `<g><title>${esc(tip)}</title><circle cx="${x(i)}" cy="${y(d.mood)}" r="14" fill="transparent"/><circle cx="${x(i)}" cy="${y(d.mood)}" r="${r}" fill="${fill}" stroke="var(--surface)" stroke-width="2"/></g>`;
  });
  const logged = days.filter((d) => d.mood !== null);
  const aria = logged.length ? `Tâm trạng ${days.length} ngày qua, ${logged.length} ngày có check-in` : 'Chưa có dữ liệu tâm trạng';
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${aria}">${s}</svg>`;
}

// Bài tập thở hộp 4-4-4-4. Trả về hàm dọn dẹp.
export function breathHtml() {
  return `<div class="breath"><div class="breath-box" data-breath><span class="runner"></span><div><span class="phase">Sẵn sàng</span><span class="count">4 vòng · 16 giây mỗi vòng</span></div></div>
    <button class="btn leaf sm" type="button" data-breath-btn>Bắt đầu thở</button></div>`;
}
export function mountBreath(root) {
  const box = root.querySelector('[data-breath]');
  const btn = root.querySelector('[data-breath-btn]');
  if (!box || !btn) return () => {};
  const phase = box.querySelector('.phase'), count = box.querySelector('.count');
  const P = ['Hít vào', 'Giữ', 'Thở ra', 'Giữ'];
  let timer = null;
  const stop = (label = 'Sẵn sàng', sub = '4 vòng · 16 giây mỗi vòng', btnText = 'Bắt đầu thở') => {
    clearInterval(timer); timer = null; box.classList.remove('on');
    phase.textContent = label; count.textContent = sub; btn.textContent = btnText;
  };
  btn.addEventListener('click', () => {
    if (timer) return stop();
    let step = 0, sec = 4;
    box.classList.add('on'); btn.textContent = 'Dừng';
    const tick = () => {
      phase.textContent = P[step % 4];
      count.textContent = `${sec} · vòng ${Math.floor(step / 4) + 1}/4`;
      if (--sec === 0) { sec = 4; step++; }
      if (step >= 16) stop('Xong rồi', 'Bạn thấy thế nào?', 'Làm lại');
    };
    tick(); timer = setInterval(tick, 1000);
  });
  return () => clearInterval(timer);
}

export function downloadText(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
