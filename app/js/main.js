import { load, save, clear } from './store.js';
import { SESSION_NUDGE_MINUTES } from './content.js';
import { addUsage } from './engine.js';
import { toast } from './ui.js';
import * as core from './views-core.js';
import * as more from './views-more.js';

const app = {
  state: load(),
  temp: null, // lần check-in "không lưu", chỉ giữ trong bộ nhớ
  flags: {},
  update(fn) {
    this.state = fn(this.state);
    if (!save(this.state)) toast('Trình duyệt đang chặn lưu trữ. Dữ liệu sẽ mất khi đóng tab.', 4000);
  },
  reset() { this.state = clear(); this.temp = null; },
  go(hash) {
    if (location.hash === hash) render(); else location.hash = hash;
  },
};

const routes = {
  welcome: core.welcome,
  today: core.today,
  result: core.result,
  journey: more.journey,
  skills: more.skills,
  skill: more.skill,
  who5: more.who5,
  help: more.help,
  settings: more.settings,
};
const NAV_OF = { result: 'today', skill: 'skills', who5: 'journey' };

let cleanup = null;
function render() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  let route = routes[name] ? name : 'today';
  if (!app.state.consentAt && route !== 'help') route = 'welcome';
  if (app.state.consentAt && route === 'welcome') route = 'today';

  if (cleanup) { cleanup(); cleanup = null; }
  const view = document.getElementById('view');
  const out = routes[route](app, arg ? decodeURIComponent(arg) : undefined);
  view.innerHTML = out.html;
  document.getElementById('shell').classList.toggle('bare', !app.state.consentAt);
  const nav = NAV_OF[route] || route;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.title = out.title ? `${out.title} · Sen` : 'Sen';
  cleanup = out.mount ? out.mount(view) || null : null;
  if (app.flags.nudge) insertNudge(view);
  window.scrollTo(0, 0);
  const h1 = view.querySelector('h1');
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}

function insertNudge(view) {
  if (app.flags.nudgeDismissed || view.querySelector('.nudge')) return;
  const el = document.createElement('div');
  el.className = 'nudge';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>Bạn đã ở Sen ${SESSION_NUDGE_MINUTES} phút. Nghỉ mắt, uống cốc nước nhé.</span><button class="link" type="button">Ẩn</button>`;
  el.querySelector('button').onclick = () => { app.flags.nudgeDismissed = true; el.remove(); };
  view.prepend(el);
}

// Không thao túng sự chú ý: nhắc nghỉ sau một phiên dài.
setTimeout(() => {
  app.flags.nudge = true;
  if (app.state.consentAt) insertNudge(document.getElementById('view'));
}, SESSION_NUDGE_MINUTES * 60000);

// Ghi thời gian dùng (chỉ khi tab đang hiển thị) để nhận ra dấu hiệu phụ thuộc vào app.
setInterval(() => {
  if (app.state.consentAt && document.visibilityState === 'visible') app.update((s) => addUsage(s, 1));
}, 60000);

addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
