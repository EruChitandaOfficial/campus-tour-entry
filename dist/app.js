import {Timeline, slideAt, DESTINATION} from './timeline.js';

const root = document.documentElement;
const stage = document.querySelector('#stage');
const images = [...stage.querySelectorAll('img')];
const status = document.querySelector('#connection-status');
const percentage = document.querySelector('#percentage');
const progressbar = document.querySelector('#progress');
const enter = document.querySelector('#enter');
const pause = document.querySelector('#pause');
const note = document.querySelector('#departure-note');
const clock = new Timeline();
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let autoRedirect = new URLSearchParams(location.search).get('preview') !== '1';
let navigating = false;
let completionFrame = null;
let frameId = null;
let ready = false;
let lastValue = -1;
let completePainted = false;

function updateControls() {
  pause.textContent = autoRedirect ? '暂停自动跳转' : '恢复自动跳转';
  note.textContent = autoRedirect
    ? '图片播放完毕，进度达到 100% 后自动前往学校官网'
    : '自动跳转已暂停，可在图片播放完毕后手动前往官网';
}
updateControls();

function paint(p) {
  const value = Math.floor(p * 100);
  if (value !== lastValue) {
    root.style.setProperty('--progress', `${value}%`);
    percentage.textContent = `${value}%`;
    progressbar.setAttribute('aria-valuenow', String(value));
    lastValue = value;
  }
  const slide = slideAt(p, images.length, motion.matches);
  stage.dataset.frame = String(slide.index);
  images.forEach((image, index) => {
    const opacity = index === slide.index ? 1 - slide.mix : index === slide.next ? slide.mix : 0;
    image.style.opacity = String(opacity);
    image.style.transform = motion.matches ? 'none' : `translate(${slide.x}px, ${slide.y}px) rotate(${slide.rotation}deg)`;
  });
  if (p === 1 && !completePainted) {
    status.textContent = '播放完成，准备出发';
    completePainted = true;
  }
}

function navigate() {
  if (!ready || !clock.complete || completionFrame === null || navigating) return;
  navigating = true;
  status.textContent = '正在前往学校官网…';
  location.replace(DESTINATION);
}
function schedule() {
  if (frameId === null && ready && !navigating && !document.hidden) frameId = requestAnimationFrame(frame);
}
function frame(now) {
  frameId = null;
  if (document.hidden) { clock.suspend(); completionFrame = null; return; }
  paint(clock.tick(now));
  if (clock.complete) {
    if (completionFrame === null) {
      completionFrame = now;
      enter.disabled = false;
    } else if (autoRedirect && now - completionFrame >= 150) {
      navigate();
    }
  }
  if (!clock.complete || autoRedirect) schedule();
}

pause.addEventListener('click', () => {
  autoRedirect = !autoRedirect;
  updateControls();
  if (clock.complete) completionFrame = performance.now();
  schedule();
});
enter.addEventListener('click', navigate);
document.addEventListener('visibilitychange', () => {
  clock.suspend();
  completionFrame = null;
  if (document.hidden && frameId !== null) { cancelAnimationFrame(frameId); frameId = null; }
  schedule();
});
window.addEventListener('pagehide', () => { navigating = true; });
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    navigating = false;
    autoRedirect = false;
    clock.suspend();
    completionFrame = null;
    frameId = null;
    updateControls();
    schedule();
  }
});

// All five originals must be decoded before the visible animation clock starts.
Promise.all(images.map(image => image.decode())).then(() => {
  ready = true;
  stage.dataset.ready = 'true';
  status.textContent = '奶蛙正在带路…';
  requestAnimationFrame(() => schedule());
}).catch(() => {
  status.textContent = '图片加载失败，请刷新重试';
  note.textContent = '动画尚未完整播放，已停止自动跳转';
  document.querySelector('#error-fallback').hidden = false;
});
