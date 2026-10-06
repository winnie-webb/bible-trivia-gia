import type { Rider, WorldApi } from '../three/moods';
import { h } from '../utils/dom';

/**
 * A speech bubble that floats above a rider's head and follows it.
 * Without WebGL (no riders to point at) it rests in a sensible spot instead.
 */
export function speechBubble(text: string, who: Rider, world: WorldApi) {
  const el = h('div.bubble', { role: 'status', 'aria-live': 'polite' }, [h('span', { text })]);
  let raf = 0;
  const track = () => {
    raf = requestAnimationFrame(track);
    const p = world.getAnchor(who);
    if (p) {
      // keep the whole bubble on screen (its tail points about 30% in from the left)
      const w = (el.firstElementChild as HTMLElement).offsetWidth;
      const x = Math.min(Math.max(p.x, 14 + w * 0.3), innerWidth - 14 - w * 0.7);
      const y = Math.max(p.y, 120);
      el.classList.remove('no-anchor');
      el.style.transform = `translate(${x}px, ${y}px)`;
    } else el.classList.add('no-anchor');
  };
  return {
    el,
    show() {
      cancelAnimationFrame(raf);
      track();
      el.classList.add('is-on');
    },
    hide() {
      el.classList.remove('is-on');
      window.setTimeout(() => !el.classList.contains('is-on') && cancelAnimationFrame(raf), 700);
    },
    dispose() {
      cancelAnimationFrame(raf);
      el.remove();
    },
  };
}
