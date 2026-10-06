import type { AudioManager } from '../audio/AudioManager';
import { mediaInBeat, preload } from '../media/media';
import { ARRIVAL, transition } from '../motion/transitions';
import { SCENES } from '../scenes';
import type { Lock, Scene, SceneCtx } from '../scenes/types';
import type { WorldApi } from '../three/moods';
import type { Quality } from '../utils/device';
import { h } from '../utils/dom';
import type { Beat } from './beats';

/**
 * THE DIRECTOR
 * Plays the beats in order. Owns which scene is on screen, the transition
 * between scenes, where the riders are, gestures and the continue hint.
 * Riding between stops belongs to the ride control (Ride.ts), which calls
 * advance() when the riders arrive.
 *
 * Gestures (no hover anywhere):
 *   tap / swipe up   → next panel (never past a stop: that takes riding)
 *   swipe down       → back (back skips the roads)
 *   keys: → ↓ Enter = next · ← ↑ = back · Space is the ride control's
 */

interface Opts {
  stage: HTMLElement;
  world: WorldApi;
  audio: AudioManager;
  quality: Quality;
  beats: Beat[];
  reduced: () => boolean;
  onChange?: (i: number) => void;
}

/** Beats at which only the ride control moves forward. */
export const isRideBeat = (b?: Beat) => !!b && (b.kind === 'road' || !!b.rideOut);

export class Director {
  beats: Beat[];
  index = -1;
  furthest = -1;
  /** A video is playing in the current scene. */
  mediaBusy = false;
  /** Jesus took the wheel (the bump on the first stretch has happened). */
  incidentDone = false;
  private o: Opts;
  private scenesEl: HTMLElement;
  private lightLayer: HTMLElement;
  private hintEl: HTMLElement;
  private originEl: HTMLElement;
  private current: { beat: Beat; scene: Scene } | null = null;
  private lockLevel: Lock = 'none';
  private busyUntil = 0;
  private autoTimer = 0;
  private hintTimer = 0;
  private paused = false;
  private hintsShown = 0;
  private seen = new Set<number>();
  private listeners = new Set<() => void>();

  constructor(o: Opts) {
    this.o = o;
    this.beats = o.beats;
    this.scenesEl = h('div.scenes');
    this.lightLayer = h('div.light-layer', { 'aria-hidden': 'true' });
    this.originEl = h('div.origin', { 'aria-hidden': 'true' }, [h('span')]);
    this.hintEl = h('div.hint', { 'aria-hidden': 'true' }, [h('span.hint-line'), h('span.hint-text')]);
    o.stage.append(this.originEl, this.scenesEl, this.lightLayer, this.hintEl);
    this.bindInput();
  }

  get beat(): Beat | undefined {
    return this.beats[this.index];
  }

  get isPaused() {
    return this.paused;
  }

  /** Called whenever the beat, the media state or the pause state changes. */
  subscribe(fn: () => void) {
    this.listeners.add(fn);
  }
  private emit() {
    this.listeners.forEach((f) => f());
  }

  // ------------------------------------------------------------------ navigation

  start(i = 0) {
    this.go(i, 1, 'cut');
  }

  /** Forward by gesture: never past a stop or along a road (that takes riding). */
  next() {
    if (performance.now() < this.busyUntil || isRideBeat(this.beat)) return;
    if (this.index < this.beats.length - 1) this.go(this.index + 1, 1);
  }

  /** Forward unconditionally (the ride control, Skip/Continue buttons). */
  advance(forced?: Beat['transition']) {
    if (this.index < this.beats.length - 1) this.go(this.index + 1, 1, forced);
  }

  /** Forward to a later beat (reduced motion skips empty roads). */
  to(i: number, forced?: Beat['transition']) {
    if (i > this.index && i < this.beats.length) this.go(i, 1, forced);
  }

  /** Back one screen; roads are skipped (the riders glide back to the previous stop). */
  prev() {
    if (performance.now() < this.busyUntil) return;
    let i = this.index - 1;
    while (i > 0 && (this.beats[i].kind === 'road' || this.beats[i].kind === 'gate')) i--;
    if (i >= 1) this.go(i, -1);
  }

  /** Jump to a beat already experienced (from the menu). */
  jump(i: number) {
    if (i < 0 || i > this.furthest || i === this.index) return;
    this.go(i, i > this.index ? 1 : -1, 'dark');
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (p) clearTimeout(this.autoTimer);
    else this.scheduleAuto();
    this.emit();
  }

  /** Who drives at a beat: Gia in the present-day opening and until the bump; Jesus after. */
  driverFor(b: Beat): 'gia' | 'jesus' {
    if (b.kind === 'opening' || b.kind === 'gate' || b.kind === 'rewind') return 'gia';
    return this.incidentDone ? 'jesus' : 'gia';
  }

  private go(i: number, dir: 1 | -1, forced?: Beat['transition']) {
    const beat = this.beats[i];
    if (!beat) return;
    clearTimeout(this.autoTimer);
    clearTimeout(this.hintTimer);
    this.hintEl.classList.remove('is-on');

    const prev = this.current;
    const seen = this.seen.has(i);
    this.index = i;
    this.furthest = Math.max(this.furthest, i);
    this.seen.add(i);
    this.lockLevel = 'none';
    this.mediaBusy = false;

    const ctx: SceneCtx = {
      world: this.o.world,
      audio: this.o.audio,
      quality: this.o.quality,
      reduced: this.o.reduced(),
      seen,
      next: () => this.next(),
      prev: () => this.prev(),
      lock: (l) => {
        if (this.index === i) this.lockLevel = l;
        if (l === 'none') this.armHint();
      },
      mediaPlaying: (on) => {
        if (this.index !== i) return;
        this.mediaBusy = on;
        this.emit();
      },
    };
    const scene = SCENES[beat.kind](beat, ctx);
    scene.el.dataset.beat = beat.id;
    this.current = { beat, scene };

    // world + sound
    const w = this.o.world;
    const reduced = this.o.reduced();
    w.setMood(beat.mood);
    if (beat.kind !== 'road') w.setTarget(beat.u, (forced === 'cut' && !prev) || reduced);
    w.setRiding(beat.kind === 'road');
    w.setReveal(beat.kind === 'gate' ? 0 : 1);
    w.setRidersVisible(beat.kind !== 'gate');
    w.setFrame(beat.frame);
    w.setDriver(this.driverFor(beat), false);
    this.o.audio.setMood(beat.mood);
    // the soundtrack is whichever available track was most recently cued at or before this beat
    for (let k = i; k >= 0; k--) {
      const id = this.beats[k].music;
      if (id && this.o.audio.hasTrack(id)) {
        this.o.audio.playTrack(id);
        break;
      }
    }

    document.body.dataset.phase = beat.kind === 'gate' ? 'gate' : beat.kind;
    document.body.dataset.mood = beat.mood;

    // mount + transition
    this.scenesEl.append(scene.el);
    prev?.scene.leave?.();
    if (prev) prev.scene.el.classList.add('is-leaving');
    const name = forced ?? (dir === 1 ? beat.transition ?? 'depth' : 'depth');
    this.busyUntil = performance.now() + (reduced ? 450 : Math.min(ARRIVAL[name] + 450, 1300));

    const arrive = reduced ? 250 : ARRIVAL[name];
    window.setTimeout(() => {
      if (this.current?.scene !== scene) return;
      scene.el.classList.add('is-in');
      scene.enter?.();
      this.armHint();
    }, arrive);

    transition(name, prev?.scene.el ?? null, scene.el, dir, { reduced, blur: this.o.quality.blur, lightLayer: this.lightLayer }).then(() => {
      if (prev) {
        prev.scene.dispose?.();
        prev.scene.el.remove();
      }
    });

    this.scheduleAuto();
    // warm the next few beats' images
    for (let k = 1; k <= 3; k++) {
      const b = this.beats[i + k];
      if (b) preload(mediaInBeat(b.data));
    }
    this.o.onChange?.(i);
    this.emit();
  }

  private scheduleAuto() {
    clearTimeout(this.autoTimer);
    const b = this.current?.beat;
    if (!b?.auto || this.paused) return;
    const at = b.auto + (this.o.reduced() ? 600 : 0);
    this.autoTimer = window.setTimeout(() => {
      if (this.current?.beat === b && !this.paused) this.next();
    }, at);
  }

  /** The gentle "touch to continue": only after she lingers, and only where taps move on. */
  private armHint() {
    clearTimeout(this.hintTimer);
    this.hintEl.classList.remove('is-on');
    const cur = this.current;
    if (!cur || cur.scene.hint === false || this.lockLevel !== 'none' || cur.beat.kind === 'stop' || isRideBeat(cur.beat)) return;
    this.hintTimer = window.setTimeout(() => {
      if (this.current !== cur || this.lockLevel !== 'none') return;
      const text = typeof cur.scene.hint === 'string' ? cur.scene.hint : this.hintsShown < 3 ? 'Touch to continue' : '';
      (this.hintEl.querySelector('.hint-text') as HTMLElement).textContent = text;
      this.hintsShown++;
      this.hintEl.classList.add('is-on');
    }, 4200);
  }

  // ------------------------------------------------------------------ input

  private bindInput() {
    const stage = this.o.stage;
    let sx = 0,
      sy = 0,
      st = 0,
      id = -1,
      fromInteractive = false;

    const interactive = (t: EventTarget | null) =>
      !!(t as HTMLElement | null)?.closest?.('button, a, input, video, [data-interactive], .controls, .menu, .dock');

    stage.addEventListener('pointerdown', (e) => {
      if (id !== -1) return;
      id = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      st = performance.now();
      fromInteractive = interactive(e.target);
    });

    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      if (e.type === 'pointercancel') return;
      const dy = e.clientY - sy;
      const dx = e.clientX - sx;
      const dt = performance.now() - st;
      const v = Math.abs(dy) / Math.max(dt, 1);
      const vertical = Math.abs(dy) > Math.abs(dx);
      if (vertical && (dy < -60 || (dy < -25 && v > 0.5))) {
        if (this.lockLevel !== 'all') this.next();
        return;
      }
      if (vertical && (dy > 60 || (dy > 25 && v > 0.5))) {
        this.prev();
        return;
      }
      // tap
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 500 && !fromInteractive) {
        if (this.current?.scene.onTap?.()) return;
        if (this.lockLevel === 'none') this.next();
      }
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);

    window.addEventListener('keydown', (e) => {
      if (this.paused || (e.target as HTMLElement)?.closest?.('button, input, video, .menu')) return;
      if (['ArrowRight', 'ArrowDown', 'Enter', 'PageDown'].includes(e.key)) {
        if (isRideBeat(this.beat)) return; // the ride control handles these
        e.preventDefault();
        if (this.current?.scene.onTap?.()) return;
        if (this.lockLevel !== 'all') this.next();
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        this.prev();
      }
    });

    // desktop trackpads / mouse wheels
    let acc = 0;
    let cool = 0;
    window.addEventListener(
      'wheel',
      (e) => {
        if ((e.target as HTMLElement)?.closest?.('.scroll, .menu')) return;
        e.preventDefault();
        const now = performance.now();
        if (now < cool) return;
        acc += e.deltaY;
        if (Math.abs(acc) > 70) {
          if (acc > 0 && this.lockLevel !== 'all') this.next();
          else if (acc < 0) this.prev();
          acc = 0;
          cool = now + 1100;
        }
      },
      { passive: false },
    );
  }
}
