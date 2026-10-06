import type { Mood } from '../content/types';
import { PALETTES, type WorldApi } from './moods';

/**
 * Used when WebGL is unavailable (or the device is very weak):
 * the same mood lighting as CSS gradients, with a soft horizon glow.
 */
export class FallbackWorld implements WorldApi {
  private el: HTMLDivElement;
  constructor(host: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'fallback-world';
    this.el.innerHTML = '<div class="fw-sky"></div><div class="fw-glow"></div><div class="fw-thread"></div>';
    host.appendChild(this.el);
    this.setMood('void');
  }
  setMood(mood: Mood) {
    const p = PALETTES[mood];
    const s = this.el.style;
    s.setProperty('--fw-top', p.top);
    s.setProperty('--fw-bottom', p.bottom);
    s.setProperty('--fw-horizon', p.horizon);
    s.setProperty('--fw-strength', String(p.horizonStrength));
    s.setProperty('--fw-thread', p.thread);
    s.setProperty('--fw-thread-o', String(Math.min(p.threadIntensity, 1)));
  }
  setTarget() {}
  setRiding() {}
  setReveal(v: number) {
    this.el.style.setProperty('--fw-reveal', String(v));
  }
  setFocus(f: number) {
    this.el.style.setProperty('--fw-focus', String(f));
  }
  setReducedMotion() {}
  setIdle() {}
  setFrame() {}
  setRidersVisible() {}
  setDriver() {}
  setObstacle() {}
  react() {}
  wave() {}
  getAnchor() {
    return null;
  }
  getRidersRect() {
    return null;
  }
  dispose() {
    this.el.remove();
  }
}
