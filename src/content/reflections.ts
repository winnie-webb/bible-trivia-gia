import type { Artwork, Reflection } from './types';

/**
 * ============================================================
 *  REFLECTIONS: quiet statements, placed by id in story.ts
 * ============================================================
 */
export const reflections: Record<string, Reflection> = {
  'who-you-are': {
    label: 'The woman entering 20',
    text: 'More mature. More purposeful. Braver. Nurturing. Intentional. Still growing.',
    lines: ['More mature.', 'More purposeful.', 'Braver.', 'Nurturing.', 'Intentional.', 'Still growing.'],
    mood: 'dawn',
    drafted: true,
  },
};

/**
 * ============================================================
 *  19 → 20: press and hold
 * ============================================================
 * `past`: a still of her at the start of 19 (a frame from the previous birthday video works).
 * `present`: a current birthday photo.
 */
export const turning = {
  pastLabel: 'The girl who entered 19',
  presentLabel: 'The woman entering 20',
  past: { src: '/assets/opening/gia-at-19.jpg', alt: 'Gia on her 19th birthday', label: 'Still of Gia at 19', status: 'find' as const },
  present: { src: '/assets/today/gia-at-20.jpg', alt: 'Gia today, at 20', label: 'Current birthday photo', status: 'find' as const },
  holdHint: 'Press and hold',
  // drafted from the brief's main message — edit freely
  after: 'Look at the year you lived. How you grew. How God was with you.',
};

/**
 * ============================================================
 *  THE ROAD AHEAD
 * ============================================================
 * Not in the story by default — the cross ride ('roadAhead' in ride.ts) now
 * carries the road ahead. To use a flat artwork image instead, add
 * { type: 'future' } to story.ts and set `artwork` below.
 */
export const future: { kicker: string; lines: string[]; artwork: (Artwork & { kicker?: string }) | null } = {
  kicker: 'The road ahead',
  // drafted — edit freely
  lines: ['Your twenties. Dentistry. Faith. So much none of us can see yet.', 'God was with you on every page of this year. He is already in the next one.'],
  artwork: null,
};
