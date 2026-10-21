// Bộ máy gợi ý của Sen. Chạy hoàn toàn trên máy, không gửi dữ liệu đi đâu.
// Giữ file này giống hệt nhau ở site/app/js/ và ios/src/core/.
import { MOODS, SKILLS, RISK_TERMS, WHO5, STAGES, HEAVY_USE, LONELY } from './content.js';

const DAY = 86400000;
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const skillById = (id) => SKILLS.find((s) => s.id === id);
export const moodLabel = (v) => (MOODS.find((m) => m.v === v) || {}).label || '';

export function formatHours(h) {
  const n = Number(h);
  return (Number.isInteger(n) ? String(n) : String(n).replace('.', ',')) + ' giờ';
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function emptyState(now = new Date()) {
  return {
    version: 1,
    consentAt: null,
    startedAt: now.toISOString(),
    entries: [],
    who5: [],
    skillsUsed: {},
    usage: {}, // { 'YYYY-MM-DD': số phút dùng app }
    settings: { retentionDays: 90, reminder: { enabled: false, hour: 21, minute: 0, frequency: 'daily' } },
  };
}

// Gộp dữ liệu đã lưu với cấu trúc mặc định để app không vỡ khi có trường mới.
export function normalizeState(raw, now = new Date()) {
  const base = emptyState(now);
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    who5: Array.isArray(raw.who5) ? raw.who5 : [],
    skillsUsed: raw.skillsUsed && typeof raw.skillsUsed === 'object' ? raw.skillsUsed : {},
    usage: raw.usage && typeof raw.usage === 'object' ? raw.usage : {},
    settings: {
      ...base.settings,
      ...(raw.settings || {}),
      reminder: { ...base.settings.reminder, ...((raw.settings || {}).reminder || {}) },
    },
  };
}

export function detectRisk(text) {
  if (!text) return false;
  const s = String(text).normalize('NFC').toLowerCase().replace(/\s+/g, ' ');
  return RISK_TERMS.some((k) => s.includes(k));
}

export function pruneByRetention(state, now = new Date()) {
  const days = state.settings.retentionDays;
  if (!days) return state;
  const cutoff = now.getTime() - days * DAY;
  const cutoffKey = dayKey(cutoff);
  return {
    ...state,
    entries: state.entries.filter((e) => new Date(e.at).getTime() >= cutoff),
    who5: state.who5.filter((w) => new Date(w.at).getTime() >= cutoff),
    usage: Object.fromEntries(Object.entries(state.usage || {}).filter(([k]) => k >= cutoffKey)),
  };
}

function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

// Tâm trạng trung bình mỗi ngày trong `days` ngày gần nhất (ngày không check-in = null).
export function dailyMoods(entries, now = new Date(), days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const key = dayKey(d);
    const same = entries.filter((e) => dayKey(e.at) === key);
    const mood = same.length ? same.reduce((a, e) => a + e.mood, 0) / same.length : null;
    out.push({ key, label: i === 0 ? 'Nay' : DOW[d.getDay()], date: d, mood });
  }
  return out;
}

export function who5Score(answers) {
  return answers.reduce((a, v) => a + v, 0) * 4;
}

export function latestWho5(state) {
  return state.who5.length ? state.who5[state.who5.length - 1] : null;
}

export function who5Due(state, now = new Date()) {
  if (state.entries.length < 3) return false;
  const last = latestWho5(state);
  return !last || now.getTime() - new Date(last.at).getTime() >= WHO5.intervalDays * DAY;
}

export function stageFor(state, now = new Date()) {
  const day = Math.floor((now.getTime() - new Date(state.startedAt).getTime()) / DAY);
  let idx = 0;
  STAGES.forEach((s, i) => { if (day >= s.fromDay) idx = i; });
  return { ...STAGES[idx], index: idx, day, next: STAGES[idx + 1] || null };
}

// Gợi ý gặp chuyên gia khi tâm trạng thấp kéo dài hoặc WHO-5 thấp. Không phải chẩn đoán.
export function referral(state, now = new Date()) {
  const recent = state.entries.filter((e) => now.getTime() - new Date(e.at).getTime() < 7 * DAY);
  const low = dailyMoods(recent, now, 7).filter((d) => d.mood !== null && d.mood <= 2).length;
  if (low >= 5) return { reason: 'mood', lowDays: low };
  const w = latestWho5(state);
  if (w && w.score <= WHO5.threshold && now.getTime() - new Date(w.at).getTime() < 21 * DAY) {
    return { reason: 'who5', score: w.score };
  }
  return null;
}

/* ---------- Tác động lâu dài: Sen lùi lại dần theo thời gian ---------- */

export function addUsage(state, minutes = 1, now = new Date()) {
  const k = dayKey(now);
  const usage = state.usage || {};
  return { ...state, usage: { ...usage, [k]: (usage[k] || 0) + minutes } };
}

export function weekUsage(state, now = new Date()) {
  let total = 0;
  for (let i = 0; i < 7; i++) total += (state.usage || {})[dayKey(now.getTime() - i * DAY)] || 0;
  return total;
}

// Dùng app quá nhiều cũng là một rủi ro: nhắc kết nối người thật.
export function heavyUse(state, now = new Date()) {
  let days = 0;
  for (let i = 0; i < 7; i++) {
    if (((state.usage || {})[dayKey(now.getTime() - i * DAY)] || 0) >= HEAVY_USE.minutesPerDay) days++;
  }
  return days >= HEAVY_USE.days ? { days } : null;
}

export function lonelinessHint(state, now = new Date()) {
  const recent = state.entries.filter((e) => now.getTime() - new Date(e.at).getTime() < LONELY.windowDays * DAY);
  const times = recent.filter((e) => (e.emotions || []).includes('Cô đơn')).length;
  return times >= LONELY.times ? { times } : null;
}

export function topSkills(state, n = 3) {
  return Object.entries(state.skillsUsed || {})
    .filter(([id, count]) => count > 0 && skillById(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({ skill: skillById(id), count }));
}

// Lá: gợi ý giảm nhắc. Hoa: gợi ý tắt nhắc. Người dùng luôn là người quyết định.
export function reminderAdvice(state, now = new Date()) {
  const r = state.settings.reminder;
  if (!r.enabled) return null;
  const st = stageFor(state, now);
  if (st.id === 'bloom') return { kind: 'off', text: 'Bạn đã đi cùng Sen hơn 6 tháng. Có thể bạn không cần nhắc nhở nữa.' };
  if (st.index >= 1 && r.frequency !== 'thrice') return { kind: 'thrice', text: 'Đã hơn 2 tuần rồi. Bạn có muốn giảm nhắc còn 3 lần mỗi tuần?' };
  return null;
}

// Sổ kỹ năng dạng chữ để người dùng giữ lại, kể cả khi đã xóa app.
export function skillsSummary(state) {
  const top = topSkills(state, SKILLS.length);
  const lines = ['SỔ KỸ NĂNG CỦA TÔI', 'Những cách đã giúp tôi, ghi lại từ app Sen.', ''];
  if (!top.length) lines.push('(Chưa đánh dấu bài tập nào.)');
  top.forEach(({ skill, count }) => {
    lines.push(`${skill.name} — đã làm ${count} lần`);
    lines.push(`Dùng khi: ${skill.goodFor.toLowerCase()}`);
    skill.steps.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
    lines.push('');
  });
  lines.push('Khi cần người thật: 111 (24/7) · 096 306 1414 (Ngày Mai, 8:00–20:00) · 115');
  return lines.join('\n');
}

function joinVi(a) {
  if (a.length < 2) return a[0] || '';
  return a.slice(0, -1).join(', ') + ' và ' + a[a.length - 1];
}

function pickSkill(E, T, m, sleep) {
  if (E.includes('Lo âu') || E.includes('Áp lực')) return 'box-breath';
  if (E.includes('Tức giận')) return 'grounding';
  if (E.includes('Cô đơn')) return 'self-kind';
  if (E.includes('Buồn')) return 'self-kind';
  if (m >= 4) return 'three-good';
  if (sleep < 6 || T.includes('Giấc ngủ')) return 'wind-down';
  return 'box-breath';
}

/**
 * Phân tích một lần check-in.
 * checkin: { mood, emotions[], triggers[], sleep, journal }
 * state: toàn bộ dữ liệu (đã bao gồm hoặc chưa bao gồm lần check-in này)
 */
export function analyze(checkin, state, now = new Date()) {
  const { mood: m, emotions: E = [], triggers: T = [], sleep = 7, journal = '' } = checkin;
  if (detectRisk(journal)) return { type: 'crisis' };

  const opening = m <= 2 ? 'Hôm nay có vẻ nặng với bạn.'
    : m === 3 ? 'Hôm nay của bạn có vẻ lưng chừng.'
    : 'Thật vui khi hôm nay nhẹ hơn một chút.';

  const topics = T.filter((x) => x !== 'Giấc ngủ').map((x) => x.toLowerCase());
  const parts = [];
  if (E.length) parts.push(`Bạn đang thấy ${joinVi(E.map((x) => x.toLowerCase()))}${topics.length ? ', nhất là chuyện ' + joinVi(topics) : ''}.`);
  else if (topics.length) parts.push(`Chuyện ${joinVi(topics)} đang chiếm nhiều chỗ trong đầu bạn.`);
  if (sleep < 6) parts.push(`Chỉ ngủ ${formatHours(sleep)} cũng làm mọi cảm xúc nặng hơn thường lệ.`);
  const exam = /(^|\s)thi(\s|$|[.,!?])|kiểm tra|deadline|bài tập lớn/i.test(journal) || T.includes('Học tập');
  if (m <= 3) {
    parts.push(E.includes('Lo âu') && exam
      ? 'Lo lắng trước kỳ thi là phản ứng rất thường gặp. Nó không có nghĩa là bạn yếu đuối.'
      : 'Những cảm xúc này đều có lý do, và bạn không cần vội sửa chúng.');
  } else {
    parts.push('Hãy để ý điều gì đã giúp hôm nay tốt hơn.');
  }

  const keep = [];
  if (T.includes('Học tập')) keep.push('Chia nhỏ việc ôn: chọn 1 phần, học 25 phút rồi nghỉ 5 phút. Xong một vòng là đủ cho tối nay.');
  if (sleep < 6 || T.includes('Giấc ngủ')) keep.push('Đêm nay: đặt giờ đi ngủ cố định và để điện thoại ngoài tầm tay.');
  if (T.includes('Gia đình')) keep.push('Viết ra một điều bạn muốn gia đình hiểu. Chưa cần nói ngay.');
  if (T.includes('Bạn bè') || T.includes('Tình cảm')) keep.push('Trước khi trả lời một tin nhắn khó, đợi 10 phút rồi đọc lại.');
  if (T.includes('Tiền bạc')) keep.push('Ghi 3 khoản chi lớn nhất tuần này. Nhìn rõ con số thường bớt đáng sợ.');
  if (T.includes('Sức khỏe')) keep.push('Uống một cốc nước và đi bộ 10 phút ngoài trời.');
  if (!keep.length) keep.push(m >= 4 ? 'Ghi lại điều đã giúp hôm nay tốt hơn, để dùng lại khi cần.' : 'Chọn một việc nhỏ nhất làm được trong 5 phút tới, và chỉ làm việc đó.');

  const human = E.includes('Cô đơn')
    ? 'Cô đơn dịu đi khi có người nghe. Thử nhắn một người: “Tối nay rảnh nói chuyện 10 phút không?”'
    : m <= 3 ? 'Có ai bạn tin để kể chuyện này không? Một tin nhắn ngắn cũng đủ.'
    : 'Chia sẻ niềm vui hôm nay với một người thân cũng là một cách giữ nó lâu hơn.';

  // Từ giai đoạn Nụ, Sen hỏi người dùng tự làm được gì trước khi đưa gợi ý.
  const ownSkills = topSkills(state, 3).map((x) => x.skill);
  const selfFirst = stageFor(state, now).index >= 2 && ownSkills.length > 0;

  return {
    type: 'normal',
    selfFirst,
    ownSkills,
    opening,
    body: parts.join(' '),
    why: [
      ['Tâm trạng', `${m}/5 (${moodLabel(m)})`],
      ['Cảm xúc', E.join(', ') || 'không chọn'],
      ['Chủ đề', T.join(', ') || 'không chọn'],
      ['Giấc ngủ', formatHours(sleep)],
      ['Nhật ký', journal.trim() ? 'có, chỉ phân tích trên máy' : 'không có'],
    ],
    skill: skillById(pickSkill(E, T, m, sleep)),
    keep: keep.slice(0, 2),
    human,
    refer: referral(state, now),
  };
}

export function exportJson(state) {
  return JSON.stringify({ app: 'Sen', exportedAt: new Date().toISOString(), ...state }, null, 2);
}
