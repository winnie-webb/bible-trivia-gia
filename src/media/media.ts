import type { MediaItem } from '../content/types';
import { h } from '../utils/dom';

/**
 * MEDIA ENGINE
 * - Images: <picture> with optional modern sources + srcset, async decode.
 * - Videos: inline (never forced fullscreen), poster first, metadata-only preload.
 * - Placeholders: a missing required file renders a labelled "needed" frame
 *   (with its expected path), and placeholder videos simulate playback so the
 *   controls can still be felt. Missing optional files are simply left out.
 */

export const isPlaceholder = (src?: string) => !!src && src.startsWith('placeholder:');

/** Files confirmed missing by the startup check (see checkAssets). */
const missing = new Set<string>();
export const isMissing = (src?: string) => !src || isPlaceholder(src) || missing.has(src);
let checked: Promise<void> = Promise.resolve();
/** Resolves once the startup check has finished. */
export const assetsChecked = () => checked;

/** The items worth showing: everything present, plus placeholders for required ones that are missing. */
export const shown = (items: MediaItem[]) => items.filter((m) => m.required || !isMissing(m.src) || (m.type === 'video' && m.poster && !isMissing(m.poster)));

/** A missing video whose poster exists is shown as that photo instead. */
export const asStill = (m: MediaItem): MediaItem | null =>
  m.type === 'video' && isMissing(m.src) && m.poster && !isMissing(m.poster) ? { ...m, type: 'image', src: m.poster } : null;

/**
 * At startup, ask the server whether each referenced file exists.
 * Missing files render as labelled "asset needed" frames instead of broken media.
 * (Dev servers and many static hosts answer missing files with index.html, so
 * an HTML content-type also counts as missing.)
 */
export function checkAssets(urls: string[], timeoutMs = 3000): Promise<void> {
  checked = runCheck(urls, timeoutMs);
  return checked;
}

async function runCheck(urls: string[], timeoutMs: number): Promise<void> {
  const unique = [...new Set(urls.filter((u) => u && !isPlaceholder(u)))];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  await Promise.all(
    unique.map(async (u) => {
      try {
        const r = await fetch(u, { method: 'HEAD', signal: ctrl.signal, cache: 'no-store' });
        const type = r.headers.get('content-type') || '';
        // an empty file (a copy that didn't finish) counts as missing too
        if (!r.ok || type.includes('text/html') || r.headers.get('content-length') === '0') missing.add(u);
      } catch {
        /* unknown → assume present; images still fall back on error */
      }
    }),
  );
  clearTimeout(timer);
}

interface PhInfo {
  label?: string;
  required?: boolean;
  alt?: string;
}

/** A clearly-marked development placeholder — never pretends to be the real asset. */
export function placeholderFrame(src: string, orientation: string, kind = 'photo', info: PhInfo = {}): HTMLElement {
  const name = isPlaceholder(src) ? src.slice('placeholder:'.length) : info.label || info.alt || 'Media';
  const file = isPlaceholder(src) ? '' : `public${src}`;
  const status = info.required === false ? 'Optional · placeholder' : 'Placeholder · file needed';
  return h(`div.ph.ph-${orientation}`, { 'data-kind': kind, role: 'img', 'aria-label': info.alt || name }, [
    h('div.ph-grain'),
    h('div.ph-label', {}, [
      h('span.ph-kind', { text: kind === 'video' ? '▶ Video slot' : kind === 'art' ? 'Artwork slot' : 'Image slot' }),
      h('span.ph-name', { text: name }),
      file ? h('span.ph-file', { text: file }) : null,
      h(`span.ph-status${info.required === false ? '' : '.st-find'}`, { text: status }),
    ]),
  ]);
}

/** A still image (or a placeholder) filling its parent with object-fit: cover. */
export function picture(item: Pick<MediaItem, 'src' | 'srcset' | 'sources' | 'alt' | 'focal' | 'orientation'> & PhInfo, cls = '', kind = 'photo'): HTMLElement {
  const ph = () => {
    const el = placeholderFrame(item.src, item.orientation ?? 'portrait', kind, item);
    if (cls) el.classList.add(...cls.split(' '));
    return el;
  };
  if (isMissing(item.src)) return ph();
  const img = h<HTMLImageElement>('img', { src: item.src, srcset: item.srcset, alt: item.alt, decoding: 'async', sizes: '100vw' });
  if (item.focal) img.style.objectPosition = item.focal;
  const pic = h(`picture.media${cls ? '.' + cls.split(' ').join('.') : ''}`, {}, [
    ...(item.sources ?? []).map((s) => h('source', { srcset: s.src, type: s.type })),
    img,
  ]);
  // if the startup check hadn't finished, still never show a broken image
  img.addEventListener('error', () => pic.replaceWith(ph()), { once: true });
  return pic;
}

/** Anything a scene needs from a video, real or placeholder. */
export interface Player extends EventTarget {
  readonly el: HTMLElement;
  readonly paused: boolean;
  readonly placeholder: boolean;
  play(): Promise<void> | void;
  pause(): void;
  restart(): void;
  showControls(on: boolean): void;
  dispose(): void;
}

class VideoPlayer extends EventTarget implements Player {
  el: HTMLElement;
  video: HTMLVideoElement;
  placeholder = false;
  constructor(item: MediaItem) {
    super();
    this.video = h<HTMLVideoElement>('video', {
      src: item.src,
      poster: item.poster && !isMissing(item.poster) ? item.poster : undefined,
      playsinline: true,
      'webkit-playsinline': true,
      preload: 'metadata',
      'aria-label': item.alt,
      controlslist: 'nodownload noplaybackrate',
      disablepictureinpicture: true,
    });
    if (item.ambient) {
      this.video.muted = true;
      this.video.loop = true;
      this.video.autoplay = true;
    }
    if (item.focal) this.video.style.objectPosition = item.focal;
    this.el = h('div.media.video-media', {}, [this.video]);
    // a file that fails to load still never looks broken
    this.video.addEventListener('error', () => this.el.append(placeholderFrame(item.src, item.orientation, 'video', item)), { once: true });
    for (const ev of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata']) {
      this.video.addEventListener(ev, () => this.dispatchEvent(new Event(ev)));
    }
  }
  get paused() {
    return this.video.paused;
  }
  play() {
    return this.video.play().catch(() => {
      // autoplay with sound refused: fall back to native controls
      this.showControls(true);
    });
  }
  pause() {
    this.video.pause();
  }
  restart() {
    this.video.currentTime = 0;
    this.play();
  }
  showControls(on: boolean) {
    this.video.controls = on;
  }
  dispose() {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load(); // releases the decoder on iOS
  }
}

/** Simulated video so the whole engine can be felt before real files exist. */
class PlaceholderPlayer extends EventTarget implements Player {
  el: HTMLElement;
  placeholder = true;
  private bar: HTMLElement;
  private t = 0;
  private dur = 10;
  private timer = 0;
  private _paused = true;
  constructor(item: MediaItem) {
    super();
    this.bar = h('div.ph-progress-bar');
    this.el = h('div.media.video-media.is-placeholder', {}, [
      placeholderFrame(item.src, item.orientation, 'video', item),
      h('div.ph-progress', {}, [this.bar]),
    ]);
  }
  get paused() {
    return this._paused;
  }
  play() {
    if (!this._paused) return;
    if (this.t >= this.dur) this.t = 0;
    this._paused = false;
    this.el.classList.add('is-playing');
    this.dispatchEvent(new Event('play'));
    let last = performance.now();
    const step = (now: number) => {
      this.t += (now - last) / 1000;
      last = now;
      this.bar.style.transform = `scaleX(${Math.min(this.t / this.dur, 1)})`;
      if (this.t >= this.dur) {
        this._paused = true;
        this.el.classList.remove('is-playing');
        this.dispatchEvent(new Event('pause'));
        this.dispatchEvent(new Event('ended'));
        return;
      }
      this.timer = requestAnimationFrame(step);
    };
    this.timer = requestAnimationFrame(step);
  }
  pause() {
    if (this._paused) return;
    cancelAnimationFrame(this.timer);
    this._paused = true;
    this.el.classList.remove('is-playing');
    this.dispatchEvent(new Event('pause'));
  }
  restart() {
    this.pause();
    this.t = 0;
    this.play();
  }
  showControls() {}
  dispose() {
    cancelAnimationFrame(this.timer);
  }
}

export function createPlayer(item: MediaItem): Player {
  return isMissing(item.src) ? new PlaceholderPlayer(item) : new VideoPlayer(item);
}

/** Media element for any item: image/screenshot/call → picture; video → player.el */
export function mediaElement(item: MediaItem, cls = ''): { el: HTMLElement; player?: Player } {
  if (item.type === 'video') {
    const player = createPlayer(item);
    if (cls) player.el.classList.add(...cls.split(' '));
    return { el: player.el, player };
  }
  return { el: picture(item, cls) };
}

// ---------- preloading ----------

const warmed = new Set<string>();

/** Fetch images for upcoming beats ahead of time (posters for videos). */
export function preload(items: (MediaItem | { src: string; poster?: string; type?: string })[]) {
  for (const it of items) {
    const url = it.type === 'video' ? it.poster : it.src;
    if (!url || isMissing(url) || warmed.has(url)) continue;
    warmed.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

/** Collect every media item referenced by a beat's data. */
export function mediaInBeat(data: any): MediaItem[] {
  const out: MediaItem[] = [];
  const visit = (v: any, depth = 0) => {
    if (!v || typeof v !== 'object' || depth > 4) return;
    if (typeof v.src === 'string') out.push(v);
    if (typeof v.poster === 'string') out.push({ ...v, src: v.poster, type: 'image' });
    for (const k of Object.keys(v)) visit(v[k], depth + 1);
  };
  visit(data);
  return out;
}
