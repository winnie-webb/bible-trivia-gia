/**
 * CONTENT TYPES
 * -------------
 * The shapes behind journey.ts and media.ts. You never need to edit this
 * file to personalise; it documents what each field means.
 */

/** The lighting of a moment. Drives sky colour and the ambient chord. */
export type Mood =
  | 'void' // the first screen
  | 'storm' // cold, restrained (the hurricane)
  | 'night' // the rewind to last year
  | 'journey' // neutral travelling light
  | 'warm' // nostalgic memories
  | 'joy' // movement, warmth
  | 'grace' // faith: a soft luminous air
  | 'tender' // intimate blush warmth
  | 'quiet' // almost nothing
  | 'theatre' // a video playing
  | 'candle' // one small light
  | 'dawn' // the present day
  | 'future' // the bright, open landscape
  | 'finale'; // settled, warm, resolved

export type Orientation = 'portrait' | 'landscape' | 'square';

/** How one screen hands over to the next (motion/transitions.ts). */
export type TransitionName = 'depth' | 'through' | 'light' | 'dark' | 'drift' | 'dissolve' | 'cut';

/**
 * One photo or video. Every item lives in the central manifest (manifest.ts).
 * If the file at `src` is missing:
 *  - required items show a labelled placeholder frame (file path + "needed"),
 *  - optional items are simply left out.
 */
export interface MediaItem {
  type: 'image' | 'video';
  /** Path inside /public, e.g. '/assets/3-valentines/flowers.jpg'. */
  src: string;
  /** Video only: the still shown before playback (also the fallback if the video is missing). */
  poster?: string;
  orientation: Orientation;
  /** Describes the picture for screen readers. */
  alt: string;
  /** Short name shown on the placeholder. */
  label: string;
  required: boolean;
  /** CSS object-position, to keep a face in frame when cropped, e.g. '50% 30%'. */
  focal?: string;
  /** Optional responsive / modern-format versions of an image. */
  srcset?: string;
  sources?: { src: string; type: string }[];
  /** Video only: muted, looping background motion instead of a video she plays. */
  ambient?: boolean;
}

/** How a stop's panel is staged. Each one is a different visual treatment. */
export type PanelLayout =
  | 'film' // the 19th-birthday video with play / skip / continue
  | 'storm' // one landscape photo, what was lost, the line reconnecting
  | 'feast' // a photo with playful labels drifting in
  | 'fan' // two or three photos fanned like prints
  | 'practice' // a contact sheet of practice shots
  | 'reveal' // practice shots gather, light sweeps, the finished look rises
  | 'award' // an award photo and a figure that counts up
  | 'skills' // a short video beside a photo
  | 'growth' // a photo tile beside a softly lit testimony tile
  | 'glow' // a photo held in soft light (falls back to light alone)
  | 'mentors' // a photo with an answered-prayer line
  | 'licence' // a video with a speech-bubble callback to the opening
  | 'scripture' // a photo held in light, with a few verses revealed in turn
  | 'quiet' // one photo, slow and still
  | 'candle'; // a single light and a few words (no photo needed)

export interface Figure {
  value: string;
  label: string;
  /** Small date line under the figure. */
  when?: string;
}

/** A Bible verse shown on screen (Winston chose to include these). */
export interface Verse {
  text: string;
  /** e.g. 'Jeremiah 1:5' */
  ref: string;
}

export interface Panel {
  id: string;
  layout: PanelLayout;
  /** Small label above the title: usually the date. */
  kicker?: string;
  title: string;
  /** One or two short sentences. */
  caption?: string;
  media: MediaItem[];
  /** 'storm': what was lost · 'feast': labels around the photo. */
  tags?: string[];
  /** 'award': the large figure(s). */
  figures?: Figure[];
  /** 'mentors' / 'candle': short lines revealed in turn. */
  lines?: string[];
  /** 'scripture': the verses, revealed one after another. */
  verses?: Verse[];
  /** 'licence': the bubble that echoes the opening. 'growth': the testimony tile's text. */
  note?: { kicker?: string; title?: string; text: string };
  /** Override the stop's lighting for this panel. */
  mood?: Mood;
  /** Words in quote marks must be real words. Drafted text is marked so you can review it. */
  drafted?: boolean;
}

export interface Stop {
  id: string;
  /** Shown in the route and the menu. */
  name: string;
  mood: Mood;
  /** Slower reveals and a gentler ride in (serious moments). */
  calm?: boolean;
  panels: Panel[];
}

export interface Road {
  /** One line shown while riding this stretch (optional). */
  line?: string;
  /** Seconds of riding at full speed. */
  seconds: number;
  mood: Mood;
  /** The playful bump on the first stretch: Jesus takes the wheel. */
  incident?: { at: number; bubble: string };
}
