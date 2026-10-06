import type { Beat } from '../experience/beats';
import type { WorldApi } from '../three/moods';
import type { AudioManager } from '../audio/AudioManager';
import type { Quality } from '../utils/device';

/** 'none' = tap & swipe advance · 'tap' = only swipe/buttons advance · 'all' = scene decides */
export type Lock = 'none' | 'tap' | 'all';

export interface SceneCtx {
  world: WorldApi;
  audio: AudioManager;
  quality: Quality;
  reduced: boolean;
  /** True if this beat was already experienced (revisiting). */
  seen: boolean;
  next(): void;
  prev(): void;
  lock(level: Lock): void;
  /** A video in this scene started or stopped: riding waits while one plays. */
  mediaPlaying(on: boolean): void;
}

export interface Scene {
  el: HTMLElement;
  /** The incoming transition has visibly arrived. */
  enter?(): void;
  /** Leaving has begun: pause anything playing. */
  leave?(): void;
  /** Removed from the page: release media, timers, listeners. */
  dispose?(): void;
  /** Return true if the scene used this tap itself. */
  onTap?(): boolean;
  /** Override the "touch to continue" hint. false = never show. */
  hint?: string | false;
}

export type SceneFactory = (beat: Beat, ctx: SceneCtx) => Scene;
