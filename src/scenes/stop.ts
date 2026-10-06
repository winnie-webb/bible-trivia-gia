import type { MediaItem, Panel } from '../content/types';
import type { StopData } from '../experience/beats';
import { asStill, picture, shown } from '../media/media';
import { h, put, words } from '../utils/dom';
import { shell } from './text';
import type { Scene, SceneCtx, SceneFactory } from './types';
import { playable, type Playable } from './video';

/**
 * STOPS
 * Each panel of a stop is one screen, and each layout stages its media
 * differently: a fan of prints, a contact sheet, a reveal, an award… so no
 * two stops feel like the same card. Words are short; the media carries it.
 *
 * Every stop leaves the bottom band free: the riders park there, beside the
 * ride control, so the vehicle never covers a photo, caption or button.
 */

// a message bubble: he reached her by text, over a community Starlink
const MESSAGE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';

interface Built {
  stage: HTMLElement;
  /** Layouts that write their own words leave this out. */
  text?: HTMLElement | null;
  players?: Playable[];
  enter?(): void;
  dispose?(): void;
}

export const stopScene: SceneFactory = (beat, ctx) => {
  const data = beat.data as StopData;
  const { stop, panel, index, count } = data;
  if (panel.layout === 'film') return filmPanel(beat.data, ctx);
  const calm = !!stop.calm;
  const el = shell('stop', `lay-${panel.layout}${calm ? '.is-calm' : ''}`);
  const built = LAYOUTS[panel.layout as Exclude<Panel['layout'], 'film'>](panel, ctx, el);
  const text = built.text === undefined ? textBlock(panel, calm ? 1.5 : 1) : built.text;
  put(el, built.stage, text);
  // inner panels move on with a tap; the last one takes the ride control
  ctx.lock(index < count - 1 ? 'none' : 'all');
  const players = built.players ?? [];
  return {
    el,
    hint: false,
    enter: () => built.enter?.(),
    leave: () => players.forEach((p) => p.pause()),
    dispose() {
      players.forEach((p) => p.dispose());
      built.dispose?.();
    },
  };
};

// ------------------------------------------------------------------ shared parts

function textBlock(p: Panel, slow = 1, base = 500): HTMLElement {
  const d = (ms: number) => Math.round(base + ms * slow);
  return h('div.sp-text', {}, [
    p.kicker ? h('p.kicker.rv', { style: { '--d': d(0) }, text: p.kicker }) : null,
    h('h2.sp-title.rv', { style: { '--d': d(250) }, text: p.title }),
    p.caption ? h('p.sp-caption.rv', { style: { '--d': d(900) }, text: p.caption }) : null,
  ]);
}

/** A print: a photo (or its placeholder) in a soft white frame. */
function print(item: MediaItem, cls = '', delay = 0): HTMLElement {
  return h(`figure.print.o-${item.orientation}${cls ? '.' + cls : ''}`, { style: { '--d': delay } }, [picture(item)]);
}

/** Photo or video (a missing video with a poster shows the poster as a photo). */
function mediaTile(item: MediaItem, ctx: SceneCtx, host: HTMLElement, players: Playable[], cls: string, delay: number, label?: string): HTMLElement {
  const still = asStill(item);
  if (item.type === 'video' && !still) {
    const p = playable(item, ctx, host, { label });
    players.push(p);
    return h(`div.tile.tile-video.o-${item.orientation}.${cls}`, { style: { '--d': delay } }, [p.frame]);
  }
  return print(still ?? item, cls, delay);
}

// ------------------------------------------------------------------ layouts

const LAYOUTS: Record<Exclude<Panel['layout'], 'film'>, (p: Panel, ctx: SceneCtx, el: HTMLElement) => Built> = {
  /** Hurricane: the photo, what was lost, then the line between us reconnects. */
  storm(p) {
    const tags = (p.tags ?? []).map((t, i) => h('li.st-tag.rv', { style: { '--d': 1300 + i * 700 }, text: t }));
    const link = h('div.st-link', { 'aria-hidden': 'true' }, [
      h('span.st-end', { text: 'You' }),
      h('span.st-wire', {}, [h('span.st-phone', { html: MESSAGE_ICON })]),
      h('span.st-end', { text: 'Me' }),
    ]);
    const stage = h('div.sp-stage', {}, [
      h('div.st-col', {}, [print(p.media[0], 'rv-slow', 300), h('ul.st-tags', { 'aria-label': (p.tags ?? []).join(', ') }, tags), link]),
    ]);
    let t = 0;
    return {
      stage,
      text: textBlock(p, 1.6, 2600),
      enter() {
        t = window.setTimeout(() => link.classList.add('is-connected'), 4200);
      },
      dispose: () => clearTimeout(t),
    };
  },

  /** Christmas: the plate, with what was on it drifting in like little labels. */
  feast(p) {
    const tags = (p.tags ?? []).map((t, i) => h(`span.fe-tag.ft${i}`, { style: { '--i': i }, text: t }));
    const stage = h('div.sp-stage', {}, [h('div.fe-wrap', {}, [print(p.media[0], 'rv-depth', 200), h('div.fe-tags', { 'aria-label': (p.tags ?? []).join(', ') }, tags)])]);
    return { stage };
  },

  /** Valentine's: two or three prints fanned out. Touch one to bring it forward. */
  fan(p) {
    const items = shown(p.media).slice(0, 3);
    const prints = items.map((m, i) => {
      const n = print(m, `fan-${items.length}-${i}.rv-depth`, 300 + i * 450);
      n.setAttribute('data-interactive', '');
      n.addEventListener('click', () => {
        prints.forEach((x) => x.classList.remove('is-front'));
        n.classList.add('is-front');
      });
      return n;
    });
    return { stage: h('div.sp-stage', {}, [h('div.fan', {}, prints)]) };
  },

  /** Learning makeup: a contact sheet, attempt by attempt. */
  practice(p) {
    const items = shown(p.media);
    const cells = items.map((m, i) => h('div.pr-cell.rv', { style: { '--d': 300 + i * 600 } }, [print(m), h('span.pr-n', { text: String(i + 1).padStart(2, '0') })]));
    return { stage: h('div.sp-stage', {}, [h(`div.pr-sheet.n${items.length}`, {}, cells)]) };
  },

  /** The gala: the practice shots gather, light sweeps across, the finished look rises. */
  reveal(p, ctx, el) {
    const [gala, ...practice] = p.media;
    const before = shown(practice).map((m, i) => h(`div.rvl-thumb.t${i}`, {}, [picture(m)]));
    const stage = h('div.sp-stage', {}, [
      h('div.rvl', {}, [h('div.rvl-thumbs', { 'aria-hidden': 'true' }, before), h('span.rvl-sweep', { 'aria-hidden': 'true' }), print(gala, 'rvl-main')]),
    ]);
    let t = 0;
    return {
      stage,
      text: textBlock(p, 1, 2400),
      enter() {
        t = window.setTimeout(() => el.classList.add('is-revealed'), ctx.reduced ? 200 : 1300);
      },
      dispose: () => clearTimeout(t),
    };
  },

  /** Rising Star (April 30) and the 4.0 (May 12): two distinct celebrations. */
  award(p, ctx) {
    const f = p.figures?.[0];
    const value = h('span.aw-value', { text: ctx.reduced ? f?.value ?? '' : '0.0' });
    const confetti = h(
      'div.aw-confetti',
      { 'aria-hidden': 'true' },
      Array.from({ length: 18 }, (_, i) => h(`i.c${i % 3}`, { style: { '--a': `${(i / 18) * 360}deg`, '--r': (0.6 + ((i * 37) % 10) / 20).toFixed(2) } })),
    );
    const stage = h('div.sp-stage', {}, [
      h('div.aw', {}, [
        h('div.aw-photo', {}, [
          print(p.media[0], 'rv-depth', 300),
          confetti,
          p.note ? h('p.aw-ribbon.rv', { style: { '--d': 1200 } }, [h('span.aw-rk', { text: p.note.kicker ?? '' }), h('span', { text: p.note.text })]) : null,
        ]),
        f
          ? h('div.aw-figure.rv', { style: { '--d': 2200 }, 'aria-label': `${f.value}, ${f.label}, ${f.when ?? ''}` }, [
              value,
              h('span.aw-label', { text: f.label }),
              f.when ? h('span.aw-when', { text: f.when }) : null,
              // the proof, if supplied: her grades screenshot
              ...shown(p.media.slice(1, 2)).map((m) => print(m, 'aw-shot')),
            ])
          : null,
      ]),
    ]);
    let raf = 0;
    let t = 0;
    return {
      stage,
      text: textBlock(p, 1, 3000),
      enter() {
        if (!f || ctx.reduced) return;
        confetti.classList.add('is-on');
        const target = parseFloat(f.value);
        t = window.setTimeout(() => {
          const t0 = performance.now();
          const step = (now: number) => {
            const k = Math.min((now - t0) / 1400, 1);
            const e = 1 - Math.pow(1 - k, 3);
            value.textContent = (target * e).toFixed(1);
            if (k < 1) raf = requestAnimationFrame(step);
            else value.textContent = f.value;
          };
          raf = requestAnimationFrame(step);
        }, 2400);
      },
      dispose() {
        clearTimeout(t);
        cancelAnimationFrame(raf);
      },
    };
  },

  /** New skills: the sign-language video (with a photo beside it, if one is added). */
  skills(p, ctx, el) {
    const players: Playable[] = [];
    const [vid, ...rest] = p.media;
    const img = shown(rest)[0];
    const stage = h('div.sp-stage', {}, [
      h(`div.sk${img ? '' : '.is-solo'}`, {}, [
        mediaTile(vid, ctx, el, players, 'sk-a.rv-depth', 300, 'Play the sign-language video'),
        img ? print(img, 'sk-b.rv-depth', 750) : null,
      ]),
    ]);
    return { stage, players };
  },

  /** A milestone and a testimony, side by side but separate. */
  growth(p) {
    const [now, before] = p.media;
    const hasBefore = !!before && shown([before]).length > 0;
    const n = p.note!;
    const stage = h('div.sp-stage', {}, [
      h('div.gr', {}, [
        h('div.gr-nails.rv', { style: { '--d': 300 } }, [
          h('div.gr-photo', {}, [
            print(now, 'gr-now'),
            hasBefore ? h('div.gr-before', {}, [print(before!), h('span.gr-tag', { text: 'Earlier' })]) : null,
            hasBefore ? h('span.gr-tag.gr-tag-now', { text: 'Now' }) : null,
          ]),
          h('div.gr-words', {}, [
            p.kicker ? h('p.kicker', { text: p.kicker }) : null,
            h('h2.sp-title', { text: p.title }),
            p.caption ? h('p.sp-caption', { text: p.caption }) : null,
          ]),
        ]),
        h('div.gr-testimony.rv', { style: { '--d': 1900 } }, [
          h('span.gr-light', { 'aria-hidden': 'true' }),
          n.kicker ? h('p.kicker', { text: n.kicker }) : null,
          n.title ? h('h3.gr-t-title', { text: n.title }) : null,
          h('p.gr-t-text', { text: n.text }),
        ]),
      ]),
    ]);
    return { stage, text: null };
  },

  /** Baptism: the photo held in light, or the light alone if there is no photo. */
  glow(p) {
    const items = shown(p.media);
    const stage = h('div.sp-stage', {}, [
      h('div.gl', {}, [
        h('span.gl-halo', { 'aria-hidden': 'true' }),
        h('span.gl-ripple.r1', { 'aria-hidden': 'true' }),
        h('span.gl-ripple.r2', { 'aria-hidden': 'true' }),
        items[0] ? print(items[0], 'rv-depth', 500) : h('span.gl-orb.rv-depth', { style: { '--d': 400 }, 'aria-hidden': 'true' }),
      ]),
    ]);
    return { stage };
  },

  /** The Lintons: an answered prayer, line by line. */
  mentors(p) {
    const lines = (p.lines ?? []).map((l, i) => h('p.mn-line.rv', { style: { '--d': 1700 + i * 1100 } }, [words(l)]));
    const stage = h('div.sp-stage', {}, [h('div.mn', {}, [print(p.media[0], 'rv-depth', 300)])]);
    const text = h('div.sp-text', {}, [
      p.kicker ? h('p.kicker.rv', { style: { '--d': 500 }, text: p.kicker }) : null,
      h('h2.sp-title.rv', { style: { '--d': 800 }, text: p.title }),
      h('div.mn-lines', {}, lines),
    ]);
    return { stage, text };
  },

  /** The licence: her video, and the bubble from the very first screen. */
  licence(p, ctx, el) {
    const players: Playable[] = [];
    const n = p.note;
    const stage = h('div.sp-stage', {}, [
      h('div.lc', {}, [
        mediaTile(p.media[0], ctx, el, players, 'lc-video.rv-depth', 300, 'Play the licence video'),
        n
          ? h('div.lc-echo.rv', { style: { '--d': 1500 } }, [n.kicker ? h('span.lc-k', { text: n.kicker }) : null, h('span.lc-bubble', { text: n.text })])
          : null,
      ]),
    ]);
    return { stage, players };
  },

  /** Known and precious: a childhood photo held in light, and the verses, one at a time. */
  scripture(p) {
    const items = shown(p.media);
    const verses = (p.verses ?? []).map((v, i) =>
      h('figure.vs.rv', { style: { '--d': 1500 + i * 1300 } }, [h('blockquote.vs-text', { text: `“${v.text}”` }), h('figcaption.vs-ref', { text: v.ref })]),
    );
    const stage = h('div.sp-stage', {}, [
      h('div.gl', {}, [h('span.gl-halo', { 'aria-hidden': 'true' }), items[0] ? print(items[0], 'vs-photo.rv-depth', 300) : null]),
    ]);
    const text = h('div.sp-text', {}, [
      p.kicker ? h('p.kicker.rv', { style: { '--d': 500 }, text: p.kicker }) : null,
      h('h2.sp-title.rv', { style: { '--d': 800 }, text: p.title }),
      h('div.vs-list', {}, verses),
    ]);
    return { stage, text };
  },

  /** A quiet day: one photo, slow and still. */
  quiet(p) {
    return { stage: h('div.sp-stage', {}, [h('div.qt', {}, [print(p.media[0], 'rv-slow', 400)])]) };
  },

  /** The fast: one small light, and a few words. */
  candle(p) {
    const lines = (p.lines ?? []).map((l, i) => h('p.cd-line.rv', { style: { '--d': 2400 + i * 1500 } }, [words(l)]));
    const stage = h('div.sp-stage', {}, [h('div.cd', { 'aria-hidden': 'true' }, [h('span.cd-glow'), h('span.cd-flame'), h('span.cd-wick'), h('span.cd-candle')])]);
    const text = h('div.sp-text', {}, [
      p.kicker ? h('p.kicker.rv', { style: { '--d': 700 }, text: p.kicker }) : null,
      h('h2.sp-title.rv', { style: { '--d': 1200 }, text: p.title }),
      h('div.cd-lines', {}, lines),
    ]);
    return { stage, text };
  },
};

// ------------------------------------------------------------------ stop 1: the film

/** The 19th-birthday video: play when she chooses, skip any time, continue when done. */
function filmPanel(data: StopData, ctx: SceneCtx): Scene {
  const p = data.panel;
  const el = shell('stop', 'lay-film');
  const item = p.media[0];
  const still = asStill(item);
  const players: Playable[] = [];
  const screen = mediaTile(item, ctx, el, players, 'fm-screen', 0, `Play: ${p.title}`);
  const player = players[0]?.player;
  const go = h('button.fm-go', { type: 'button', onclick: () => ctx.next() }, [h('span', { text: still ? 'Continue' : 'Skip' })]);
  const goLabel = go.firstElementChild as HTMLElement;
  if (player) {
    player.addEventListener('play', () => (goLabel.textContent = 'Continue'));
    player.addEventListener('ended', () => el.classList.add('is-ended'));
  }
  put(
    el,
    h('header.fm-head', {}, [h('p.kicker.rv', { style: { '--d': 300 }, text: p.kicker ?? '' }), h('h2.sp-title.rv', { style: { '--d': 700 }, text: p.title })]),
    h('div.sp-stage.rv-depth', { style: { '--d': 1000 } }, [screen]),
    h('div.fm-actions.rv', { style: { '--d': 1800 } }, [go]),
  );
  // a tap outside the video never skips it by accident; Skip / Continue (or a swipe) moves on
  ctx.lock('tap');
  return {
    el,
    hint: false,
    leave: () => players.forEach((x) => x.pause()),
    dispose: () => players.forEach((x) => x.dispose()),
  };
}
