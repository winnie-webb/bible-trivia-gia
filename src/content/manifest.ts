import type { MediaItem, Orientation } from './types';

/**
 * ============================================================
 *  MEDIA MANIFEST: every photo and video in the experience
 * ============================================================
 * Drop a file at its `src` (inside /public) and it appears automatically.
 * Nothing else needs to change. To use a different file name, change `src` here.
 *
 * Missing files:
 *   required → a labelled placeholder frame shows the expected path
 *   optional → left out quietly
 *
 * Open the app with ?media to see which files are found and which are still placeholders.
 * The same list, with cropping and length guidance, is in ASSET_CHECKLIST.md.
 */

export interface Asset extends MediaItem {
  /** The stop it belongs to (for the checklist). */
  scene: string;
  /** What to supply, plus orientation / crop / length advice. */
  guidance: string;
}

const photo = (scene: string, src: string, label: string, alt: string, orientation: Orientation, required: boolean, guidance: string, extra: Partial<Asset> = {}): Asset => ({
  type: 'image',
  scene,
  src,
  label,
  alt,
  orientation,
  required,
  guidance,
  ...extra,
});

const video = (scene: string, src: string, poster: string, label: string, alt: string, orientation: Orientation, required: boolean, guidance: string): Asset => ({
  type: 'video',
  scene,
  src,
  poster,
  label,
  alt,
  orientation,
  required,
  guidance,
});

export const M = {
  /* ── Stop 1 · Your last birthday ── */
  lastBirthday: video(
    'Stop 1 · Your last birthday',
    '/assets/bday2025recap.mp4',
    '/assets/1-last-birthday/last-birthday-poster.jpg',
    'Video from Gia’s 19th birthday',
    'The video from Gia’s 19th birthday',
    'portrait',
    true,
    'The short video from her 19th birthday. MP4 (H.264), ideally under 90 seconds. Poster: one clear frame as a JPG (optional but recommended).',
  ),

  /* ── Stop 2 · Through the storm, then Christmas ── */
  hurricane: photo(
    'Stop 2 · Through the storm',
    '/assets/melissa.jpeg',
    'Hurricane Melissa damage',
    'Damage left by Hurricane Melissa',
    'landscape',
    true,
    'A real photo of the hurricane damage. Landscape. No people’s faces needed; avoid anything graphic.',
  ),
  christmasFood: photo(
    'Stop 2 · Our first Christmas',
    '/assets/christmas-dinner.jpeg',
    'Your Christmas food',
    'Winston’s Christmas plate',
    'square',
    true,
    'A photo of your Christmas food. Square or portrait; crop tight on the plate.',
  ),

  /* ── Stop 3 · Valentine’s ── */
  valLetter: photo(
    'Stop 3 · Valentine’s',
    '/assets/valentine.jpeg',
    'The Valentine’s app',
    'The letter “My Beloved, My Valentine” from the Valentine’s trivia app Winston made',
    'portrait',
    true,
    'Screenshot of the letter in the Valentine’s app. Portrait; the top of the letter stays in view.',
    { focal: '50% 12%' },
  ),
  valFlowers: photo('Stop 3 · Valentine’s', '/assets/3-valentines/flowers.jpg', 'The flowers', 'The Valentine’s flowers', 'portrait', false, 'Optional: the flowers. Portrait.'),
  valChocolates: photo(
    'Stop 3 · Valentine’s',
    '/assets/3-valentines/gia-with-chocolates.jpg',
    'Gia with the chocolates',
    'Gia with her Valentine’s chocolates',
    'portrait',
    false,
    'Optional: Gia with the chocolates. Portrait; keep her face in the upper half.',
  ),


  /* ── Stop 4 · Practice, the gala, the comeback ── */
  practice1: photo('Stop 4 · Learning makeup', '/assets/makeup-1.jpeg', 'Makeup practice 1', 'Learning how to match foundation to her undertone', 'portrait', true, 'An early practice moment. Portrait.', { focal: '50% 36%' }),
  practice2: photo('Stop 4 · Learning makeup', '/assets/makeup-2.jpeg', 'Makeup practice 2', 'Gia trying foundation shades on her face', 'portrait', true, 'A practice photo. Portrait.', { focal: '50% 82%' }),
  practice3: photo('Stop 4 · Learning makeup', '/assets/4-gala-comeback/practice-3.jpg', 'Makeup practice 3', 'Gia practising her makeup', 'portrait', false, 'Optional third practice photo. Portrait, face centred.'),
  gala: photo(
    'Stop 4 · The gala',
    '/assets/gala-look.jpeg',
    'The finished gala look',
    'Gia at the gala, the finished look',
    'portrait',
    true,
    'Her finished gala photo, the big reveal. Portrait, the best-quality version you have.',
    { focal: '50% 28%' },
  ),
  risingStar: photo(
    'Stop 4 · Rising Star & 4.0',
    '/assets/rising-star.jpeg',
    'Rising Star Award photo',
    'Gia with Barry University’s Rising Star Award',
    'portrait',
    true,
    'Gia with the Rising Star Award. Portrait.',
    { focal: '50% 34%' },
  ),
  grades: photo(
    'Stop 4 · Rising Star & 4.0',
    '/assets/grades-4-0.jpg',
    'Spring 2026 grades: 4.000',
    'Her Spring 2026 term GPA: 4.000',
    'landscape',
    false,
    'Cropped from 4.0.jpeg to show only Spring 2026 (4.000), not earlier terms.',
  ),

  /* ── Stop 5 · Summer discoveries ── */
  signLanguage: video(
    'Stop 5 · Playful new skills',
    '/assets/sign-language.mp4',
    '/assets/5-summer/sign-language-poster.jpg',
    'Sign-language video',
    'Trying sign language together',
    'portrait',
    true,
    'The short sign-language video. Portrait MP4, 10–30 seconds is ideal. Poster JPG optional.',
  ),
  nailsNow: photo(
    'Stop 5 · The nail milestone',
    '/assets/nails.jpeg',
    'Her long nails now',
    'Gia’s beautiful long nails',
    'square',
    true,
    'A current photo of her nails. Square, close up, good light.',
  ),
  nailsBefore: photo(
    'Stop 5 · The nail milestone',
    '/assets/5-summer/nails-before.jpg',
    'Earlier nail photo',
    'Gia’s nails before',
    'square',
    false,
    'Optional, only if a real earlier photo exists. Square, close up. Leave it out otherwise; nothing is shown in its place.',
  ),

  /* ── Stop 6 · Faith and answered prayer ── */
  youngGia: photo(
    'Stop 6 · Known and precious',
    '/assets/young-gia.jpeg',
    'Gia as a little girl',
    'Gia as a little girl in her green school uniform, smiling',
    'portrait',
    true,
    'A childhood photo. Portrait.',
    { focal: '50% 85%' },
  ),
  baptism: photo(
    'Stop 6 · One year since baptism',
    '/assets/6-faith/baptism.jpg',
    'Baptism photo',
    'Gia’s baptism',
    'portrait',
    false,
    'Optional baptism photo (or a still from a video). Portrait. Without it, the stop shows a soft light instead.',
  ),
  lintons: photo(
    'Stop 6 · The Lintons',
    '/assets/lintons.jpeg',
    'Mr. and Mrs. Linton',
    'Mr. and Mrs. Linton together',
    'square',
    true,
    'One photo of Mr. and Mrs. Linton together. Landscape or square; their permission first.',
  ),

  /* ── Stop 7 · “I actually did it!” ── */
  licence: photo(
    'Stop 7 · I actually did it!',
    '/assets/license.jpeg',
    'Her new driving licence',
    'Gia’s new California driver licence',
    'portrait',
    true,
    'Her new licence, shown in full (Winston’s choice).',
    { focal: '50% 55%' },
  ),

  /* ── Stop 8 · A quiet reset ── */
  quietReset: photo(
    'Stop 8 · A quiet reset',
    '/assets/hospital.jpeg',
    'A calm, approved photo',
    'Gia’s arm resting during her hospital visit',
    'portrait',
    true,
    'One calm photo you are both comfortable with (her smiling, a sky, a Bible, hands). No hospital images or records. Portrait.',
  ),

  /* ── Finale ── */
  giaToday: photo(
    'Finale · Happy 20th Birthday',
    '/assets/chapter-20-1.jpeg',
    'A beautiful current photo of Gia',
    'Gia, turning 20',
    'portrait',
    true,
    'A beautiful, current photo of Gia. Portrait, high resolution; her face in the upper third.',
    { focal: '50% 40%' },
  ),
} satisfies Record<string, Asset>;

export const ALL_ASSETS: Asset[] = Object.values(M);
