import type { Artwork, BirthdayMessage } from '../content/types';
import { picture } from '../media/media';
import { h, wait, words, put } from '../utils/dom';
import { shell } from './text';
import type { SceneFactory } from './types';
import { playable, type Playable } from './video';

/* =====================================================================
 * ARTWORK — layered images (e.g. Gia + Jesus) with slow parallax and light.
 * One flat image works; separated layers (background → foreground) add depth.
 * ===================================================================== */
export const artwork: SceneFactory = (beat, ctx) => {
  const a = beat.data as Artwork & { kicker?: string };
  const el = shell('art', a.light ? 'has-light' : '');
  const layers = a.layers.map((l, i) => {
    const node = picture({ src: l.src, alt: l.alt ?? (i === 0 ? a.alt : ''), orientation: 'portrait', label: a.alt, status: 'optional' }, '', 'art');
    return h('div.art-layer', { style: { '--z': l.depth } }, [node]);
  });
  const stage = h('div.art-stage', { role: 'img', 'aria-label': a.alt }, [...layers, a.light ? h('div.art-light', { 'aria-hidden': 'true' }) : null, h('div.art-fog')]);
  put(el, 
    a.kicker ? h('p.kicker.art-kicker.rv', { style: { '--d': 1200 }, text: a.kicker }) : null,
    stage,
    a.caption ? h('p.art-caption.rv', { style: { '--d': 2200 }, text: a.caption }) : null,
  );
  // Parallax: follow the finger gently (no hover dependency — touch drives it).
  let raf = 0;
  const onMove = (e: PointerEvent) => {
    if (ctx.reduced) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      stage.style.setProperty('--px', ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
      stage.style.setProperty('--py', ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
    });
  };
  el.addEventListener('pointermove', onMove);
  return { el, dispose: () => cancelAnimationFrame(raf) };
};

/* =====================================================================
 * FEATURE FILM — the main birthday video, presented like a premiere.
 * ===================================================================== */
export const film: SceneFactory = (beat, ctx) => {
  const d = beat.data;
  const el = shell('film');
  const p = playable(d.video, ctx, el, { label: `Play: ${d.title}`, focus: 1 });
  const cont = h('button.film-continue.rv', { type: 'button', style: { '--d': 2800 }, onclick: () => ctx.next() }, [h('span', { text: d.continueLabel ?? 'Continue' })]);
  put(el, 
    h('div.film-head', {}, [h('p.kicker.rv', { style: { '--d': 600 }, text: d.kicker }), h('h2.film-title.rv', { style: { '--d': 1200 }, text: d.title })]),
    h('div.film-screen.rv-depth', { style: { '--d': 1800 } }, [p.frame, h('div.film-spill', { 'aria-hidden': 'true' })]),
    cont,
  );
  // Watching is optional: tapping outside the video never skips it by accident; Continue (or a swipe) moves on.
  ctx.lock('tap');
  p.player.addEventListener('pause', () => ctx.lock('tap'));
  return { el, hint: false, dispose: () => p.dispose() };
};

/* =====================================================================
 * VOICES — birthday messages as points of light scattered in depth.
 * She discovers and touches each one; it opens into its video.
 * ===================================================================== */
export const voices: SceneFactory = (beat, ctx) => {
  const { intro, messages } = beat.data as { intro: { line: string; hint: string; continueLabel: string }; messages: BirthdayMessage[] };
  const el = shell('voices');
  const field = h('div.vc-field');
  const seen = new Set<string>();
  let open: { p: Playable; node: HTMLElement } | null = null;

  // golden-angle spiral → evenly scattered but organic; depth alternates
  const n = messages.length;
  const pts = messages.map((msg, i) => {
    const a = i * 2.39996 + 0.6;
    const r = Math.sqrt((i + 0.6) / (n + 0.6));
    const x = 50 + Math.cos(a) * r * 44;
    const y = 50 + Math.sin(a) * r * 44;
    const z = (i % 3) / 2; // 0 near … 1 far
    const btn = h(
      'button.vc-point.rv',
      {
        type: 'button',
        'aria-label': `Message from ${msg.from}`,
        style: { left: `${x}%`, top: `${y}%`, '--z': z, '--d': 900 + i * 220, '--ph': (i * 0.7).toFixed(2) },
      },
      [h('span.vc-glow'), h('span.vc-core'), h('span.vc-name', { text: msg.from })],
    );
    btn.addEventListener('click', () => openMessage(msg, btn));
    return btn;
  });
  put(field, ...pts);

  const cont = h('button.vc-continue', { type: 'button', onclick: () => ctx.next() }, [h('span', { text: intro.continueLabel })]);
  const overlay = h('div.vc-portal', { role: 'dialog', 'aria-modal': 'true' });

  async function openMessage(msg: BirthdayMessage, btn: HTMLElement) {
    if (open) return;
    seen.add(msg.id);
    btn.classList.add('is-seen');
    el.classList.add('has-seen');
    const r = btn.getBoundingClientRect();
    overlay.style.setProperty('--ox', `${r.left + r.width / 2}px`);
    overlay.style.setProperty('--oy', `${r.top + r.height / 2}px`);
    const p = playable(msg.video, ctx, overlay, { label: `Play message from ${msg.from}`, focus: 0.9, restoreLock: 'all' });
    const close = h('button.vc-close', { type: 'button', 'aria-label': 'Close message', onclick: () => closeMessage() }, [h('span')]);
    const node = h('div.vc-portal-inner', {}, [
      h('p.vc-from', {}, [h('span.vc-from-name', { text: msg.from }), msg.relation ? h('span.vc-from-rel', { text: msg.relation }) : null]),
      p.frame,
      close,
    ]);
    overlay.replaceChildren(node);
    overlay.classList.add('is-open');
    el.classList.add('portal-open');
    ctx.lock('all');
    open = { p, node };
    await wait(650);
    if (open?.p === p) p.player.play();
  }
  function closeMessage() {
    if (!open) return;
    const o = open;
    open = null;
    o.p.player.pause();
    overlay.classList.remove('is-open');
    el.classList.remove('portal-open');
    ctx.lock('tap');
    setTimeout(() => o.p.dispose(), 700);
    if (seen.size >= 1) el.classList.add('can-continue');
  }

  put(el, 
    h('div.vc-head', {}, [h('p.vc-line.rv-words', { style: { '--d0': 300 } }, [words(intro.line)]), h('p.vc-hint.rv', { style: { '--d': 2000 }, text: intro.hint })]),
    field,
    h('div.vc-foot', {}, [cont]),
    overlay,
  );
  ctx.lock('tap');
  // the continue button appears after a while even if nothing was opened
  const t = setTimeout(() => el.classList.add('can-continue'), 9000);
  return {
    el,
    hint: false,
    dispose() {
      clearTimeout(t);
      open?.p.dispose();
    },
  };
};

/* =====================================================================
 * 19 → 20 — press and hold. The camera passes through the girl who entered
 * 19 and arrives at the woman entering 20, as the world turns to dawn.
 * ===================================================================== */
export const turningScene: SceneFactory = (beat, ctx) => {
  const d = beat.data;
  const el = shell('turn');
  const past = h('figure.turn-past', {}, [picture({ ...d.past, orientation: 'portrait' }), h('figcaption.kicker', { text: d.pastLabel })]);
  const present = h('figure.turn-present', {}, [picture({ ...d.present, orientation: 'portrait' }), h('figcaption.kicker', { text: d.presentLabel })]);
  const n19 = h('span.turn-n.n19', { text: '19' });
  const n20 = h('span.turn-n.n20', { text: '20' });
  const ring = h('span.hold-ring', { html: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="1"/></svg>' });
  const holdBtn = h('button.hold-btn', { type: 'button', 'aria-label': `${d.holdHint} to continue into 20` }, [ring, h('span.hold-core')]);
  const hint = h('p.hold-hint', { text: d.holdHint });
  const after = h('p.turn-after', {}, [words(d.after)]);

  put(el, 
    h('div.turn-stage', {}, [past, present]),
    h('div.turn-numerals', { 'aria-hidden': 'true' }, [n19, n20]),
    h('div.turn-control.rv', { style: { '--d': 1600 } }, [holdBtn, hint]),
    h('div.turn-after-wrap', {}, [after]),
  );

  let p = 0;
  let holding = false;
  let done = ctx.seen;
  let raf = 0;
  let last = 0;
  const DURATION = ctx.reduced ? 0.8 : 3.2; // seconds of holding

  const apply = () => {
    el.style.setProperty('--p', p.toFixed(4));
    ctx.world.setHold(done ? 0 : p);
  };
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (holding) p = Math.min(1, p + dt / DURATION);
    else p = Math.max(0, p - dt / 0.9);
    apply();
    if (p >= 1 && !done) return complete();
    if (holding || p > 0) raf = requestAnimationFrame(loop);
  };
  const start = (e: Event) => {
    e.preventDefault();
    if (done) return;
    holding = true;
    el.classList.add('is-holding');
    navigator.vibrate?.(8);
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    holding = false;
    el.classList.remove('is-holding');
  };
  function complete() {
    done = true;
    holding = false;
    p = 1;
    el.style.setProperty('--p', '1');
    el.classList.add('is-done');
    ctx.world.setHold(0);
    ctx.world.setMood('dawn');
    ctx.audio.setMood('dawn');
    navigator.vibrate?.([10, 60, 18]);
    ctx.lock('none');
  }
  holdBtn.addEventListener('pointerdown', start);
  holdBtn.addEventListener('pointerup', stop);
  holdBtn.addEventListener('pointercancel', stop);
  holdBtn.addEventListener('pointerleave', stop);
  holdBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  // keyboard: hold Space/Enter
  holdBtn.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !holding) start(e);
  });
  holdBtn.addEventListener('keyup', stop);

  if (done) {
    el.classList.add('is-done');
    el.style.setProperty('--p', '1');
    ctx.world.setMood('dawn');
  } else ctx.lock('all');

  return {
    el,
    hint: done ? undefined : false,
    dispose() {
      cancelAnimationFrame(raf);
      ctx.world.setHold(0);
    },
  };
};
