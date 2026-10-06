import type { Memory } from '../content/types';
import { mediaElement, type Player } from '../media/media';
import { h, put } from '../utils/dom';
import { shell } from './text';
import type { SceneFactory } from './types';
import { playable, type Playable } from './video';

/**
 * RELATIONSHIP — two distant points joined by a line of light.
 * Calls, screenshots and photos hang along the line at different depths,
 * like windows suspended in the distance between two places.
 */
export const relationshipScene: SceneFactory = (beat, ctx) => {
  const { memory: m, date, showTitle } = beat.data as { memory: Memory; date: string; showTitle: boolean };
  const r = m.relationship ?? {};
  const severed = r.severed;
  const el = shell('rel', severed ? 'is-severed' : '');
  // when severed, everything after the reconnection is delayed by this much
  const later = severed ? 3600 : 0;
  const players: Player[] = [];
  const playables: Playable[] = [];

  // gentle S-curve from her (top-left) to him (bottom-right)
  const path = 'M 14 15 C 40 18, 30 48, 55 52 S 80 72, 86 80';
  const svg = `
    <svg class="rel-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="relg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#c47f78" stop-opacity=".95"/>
          <stop offset=".5" stop-color="#c9a063" stop-opacity=".8"/>
          <stop offset="1" stop-color="#c47f78" stop-opacity=".95"/>
        </linearGradient>
      </defs>
      ${severed ? `<path class="rel-broken" d="${path}" pathLength="1"/>` : ''}
      <path class="rel-line" d="${path}" pathLength="1"/>
      <path class="rel-pulse" d="${path}" pathLength="1"/>
    </svg>`;

  const signal = h('span', { text: severed?.lostLabel ?? '' });
  const media = (m.media ?? []).slice(0, 3);
  const windows = media.map((item, i) => {
    const kind = item.type === 'call' ? 'call' : item.type === 'screenshot' ? 'screen' : 'photo';
    let inner: HTMLElement;
    if (item.type === 'video') {
      const p = playable(item, ctx, el, { focus: 0.6 });
      playables.push(p);
      inner = p.frame;
    } else {
      const res = mediaElement(item, '');
      if (res.player) players.push(res.player);
      inner = res.el;
    }
    return h(`div.rel-win.rw${i}.kind-${kind}.o-${item.orientation}.rv-depth`, { style: { '--d': 1600 + later + i * 500 } }, [
      inner,
      kind === 'call' ? h('span.rel-live', { 'aria-hidden': 'true' }) : null,
    ]);
  });

  put(el, 
    h('div.rel-area', {}, [
    h('div.rel-map', { html: svg }),
    h('div.rel-pin.pin-there.rv', { style: { '--d': 300 } }, [h('span.pin-dot'), h('span.pin-label', { text: r.there ?? '' })]),
    h('div.rel-pin.pin-here.rv', { style: { '--d': 700 } }, [h('span.pin-dot'), h('span.pin-label', { text: r.here ?? '' })]),
    r.distance ? h('p.rel-distance.rv', { style: { '--d': 1300 }, text: r.distance }) : null,
    severed ? h('p.rel-signal', { 'aria-live': 'polite' }, [signal]) : null,
    h('div.rel-windows', {}, windows),
    ]),
    h('div.mem-caption.rel-caption', {}, [
      date ? h('p.mem-date.rv', { style: { '--d': 2600 + later }, text: date }) : null,
      showTitle !== false ? h('h3.mem-title.rv', { style: { '--d': 2900 + later }, text: m.title }) : null,
      m.shortText ? h('p.mem-short.rv', { style: { '--d': 3400 + later }, text: m.shortText }) : null,
    ]),
  );

  let timer = 0;
  return {
    el,
    enter() {
      if (!severed) return;
      if (ctx.seen) {
        el.classList.add('is-reconnected');
        signal.textContent = severed.foundLabel;
        return;
      }
      // the line between you goes dark… then a signal comes back
      ctx.world.setMood('silence');
      ctx.audio.setMood('silence');
      timer = window.setTimeout(() => {
        el.classList.add('is-reconnected');
        signal.textContent = severed.foundLabel;
        ctx.world.setMood('tender');
        ctx.audio.setMood('tender');
        navigator.vibrate?.([12, 80, 12]);
      }, later);
    },
    dispose() {
      clearTimeout(timer);
      players.forEach((p) => p.dispose());
      playables.forEach((p) => p.dispose());
    },
  };
};
