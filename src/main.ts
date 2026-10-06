import './styles/tokens.css';
import './styles/base.css';
import './styles/scenes.css';
import { audio } from './audio/AudioManager';
import { buildBeats } from './experience/beats';
import { Director } from './experience/Director';
import { mountControls } from './experience/Controls';
import { Ride } from './experience/Ride';
import { FallbackWorld } from './three/FallbackWorld';
import { checkAssets, isMissing } from './media/media';
import { ALL_ASSETS } from './content/manifest';
import type { WorldApi } from './three/moods';
import { detectQuality, prefersReducedMotion, store } from './utils/device';
import { h } from './utils/dom';

/**
 * BOOT
 * 1. Build the beat list from content.
 * 2. Show the first screen immediately with a CSS world.
 * 3. Load the WebGL world in the background (separate chunk) and swap it in.
 */

const app = document.getElementById('app')!;
const params = new URLSearchParams(location.search);
const quality = detectQuality();
const { beats, lanterns } = buildBeats();
// find out which media files exist yet; missing ones show as labelled placeholders
const assetCheck = checkAssets(ALL_ASSETS.flatMap((a) => [a.src, a.poster ?? '']));

let reduced = store.get('motion') ? store.get('motion') === 'reduced' : prefersReducedMotion();
document.body.classList.toggle('reduced', reduced);

const worldHost = h('div.world');
const canvas = h<HTMLCanvasElement>('canvas.world-canvas', { 'aria-hidden': 'true' });
const stage = h('main.stage');
const overlay = h('div.overlay');
worldHost.append(canvas);
app.append(worldHost, stage, overlay);

// A proxy so the director can talk to whichever world is active.
let world: WorldApi = new FallbackWorld(worldHost);
const state: { mood?: any; u?: number; reveal?: number; focus?: number; frame?: any; riders?: boolean; driver?: 'gia' | 'jesus'; riding?: boolean; obstacle?: [number | null, (() => void) | undefined] } = {};
const proxy: WorldApi = {
  setMood: (m) => ((state.mood = m), world.setMood(m)),
  setTarget: (u, i) => ((state.u = u), world.setTarget(u, i)),
  setRiding: (r) => ((state.riding = r), world.setRiding(r)),
  setReveal: (v) => ((state.reveal = v), world.setReveal(v)),
  setFocus: (f) => ((state.focus = f), world.setFocus(f)),
  setReducedMotion: (r) => world.setReducedMotion(r),
  setIdle: (i) => world.setIdle(i),
  setFrame: (f) => ((state.frame = f), world.setFrame(f)),
  setRidersVisible: (v) => ((state.riders = v), world.setRidersVisible(v)),
  setDriver: (d, a) => ((state.driver = d), world.setDriver(d, a)),
  setObstacle: (u, c) => ((state.obstacle = [u, c]), world.setObstacle(u, c)),
  react: () => world.react(),
  wave: (ms) => world.wave(ms),
  getAnchor: (who) => world.getAnchor(who),
  getRidersRect: () => world.getRidersRect(),
  dispose: () => world.dispose(),
};

const director = new Director({
  stage,
  world: proxy,
  audio,
  quality,
  beats,
  reduced: () => reduced,
  onChange: (i) => {
    if (dev) dev.textContent = `${i} · ${beats[i].id} · ${beats[i].kind} · ${beats[i].mood}`;
  },
});

const ride = new Ride({ root: overlay, director, world: proxy, reduced: () => reduced });

mountControls(overlay, director, audio, {
  get: () => reduced,
  set: (v) => {
    reduced = v;
    store.set('motion', v ? 'reduced' : 'full');
    document.body.classList.toggle('reduced', v);
    proxy.setReducedMotion(v);
  },
});

// ?media lists every file in the manifest: found, or still a placeholder.
if (params.has('media')) {
  assetCheck.then(() => {
    const rows = ALL_ASSETS.flatMap((a) => {
      const files = [a.src, ...(a.poster ? [a.poster] : [])];
      return files.map((f, i) =>
        h('tr', { class: isMissing(f) ? 'is-missing' : 'is-found' }, [
          h('td', { text: isMissing(f) ? (a.required && i === 0 ? 'Needed' : 'Optional') : 'Found' }),
          h('td', { text: a.scene }),
          h('td', { text: i === 0 ? a.label : 'Poster / fallback still' }),
          h('td.mf-path', { text: `public${f}` }),
        ]),
      );
    });
    overlay.append(
      h('div.media-panel', { 'data-interactive': '' }, [
        h('p.kicker', { text: 'Media manifest · src/content/manifest.ts' }),
        h('table', {}, [h('tbody', {}, rows)]),
        h('button.mf-close', { type: 'button', onclick: (e: Event) => (e.currentTarget as HTMLElement).parentElement!.remove() }, [h('span', { text: 'Close' })]),
      ]),
    );
  });
}

// Developer helpers: ?dev shows the beat id, ?beat=12 or ?beat=summer:skills starts there.
const dev = params.has('dev') ? h('div.dev-badge') : null;
if (params.has('dev')) Object.assign(window as any, { __director: director, __ride: ride });
if (dev) overlay.append(dev);
const startParam = params.get('beat');
let startAt = 0;
if (startParam) {
  const n = Number(startParam);
  startAt = Number.isFinite(n) ? n : Math.max(0, beats.findIndex((b) => b.id === startParam || b.id.startsWith(startParam)));
}
// starting past the first stretch (dev only): Jesus is already at the wheel
const firstRoad = beats.findIndex((b) => b.kind === 'road');
director.incidentDone = firstRoad >= 0 && startAt > firstRoad;
// the first screen needs no media; a later start waits for the file check so placeholders are right
if (startAt === 0) director.start(0);
else assetCheck.finally(() => director.start(startAt));

// Load the WebGL world after first paint.
if (quality.tier !== 'none') {
  const load = () =>
    import('./three/World')
      .then(({ World }) => {
        const w = new World(canvas, lanterns, quality);
        w.setReducedMotion(reduced);
        if (state.mood) w.setMood(state.mood);
        if (state.u != null) w.setTarget(state.u, true);
        if (state.reveal != null) w.setReveal(state.reveal);
        if (state.focus != null) w.setFocus(state.focus);
        if (state.frame) w.setFrame(state.frame);
        if (state.riders != null) w.setRidersVisible(state.riders);
        if (state.driver) w.setDriver(state.driver, false);
        if (state.riding != null) w.setRiding(state.riding);
        if (state.obstacle?.[0] != null) w.setObstacle(...state.obstacle);
        world.dispose();
        world = w;
        if (params.has('dev')) {
          // QA helper: advance the world N frames and save what the WebGL layer shows to .qa/<name>.jpg
          (window as any).__world = w;
          (window as any).__qa = async (name = 'shot', frames = 300) => {
            const ww = w as any;
            for (let i = 0; i < frames; i++) ww.tick(1 / 60, performance.now());
            const gl = ww.renderer.getContext() as WebGLRenderingContext;
            const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
            const px = new Uint8Array(W * H * 4);
            gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
            const c = document.createElement('canvas');
            c.width = W;
            c.height = H;
            const ctx = c.getContext('2d')!;
            const img = ctx.createImageData(W, H);
            for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
            ctx.putImageData(img, 0, 0);
            await fetch(`/__qa/${name}`, { method: 'POST', body: c.toDataURL('image/jpeg', 0.85) });
            return 'saved';
          };
          // QA helper: one contact sheet of the riders in several framings → .qa/<name>.jpg
          (window as any).__qaSheet = async (frames: string[], name = 'sheet') => {
            const ww = w as any;
            const gl = ww.renderer.getContext() as WebGLRenderingContext;
            const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
            const tw = Math.round(W / 2), th = Math.round(H / 2);
            const sheet = document.createElement('canvas');
            sheet.width = tw * frames.length;
            sheet.height = th;
            const sc = sheet.getContext('2d')!;
            const tmp = document.createElement('canvas');
            tmp.width = W;
            tmp.height = H;
            const tc = tmp.getContext('2d')!;
            for (let n = 0; n < frames.length; n++) {
              ww.setFrame(frames[n]);
              for (let i = 0; i < 500; i++) ww.tick(1 / 60, performance.now());
              const px = new Uint8Array(W * H * 4);
              gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
              const img = tc.createImageData(W, H);
              for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
              tc.putImageData(img, 0, 0);
              sc.drawImage(tmp, n * tw, 0, tw, th);
              sc.fillStyle = '#000';
              sc.font = '20px sans-serif';
              sc.fillText(frames[n], n * tw + 8, 24);
            }
            await fetch(`/__qa/${name}`, { method: 'POST', body: sheet.toDataURL('image/jpeg', 0.8) });
            return 'saved';
          };
        }
        document.body.classList.add('has-webgl');
      })
      .catch((e) => console.warn('WebGL world unavailable, staying on CSS world', e));
  ('requestIdleCallback' in window ? (window as any).requestIdleCallback : setTimeout)(load, { timeout: 800 });
}

// Keep the layout honest on iOS where innerHeight changes with browser chrome.
const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
setVh();
window.addEventListener('resize', setVh);
