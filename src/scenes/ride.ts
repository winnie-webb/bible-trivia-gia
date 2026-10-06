import type { RideAppearance } from '../content/ride';
import { h, put } from '../utils/dom';
import { shell } from './text';
import type { SceneFactory } from './types';

/**
 * RIDE MOMENTS — the riders themselves live in the 3D world for the whole
 * journey (three/riders.ts). This scene only adds what belongs to a moment:
 * a close framing, Gia's speech bubble tracking her head, or a few lines.
 */
export const ride: SceneFactory = (beat, ctx) => {
  const a = beat.data as RideAppearance;
  const el = shell('ride');
  const bubble = a.bubble ? h('div.ride-bubble', { 'aria-live': 'polite' }, [h('span', { text: a.bubble })]) : null;
  put(
    el,
    bubble,
    a.kicker ? h('p.kicker.ride-kicker.rv', { style: { '--d': 900 }, text: a.kicker }) : null,
    a.lines?.length ? h('div.ride-lines', {}, a.lines.map((l, i) => h('p.fu-line.rv', { style: { '--d': 2000 + i * 1800 }, text: l }))) : null,
  );

  let raf = 0;
  const track = () => {
    raf = requestAnimationFrame(track);
    const p = ctx.world.getAnchor();
    if (p && bubble) bubble.style.transform = `translate(${p.x}px, ${p.y}px)`;
    else if (bubble) el.classList.add('no-webgl');
  };

  return {
    el,
    enter() {
      if (bubble) {
        ctx.world.wave(5200);
        raf = requestAnimationFrame(track);
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
    },
  };
};
