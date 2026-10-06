import type { MediaItem } from './types';

/**
 * ============================================================
 *  FEATURED VIDEOS
 * ============================================================
 * Shown like premieres: poster first, she chooses to play, native controls,
 * music fades down, and "Continue" is always available.
 */
export interface Film {
  kicker: string;
  title: string;
  video: MediaItem;
  continueLabel?: string;
}

export const films: Record<'previousBirthday' | 'birthdayFilm', Film> = {
  previousBirthday: {
    kicker: 'October 6, 2025',
    title: 'The girl entering 19',
    continueLabel: 'Continue',
    video: {
      type: 'video',
      src: '/assets/opening/previous-birthday.mp4',
      poster: '/assets/opening/previous-birthday-poster.jpg',
      orientation: 'portrait', // change to 'landscape' if the video is horizontal
      alt: 'The video from Gia’s 19th birthday',
      label: 'Previous birthday video',
      status: 'have',
    },
  },
  birthdayFilm: {
    kicker: 'For you',
    title: 'A birthday film',
    continueLabel: 'Continue',
    video: {
      type: 'video',
      src: '/assets/video/birthday-film.mp4',
      poster: '/assets/video/birthday-film-poster.jpg',
      orientation: 'landscape', // change to 'portrait' if the video is vertical
      alt: 'Winston’s birthday video for Gia',
      label: 'Winston’s birthday video',
      status: 'have',
    },
  },
};
