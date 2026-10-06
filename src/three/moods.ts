import type { Mood } from '../content/types';

/**
 * The lighting of the world for each mood. The world eases between these,
 * so changing a memory's mood changes the colour of the air around it.
 */
export interface Palette {
  top: string; // sky colour at top of screen
  bottom: string; // colour at the horizon / bottom
  horizon: string; // glow colour on the horizon
  horizonStrength: number;
  thread: string; // the thread of light
  threadIntensity: number;
  dust: string; // drifting motes
  dustAmount: number;
  flow: number; // speed of light travelling along the thread
}

export const PALETTES: Record<Mood, Palette> = {
  void: { top: '#fdfaf5', bottom: '#f8f1e8', horizon: '#ffffff', horizonStrength: 0, thread: '#c49a5a', threadIntensity: 0, dust: '#c9a46c', dustAmount: 0, flow: 0.4 },
  storm: { top: '#eef0f2', bottom: '#dde2e7', horizon: '#ffffff', horizonStrength: 0.2, thread: '#7d8c9c', threadIntensity: 0.75, dust: '#8794a2', dustAmount: 0.7, flow: 1.4 },
  night: { top: '#fbf7f1', bottom: '#f1e7dc', horizon: '#ffffff', horizonStrength: 0.25, thread: '#b8894b', threadIntensity: 0.7, dust: '#c4a171', dustAmount: 0.3, flow: 0.5 },
  journey: { top: '#fcf8f2', bottom: '#f1e3d6', horizon: '#fff8ef', horizonStrength: 0.45, thread: '#c08f50', threadIntensity: 1, dust: '#c9a46c', dustAmount: 0.55, flow: 0.9 },
  warm: { top: '#fdf6ee', bottom: '#f3dcc7', horizon: '#fff2e0', horizonStrength: 0.55, thread: '#c2874a', threadIntensity: 1.1, dust: '#cfa266', dustAmount: 0.7, flow: 0.9 },
  joy: { top: '#fff7f1', bottom: '#f8dbcc', horizon: '#fff4e8', horizonStrength: 0.6, thread: '#cf8757', threadIntensity: 1.2, dust: '#dea477', dustAmount: 1, flow: 1.6 },
  grace: { top: '#fffdf8', bottom: '#f4eadb', horizon: '#ffffff', horizonStrength: 0.95, thread: '#c59c58', threadIntensity: 1.2, dust: '#d4b273', dustAmount: 0.8, flow: 0.7 },
  tender: { top: '#fdf6f4', bottom: '#f2d8d4', horizon: '#fff5f3', horizonStrength: 0.5, thread: '#c6847f', threadIntensity: 1.1, dust: '#d79c96', dustAmount: 0.6, flow: 0.8 },
  quiet: { top: '#faf8f5', bottom: '#eee8e1', horizon: '#ffffff', horizonStrength: 0.15, thread: '#b49b7c', threadIntensity: 0.6, dust: '#bca88f', dustAmount: 0.3, flow: 0.35 },
  theatre: { top: '#f5f0ea', bottom: '#e7ded3', horizon: '#ffffff', horizonStrength: 0.1, thread: '#b49b7c', threadIntensity: 0.25, dust: '#bca88f', dustAmount: 0.12, flow: 0.3 },
  candle: { top: '#f8f2ea', bottom: '#ebdccb', horizon: '#fff3dd', horizonStrength: 0.4, thread: '#bd8743', threadIntensity: 0.5, dust: '#c99a5c', dustAmount: 0.25, flow: 0.25 },
  dawn: { top: '#fff9f3', bottom: '#fbdcc8', horizon: '#ffffff', horizonStrength: 1, thread: '#d0955a', threadIntensity: 1.1, dust: '#e2ad78', dustAmount: 0.7, flow: 0.8 },
  future: { top: '#fffbf6', bottom: '#f6e2d5', horizon: '#ffffff', horizonStrength: 1, thread: '#cb9c61', threadIntensity: 1, dust: '#dcb683', dustAmount: 0.65, flow: 0.6 },
  finale: { top: '#fff9f4', bottom: '#f6dbd1', horizon: '#ffffff', horizonStrength: 0.85, thread: '#c78e6e', threadIntensity: 0.9, dust: '#d9a68e', dustAmount: 0.5, flow: 0.3 },
};

/** How the camera frames the riders (see FRAMES in World.ts). */
export type Frame = 'travel' | 'hero' | 'incident' | 'stop' | 'settle';

export type Rider = 'gia' | 'jesus' | 'winston';

/** What every world implementation (WebGL or fallback) can do. */
export interface WorldApi {
  setMood(mood: Mood): void;
  /** Move the riders to position u (0–1) along the thread. */
  setTarget(u: number, immediate?: boolean): void;
  /** Riding: the riders follow the target closely (otherwise they glide). */
  setRiding(on: boolean): void;
  /** Unfurl the thread (0 = only a point of light, 1 = whole thread). */
  setReveal(v: number): void;
  /** 0–1 dims the world (e.g. while a video is focused). */
  setFocus(f: number): void;
  setReducedMotion(r: boolean): void;
  /** Render at lower frame rate (e.g. under a playing video). */
  setIdle(idle: boolean): void;
  /** Camera framing of the riders. */
  setFrame(f: Frame): void;
  setRidersVisible(v: boolean): void;
  /** Who sits at the wheel. animate = they swap seats with a little hop. */
  setDriver(who: 'gia' | 'jesus', animate: boolean): void;
  /** A soft cloud on the path: the riders stop against it at u and onContact fires once. null = it drifts away. */
  setObstacle(u: number | null, onContact?: () => void): void;
  /** Everyone startles for a moment. */
  react(): void;
  /** Gia waves for N ms. */
  wave(ms: number): void;
  /** Screen position just above a rider's head (CSS px), or null. */
  getAnchor(who: Rider): { x: number; y: number } | null;
  /** Screen rectangle the riders occupy (CSS px), or null. For layout QA. */
  getRidersRect(): { x: number; y: number; w: number; h: number } | null;
  dispose(): void;
}
