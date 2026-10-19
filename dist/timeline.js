// One visible-time clock drives both animation and navigation readiness.
export const DURATION_MS = 4000;
export const DESTINATION = 'https://www.hkust-gz.edu.cn/';

export class Timeline {
  constructor(duration = DURATION_MS) {
    this.duration = duration;
    this.elapsed = 0;
    this.last = null;
  }
  tick(now, active = true) {
    if (active && this.last !== null) {
      // A long frame may reflect a sleeping device: never skip the visible welcome.
      this.elapsed = Math.min(this.duration, this.elapsed + Math.max(0, Math.min(now - this.last, 100)));
    }
    this.last = active ? now : null;
    return this.progress;
  }
  suspend() { this.last = null; }
  get progress() { return this.elapsed / this.duration; }
  get complete() { return this.elapsed >= this.duration; }
}

export function slideAt(progress, count = 5, reducedMotion = false) {
  const p = Math.min(1, Math.max(0, progress));
  const position = p * count;
  const index = Math.min(count - 1, Math.floor(position));
  const local = p === 1 ? 1 : position - index;
  const mix = index < count - 1 && !reducedMotion ? Math.max(0, (local - .78) / .22) : 0;
  const wave = reducedMotion || p === 1 ? 0 : Math.sin(local * Math.PI * 2);
  return {index, next: Math.min(count - 1, index + 1), mix, x: wave * 10, y: wave === 0 ? 0 : -Math.abs(wave) * 6, rotation: wave * 1.5};
}
