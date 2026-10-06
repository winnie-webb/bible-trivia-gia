import { config } from '../content/config';
import type { Mood } from '../content/types';
import { store } from '../utils/device';

/**
 * AUDIO ARCHITECTURE
 *
 *   music tracks ─┐
 *   ambient pad ──┼─► music bus ─► duck ─┐
 *                                        ├─► master ─► speakers
 *   voice ───────────► voice bus ────────┘
 *
 * - Nothing makes sound until the first tap (browser autoplay rules).
 * - Any video or narration "ducks" the music, and releases it when done.
 * - Until real tracks are added in config.audio.tracks, a soft generated
 *   pad plays and changes chord with the mood of each scene.
 */

const CHORDS: Record<Mood, number[]> = {
  void: [73.42, 110, 0, 0],
  night: [73.42, 110, 146.83, 164.81],
  storm: [61.74, 92.5, 146.83, 0],
  journey: [73.42, 146.83, 185, 329.63],
  warm: [73.42, 146.83, 220, 329.63],
  joy: [146.83, 220, 246.94, 369.99],
  grace: [98, 146.83, 220, 246.94],
  tender: [82.41, 196, 246.94, 293.66],
  quiet: [73.42, 110, 0, 0],
  theatre: [73.42, 0, 0, 0],
  candle: [73.42, 110, 220, 0],
  dawn: [110, 164.81, 220, 277.18],
  future: [98, 146.83, 246.94, 369.99],
  finale: [73.42, 110, 185, 293.66],
};

class AmbientPad {
  out: GainNode;
  private oscs: { a: OscillatorNode; b: OscillatorNode; g: GainNode }[] = [];
  private filter: BiquadFilterNode;
  private ctx: AudioContext;
  constructor(ctx: AudioContext, dest: AudioNode) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 900;
    this.filter.Q.value = 0.4;
    this.filter.connect(this.out);
    this.out.connect(dest);

    // slow movement in the filter so the pad breathes
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 350;
    lfo.connect(lfoGain).connect(this.filter.frequency);
    lfo.start();

    for (let i = 0; i < 4; i++) {
      const a = ctx.createOscillator();
      const b = ctx.createOscillator();
      const g = ctx.createGain();
      a.type = 'sine';
      b.type = 'triangle';
      b.detune.value = 7 + i * 2;
      a.frequency.value = b.frequency.value = 110;
      g.gain.value = 0;
      a.connect(g);
      b.connect(g);
      g.connect(this.filter);
      a.start();
      b.start();
      this.oscs.push({ a, b, g });
    }

    // a breath of air
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.012;
    noise.connect(bp).connect(ng).connect(this.out);
    noise.start();
  }
  setChord(mood: Mood, seconds = 3) {
    const t = this.ctx.currentTime;
    CHORDS[mood].forEach((f, i) => {
      const o = this.oscs[i];
      if (f > 0) {
        o.a.frequency.setTargetAtTime(f, t, seconds / 3);
        o.b.frequency.setTargetAtTime(f, t, seconds / 3);
      }
      const level = f > 0 ? (i === 0 ? 0.07 : 0.045) : 0;
      o.g.gain.setTargetAtTime(level, t, seconds / 2);
    });
    const bright = mood === 'dawn' || mood === 'future' || mood === 'joy' ? 1500 : mood === 'storm' || mood === 'candle' ? 600 : 950;
    this.filter.frequency.setTargetAtTime(bright, t, seconds / 2);
  }
  fade(to: number, seconds: number) {
    this.out.gain.setTargetAtTime(to, this.ctx.currentTime, seconds / 3);
  }
}

export class AudioManager {
  ctx: AudioContext | null = null;
  enabled = false;
  private master!: GainNode;
  private music!: GainNode;
  private duckNode!: GainNode;
  private voice!: GainNode;
  private pad: AmbientPad | null = null;
  private tracks = new Map<string, { el: HTMLAudioElement; gain: GainNode }>();
  private current: string | null = null;
  private ducks = new Set<object>();
  private mood: Mood = 'void';
  private listeners = new Set<(on: boolean) => void>();

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend();
      else if (this.enabled) this.ctx.resume();
    });
  }

  get preference(): boolean {
    return store.get('sound') !== 'off';
  }

  /** Must be called inside a tap handler. */
  unlock(withSound: boolean) {
    try {
      // iOS: play through the silent switch like a music app
      const nav = navigator as any;
      if (nav.audioSession) nav.audioSession.type = 'playback';
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      this.duckNode = ctx.createGain();
      this.duckNode.connect(this.master);
      this.music = ctx.createGain();
      this.music.gain.value = config.audio.musicVolume;
      this.music.connect(this.duckNode);
      this.voice = ctx.createGain();
      this.voice.connect(this.master);
      this.pad = new AmbientPad(ctx, this.music);
      this.pad.setChord(this.mood, 0.1);
      this.pad.fade(1, 4);
      ctx.resume();
    } catch (e) {
      console.warn('Audio unavailable', e);
    }
    this.setEnabled(withSound);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    store.set('sound', on ? 'on' : 'off');
    if (this.ctx) {
      if (on) this.ctx.resume();
      this.master.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, on ? 0.8 : 0.25);
      this.tracks.forEach((t, id) => {
        if (id === this.current) on ? t.el.play().catch(() => {}) : t.el.pause();
      });
    }
    this.listeners.forEach((l) => l(on));
  }

  onChange(fn: (on: boolean) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Called on every beat. Changes the ambient chord. */
  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.pad?.setChord(mood, mood === 'dawn' || mood === 'finale' ? 6 : 3.5);
  }

  hasTrack(id: string) {
    return !!config.audio.tracks[id];
  }

  /** Switch to a soundtrack by id (from config.audio.tracks). Missing ids are ignored. */
  playTrack(id: string | undefined) {
    if (!id || !this.ctx || id === this.current) return;
    const url = config.audio.tracks[id];
    if (!url) return;
    const ctx = this.ctx;
    let t = this.tracks.get(id);
    if (!t) {
      const el = new Audio(url);
      el.loop = true;
      el.crossOrigin = 'anonymous';
      el.preload = 'auto';
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(el).connect(gain).connect(this.music);
      t = { el, gain };
      this.tracks.set(id, t);
    }
    const prev = this.current ? this.tracks.get(this.current) : null;
    this.current = id;
    const now = ctx.currentTime;
    if (prev) {
      prev.gain.gain.setTargetAtTime(0, now, 1.2);
      setTimeout(() => prev.el.pause(), 5000);
    }
    if (this.enabled) t.el.play().catch(() => {});
    t.gain.gain.setTargetAtTime(1, now, 1.5);
    this.pad?.fade(0, 4); // real music replaces the generated pad
  }

  /** Lower the music while something else speaks. Pass any object as a key. */
  duck(key: object) {
    this.ducks.add(key);
    this.applyDuck();
  }
  unduck(key: object) {
    this.ducks.delete(key);
    this.applyDuck();
  }
  private applyDuck() {
    if (!this.ctx) return;
    const down = this.ducks.size > 0;
    this.duckNode.gain.setTargetAtTime(down ? config.audio.duckTo : 1, this.ctx.currentTime, down ? 0.25 : 0.9);
  }

  /** Make any <video>/<audio> duck the music while it plays. Returns a cleanup. */
  bindMedia(el: { addEventListener: HTMLMediaElement['addEventListener']; removeEventListener: HTMLMediaElement['removeEventListener'] }) {
    const key = {};
    const on = () => this.duck(key);
    const off = () => this.unduck(key);
    el.addEventListener('play', on);
    el.addEventListener('pause', off);
    el.addEventListener('ended', off);
    return () => {
      off();
      el.removeEventListener('play', on);
      el.removeEventListener('pause', off);
      el.removeEventListener('ended', off);
    };
  }

  /** Narration routed through the voice bus. */
  createVoice(url: string): HTMLAudioElement {
    const el = new Audio(url);
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    if (this.ctx) this.ctx.createMediaElementSource(el).connect(this.voice);
    return el;
  }

  /** The ending: music settles to a quieter, resolved level. */
  resolve() {
    if (!this.ctx) return;
    this.music.gain.setTargetAtTime(config.audio.musicVolume * 0.7, this.ctx.currentTime, 6);
  }
}

export const audio = new AudioManager();
