import type { Mood, TransitionName } from './types';

/**
 * ============================================================
 *  STORY — the order of the whole experience
 * ============================================================
 * Reorder, remove or add lines freely.
 *
 *   gate        first screen (sound choice). Keep first.
 *   statement   one sentence on its own (auto = ms before it moves on by itself)
 *   film        a featured video from films.ts ('previousBirthday', 'birthdayFilm')
 *   title       the CHAPTER 20 title card with Begin
 *   chapter     a chapter card, followed by every memory in timeline.ts whose
 *               `chapter` matches its id (date order, or `order`).
 *               Omit `title` for no card (memories only).
 *   ride        the cross ride (ride.ts): Gia, Winston & Jesus riding the cross
 *   voices      birthday-message videos (messages.ts)
 *   reflection  a reflection from reflections.ts by id
 *   turning     the 19 → 20 transformation
 *   prayer      the prayer (skipped automatically if prayer.ts has no lines)
 *   future      the road ahead
 *   finale      the end
 */

export type StorySection =
  | { type: 'gate' }
  | { type: 'statement'; text: string; style?: 'date' | 'line' | 'huge' | 'whisper'; mood?: Mood; transition?: TransitionName; auto?: number; drafted?: boolean }
  | { type: 'film'; film: 'previousBirthday' | 'birthdayFilm' }
  | { type: 'title' }
  | { type: 'chapter'; id: string; numeral?: string; title?: string; range?: string; mood?: Mood }
  | { type: 'ride'; appearance: string; mood?: Mood; transition?: TransitionName }
  | { type: 'voices' }
  | { type: 'reflection'; id: string }
  | { type: 'turning' }
  | { type: 'prayer' }
  | { type: 'future' }
  | { type: 'finale' };

export const story: StorySection[] = [
  { type: 'gate' },

  // ── Present day: the riders say hello ──
  { type: 'ride', appearance: 'opening', mood: 'dawn' }, // "I have my license!"
  { type: 'statement', text: 'But first, let’s go back to where 19 began.', style: 'whisper', mood: 'night', transition: 'through', drafted: true },

  // ── Opening: the girl entering 19 ──
  { type: 'statement', text: 'October 6, 2025', style: 'date', mood: 'night', auto: 3600 },
  { type: 'film', film: 'previousBirthday' },
  { type: 'statement', text: 'That was the beginning of 19.', mood: 'night', auto: 4200, transition: 'dark', drafted: true },
  { type: 'statement', text: 'This is the year that brought you here.', mood: 'night', auto: 4800, transition: 'dissolve', drafted: true },
  { type: 'title' },

  // ── The year ──
  { type: 'chapter', id: 'storm', numeral: 'I', title: 'The storm', range: 'Late October 2025', mood: 'storm' },
  { type: 'chapter', id: 'christmas', numeral: 'II', title: 'Our first Christmas', range: 'December 2025', mood: 'warm' },
  { type: 'chapter', id: 'comeback', numeral: 'III', title: 'The comeback', range: 'December 2025 — April 2026' },
  { type: 'chapter', id: 'may', numeral: 'IV', title: 'May', range: 'Trust, and two milestones', mood: 'tender' },
  { type: 'chapter', id: 'summer', numeral: 'V', title: 'Best friends', range: 'Summer 2026', mood: 'joy' },
  { type: 'chapter', id: 'faith', numeral: 'VI', title: 'Answered prayer', range: 'Summer 2026', mood: 'grace' },
  { type: 'chapter', id: 'calling', numeral: 'VII', title: 'Toward your calling', range: 'Summer 2026', mood: 'warm' },
  { type: 'chapter', id: 'love', numeral: 'VIII', title: 'Love, shown', range: 'Recently', mood: 'tender' },
  { type: 'chapter', id: 'sept27' }, // no card — a quiet moment on its own
  { type: 'chapter', id: 'firstlove', numeral: 'IX', title: 'Our first love', range: 'September 30 — October 2, 2026', mood: 'candle' },

  // ── Chapter 20 ──
  { type: 'statement', text: 'Which brings us to today.', style: 'whisper', mood: 'dawn', transition: 'light', drafted: true },
  { type: 'chapter', id: 'today' },
  { type: 'film', film: 'birthdayFilm' },
  { type: 'voices' },
  { type: 'reflection', id: 'who-you-are' },
  { type: 'turning' },
  { type: 'prayer' },
  { type: 'ride', appearance: 'roadAhead', mood: 'future' },
  { type: 'finale' },
];
