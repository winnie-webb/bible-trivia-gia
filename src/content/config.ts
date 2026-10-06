/**
 * ============================================================
 *  CONFIG — names, first screen, title card, soundtrack
 * ============================================================
 */

export const config = {
  herName: 'Gia',
  fromName: 'Winston',

  yearStart: '2025-10-06',
  yearEnd: '2026-10-06',

  /** Tiny text on the very first screen. */
  entry: {
    whisper: 'For Gia',
    hint: 'Best with sound · phone upright',
    withSound: 'Enter with sound',
    quietly: 'Enter quietly',
  },

  /**
   * SOUNDTRACK: drop files into /public/assets/audio and list them here.
   * Until a track exists, a soft generated tone plays and follows each scene's mood.
   */
  audio: {
    tracks: {
      // main: '/assets/audio/main-theme.mp3',
      // finale: '/assets/audio/finale.mp3',
    } as Record<string, string>,
    /** Track id that starts when the ride begins (only if it exists above). */
    journeyTrack: 'main',
    finaleTrack: 'finale',
    musicVolume: 0.7,
    duckTo: 0.12,
  },
};
