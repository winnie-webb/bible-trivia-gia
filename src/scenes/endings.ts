import { h, words, put } from '../utils/dom';
import { shell } from './text';
import type { SceneFactory } from './types';

/* =====================================================================
 * PRAYER — one line at a time, by candlelight.
 * Without narration she taps for each line; with narration the lines
 * follow the voice (each line's `at` time).
 * ===================================================================== */
export const prayerScene: SceneFactory = (beat, ctx) => {
  const d = beat.data as { kicker: string; title: string; narration: string; lines: { text: string; at: number }[] };
  const el = shell('prayer');
  const lines = d.lines.map((l) => h('p.pr-line', {}, [words(l.text)]));
  const column = h('div.pr-column', {}, lines);
  const head = h('header.pr-head', {}, [h('p.kicker.rv', { style: { '--d': 500 }, text: d.kicker }), h('h2.pr-title.rv', { style: { '--d': 1300 }, text: d.title })]);
  put(el, h('div.pr-candle', { 'aria-hidden': 'true' }), head, h('div.pr-window', {}, [column]));

  let idx = -1;
  let voice: HTMLAudioElement | null = null;
  let unbind: (() => void) | null = null;

  const show = (i: number) => {
    idx = i;
    el.classList.add('has-lines');
    lines.forEach((l, j) => {
      l.classList.toggle('is-shown', j <= i);
      l.classList.toggle('is-current', j === i);
    });
    const cur = lines[i];
    if (cur) column.style.transform = `translateY(${-(cur.offsetTop + cur.offsetHeight / 2)}px)`;
    if (i === lines.length - 1) el.classList.add('is-complete');
  };

  let listenBtn: HTMLElement | null = null;
  if (d.narration) {
    voice = ctx.audio.createVoice(d.narration);
    unbind = ctx.audio.bindMedia(voice);
    voice.addEventListener('timeupdate', () => {
      const t = voice!.currentTime;
      let k = -1;
      d.lines.forEach((l, j) => {
        if (t >= l.at) k = j;
      });
      if (k !== idx && k >= 0) show(k);
    });
    listenBtn = h('button.pr-listen.rv', { type: 'button', style: { '--d': 2400 }, onclick: () => voice!.play() }, [h('span', { text: 'Listen' })]);
    put(el, listenBtn);
  }

  let timer = 0;
  return {
    el,
    hint: 'Touch for the next line',
    enter() {
      if (!voice) timer = window.setTimeout(() => idx < 0 && show(0), 3200);
    },
    onTap() {
      if (voice && !voice.paused) return true;
      if (idx < lines.length - 1) {
        show(idx + 1);
        return true;
      }
      return false;
    },
    dispose() {
      clearTimeout(timer);
      voice?.pause();
      unbind?.();
    },
  };
};

/* =====================================================================
 * THE ROAD AHEAD — the world stops looking back.
 * ===================================================================== */
export const futureScene: SceneFactory = (beat) => {
  const d = beat.data as { kicker: string; lines: string[] };
  const el = shell('future');
  let t = 1200;
  put(el, 
    h('div.fu-horizon', { 'aria-hidden': 'true' }),
    h('div.fu-inner', {}, [
      h('p.kicker.rv', { style: { '--d': 400 }, text: d.kicker }),
      ...d.lines.map((l) => {
        const node = h('p.fu-line.rv-words', { style: { '--d0': t } }, [words(l)]);
        t += 1400 + l.split(' ').length * 80;
        return node;
      }),
    ]),
  );
  return { el };
};

/* =====================================================================
 * FINALE — an ending, not a footer. Everything settles and stays.
 * ===================================================================== */
export const finaleScene: SceneFactory = (beat, ctx) => {
  const d = beat.data as { headline: string; welcome: string; message: string[]; closing: string; signature: string };
  const el = shell('finale');
  let t = 3800;
  const msg = d.message.map((p) => {
    const node = h('p.fi-msg.rv', { style: { '--d': t }, text: p });
    t += 1200 + p.split(' ').length * 40;
    return node;
  });
  put(el, 
    h('div.fi-inner.scroll', {}, [
      h('h1.fi-headline.rv-words', { style: { '--d0': 900 } }, [words(d.headline)]),
      h('p.fi-welcome.rv', { style: { '--d': 2600 }, text: d.welcome }),
      h('div.fi-message', {}, msg),
      h('p.fi-closing.rv', { style: { '--d': t + 600 }, text: d.closing }),
      h('p.fi-signature.rv', { style: { '--d': t + 1800 }, text: d.signature }),
    ]),
  );
  ctx.lock('all');
  return {
    el,
    hint: false,
    enter() {
      ctx.audio.resolve();
    },
  };
};
