import type { MediaItem, Memory } from '../content/types';
import { mediaElement, type Player } from '../media/media';
import { h, words, put } from '../utils/dom';
import { shell } from './text';
import type { Scene, SceneCtx, SceneFactory } from './types';
import { playable, type Playable } from './video';
import { relationshipScene } from './relationship';

/**
 * MEMORY SCENES
 * One memory can span several beats (title → media → writing), and each
 * treatment stages its media differently. None of them are cards: media
 * sits in the world, text sits in the air beside it.
 */

const dateEl = (date: string, d = 300) => (date ? h('p.mem-date.rv', { style: { '--d': d }, text: date }) : null);

/** Title card for major moments and turning points. */
export const memoryTitle: SceneFactory = (beat) => {
  const { memory: m, date, turning } = beat.data as { memory: Memory; date: string; turning: boolean };
  const el = shell('mem-title', turning ? 'is-turning' : '');
  el.classList.add(`tr-${beat.treatment}`);
  put(el, 
    h('div.mt-inner', {}, [
      m.kicker ? h('p.kicker.rv', { style: { '--d': 200 }, text: m.kicker }) : null,
      dateEl(date, turning ? 900 : 300),
      h('h2.mt-title.rv-words', { style: { '--d0': turning ? 1500 : 900 } }, [words(m.title)]),
      m.shortText ? h('p.mt-short.rv', { style: { '--d': turning ? 3000 : 2200 }, text: m.shortText }) : null,
    ]),
  );
  return { el };
};

/** Memory audio (a voice note) — a small, quiet control. */
function voiceNote(m: Memory, ctx: SceneCtx): { el: HTMLElement; dispose(): void } | null {
  if (!m.audio) return null;
  const a = ctx.audio.createVoice(m.audio.src);
  const unbind = ctx.audio.bindMedia(a);
  const btn = h('button.voice-note.rv', { type: 'button', style: { '--d': 1800 } }, [h('span.vn-dot'), h('span', { text: m.audio.label ?? 'Listen' })]);
  btn.addEventListener('click', () => (a.paused ? a.play() : a.pause()));
  a.addEventListener('play', () => btn.classList.add('is-playing'));
  a.addEventListener('pause', () => btn.classList.remove('is-playing'));
  return {
    el: btn,
    dispose() {
      a.pause();
      unbind();
    },
  };
}

function caption(m: Memory, date: string, show: boolean, delay = 900) {
  return h('div.mem-caption', {}, [
    dateEl(date, delay),
    show ? h('h3.mem-title.rv', { style: { '--d': delay + 300 }, text: m.title }) : null,
    show && m.shortText ? h('p.mem-short.rv', { style: { '--d': delay + 900 }, text: m.shortText }) : null,
  ]);
}

/** The main media beat. Dispatches on treatment. */
export const memoryMain: SceneFactory = (beat, ctx) => {
  const { memory: m, date, treatment, showTitle } = beat.data as {
    memory: Memory;
    date: string;
    treatment: string;
    compact: boolean;
    showTitle: boolean;
  };
  if (treatment === 'relationship') return relationshipScene(beat, ctx);

  const el = shell('memory', `tr-${treatment}`);
  const media = m.media ?? [];
  const players: Player[] = [];
  const cleanups: (() => void)[] = [];
  const scene: Scene = { el };

  const add = (item: MediaItem, cls: string) => {
    const r = mediaElement(item, cls);
    if (r.player) {
      players.push(r.player);
      if (item.ambient) r.player.play();
    }
    return r.el;
  };

  switch (treatment) {
    case 'cinematic': {
      const item = media[0];
      put(el, 
        h('div.cine-media', {}, [item ? add(item, 'kenburns') : null]),
        h('div.cine-scrim'),
        caption(m, date, true, 1200),
      );
      break;
    }
    case 'floating': {
      const item = media[0];
      put(el, 
        h('div.float-stage', {}, [item ? h(`div.float-frame.o-${item.orientation}.rv-depth`, {}, [add(item, '')]) : null]),
        caption(m, date, showTitle, 1100),
      );
      break;
    }
    case 'joyful': {
      put(el, 
        h(
          'div.joy-field',
          {},
          media.slice(0, 5).map((item, i) => h(`div.joy-item.j${i}.o-${item.orientation}.rv-depth`, { style: { '--d': 300 + i * 380 } }, [add(item, '')])),
        ),
        caption(m, date, showTitle, 1600),
      );
      break;
    }
    case 'difficult': {
      const item = media[0];
      put(el, 
        h('div.diff-stage', {}, [item ? h(`div.diff-frame.o-${item.orientation}.rv-slow`, {}, [add(item, '')]) : null]),
        caption(m, date, showTitle, 2400),
      );
      break;
    }
    case 'faith': {
      const item = media[0];
      put(el, 
        h('div.faith-stage', {}, [
          h('div.faith-glow', { 'aria-hidden': 'true' }),
          item ? h(`div.faith-frame.o-${item.orientation}.rv-depth`, {}, [add(item, '')]) : null,
        ]),
        caption(m, date, showTitle, 1400),
      );
      break;
    }
    case 'video': {
      const item = media.find((x) => x.type === 'video') ?? media[0];
      let p: Playable | null = null;
      if (item) {
        p = playable(item, ctx, el, { label: `Play: ${m.title}` });
        cleanups.push(() => p!.dispose());
      }
      put(el, h('div.vm-stage.rv-depth', {}, [p?.frame ?? null]), caption(m, date, showTitle, 1000));
      break;
    }
    case 'steps':
      return stepsScene(el, m, date, ctx);
    case 'discover':
      return discoverScene(el, m, date);
    case 'figures': {
      const shots = media.slice(0, 2).map((item, i) => h(`div.fig-shot.fs${i}.o-${item.orientation}.rv-depth`, { style: { '--d': 2200 + i * 500 } }, [add(item, '')]));
      put(el, 
        h('div.fig-shots', {}, shots),
        h('div.fig-stack', {}, (m.figures ?? []).flatMap((f, i) => [
          i > 0 ? h('span.fig-and.rv', { style: { '--d': 900 + i * 900 }, text: '&' }) : null,
          h('div.fig.rv-depth', { style: { '--d': 400 + i * 1200 } }, [h('span.fig-value', { text: f.value }), h('span.fig-label', { text: f.label })]),
        ]).filter(Boolean) as HTMLElement[]),
        caption(m, date, showTitle, 2600),
      );
      break;
    }
    default: {
      // quiet: words only
      put(el, 
        h('div.quiet-inner', {}, [
          dateEl(date, 400),
          h('h3.quiet-title.rv-words', { style: { '--d0': 1000 } }, [words(m.title)]),
          m.shortText ? h('p.quiet-short.rv', { style: { '--d': 2400 }, text: m.shortText }) : null,
        ]),
      );
    }
  }

  const vn = voiceNote(m, ctx);
  if (vn) {
    put(el, vn.el);
    cleanups.push(vn.dispose);
  }

  scene.dispose = () => {
    players.forEach((p) => p.dispose());
    cleanups.forEach((c) => c());
  };
  return scene;
};

/**
 * STEPS — a sequence that moves forward through depth. Each step arrives at
 * the centre while earlier ones recede above it. Steps advance on their own;
 * a tap moves on sooner. Used for the comeback, the mentorship, the licence.
 */
function stepsScene(el: HTMLElement, m: Memory, date: string, ctx: SceneCtx): Scene {
  const steps = m.steps ?? [];
  const nodes = steps.map((st) =>
    h('div.step', {}, [
      st.when ? h('p.step-when', { text: st.when }) : null,
      h('p.step-label', { text: st.label }),
      st.text ? h(`p.step-text${st.quote ? '.is-quote' : ''}`, { text: st.quote ? `“${st.text}”` : st.text }) : null,
    ]),
  );
  const column = h('div.steps-column', {}, nodes);
  put(el,
    h('header.steps-head.rv', { style: { '--d': 200 } }, [h('span.mem-date', { text: date }), h('span.steps-title', { text: m.title })]),
    h('div.steps-thread', { 'aria-hidden': 'true' }),
    h('div.steps-window', {}, [column]),
  );
  let idx = -1;
  let timer = 0;
  const show = (i: number) => {
    idx = i;
    nodes.forEach((n, j) => {
      n.classList.toggle('is-shown', j <= i);
      n.classList.toggle('is-current', j === i);
      n.classList.toggle('is-past', j < i);
    });
    const cur = nodes[i];
    if (cur) column.style.transform = `translateY(${-(cur.offsetTop + cur.offsetHeight / 2)}px)`;
    el.style.setProperty('--progress', String((i + 1) / steps.length));
    clearTimeout(timer);
    if (i < steps.length - 1) {
      const wc = (steps[i].text ?? '').split(/\s+/).length + steps[i].label.split(/\s+/).length;
      timer = window.setTimeout(() => show(i + 1), (ctx.reduced ? 3600 : 2600) + wc * 160);
    } else el.classList.add('is-complete');
  };
  return {
    el,
    enter: () => show(0),
    onTap() {
      if (idx < steps.length - 1) {
        show(idx + 1);
        return true;
      }
      return false;
    },
    dispose: () => clearTimeout(timer),
  };
}

/** DISCOVER — one tap reveals a playful detail (the Christmas plate, the ring size). */
function discoverScene(el: HTMLElement, m: Memory, date: string): Scene {
  const r = m.reveal!;
  const single = r.items.length === 1;
  let open = false;
  const items = r.items.map((t, i) =>
    h(`span.dc-item${single ? '.is-single' : ''}`, { style: { '--i': i, '--r': ((i % 2 ? 1 : -1) * (6 + i * 3)).toString() }, text: t }),
  );
  const reveal = () => {
    if (open) return;
    open = true;
    el.classList.add('is-open');
  };
  put(el,
    h('div.dc-inner', {}, [
      dateEl(date, 300),
      h('h3.quiet-title.rv-words', { style: { '--d0': 800 } }, [words(m.title)]),
      m.shortText ? h('p.quiet-short.rv', { style: { '--d': 1800 } }, [m.shortText]) : null,
      h('div.dc-stage', {}, [
        h('button.dc-btn.rv', { type: 'button', style: { '--d': 2600 }, onclick: reveal }, [h('span.dc-ring'), h('span.dc-prompt', { text: r.prompt })]),
        h('div.dc-items', { 'aria-live': 'polite' }, items),
      ]),
      r.after ? h('p.dc-after', { text: r.after }) : null,
    ]),
  );
  return {
    el,
    hint: 'Touch to continue',
    onTap() {
      if (!open) {
        reveal();
        return true;
      }
      return false;
    },
  };
}

/** The writing beat. Paragraphs reveal in sequence; scrolls if long. */
export const memoryText: SceneFactory = (beat) => {
  const { memory: m, date, paragraphs, treatment } = beat.data as { memory: Memory; date: string; paragraphs: string[]; treatment: string };
  const el = shell('mem-text', `tr-${treatment}`);
  const slow = treatment === 'difficult' ? 1.6 : 1;
  let t = 700 * slow;
  const paras = paragraphs.map((p) => {
    const node = h('p.mtx-p.rv-words', { style: { '--d0': Math.round(t) } }, [words(p)]);
    t += (900 + p.split(/\s+/).length * 55) * slow;
    return node;
  });
  put(el, 
    h('div.mtx-inner.scroll', {}, [
      h('header.mtx-head.rv', { style: { '--d': 100 } }, [h('span', { text: date }), h('span.mtx-sep'), h('span', { text: m.title })]),
      ...paras,
      m.quote
        ? h('blockquote.mtx-quote.rv', { style: { '--d': Math.round(t) } }, [h('p', { text: `“${m.quote.text}”` }), m.quote.by ? h('cite', { text: m.quote.by }) : null])
        : null,
    ]),
  );
  el.style.setProperty('--slow', String(slow));
  return { el };
};
