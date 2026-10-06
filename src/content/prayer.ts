/**
 * ============================================================
 *  PRAYER: optional. Winston will provide it.
 * ============================================================
 * Leave `lines` empty ([]) to skip this scene entirely.
 * With narration: set `narration` and give each line an `at` (seconds into the recording).
 */
export const prayer = {
  kicker: 'For your twenties',
  title: 'A prayer',
  narration: '' as string,
  lines: [{ text: '[YOUR PRAYER: to be supplied by Winston, or empty this list to skip]', at: 0 }] as { text: string; at: number }[],
};
