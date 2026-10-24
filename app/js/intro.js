// Đoạn mở đầu: bay qua đầm sen rồi dừng ở bông sen sáng nhất. Chạy mỗi lần mở app, chạm để bỏ qua.
// Không chạy khi mở thẳng trang Hỗ trợ (người đang cần giúp không phải chờ) hoặc khi máy bật tiết kiệm dữ liệu;
// máy bật giảm chuyển động thì chỉ hiện ảnh tĩnh của bông sen.
(() => {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const video = intro.querySelector('video');
  const word = intro.querySelector('.intro-word');
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    video.pause();
    intro.classList.add('out');
    setTimeout(() => intro.remove(), 450);
  }

  const saveData = navigator.connection && navigator.connection.saveData;
  if (location.hash.startsWith('#/help') || saveData) {
    intro.remove();
    return;
  }

  const shape = innerHeight > innerWidth ? 'doc' : 'ngang';
  intro.addEventListener('click', finish);
  addEventListener('keydown', (e) => {
    if (!done && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) finish();
  });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intro.style.backgroundImage = `url(media/intro-${shape}-cuoi.jpg)`;
    video.remove();
    word.classList.add('on');
    setTimeout(finish, 1600);
    return;
  }

  intro.style.backgroundImage = `url(media/intro-${shape}-dau.jpg)`;
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);
  video.addEventListener('timeupdate', () => {
    if (video.currentTime > 7.4) word.classList.add('on');
  });
  // Mạng chậm hoặc mất mạng thì không bắt người dùng chờ.
  const stall = setTimeout(() => { if (!video.currentTime) finish(); }, 3500);
  video.addEventListener('playing', () => clearTimeout(stall), { once: true });
  video.muted = true;
  video.src = `media/intro-${shape}.mp4`;
  video.play().catch(finish);
})();
