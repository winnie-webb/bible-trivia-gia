import type { BirthdayMessage } from './types';

/**
 * ============================================================
 *  VOICES: birthday messages from family & the children
 * ============================================================
 * Each message becomes a point of light she discovers and touches.
 * Any number works. Replace the slots below with real names + files.
 */
export const voicesIntro = {
  line: 'Some people who love you wanted to tell you something.',
  hint: 'Touch a light',
  continueLabel: 'Continue',
};

const slot = (n: number): BirthdayMessage => ({
  id: `message-${n}`,
  from: `[Name ${n}]`,
  relation: '[Family / child]',
  video: {
    type: 'video',
    src: `/assets/birthday-messages/message-${n}.mp4`,
    poster: `/assets/birthday-messages/message-${n}.jpg`,
    orientation: 'portrait',
    alt: `Birthday message ${n}`,
    label: `Birthday message ${n}`,
    status: 'have',
  },
});

export const messages: BirthdayMessage[] = [1, 2, 3, 4, 5].map(slot);
