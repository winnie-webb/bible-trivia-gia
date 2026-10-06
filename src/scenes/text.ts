import { h, put, words } from '../utils/dom';
import type { SceneFactory } from './types';

/** Shared shell for every scene. */
export function shell(kind: string, extra = ''): HTMLElement {
  return h(`section.scene.scene-${kind}${extra ? '.' + extra : ''}`, { 'aria-live': 'polite' });
}

/** First screen: sound choice. The tap here is what unlocks audio. */
export const gate: SceneFactory = (beat, ctx) => {
  const d = beat.data;
  const el = shell('gate');
  const enter = (withSound: boolean) => {
    ctx.audio.unlock(withSound);
    el.classList.add('is-chosen');
    ctx.next();
  };
  put(
    el,
    h('p.gate-whisper.rv', { style: { '--d': 400 }, text: d.whisper }),
    h('div.gate-actions.rv', { style: { '--d': 1800 } }, [
      h('button.btn-enter', { type: 'button', onclick: () => enter(true) }, [h('span', { text: d.withSound })]),
      h('button.btn-quiet', { type: 'button', onclick: () => enter(false) }, [h('span', { text: d.quietly })]),
    ]),
    h('p.gate-hint.rv', { style: { '--d': 2600 }, text: d.hint }),
  );
  ctx.lock('all');
  return { el, hint: false };
};

/**
 * THE REWIND — from the present day back to her last birthday.
 * The year rolls back 2026 → 2025, then the line arrives.
 */
export const rewindScene: SceneFactory = (beat) => {
  const d = beat.data as { from: string; to: string; date: string; line: string };
  const el = shell('rewind');
  const year = h('span.rw-year', { 'aria-hidden': 'true' }, [h('span.rw-from', { text: d.from }), h('span.rw-to', { text: d.to })]);
  put(
    el,
    h('div.rw-inner', {}, [
      h('p.rw-date.rv', { style: { '--d': 200 }, 'aria-label': `${d.date} ${d.to}` }, [h('span', { text: d.date }), ' ', year]),
      h('span.rw-rule.rv', { style: { '--d': 1500 }, 'aria-hidden': 'true' }),
      h('p.rw-line.rv-words', { style: { '--d0': 1900 } }, [words(d.line)]),
    ]),
  );
  return { el, hint: false };
};
