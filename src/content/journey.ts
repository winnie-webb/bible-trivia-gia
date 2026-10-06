import { M } from './manifest';
import type { Road, Stop } from './types';

/**
 * ============================================================
 *  THE JOURNEY: the whole experience, in order
 * ============================================================
 *  opening   → present day: Gia drives, "I have my license!"
 *  rewind    → back to her last birthday
 *  stops[0]  → Stop 1, the 19th-birthday video
 *  roads[i]  → the ride from stops[i] to stops[i + 1] (the last one rides into the finale)
 *  finale    → Happy 20th Birthday
 *
 * Captions: one or two short sentences; the media carries the memory.
 * `drafted: true` = written from Winston's notes; edit freely.
 * Words in quote marks are real words only.
 * Media lives in manifest.ts (file paths, required/optional).
 */

export const opening = {
  kicker: 'Today',
  bubble: 'I have my license!',
};

export const rewind = {
  from: '2026',
  to: '2025',
  date: 'October 6,',
  line: 'Before we celebrate 20, let’s revisit your last birthday.',
};

export const stops: Stop[] = [
  {
    id: 'last-birthday',
    name: 'Your last birthday',
    mood: 'night',
    panels: [
      {
        id: 'film',
        layout: 'film',
        kicker: 'October 6, 2025',
        title: 'Your last birthday',
        media: [M.lastBirthday],
      },
    ],
  },
  {
    id: 'storm-christmas',
    name: 'The storm, then Christmas',
    mood: 'storm',
    calm: true,
    panels: [
      {
        id: 'hurricane',
        layout: 'storm',
        kicker: 'Late October 2025',
        title: 'Hurricane Melissa',
        tags: ['No electricity', 'No water', 'No connection'],
        caption: 'After days without a connection, I ran two miles to a Starlink signal to text you that I was safe.',
        media: [M.hurricane],
      },
      {
        id: 'christmas',
        layout: 'feast',
        mood: 'warm',
        kicker: 'December 2025',
        title: 'Our first Christmas',
        tags: ['Mutton', 'Fried chicken', 'Curry', 'Pork'],
        caption: 'You teased that the hurricane clearly hadn’t touched me at all.',
        media: [M.christmasFood],
        drafted: true,
      },
    ],
  },
  {
    id: 'valentines',
    name: 'Valentine’s',
    mood: 'tender',
    panels: [
      {
        id: 'valentines',
        layout: 'fan',
        kicker: 'February 14, 2026',
        title: 'Valentine’s',
        caption: 'A letter for my Valentine, sent with love across the miles.',
        media: [M.valLetter, M.valFlowers, M.valChocolates],
        drafted: true,
      },
    ],
  },
  {
    id: 'gala-comeback',
    name: 'The gala & the comeback',
    mood: 'warm',
    panels: [
      {
        id: 'practice',
        layout: 'practice',
        kicker: 'The weeks before the gala',
        title: 'Learning makeup',
        caption: 'Teaching yourself, practising, getting better.',
        media: [M.practice1, M.practice2, M.practice3],
        drafted: true,
      },
      {
        id: 'gala',
        layout: 'reveal',
        // Winston's recollection of the date; edit if needed
        kicker: 'April 25, 2026',
        title: 'The gala',
        caption: 'All that practice. You looked amazing.',
        media: [M.gala, M.practice1, M.practice2, M.practice3],
        drafted: true,
      },
      {
        id: 'comeback',
        layout: 'award',
        kicker: 'The academic comeback',
        title: 'Rising Star',
        note: { kicker: 'April 30, 2026', text: 'Rising Star Award' },
        figures: [{ value: '4.0', label: 'Straight A’s', when: 'May 12, 2026' }],
        caption: 'After a difficult semester, you aimed for straight A’s, and you earned a 4.0.',
        media: [M.risingStar, M.grades],
        drafted: true,
      },
    ],
  },
  {
    id: 'summer',
    name: 'Summer discoveries',
    mood: 'joy',
    panels: [
      {
        id: 'skills',
        layout: 'skills',
        kicker: 'Summer 2026',
        title: 'A new skill',
        caption: 'Sign language… and somehow the joke became that I was good at it. I was not.',
        media: [M.signLanguage],
        drafted: true,
      },
      {
        id: 'growth',
        layout: 'growth',
        kicker: 'Summer 2026',
        title: 'Beautiful long nails',
        caption: 'No more nail biting. Now you get to enjoy them.',
        // the nail biting is part of the deliverance testimony, not a separate milestone
        note: { kicker: 'Our testimony', title: 'Deliverance', text: 'This summer, God brought us deliverance concerning spiritual spouses and dreams, and with it, freedom from nail biting.' },
        media: [M.nailsNow, M.nailsBefore],
        drafted: true,
      },
    ],
  },
  {
    id: 'faith',
    name: 'Faith & answered prayer',
    mood: 'grace',
    panels: [
      {
        id: 'known',
        layout: 'scripture',
        kicker: 'From the very beginning',
        title: 'Known and precious',
        // KJV, chosen at Winston's request
        verses: [
          { text: 'Before I formed thee in the belly I knew thee.', ref: 'Jeremiah 1:5' },
          { text: 'I am fearfully and wonderfully made.', ref: 'Psalm 139:14' },
          { text: 'Thou wast precious in my sight… and I have loved thee.', ref: 'Isaiah 43:4' },
        ],
        media: [M.youngGia],
      },
      {
        id: 'baptism',
        layout: 'glow',
        kicker: 'June 8, 2026',
        title: 'One year since your baptism',
        caption: 'A year of growing in faith and in character.',
        media: [M.baptism],
        drafted: true,
      },
      {
        id: 'lintons',
        layout: 'mentors',
        kicker: 'An answered prayer',
        title: 'The Lintons',
        lines: ['You prayed for guidance.', 'God answered with mentors.', 'Now we meet with them every Friday.'],
        media: [M.lintons],
        drafted: true,
      },
    ],
  },
  {
    id: 'licence',
    name: 'I actually did it!',
    mood: 'warm',
    panels: [
      {
        id: 'licence',
        layout: 'licence',
        kicker: 'August 20, 2026',
        title: '“I actually did it!”',
        caption: 'You first got behind the wheel at 19. With faith and perseverance, you earned your licence.',
        note: { kicker: 'Where this ride began', text: 'I have my license!' },
        media: [M.licence],
        drafted: true,
      },
    ],
  },
  {
    id: 'quiet-reset',
    name: 'A quiet reset',
    mood: 'quiet',
    calm: true,
    panels: [
      {
        id: 'hospital',
        layout: 'quiet',
        kicker: 'September 27, 2026',
        title: 'A hard day, held in prayer',
        // gentle by design: no diagnosis, no medical detail, no outcome claimed
        caption: 'A painful day at the hospital. We prayed, and placed your health and our future in God’s hands.',
        media: [M.quietReset],
        drafted: true,
      },
      {
        id: 'fast',
        layout: 'candle',
        kicker: 'September 30 – October 2, 2026',
        title: 'Returning to our first love',
        lines: ['We fasted.', 'We came back to God first,', 'and to each other.'],
        media: [],
        drafted: true,
      },
    ],
  },
];

/** roads[i] carries the riders from stops[i] to stops[i + 1]; the last one rides into the finale. */
export const roads: Road[] = [
  { line: 'One last ride through your teens.', seconds: 6, mood: 'journey', incident: { at: 0.42, bubble: 'Let me take the wheel.' } },
  { seconds: 4.5, mood: 'tender' },
  { seconds: 4.5, mood: 'warm' },
  { seconds: 4.5, mood: 'joy' },
  { seconds: 5, mood: 'grace' },
  { seconds: 4.5, mood: 'warm' },
  { seconds: 7, mood: 'quiet' }, // slower into the quiet stop
  { seconds: 6, mood: 'future' }, // the bright, open landscape
];

export const finale = {
  photo: M.giaToday,
  headline: 'Happy 20th Birthday, Gia.',
  welcome: 'Welcome to your twenties.',
  // KJV, chosen at Winston's request; set to null to leave it out
  verse: { text: 'Her price is far above rubies.', ref: 'Proverbs 31:10' } as { text: string; ref: string } | null,
  closing: 'Forever & Always',
  signature: '— Brian',
};
