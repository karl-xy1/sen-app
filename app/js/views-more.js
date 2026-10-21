// Màn Hành trình, Kỹ năng, WHO-5, Hỗ trợ, Cài đặt.
import { SKILLS, STAGES, WHO5, HOTLINES, RETENTION_CHOICES } from './content.js';
import { dailyMoods, stageFor, latestWho5, who5Score, referral, skillById, moodLabel, exportJson, pruneByRetention, skillsSummary, weekUsage } from './engine.js';
import { esc, GLYPH, ICON, fmtStamp, toast, confirmDialog, moodChart, breathHtml, mountBreath, downloadText } from './ui.js';

const STAGE_GLYPH = { seed: 'seed', leaf: 'leaf', bud: 'bud', bloom: 'bloom' };
const STAGE_COLOR = { seed: 'var(--ink-3)', leaf: 'var(--leaf)', bud: 'var(--lotus)', bloom: 'var(--lotus)' };

/* ---------------- Hành trình ---------------- */
export function journey(app) {
  const now = new Date();
  const s = app.state;
  const st = stageFor(s, now);
  const w = latestWho5(s);
  const prev = s.who5.length > 1 ? s.who5[s.who5.length - 2] : null;
  const refer = referral(s, now);
  const used = Object.entries(s.skillsUsed).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const entries = [...s.entries].sort((a, b) => b.at.localeCompare(a.at));

  const who5Html = w ? `
    <div class="stat"><b>${w.score}</b><span class="muted">/100 · ${fmtStamp(w.at)}</span></div>
    ${prev ? `<p class="small muted">${w.score - prev.score >= 0 ? 'Tăng' : 'Giảm'} ${Math.abs(w.score - prev.score)} điểm so với lần trước. Thay đổi từ 10 điểm trở lên được xem là đáng kể.</p>` : '<p class="small muted">Đây là mốc đầu tiên. Lần sau bạn sẽ thấy mình thay đổi thế nào.</p>'}`
    : '<p class="muted small">Chưa có. Sau vài lần check-in, Sen sẽ mời bạn trả lời 5 câu này mỗi 2 tuần.</p>';

  return {
    title: 'Hành trình',
    html: `
      <div><span class="eyebrow">Ngày thứ ${st.day + 1}</span><h1 class="title" style="margin-top:6px">Hành trình</h1></div>
      <section class="panel" aria-label="Giai đoạn">
        <div class="stages">${STAGES.map((g, i) => `
          <div class="stage ${i === st.index ? 'now' : ''}"><span class="glyph" style="color:${STAGE_COLOR[g.id]};${i > st.index ? 'opacity:.45' : ''}">${GLYPH[STAGE_GLYPH[g.id]]}</span>${g.name}</div>`).join('')}</div>
        <p><b>${st.name} · ${st.title}.</b> ${st.sen}</p>
        ${st.next ? `<p class="small muted">Khoảng ${st.next.fromDay - st.day} ngày nữa tới giai đoạn ${st.next.name}. Không cần vội, đây không phải cuộc đua.</p>` : ''}
      </section>
      ${st.id === 'bloom' ? `
      <section class="panel" style="background:var(--lotus-soft);border-color:transparent">
        <b>Bạn đã tới giai đoạn Hoa</b>
        <p class="small">Hơn 6 tháng qua bạn đã tự gom được những cách giúp mình. Hãy tải sổ kỹ năng về để giữ lại, kể cả khi không dùng Sen nữa. Sen vẫn ở đây khi bạn cần.</p>
        <button class="btn ghost sm" type="button" data-download-skills style="align-self:flex-start">Tải sổ kỹ năng (.txt)</button>
      </section>` : ''}
      <section class="section chart"><div class="section-head"><h2>Tâm trạng 14 ngày</h2><span class="small muted">thang 1–5</span></div>
        ${s.entries.length ? '<div class="chart-slot" id="mood14"></div>' : '<div class="empty">Chưa có check-in nào.<a class="btn sm" href="#/today">Check-in đầu tiên</a></div>'}
      </section>
      ${refer ? `<div class="note-warn"><p><b>Có vẻ thời gian gần đây khá nặng với bạn.</b> Nói chuyện với chuyên gia có thể giúp. Đây không phải chẩn đoán.</p><a class="btn ghost sm" href="#/help" style="align-self:flex-start">Xem nơi hỗ trợ</a></div>` : ''}
      <section class="section"><div class="section-head"><h2>Chỉ số WHO-5</h2><a class="link" href="#/who5">Trả lời 5 câu</a></div>${who5Html}</section>
      <section class="section"><div class="section-head"><h2>Sổ kỹ năng</h2>${used.length ? '<button class="link" type="button" data-download-skills>Tải về</button>' : ''}</div>
        ${used.length ? `<ul class="list">${used.map(([id, n]) => { const k = skillById(id); return k ? `<li><a href="#/skill/${id}"><span><b>${k.name}</b></span><span class="meta">${n} lần</span></a></li>` : ''; }).join('')}</ul>`
          : '<p class="muted small">Khi bạn làm xong một bài tập, nó sẽ được ghi ở đây, để bạn nhớ mình đã có những công cụ nào.</p>'}
      </section>
      <section class="section"><div class="section-head"><h2>Các lần check-in</h2><span class="small muted">${entries.length}</span></div>
        ${entries.length ? `<ul class="entries">${entries.map((e) => {
          const d = new Date(e.at);
          return `<li><a href="#/result/${e.id}"><span class="d"><b>${d.getDate()}/${d.getMonth() + 1}</b>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</span>
            <span class="t"><b>${esc(moodLabel(e.mood))}${e.emotions.length ? ' · ' + esc(e.emotions.join(', ')) : ''}</b><span>${esc(e.journal || 'Không có ghi chú')}</span></span>
            <span class="mood-dot" style="opacity:${0.25 + e.mood * 0.15}" aria-hidden="true"></span></a></li>`;
        }).join('')}</ul>` : '<p class="muted small">Mỗi lần check-in sẽ hiện ở đây. Bạn có thể xóa từng mục.</p>'}
      </section>`,
    mount(root) {
      const slot = root.querySelector('#mood14');
      if (slot) slot.innerHTML = moodChart(dailyMoods(s.entries, now, 14), { width: slot.clientWidth });
      root.querySelectorAll('[data-download-skills]').forEach((b) => {
        b.onclick = () => { downloadText('so-ky-nang-sen.txt', skillsSummary(app.state), 'text/plain'); toast('Đã tải sổ kỹ năng.'); };
      });
    },
  };
}

/* ---------------- Kỹ năng ---------------- */
export function skills(app) {
  return {
    title: 'Kỹ năng',
    html: `
      <div><h1 class="title">Kỹ năng</h1><p class="lead muted" style="margin-top:8px">Những bài tập nhỏ, dùng được cả khi không mở Sen. Mục tiêu là bạn nhớ chúng thay vì nhớ app.</p></div>
      <ul class="list">${SKILLS.map((k) => `
        <li><a href="#/skill/${k.id}"><span><b>${k.name}</b><span>${k.goodFor}</span></span><span class="meta">${k.minutes} phút${app.state.skillsUsed[k.id] ? ` · đã làm ${app.state.skillsUsed[k.id]}` : ''}</span></a></li>`).join('')}
      </ul>`,
  };
}

export function skill(app, id) {
  const k = skillById(id);
  if (!k) return { title: 'Kỹ năng', html: '<h1 class="title-sm">Không tìm thấy bài tập</h1><a class="link" href="#/skills">Về danh sách kỹ năng</a>' };
  return {
    title: k.name,
    html: `
      <a class="link" href="#/skills">← Kỹ năng</a>
      <div><span class="eyebrow">${k.minutes} phút · ${k.goodFor}</span><h1 class="title" style="margin-top:6px">${k.name}</h1></div>
      <p class="lead">${k.why}</p>
      <section class="exercise">
        ${k.kind === 'breath' ? breathHtml() : ''}
        <ol class="steps">${k.steps.map((x) => `<li>${x}</li>`).join('')}</ol>
        <div class="row-actions"><button class="btn leaf sm" type="button" id="done">Mình vừa làm xong</button></div>
      </section>`,
    mount(root) {
      const stop = mountBreath(root);
      root.querySelector('#done').onclick = (e) => {
        app.update((s) => ({ ...s, skillsUsed: { ...s.skillsUsed, [k.id]: (s.skillsUsed[k.id] || 0) + 1 } }));
        e.currentTarget.disabled = true;
        toast('Đã ghi vào sổ kỹ năng.');
      };
      return stop;
    },
  };
}

/* ---------------- WHO-5 ---------------- */
export function who5(app) {
  return {
    title: 'WHO-5',
    html: `
      <a class="link" href="#/journey">← Hành trình</a>
      <div><span class="eyebrow">Chỉ số hạnh phúc WHO-5 · 1 phút</span><h1 class="title" style="margin-top:6px">5 câu hỏi</h1>
        <p class="lead muted" style="margin-top:8px">${WHO5.intro}</p></div>
      <form id="who5">
        ${WHO5.items.map((q, i) => `
          <div class="q"><fieldset><legend>${i + 1}. ${q}</legend>
            <div class="opts">${WHO5.options.map((o) => `<label><input type="radio" name="q${i}" value="${o.v}"><span>${o.label}</span></label>`).join('')}</div>
          </fieldset></div>`).join('')}
        <button class="btn block" type="submit" id="w-submit" disabled style="margin-top:12px">Xem điểm</button>
      </form>
      <div id="w-result" hidden></div>
      <p class="small muted">WHO-5 đo cảm nhận hạnh phúc, không phải công cụ chẩn đoán. Bản dịch tiếng Việt do dự án Sen thực hiện.</p>`,
    mount(root) {
      const form = root.querySelector('#who5');
      const btn = root.querySelector('#w-submit');
      form.addEventListener('change', () => { btn.disabled = form.querySelectorAll('input:checked').length < 5; });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const answers = WHO5.items.map((_, i) => +form.querySelector(`input[name=q${i}]:checked`).value);
        const score = who5Score(answers);
        const prev = latestWho5(app.state);
        app.update((s) => ({ ...s, who5: [...s.who5, { at: new Date().toISOString(), answers, score }] }));
        const low = score <= WHO5.threshold;
        const out = root.querySelector('#w-result');
        out.innerHTML = `
          <section class="panel" tabindex="-1">
            <span class="eyebrow">Điểm của bạn</span>
            <div class="stat"><b>${score}</b><span class="muted">/100</span></div>
            ${prev ? `<p class="small muted">${score - prev.score >= 0 ? 'Tăng' : 'Giảm'} ${Math.abs(score - prev.score)} điểm so với lần trước.</p>` : ''}
            ${low
              ? `<div class="note-warn"><p><b>2 tuần qua có vẻ khá nặng với bạn.</b> Điểm từ 50 trở xuống là lúc nên nói chuyện với chuyên gia tâm lý. Đây không phải chẩn đoán.</p><a class="btn ghost sm" href="#/help" style="align-self:flex-start">Xem nơi hỗ trợ miễn phí</a></div>`
              : '<p>Mức cảm nhận hạnh phúc của bạn đang ổn. Hãy để ý điều gì đang giúp bạn giữ được như vậy.</p>'}
            <a class="btn ghost sm" href="#/journey" style="align-self:flex-start">Về Hành trình</a>
          </section>`;
        form.hidden = true; out.hidden = false;
        out.firstElementChild.focus();
        window.scrollTo(0, 0);
      });
    },
  };
}

/* ---------------- Hỗ trợ ---------------- */
export function help(app) {
  return {
    title: 'Hỗ trợ',
    html: `
      ${app.state.consentAt ? '' : '<a class="link" href="#/welcome">← Quay lại</a>'}
      <div><span class="eyebrow" style="color:var(--crisis)">Hỗ trợ khẩn cấp</span><h1 class="title" style="margin-top:6px">Cần người thật lắng nghe</h1></div>
      <p class="lead">Nếu bạn đang nghĩ tới việc làm hại bản thân, hoặc thấy không an toàn, hãy gọi ngay. Các đường dây dưới đây miễn phí.</p>
      <div class="section">${HOTLINES.map((h, i) => `<a class="callbtn ${i === 0 ? 'first' : ''}" href="tel:${h.tel}"><b>${h.number}</b><span>${h.name} · ${h.hours}</span><i>Gọi</i></a>`).join('')}</div>
      <section class="section"><h2 class="title-sm" style="font-size:19px">Nếu bạn lo cho một người bạn</h2>
        <ul class="keep">
          <li>Lắng nghe mà không phán xét, không vội khuyên.</li>
          <li>Có thể hỏi thẳng: “Bạn có đang nghĩ tới việc làm hại bản thân không?” Hỏi như vậy không làm tăng nguy cơ.</li>
          <li>Đừng giữ bí mật một mình. Báo cho một người lớn bạn tin.</li>
          <li>Ngồi cạnh bạn ấy khi gọi đường dây nóng.</li>
        </ul></section>
      <section class="section"><h2 class="title-sm" style="font-size:19px">Hỗ trợ lâu dài</h2>
        <ul class="keep">
          <li>Phòng tư vấn tâm lý của trường, thường miễn phí cho học sinh, sinh viên.</li>
          <li>Khoa tâm lý hoặc sức khỏe tâm thần tại bệnh viện gần bạn.</li>
        </ul></section>
      <p class="small muted">Sen là AI, không thay thế chuyên gia. Trong bản web, bấm số sẽ mở ứng dụng gọi điện nếu thiết bị hỗ trợ.</p>`,
  };
}

/* ---------------- Cài đặt ---------------- */
export function settings(app) {
  const s = app.state;
  return {
    title: 'Cài đặt',
    html: `
      <h1 class="title">Cài đặt và quyền riêng tư</h1>
      <section class="panel">
        <p class="lockline" style="font-size:14px;color:var(--ink-2)">${ICON.lock}Dữ liệu chỉ nằm trong trình duyệt trên máy này.</p>
        <p class="small muted">Đang lưu ${s.entries.length} lần check-in và ${s.who5.length} lần WHO-5. Sen không có máy chủ lưu nhật ký, không gửi dữ liệu đi đâu.</p>
      </section>
      <section class="section">
        <h2 class="title-sm" style="font-size:18px">Thời gian bạn dùng Sen</h2>
        <p><b style="font-variant-numeric:tabular-nums">${weekUsage(s)} phút</b> trong 7 ngày qua.</p>
        <p class="small muted">Sen muốn bạn cần app ít dần. Nếu bạn dùng từ 30 phút mỗi ngày trong nhiều ngày, Sen sẽ nhắc bạn tìm tới người thật.</p>
      </section>
      <section class="section">
        <div class="section-head"><h2><label for="retention">Tự xóa dữ liệu cũ sau</label></h2>
          <select id="retention">${RETENTION_CHOICES.map((c) => `<option value="${c.v}" ${c.v === s.settings.retentionDays ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div>
        <p class="small muted">Nhật ký cảm xúc là dữ liệu nhạy cảm. Giữ ít hơn nghĩa là rủi ro ít hơn nếu ai đó mượn máy bạn.</p>
      </section>
      <section class="section">
        <h2 class="title-sm" style="font-size:18px">Nhắc nhở</h2>
        <p class="small muted">Bản web không gửi thông báo. App iOS có nhắc nhở tối đa 1 lần mỗi ngày, vào giờ bạn chọn, và tắt được hoàn toàn.</p>
      </section>
      <section class="section">
        <h2 class="title-sm" style="font-size:18px">Dữ liệu của bạn</h2>
        <div class="row-actions">
          <button class="btn ghost sm" type="button" id="export">Tải dữ liệu về (JSON)</button>
          <button class="btn ghost sm" type="button" data-download-skills>Tải sổ kỹ năng (.txt)</button>
          <button class="btn danger sm" type="button" id="wipe">Xóa toàn bộ và rút lại đồng ý</button>
        </div>
      </section>
      <section class="section">
        <h2 class="title-sm" style="font-size:18px">Về Sen</h2>
        <p class="small muted">Sen là AI, không phải nhà trị liệu, và có thể sai. Gợi ý được chọn theo quy tắc từ thư viện bài tập có sẵn, chạy hoàn toàn trên máy bạn.</p>
        <p class="small"><a href="../">Trang giới thiệu</a> · <a href="../privacy.html">Chính sách quyền riêng tư</a> · Phiên bản 1.0.0</p>
      </section>`,
    mount(root) {
      root.querySelector('#retention').onchange = (e) => {
        const v = +e.target.value;
        app.update((st) => pruneByRetention({ ...st, settings: { ...st.settings, retentionDays: v } }));
        toast(v ? `Dữ liệu cũ hơn ${RETENTION_CHOICES.find((c) => c.v === v).label} sẽ tự xóa.` : 'Dữ liệu sẽ không tự xóa.');
      };
      root.querySelector('[data-download-skills]').onclick = () => {
        downloadText('so-ky-nang-sen.txt', skillsSummary(app.state), 'text/plain');
        toast('Đã tải sổ kỹ năng.');
      };
      root.querySelector('#export').onclick = () => {
        const d = new Date();
        downloadText(`sen-du-lieu-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`, exportJson(app.state));
        toast('Đã tải file dữ liệu. Hãy cất nó ở nơi an toàn.');
      };
      root.querySelector('#wipe').onclick = async () => {
        const ok = await confirmDialog({ title: 'Xóa toàn bộ dữ liệu?', body: 'Mọi check-in, điểm WHO-5 và sổ kỹ năng sẽ bị xóa khỏi máy này. Không khôi phục được.', ok: 'Xóa tất cả', danger: true });
        if (!ok) return;
        app.reset();
        toast('Đã xóa toàn bộ dữ liệu.');
        app.go('#/welcome');
      };
    },
  };
}
