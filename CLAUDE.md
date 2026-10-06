# Chapter 20: project notes for Claude

Interactive, cinematic, mobile-first birthday experience from Winston to his girlfriend **Gia** for her 20th birthday (October 6, 2026). Theme: "The year that brought you here" (Oct 6 2025 → Oct 6 2026). Long-distance; they have never met in person. Gia lives in California and attends Barry University (Miami).

## Stack & running
- Vite + TypeScript, no framework. Only runtime dependency: `three` (lazy-loaded chunk).
- `npm run dev -- --host` → open the Network URL on an iPhone. `npm run build` = typecheck + build.
- Dev URL flags: `?dev` (beat badge + QA helpers, `__director`, `__ride`, `__world`), `?beat=<stop-id[:panel-id]> or index`, `?quality=low|none`, `?media` (media found/placeholder list).
- QA in the Claude browser pane: the pane throttles requestAnimationFrame to ~1 fps, so screenshots lag. Use the dev helpers instead: `window.__qa(name)` and `window.__qaSheet(['travel','hero',...])` save WebGL frames to `.qa/` through a dev-only Vite middleware (`vite.config.ts`).
- On this machine, shell heredocs containing ASCII apostrophes break the Bash tool. Write Python patch scripts into `.qa/` (gitignored) and run them from there instead.

## Architecture (content is separate from presentation)
Revised 2026-10-06 into a short (3–5 min) ride: opening → rewind → 8 stops joined by hold-to-ride roads → finale.
- `src/content/`: everything Winston edits:
  - `journey.ts`: the whole experience in order (`opening`, `rewind`, `stops`, `roads`, `finale`). Each stop has panels; each panel has a `layout` (film, storm, feast, fan, practice, reveal, award, skills, growth, glow, mentors, licence, quiet, candle).
  - `manifest.ts`: the central media manifest (`M.*`): path, required/optional, orientation and crop guidance. `ASSET_CHECKLIST.md` mirrors it. Missing required → labelled placeholder; missing optional → omitted; a video with a missing file but present poster shows the poster.
  - `ride.ts` (rider colours, ride-button words), `config.ts`, `types.ts`.
- `src/experience/beats.ts` compiles the journey into beats (gate, opening, rewind, stop, road, finale). Stops sit at `stopU(i)` on the thread.
- `Director.ts` runs beats. Only the ride control moves forward from a stop's last panel (`rideOut`) or along a road; `prev()` skips roads; `driverFor()` gives Gia the wheel until `incidentDone`.
- `Ride.ts`: hold-to-ride (pointer, Space), tap-for-hands-free, pause on blur/hidden/menu/video, arrival lock, the route map, the cloud bump plus "Let me take the wheel." seat swap, and reduced-motion "Next stop" stepping.
- `src/scenes/`: `text.ts` (gate, rewind), `journey.ts` (opening, road, finale), `stop.ts` (all panel layouts and the film), `bubble.ts` (speech bubble tracking a rider's head), `video.ts`.
- `src/three/World.ts`: the persistent WebGL world. FRAMES: travel / hero / incident / stop / settle (with wide-screen overrides). The `stop` and `settle` framings park the riders in the bottom band (left of the ride button / centred) so they never cover media, captions or controls; re-check with `__world.getRidersRect()` after changing them. Includes the soft cloud obstacle (`setObstacle`) and stop markers shown only while riding.
- `riders.ts`: `setDriver('gia'|'jesus', animate)` swaps the front and middle seats; `react()` is the startle.
- Retired files from the old long version are still on disk but excluded in `tsconfig.json` and imported by nothing (a delete was blocked; Winston may remove them): content `story/timeline/films/messages/reflections/prayer/finale.ts`, scenes `memory/relationship/set-pieces/endings/ride.ts`. Old asset folders under `public/assets/` (anniversary, gala, hurricane, …) hold only `.gitkeep` and are unused. A copy of the pre-revision source is in `.qa/backup-pre-revision/`.
- Light theme: tokens in `src/styles/tokens.css`; mood palettes in `src/three/moods.ts`; scene styles in `src/styles/scenes.css`.

## Content rules from Winston (important)
- Never invent events, dates, quotes, gifts, medical details, mentor quotes or reactions. Drafted narration is marked `drafted: true`. `quote` is only for real words.
- Gia is the centre. Faith appears through real events, never generic filler. Scripture only where Winston asked: Jeremiah 1:5, Psalm 139:14 and Isaiah 43:4 with her childhood photo (Stop 6), and Proverbs 31:10 in the finale (KJV).
- Exclude: detailed family arguments, Winston's mother's hospitalisation, the undisclosed difficult incident, past sexual details, graduation logistics, dreams presented as events, fictional future-marriage memories.
- September 27 (Gia's ER visit): gentle and hopeful. The "spiritual opposition" idea is framed as their interpretation, with no fertility implications. The diagnosis is not named on screen unless Winston asks. It sits before the fast, not as its cause.
- Opening: Gia's bubble "I have my license!" (present day) → "Before we celebrate 20, let's revisit your last birthday." → 19th-birthday video → "One last ride through your teens."
- The nail biting is part of the summer deliverance testimony (not a separate milestone).
- The finale signs "Forever & Always — Brian".
- Hurricane: after days without power, water or connection, Winston ran about two miles to a community Starlink and texted her himself that he was safe (she didn't just hear it). Don't quote the text's words or show a screenshot of it.
- Keep relationship conflict out of the recap; Gia is the centre (achievements, growth, faith).

## Where we left off (2026-10-06, after the revision)
Winston's revision brief is implemented: removed the uncle story, the "I'm okay" screenshot, the Valentine's app recording, relationship conflict, the handstand video, call screenshots, the church search and back-seat courage, gifts, Winston's birthday video, Voices, the 19→20 turn and the prayer. Builds clean. Checked in the browser pane at mobile and desktop sizes: hold, hands-free, Space, pausing, the bump and handoff, video blocking, reduced motion, no-WebGL.
Pending:
1. Media: see `ASSET_CHECKLIST.md` (`?media` shows found vs placeholder).
2. Winston to review the `drafted: true` captions in `journey.ts` (esp. the deliverance line, the Valentine's line, and whether "I actually did it!" are her real words).
3. Hospital stop: the diagnosis (ovarian cyst) is deliberately not shown on screen, and there is no spiritual interpretation and no recovery claim. Add only if Winston asks.
4. Not yet verified on a real iPhone: smoothness while riding, the hold under real touch, audio ducking.
5. Rider colours in `ride.ts` are still guesses.
