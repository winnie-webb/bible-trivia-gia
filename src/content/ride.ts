/**
 * ============================================================
 *  THE CROSS RIDE: Gia, Winston and Jesus riding the cross
 * ============================================================
 * The cross is the vehicle for the whole journey. Gia drives at first
 * (she has her licence!) until the playful bump on the first stretch,
 * when Jesus takes the wheel (journey.ts → roads[0].incident).
 *
 * The figures are deliberately stylised (soft shapes, no faces beyond eyes).
 * These colours are guesses: adjust them so they feel like the two of you.
 */

export const rideLook = {
  gia: { label: 'Gia', skin: '#c79a7c', hair: '#3a2820', clothes: '#e8a9a0' },
  winston: { label: 'Winston', skin: '#a8775a', hair: '#231a16', clothes: '#7f93a6' },
  jesus: { label: 'Jesus', skin: '#c49372', hair: '#5a3e2b', robe: '#fbf7ef', sash: '#c9a063' },
  cross: '#b98a5e',
};

/** The ride control's words. */
export const rideText = {
  hold: 'Hold to ride',
  riding: 'Riding…',
  handsFree: 'Tap to stop',
  hint: 'or tap once to ride hands-free',
  next: 'Next',
  nextStop: 'Next stop',
  arrived: 'Arrived',
  paused: 'Paused',
};
