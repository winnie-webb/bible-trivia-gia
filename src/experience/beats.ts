import { config } from '../content/config';
import { finale, opening, rewind, roads, stops } from '../content/journey';
import type { Mood, Panel, Road, Stop, TransitionName } from '../content/types';
import type { Frame } from '../three/moods';

/**
 * A beat is one screen of the journey. The content (journey.ts) is compiled
 * into a flat list here:
 *
 *   gate → opening → rewind → [stop panels] → road → [stop panels] → road … → finale
 *
 * Stops sit at fixed positions along the thread; a road beat is the stretch
 * between two stops, travelled by holding the ride control.
 */

export type SceneKind = 'gate' | 'opening' | 'rewind' | 'stop' | 'road' | 'finale';

export interface RoadData extends Road {
  /** Stop index the road leaves from, and the one it arrives at (stops.length = the finale). */
  from: number;
  to: number;
  uStart: number;
  uEnd: number;
}

export interface StopData {
  stop: Stop;
  panel: Panel;
  index: number;
  count: number;
  number: number;
}

export interface Beat {
  id: string;
  kind: SceneKind;
  mood: Mood;
  data: any;
  /** Menu label (first panel of each stop). */
  navLabel?: string;
  /** Moves on by itself after N ms. */
  auto?: number;
  transition?: TransitionName;
  /** Position along the thread, 0–1. */
  u: number;
  frame: Frame;
  /** Stop this beat belongs to (roads: the stop they lead to). */
  stop?: number;
  /** Last panel of a stop: riding on starts from here. */
  rideOut?: boolean;
  road?: RoadData;
  /** Soundtrack id to switch to on arrival. */
  music?: string;
}

export interface Lantern {
  u: number;
  side: number;
}

/** Where each stop sits on the thread. */
export const stopU = (i: number) => 0.03 + i * 0.112;
export const FINALE_U = 0.94;
export const STOP_COUNT = stops.length;

export function buildBeats(): { beats: Beat[]; lanterns: Lantern[] } {
  const beats: Beat[] = [];
  beats.push({ id: 'gate', kind: 'gate', mood: 'void', data: config.entry, u: 0.012, frame: 'hero' });
  beats.push({ id: 'opening', kind: 'opening', mood: 'dawn', data: opening, u: 0.012, frame: 'hero', transition: 'light', auto: 8200, navLabel: 'Today' });
  beats.push({ id: 'rewind', kind: 'rewind', mood: 'night', data: rewind, u: 0.012, frame: 'stop', transition: 'dark', auto: 6200 });

  stops.forEach((stop, si) => {
    const u = stopU(si);
    stop.panels.forEach((panel, pi) => {
      const data: StopData = { stop, panel, index: pi, count: stop.panels.length, number: si + 1 };
      beats.push({
        id: `${stop.id}:${panel.id}`,
        kind: 'stop',
        mood: panel.mood ?? (panel.layout === 'film' ? 'theatre' : stop.mood),
        data,
        u,
        frame: 'stop',
        stop: si,
        // the film moves on with its own Skip / Continue; every other stop's last panel rides on
        rideOut: pi === stop.panels.length - 1 && panel.layout !== 'film',
        navLabel: pi === 0 ? stop.name : undefined,
        transition: pi === 0 ? (si === 0 ? 'dark' : 'depth') : 'drift',
      });
    });
    const road = roads[si];
    if (!road) return;
    const to = si + 1;
    const uEnd = to < stops.length ? stopU(to) : FINALE_U;
    beats.push({
      id: `road-${si + 1}`,
      kind: 'road',
      mood: road.mood,
      data: road,
      u,
      frame: 'travel',
      stop: to,
      road: { ...road, from: si, to, uStart: u, uEnd },
      transition: 'depth',
      // the soundtrack (if any) starts with the first ride
      music: si === 0 ? config.audio.journeyTrack : undefined,
    });
  });

  beats.push({ id: 'finale', kind: 'finale', mood: 'finale', data: finale, u: FINALE_U, frame: 'settle', transition: 'light', navLabel: 'Happy 20th', music: config.audio.finaleTrack });

  const lanterns = stops.map((_, i) => ({ u: stopU(i), side: i % 2 ? 1 : -1 }));
  return { beats, lanterns };
}
