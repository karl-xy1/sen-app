// Màn Chào mừng, Check-in (Hôm nay) và Kết quả.
import { MOODS, EMOTIONS, TRIGGERS, HOTLINES } from './content.js';
import { analyze, detectRisk, newId, who5Due, dailyMoods, moodLabel, formatHours, heavyUse, lonelinessHint } from './engine.js';
import { esc, GLYPH, ICON, fmtDay, fmtTime, fmtStamp, toast, confirmDialog, moodChart, breathHtml, mountBreath } from './ui.js';

/* ---------------- Chào mừng ---------------- */
export function welcome(app) {
  return {
    title: 'Chào bạn',
    html: `
      <div style="width:56px;height:56px;color:var(--lotus)">${GLYPH.bloom}</div>
      <h1 class="title">Chào bạn.<br>Ở đây không ai vội.</h1>
      <p class="lead muted">Sen giúp bạn gọi tên cảm xúc, thử những bài tập nhỏ và dần tự đứng vững, kể cả khi không cần đến Sen nữa.</p>
      <ul class="promise">
        <li>${ICON.ai}<div><b>Sen là AI, không phải nhà trị liệu</b><span>Sen có thể sai và không chẩn đoán bệnh. Gợi ý được chọn từ thư viện bài tập có sẵn.</span></div></li>
        <li>${ICON.data}<div><b>Nhật ký là của bạn</b><span>Chỉ lưu trong trình duyệt trên máy này. Sen không có máy chủ lưu nhật ký, không dùng dữ liệu để quảng cáo.</span></div></li>
        <li>${ICON.people}<div><b>Khi bạn gặp nguy hiểm</b><span>Sen dừng gợi ý và đưa bạn tới đường dây nóng có người thật.</span></div></li>
      </ul>
      <label class="consent" for="consent"><input type="checkbox" id="consent"><span>Mình hiểu Sen không thay thế bác sĩ hay chuyên gia tâm lý, và đồng ý lưu check-in trên máy này.</span></label>
      <button class="btn block" id="start" disabled>Bắt đầu</button>
      <p class="small muted" style="text-align:center">Cần giúp ngay? <a href="#/help">Xem đường dây nóng</a> · <a href="../">Tìm hiểu về Sen</a></p>`,
    mount(root) {
      const cb = root.querySelector('#consent'), btn = root.querySelector('#start');
      cb.addEventListener('change', () => { btn.disabled = !cb.checked; });
      btn.addEventListener('click', () => {
        const now = new Date().toISOString();
        app.update((s) => ({ ...s, consentAt: now, startedAt: s.entries.length ? s.startedAt : now }));
        app.go('#/today');
      });
    },
  };
}

/* ---------------- Hôm nay / Check-in ---------------- */
function greeting(d) {
  const h = d.getHours();
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
}

function checkinForm() {
  return `
    <form id="checkin" class="view" style="padding:0;gap:26px" novalidate>
      <fieldset style="border:0;margin:0;padding:0">
        <legend class="field-label" style="width:100%">Tâm trạng lúc này</legend>
        <div class="mood">${MOODS.map((m) => {
          const size = 10 + (m.v - 1) * 6;
          return `<label for="mood-${m.v}"><input type="radio" name="mood" id="mood-${m.v}" value="${m.v}"><span class="dot"><i style="width:${size}px;height:${size}px"></i></span><span>${m.label}</span></label>`;
        }).join('')}</div>
      </fieldset>
      <div><p class="field-label">Cảm xúc gần nhất <small>chọn một hoặc nhiều</small></p>
        <div class="chips" data-group="emotions">${EMOTIONS.map((x) => `<button type="button" aria-pressed="false">${x}</button>`).join('')}</div></div>
      <div><p class="field-label">Điều gì đang ảnh hưởng? <small>không bắt buộc</small></p>
        <div class="chips" data-group="triggers">${TRIGGERS.map((x) => `<button type="button" aria-pressed="false">${x}</button>`).join('')}</div></div>
      <div><p class="field-label"><label for="sleep">Giấc ngủ đêm qua</label><output id="sleep-out" for="sleep" style="color:var(--ink);font-variant-numeric:tabular-nums">7 giờ</output></p>
        <input type="range" id="sleep" min="0" max="12" step="0.5" value="7">
        <div class="scale"><span>0</span><span>6</span><span>12 giờ</span></div></div>
      <div><p class="field-label"><label for="journal">Kể thêm nếu bạn muốn</label><small>không bắt buộc</small></p>
        <textarea id="journal" maxlength="2000" placeholder="Điều gì đang ở trong đầu bạn?"></textarea></div>
      <div class="soft">
        <label class="switch" for="incognito"><span><b>Không lưu lần này</b><small>Sen vẫn gợi ý, rồi quên ngay khi bạn rời trang</small></span><input type="checkbox" id="incognito"></label>
        <p class="lockline">${ICON.lock}Chỉ lưu trên máy này · tự xóa theo cài đặt của bạn</p>
      </div>
      <p class="small muted" id="form-hint" aria-live="polite">Chọn tâm trạng để tiếp tục.</p>
      <button class="btn block" type="submit" id="submit" disabled>Xem gợi ý</button>
    </form>`;
}

export function today(app) {
  const now = new Date();
  const s = app.state;
  const todays = s.entries.filter((e) => new Date(e.at).toDateString() === now.toDateString());
  const last = todays[todays.length - 1];
  const showWho5 = who5Due(s, now) && !app.flags.who5Later;
  const heavy = heavyUse(s, now);
  const lonely = lonelinessHint(s, now);

  const careCard = heavy && !app.flags.heavyLater ? `
    <div class="panel" id="care">
      <b>Tuần này bạn dùng Sen khá nhiều</b>
      <p class="muted small">Có ${heavy.days} ngày bạn ở Sen từ 30 phút trở lên. Sen mừng vì có ích, nhưng một cuộc trò chuyện với người thật thường giúp nhiều hơn một app.</p>
      <div class="row-actions"><a class="btn leaf sm" href="#/skill/one-message">Nhắn cho một người</a><button class="link" type="button" data-later="heavyLater">Để sau</button></div>
    </div>`
    : lonely && !app.flags.lonelyLater ? `
    <div class="panel" id="care">
      <b>Gần đây bạn hay thấy cô đơn</b>
      <p class="muted small">Bạn chọn “Cô đơn” ${lonely.times} lần trong 2 tuần qua. Cảm giác này dịu đi khi có người nghe, dù chỉ là một tin nhắn ngắn.</p>
      <div class="row-actions"><a class="btn leaf sm" href="#/skill/one-message">Thử bài “Một tin nhắn”</a><button class="link" type="button" data-later="lonelyLater">Để sau</button></div>
    </div>` : '';

  const who5Card = showWho5 ? `
    <div class="panel">
      <b>Đã khoảng 2 tuần rồi</b>
      <p class="muted small">Dành 1 phút trả lời 5 câu WHO-5 để thấy bạn thay đổi thế nào qua thời gian.</p>
      <div class="row-actions"><a class="btn leaf sm" href="#/who5">Trả lời 5 câu</a><button class="link" type="button" id="who5-later">Để sau</button></div>
    </div>` : '';

  const doneCard = last ? `
    <div class="panel">
      <span class="eyebrow">Hôm nay</span>
      <p>Bạn đã check-in lúc <b>${fmtTime(new Date(last.at))}</b> · ${esc(moodLabel(last.mood))}</p>
      <div class="row-actions"><a class="btn ghost sm" href="#/result/${last.id}">Xem lại gợi ý</a><button class="link" type="button" id="again">Check-in thêm</button></div>
    </div>` : '';

  return {
    title: 'Hôm nay',
    html: `
      <div><span class="eyebrow">${fmtDay(now)}</span>
        <h1 class="title" style="margin-top:6px">${last ? greeting(now) + '.' : 'Lúc này bạn thấy thế nào?'}</h1></div>
      ${careCard}
      ${who5Card}
      ${doneCard}
      <div id="form-wrap" ${last ? 'hidden' : ''}>${checkinForm()}</div>`,
    mount(root) {
      const later = root.querySelector('#who5-later');
      if (later) later.onclick = () => { app.flags.who5Later = true; later.closest('.panel').remove(); };
      root.querySelectorAll('[data-later]').forEach((b) => {
        b.onclick = () => { app.flags[b.dataset.later] = true; app.go('#/today'); };
      });
      const again = root.querySelector('#again');
      if (again) again.onclick = () => { root.querySelector('#form-wrap').hidden = false; root.querySelector('#mood-3').focus(); };

      const form = root.querySelector('#checkin');
      const submit = root.querySelector('#submit');
      const hint = root.querySelector('#form-hint');
      form.addEventListener('change', (e) => {
        if (e.target.name === 'mood') { submit.disabled = false; hint.textContent = ''; }
      });
      root.querySelectorAll('.chips button').forEach((b) => b.addEventListener('click', () => {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
      }));
      const sleep = root.querySelector('#sleep');
      sleep.addEventListener('input', () => { root.querySelector('#sleep-out').textContent = formatHours(sleep.value); });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const moodEl = form.querySelector('input[name=mood]:checked');
        if (!moodEl) { hint.textContent = 'Chọn tâm trạng để tiếp tục.'; return; }
        const pick = (g) => [...root.querySelectorAll(`[data-group=${g}] button[aria-pressed=true]`)].map((b) => b.textContent);
        const journal = root.querySelector('#journal').value.trim();
        const entry = {
          id: newId(), at: new Date().toISOString(), mood: +moodEl.value,
          emotions: pick('emotions'), triggers: pick('triggers'), sleep: +sleep.value, journal, risk: detectRisk(journal),
        };
        if (root.querySelector('#incognito').checked) {
          app.temp = entry;
          app.go('#/result/temp');
        } else {
          app.update((s) => ({ ...s, entries: [...s.entries, entry] }));
          app.go('#/result/' + entry.id);
        }
      });
    },
  };
}

/* ---------------- Kết quả ---------------- */
function crisisHtml() {
  return `
    <span class="eyebrow" style="color:var(--crisis)">Chế độ an toàn</span>
    <h1 class="title">Cảm ơn bạn đã nói ra. Bạn không một mình.</h1>
    <p class="lead">Những gì bạn viết cho thấy lúc này bạn có thể không an toàn. Một người thật sẽ giúp bạn tốt hơn Sen.</p>
    <div class="section">
      ${HOTLINES.map((h, i) => `<a class="callbtn ${i === 0 ? 'first' : ''}" href="tel:${h.tel}"><b>${h.number}</b><span>${h.name} · ${h.hours}</span><i>Gọi</i></a>`).join('')}
      <a class="btn ghost block" href="sms:">Nhắn cho người mình tin tưởng</a>
    </div>
    <p>Nếu được, hãy ở gần một người khác và cất những thứ có thể làm bạn đau ra xa.</p>
    <p class="soft small">Sen đã tạm dừng mọi gợi ý tự động để không nói sai điều gì lúc này. Khi bạn sẵn sàng, Sen vẫn ở đây.</p>
    <a class="link" href="#/today">Về trang Hôm nay</a>`;
}

export function result(app, id) {
  const temp = id === 'temp';
  const entry = temp ? app.temp : app.state.entries.find((e) => e.id === id);
  if (!entry) {
    return {
      title: 'Không tìm thấy',
      html: `<h1 class="title-sm">Không tìm thấy lần check-in này</h1>
        <p class="muted">Có thể nó đã bị xóa, tự xóa theo cài đặt, hoặc là lần “không lưu” đã kết thúc.</p>
        <a class="btn ghost" href="#/today">Về trang Hôm nay</a>`,
    };
  }
  const at = new Date(entry.at);
  const hist = { ...app.state, entries: temp ? [...app.state.entries, entry] : app.state.entries.filter((e) => e.at <= entry.at) };
  const r = analyze(entry, hist, at);
  if (r.type === 'crisis') return { title: 'Hỗ trợ ngay', html: crisisHtml() };

  const sk = r.skill;
  const week = dailyMoods(hist.entries, at, 7);
  const referHtml = r.refer ? `
    <div class="note-warn">
      <p><b>${r.refer.reason === 'mood' ? `Tâm trạng thấp ${r.refer.lowDays}/7 ngày qua.` : `Điểm WHO-5 gần nhất là ${r.refer.score}/100.`}</b>
      Nói chuyện với chuyên gia tâm lý có thể giúp. Đây không phải chẩn đoán, chỉ là một gợi ý.</p>
      <a class="btn ghost sm" href="#/help" style="align-self:flex-start">Xem nơi hỗ trợ miễn phí</a>
    </div>` : '';

  return {
    title: 'Gợi ý cho bạn',
    html: `
      <div><span class="eyebrow">${fmtStamp(entry.at)}${temp ? ' · không lưu' : ''}</span>
        <h1 class="title-sm" style="margin-top:6px">Sen nghe thấy bạn</h1></div>
      <p class="reflect">${esc(r.opening)} ${esc(r.body)}</p>
      <details class="why">
        <summary>Vì sao Sen nói vậy?</summary>
        <dl>${r.why.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <p>Bài tập được chọn theo quy tắc từ thư viện có sẵn của Sen. Sen không dùng dữ liệu nào khác và không gửi dữ liệu đi đâu.</p>
      </details>
      ${r.selfFirst ? `
      <section class="panel" id="self-first">
        <span class="eyebrow">Trước khi Sen gợi ý</span>
        <h2 class="title-sm" style="font-size:20px">Lần trước điều gì đã giúp bạn?</h2>
        <p class="muted small">Bạn đã có những công cụ này trong sổ kỹ năng. Thử tự chọn một cái trước nhé.</p>
        <ul class="list">${r.ownSkills.map((k) => `<li><a href="#/skill/${k.id}"><span><b>${k.name}</b><span>${k.goodFor}</span></span><span class="meta">${k.minutes} phút</span></a></li>`).join('')}</ul>
        <button class="btn ghost sm" type="button" id="show-suggest" style="align-self:flex-start">Xem gợi ý của Sen</button>
      </section>` : ''}
      <div id="suggest" style="display:flex;flex-direction:column;gap:22px" ${r.selfFirst ? 'hidden' : ''}>
      <section class="exercise" aria-labelledby="ex-title">
        <span class="eyebrow" style="color:var(--leaf)">Thử ngay · ${sk.minutes} phút</span>
        <h2 id="ex-title" class="title-sm" style="font-size:20px">${sk.name}</h2>
        <p class="muted small">${sk.why}</p>
        ${sk.kind === 'breath' ? breathHtml() : `<ol class="steps">${sk.steps.map((x) => `<li>${x}</li>`).join('')}</ol>`}
        <div class="row-actions"><button class="btn leaf sm" type="button" id="done">Mình làm xong rồi</button><button class="link" type="button" id="later">Để sau cũng được</button></div>
      </section>
      <section class="section"><h2 class="title-sm" style="font-size:18px">Kỹ năng mang theo</h2>
        <ul class="keep">${r.keep.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></section>
      <section class="section"><h2 class="title-sm" style="font-size:18px">Kết nối người thật</h2>
        <p>${esc(r.human)}</p>
        <a class="btn ghost sm" href="sms:" style="align-self:flex-start">Soạn tin nhắn</a></section>
      </div>
      <section class="section chart"><h2 class="title-sm" style="font-size:18px">7 ngày qua</h2><div class="chart-slot" id="mood7"></div></section>
      ${referHtml}
      <div class="fine"><span>Sen là AI và có thể sai. Đây không phải chẩn đoán y khoa.</span>
        ${temp ? '<span>Không lưu</span>' : '<button class="link" style="color:var(--crisis)" type="button" id="del">Xóa mục này</button>'}</div>`,
    mount(root) {
      const stopBreath = mountBreath(root);
      const slot = root.querySelector('#mood7');
      slot.innerHTML = moodChart(week, { height: 150, width: slot.clientWidth });
      const show = root.querySelector('#show-suggest');
      if (show) show.onclick = () => {
        root.querySelector('#suggest').hidden = false;
        show.remove();
        root.querySelector('#ex-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      root.querySelector('#done').onclick = (e) => {
        app.update((s) => ({ ...s, skillsUsed: { ...s.skillsUsed, [sk.id]: (s.skillsUsed[sk.id] || 0) + 1 } }));
        e.currentTarget.disabled = true;
        toast('Đã ghi vào sổ kỹ năng của bạn.');
      };
      root.querySelector('#later').onclick = () => toast('Không sao. Bài tập vẫn ở mục Kỹ năng khi bạn cần.');
      const del = root.querySelector('#del');
      if (del) del.onclick = async () => {
        const ok = await confirmDialog({ title: 'Xóa lần check-in này?', body: 'Mục này sẽ bị xóa khỏi máy và không khôi phục được.', ok: 'Xóa', danger: true });
        if (!ok) return;
        app.update((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== entry.id) }));
        toast('Đã xóa lần check-in này.');
        app.go('#/today');
      };
      return stopBreath;
    },
  };
}
