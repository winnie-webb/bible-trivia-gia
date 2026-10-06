import { stops } from '../content/journey';
import { rideText } from '../content/ride';
import { speechBubble } from '../scenes/bubble';
import type { WorldApi } from '../three/moods';
import { h } from '../utils/dom';
import { STOP_COUNT, type Beat } from './beats';
import type { Director } from './Director';

/**
 * THE RIDE CONTROL
 * The cross carries us between stops, and she drives the pace:
 *   hold the button (touch, mouse, or Space)   → the cross rides; let go → it slows to a stop
 *   tap it once                                → rides hands-free; tap again to stop
 *   arriving at a memory                       → the ride stops and the memory opens
 * Riding never passes an unopened memory or interrupts a video, and pauses
 * when the page loses focus, is hidden, or the menu opens.
 * With reduced motion the button becomes "Next stop" (no riding animation).
 *
 * Also owns the route map (top left) and the playful bump on the first stretch.
 */

interface Opts {
  root: HTMLElement;
  director: Director;
  world: WorldApi;
  reduced: () => boolean;
}

type Mode = 'hidden' | 'next' | 'ride';

const RING =
  '<svg viewBox="0 0 40 40" aria-hidden="true"><circle class="rr-track" cx="20" cy="20" r="17"/><circle class="rr-fill" cx="20" cy="20" r="17" pathLength="1"/><path class="rr-cross" d="M20 11v18M14.5 17h11"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const QUICK_TAP_MS = 280;
const ARRIVAL_LOCK_MS = 1400;

export class Ride {
  private o: Opts;
  private dock: HTMLElement;
  private btn: HTMLButtonElement;
  private label: HTMLElement;
  private hint: HTMLElement;
  private nextBtn: HTMLButtonElement;
  private dots: HTMLElement;
  private route: HTMLElement;
  private routeDots: HTMLElement[];
  private routeMarker: HTMLElement;
  private routeLabel: HTMLElement;
  private live: HTMLElement;
  private bubble: ReturnType<typeof speechBubble>;

  private mode: Mode = 'hidden';
  private holding = false;
  private pressing = false;
  private handsFree = false;
  private wasHandsFree = false;
  private pressAt = 0;
  private p = 0;
  private v = 0;
  private raf = 0;
  private last = 0;
  private roadAt = -1;
  private lockUntil = 0;
  private rides = 0;
  private incident: 'none' | 'armed' | 'waiting' | 'playing' = 'none';
  private timers: number[] = [];

  constructor(o: Opts) {
    this.o = o;
    this.label = h('span.ride-label', { text: rideText.hold });
    this.btn = h<HTMLButtonElement>('button.ride-btn', { type: 'button', 'aria-pressed': 'false' }, [h('span.ride-ring', { html: RING }), this.label]);
    this.hint = h('p.ride-hint', { text: rideText.hint });
    this.nextBtn = h<HTMLButtonElement>('button.dock-next', { type: 'button', 'aria-label': 'Next memory' }, [h('span', { text: rideText.next }), h('span.dn-arrow', { html: ARROW })]);
    this.dots = h('div.dock-dots', { 'aria-hidden': 'true' });
    this.dock = h('div.dock', { 'data-mode': 'hidden' }, [
      h('div.dock-panel', {}, [this.dots, this.nextBtn]),
      h('div.dock-ride', {}, [this.btn, this.hint]),
    ]);

    this.routeDots = stops.map((s, i) => h('span.rt-dot', { style: { left: `${(i / STOP_COUNT) * 100}%` }, title: s.name }));
    this.routeMarker = h('span.rt-marker');
    this.routeLabel = h('p.rt-label');
    this.route = h('nav.route', { 'aria-hidden': 'true' }, [
      h('div.rt-line', {}, [h('span.rt-fill'), ...this.routeDots, h('span.rt-end', { style: { left: '100%' } }), this.routeMarker]),
      this.routeLabel,
    ]);
    this.live = h('p.sr-only', { 'aria-live': 'polite' });
    this.bubble = speechBubble('', 'jesus', o.world);
    o.root.append(this.route, this.dock, this.live, this.bubble.el);

    this.bindInput();
    o.director.subscribe(() => this.sync());
  }

  // ------------------------------------------------------------------ state

  private get beat(): Beat | undefined {
    return this.o.director.beat;
  }

  /** Bring the dock, route and riding state in line with the current beat. */
  private sync() {
    const d = this.o.director;
    const b = this.beat;
    if (!b) return;
    const reduced = this.o.reduced();

    // entering a road: start the stretch
    if (b.kind === 'road' && this.roadAt !== d.index) {
      this.roadAt = d.index;
      this.p = 0;
      this.v = 0;
      this.clearTimers();
      const r = b.road!;
      if (r.incident && !d.incidentDone) {
        this.incident = 'armed';
        this.bubble.el.querySelector('span')!.textContent = r.incident.bubble;
        if (reduced) this.later(500, () => this.playIncident());
        else this.o.world.setObstacle(r.uStart + r.incident.at * (r.uEnd - r.uStart) - 0.0015, () => this.playIncident());
      } else this.incident = 'none';
      this.loop();
    }
    // leaving a road any other way (back, menu): let go of everything
    if (b.kind !== 'road' && this.roadAt !== -1) {
      this.roadAt = -1;
      this.release(false);
      this.handsFree = false;
      if (this.incident !== 'none') {
        this.clearTimers();
        this.incident = 'none';
        this.bubble.hide();
        this.o.world.setObstacle(null);
      }
    }
    if (d.isPaused) this.halt();

    const film = b.kind === 'stop' && b.data.panel.layout === 'film';
    this.mode = film ? 'hidden' : b.kind === 'road' || b.rideOut ? 'ride' : b.kind === 'stop' ? 'next' : 'hidden';
    this.dock.dataset.mode = this.mode;
    if (this.mode === 'next') {
      const { index, count } = b.data;
      this.dots.replaceChildren(...Array.from({ length: count }, (_, i) => h(`span${i === index ? '.is-on' : ''}`)));
    }
    this.renderButton();
    this.renderRoute();
  }

  private renderButton() {
    const reduced = this.o.reduced();
    const blocked = this.blocked();
    const busy = this.o.director.mediaBusy;
    this.btn.disabled = blocked && !this.pressing;
    this.btn.classList.toggle('is-riding', this.v > 0.001 || this.holding || this.handsFree);
    this.btn.setAttribute('aria-pressed', String(this.handsFree));
    this.label.textContent = reduced ? rideText.nextStop : busy ? 'Video playing' : this.handsFree ? rideText.handsFree : this.holding ? rideText.riding : rideText.hold;
    this.btn.setAttribute(
      'aria-label',
      reduced ? 'Next stop' : this.handsFree ? 'Riding hands-free. Tap to stop.' : 'Hold to ride to the next memory, or tap once to ride hands-free.',
    );
    this.dock.classList.toggle('show-hint', !reduced && this.rides < 2 && this.mode === 'ride');
    this.dock.classList.toggle('is-reduced', reduced);
    this.dock.classList.toggle('is-blocked', blocked);
    this.dock.style.setProperty('--p', this.beat?.kind === 'road' ? this.p.toFixed(3) : '0');
  }

  private renderRoute() {
    const b = this.beat;
    const show = !!b && (b.kind === 'stop' || b.kind === 'road');
    this.route.classList.toggle('is-on', show);
    if (!b || !show) return;
    const at = b.kind === 'road' ? b.road!.from + this.p : (b.stop ?? 0);
    const reached = b.kind === 'road' ? b.road!.from : (b.stop ?? 0);
    this.route.style.setProperty('--at', (at / STOP_COUNT).toFixed(4));
    this.routeDots.forEach((d, i) => {
      d.classList.toggle('is-past', i <= reached);
      d.classList.toggle('is-here', b.kind === 'stop' && i === b.stop);
    });
    if (b.kind === 'stop') this.routeLabel.textContent = `${b.stop! + 1} of ${STOP_COUNT} · ${stops[b.stop!].name}`;
    else this.routeLabel.textContent = b.road!.to < STOP_COUNT ? `On the way to stop ${b.road!.to + 1}` : 'Into your twenties';
  }

  /** Riding is not possible right now. */
  private blocked() {
    const d = this.o.director;
    return this.mode !== 'ride' || d.mediaBusy || d.isPaused || performance.now() < this.lockUntil || this.incident === 'waiting' || this.incident === 'playing';
  }

  // ------------------------------------------------------------------ input

  private bindInput() {
    const btn = this.btn;
    btn.addEventListener('pointerdown', (e) => {
      if (this.o.reduced() || e.button > 0) return;
      e.preventDefault();
      try {
        btn.setPointerCapture(e.pointerId); // keep the hold even if the finger drifts off the button
      } catch {
        /* synthetic or already-released pointer */
      }
      this.press();
    });
    const up = (e: PointerEvent) => this.release(e.type === 'pointerup');
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', () => this.pressing && this.release(false));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    // clicks only matter for the keyboard (Enter) and in reduced motion
    btn.addEventListener('click', (e) => {
      if (this.o.reduced()) return this.step();
      if (e.detail === 0) this.toggleHandsFree();
    });
    this.nextBtn.addEventListener('click', () => this.o.director.next());

    window.addEventListener('keydown', (e) => {
      if (this.mode !== 'ride' || this.o.director.isPaused) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('input, video, .menu')) return;
      if (e.key === ' ') {
        e.preventDefault(); // also keeps a focused button from "clicking"
        if (e.repeat) return;
        if (this.o.reduced()) return this.step();
        this.press();
      } else if (['ArrowRight', 'ArrowDown', 'Enter', 'PageDown'].includes(e.key) && !t?.closest?.('button')) {
        e.preventDefault();
        if (this.o.reduced()) this.step();
        else this.toggleHandsFree();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key !== ' ' || !this.pressing) return;
      e.preventDefault();
      this.release(true);
    });

    // pause whenever she leaves
    window.addEventListener('blur', () => this.halt());
    document.addEventListener('visibilitychange', () => document.hidden && this.halt());
  }

  /** Finger / mouse / Space goes down on the ride control. */
  private press() {
    if (this.blocked()) return;
    this.pressing = true;
    this.pressAt = performance.now();
    this.wasHandsFree = this.handsFree;
    this.holding = true;
    this.handsFree = false;
    this.rides++;
    // from a stop: leave it and set off
    if (this.beat?.kind === 'stop') this.o.director.advance('depth');
    this.loop();
    this.renderButton();
  }

  /** …and comes back up. A quick tap toggles hands-free riding. */
  private release(maybeTap: boolean) {
    if (!this.pressing) return;
    this.pressing = false;
    this.holding = false;
    if (maybeTap && performance.now() - this.pressAt < QUICK_TAP_MS) this.handsFree = !this.wasHandsFree;
    this.renderButton();
  }

  private toggleHandsFree() {
    if (this.handsFree) {
      this.handsFree = false;
      return this.renderButton();
    }
    if (this.blocked()) return;
    this.rides++;
    if (this.beat?.kind === 'stop') this.o.director.advance('depth');
    this.handsFree = true;
    this.loop();
    this.renderButton();
  }

  /** Stop at once (focus lost, page hidden, menu open). */
  private halt() {
    this.pressing = false;
    this.holding = false;
    this.handsFree = false;
    this.v = 0;
    this.renderButton();
  }

  /** Reduced motion: no riding animation, one step to the next stop. */
  private step() {
    if (this.blocked()) return;
    const d = this.o.director;
    const b = this.beat;
    if (!b) return;
    if (b.kind === 'stop') {
      const road = d.beats[d.index + 1];
      // a road with nothing to show is skipped entirely
      if (road?.kind === 'road' && !road.road!.line && !(road.road!.incident && !d.incidentDone)) {
        this.o.world.setTarget(road.road!.uEnd, true);
        // a beat to take in the new stop before the next tap can move on
        this.lockUntil = performance.now() + ARRIVAL_LOCK_MS;
        window.setTimeout(() => this.renderButton(), ARRIVAL_LOCK_MS + 20);
        d.to(d.index + 2, 'dissolve');
      } else d.advance('dissolve');
    } else if (b.kind === 'road' && this.incident === 'none') this.arrive();
  }

  // ------------------------------------------------------------------ riding

  private loop() {
    if (this.raf) return;
    this.last = performance.now();
    const tick = (now: number) => {
      const b = this.beat;
      if (!b || b.kind !== 'road') {
        this.raf = 0;
        return;
      }
      this.raf = requestAnimationFrame(tick);
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.ride(dt, b);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private ride(dt: number, b: Beat) {
    const r = b.road!;
    if (this.o.reduced()) return;
    const vmax = 1 / r.seconds;
    const going = (this.holding || this.handsFree) && !this.blocked();
    // ease into the stop (or into the cloud)
    const cap = this.incident === 'armed' ? r.incident!.at : 1;
    const vcap = Math.sqrt(2 * (vmax / 0.8) * Math.max(cap - this.p, 0)) + vmax * 0.05;
    if (going) this.v = Math.min(vmax, this.v + (vmax * dt) / 0.45);
    else this.v = Math.max(0, this.v - (vmax * dt) / 0.6);
    this.v = Math.min(this.v, vcap);
    this.p = Math.min(cap, this.p + this.v * dt);
    this.o.world.setTarget(r.uStart + (r.uEnd - r.uStart) * this.p);

    if (this.incident === 'armed' && this.p >= cap - 1e-4) {
      this.incident = 'waiting';
      this.v = 0;
      // the world reports the moment of contact; without riders on screen, carry on anyway
      this.later(1100, () => this.playIncident());
    }
    if (this.p >= 1 - 1e-4) this.arrive();
    this.renderButton();
    this.renderRoute();
  }

  /** The riders reached the stop: stop riding and open the memory. */
  private arrive() {
    const b = this.beat;
    if (!b || b.kind !== 'road') return;
    this.o.world.setTarget(b.road!.uEnd);
    this.pressing = false;
    this.holding = false;
    this.handsFree = false;
    this.v = 0;
    this.p = 1;
    this.lockUntil = performance.now() + ARRIVAL_LOCK_MS;
    const to = b.road!.to;
    this.live.textContent = to < STOP_COUNT ? `${rideText.arrived}: stop ${to + 1} of ${STOP_COUNT}, ${stops[to].name}` : 'Happy 20th Birthday';
    this.o.director.advance('depth');
    window.setTimeout(() => this.renderButton(), ARRIVAL_LOCK_MS + 20);
  }

  /** Bump → everyone startles → "Let me take the wheel." → Jesus and Gia swap seats → ride on. */
  private playIncident() {
    if (this.incident !== 'waiting' && this.incident !== 'armed') return;
    this.incident = 'playing';
    this.clearTimers();
    const w = this.o.world;
    const d = this.o.director;
    const reduced = this.o.reduced();
    this.renderButton();
    if (reduced) {
      this.bubble.show();
      w.setDriver('jesus', false);
      d.incidentDone = true;
      this.later(2800, () => this.finishIncident());
      return;
    }
    // turn to the side so the startle and the seat swap can be seen
    w.setFrame('incident');
    w.react();
    navigator.vibrate?.(12);
    this.later(1200, () => this.bubble.show());
    this.later(2200, () => {
      w.setDriver('jesus', true);
      d.incidentDone = true;
    });
    this.later(4400, () => this.finishIncident());
  }

  private finishIncident() {
    this.bubble.hide();
    this.o.world.setObstacle(null);
    if (this.beat?.kind === 'road') this.o.world.setFrame(this.beat.frame);
    this.incident = 'none';
    this.renderButton();
  }

  private later(ms: number, fn: () => void) {
    this.timers.push(window.setTimeout(fn, ms));
  }
  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
