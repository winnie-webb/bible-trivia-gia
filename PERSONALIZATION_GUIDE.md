# Chapter 20: Personalization Guide

A short, visual ride through the last year of Gia's teens, about 3–5 minutes depending on how long she watches each video.
Everything you edit lives in two places:

```
src/content/
  journey.ts     the whole experience in order: opening, the 8 stops, the roads between them, the finale
  manifest.ts    every photo and video: file path, required/optional, orientation advice
  ride.ts        the riders' colours and the ride button's words
  config.ts      first screen, soundtrack
  types.ts       (reference only: what each field means)

public/assets/   every file you add (see ASSET_CHECKLIST.md for the exact names)
```

## Running it

```bash
npm install
```

```bash
npm run dev -- --host
```

Open the printed **Network** address on your iPhone (same Wi-Fi).

| URL flag | What it does |
|---|---|
| `?media` | Lists every file in the manifest: **Found**, or still a placeholder (**Needed** / **Optional**) |
| `?dev` | Small badge showing the current screen, plus QA helpers |
| `?beat=valentines` | Start at a stop (use a stop id from `journey.ts`, or `stop-id:panel-id`) |
| `?quality=low` / `?quality=none` | Test a weaker phone / the no-WebGL fallback |

To publish: `npm run build`, then deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages).

## How the experience flows

1. **Today** (present day): Gia drives the cross and says *"I have my license!"*
2. **The rewind**: "October 6, 2026" rolls back to 2025: *"Before we celebrate 20, let's revisit your last birthday."*
3. **Stop 1**: her 19th-birthday video (Play, Skip, Continue).
4. **The ride begins**: *"One last ride through your teens."* Early on the cross bumps a soft cloud, everyone startles, and Jesus says *"Let me take the wheel."* He drives from then on.
5. **Stops 2–8**, joined by short rides.
6. **The finale**: a current photo, "Happy 20th Birthday, Gia." / "Welcome to your twenties." / "Forever & Always — Winston".

### Riding
- **Hold** the ride button (or hold **Space** on a computer) and the cross rides. Let go and it slows to a stop.
- **Tap once** to ride hands-free; tap again to stop.
- Arriving at a stop always stops the ride and opens the memory. Riding never passes an unopened memory and is paused while a video plays.
- It pauses by itself if she switches apps, the page is hidden, or the menu opens.
- Inside a stop with more than one panel, **Next ›** (or a tap or swipe up) moves through it. Swipe down or press ← to go back.
- **Reduced motion** (the phone setting, or Menu → Motion): the button becomes **Next stop** and there's no riding animation.

## Changing words
Edit `journey.ts`. Keep captions to one or two short sentences; the photos carry the memory.
- `kicker` = the small date line, `title`, `caption`.
- `drafted: true` = written from your notes; check it reads like you.
- Quote marks only around real words.

## Changing media
Drop files into `public/assets/…` with the names in `ASSET_CHECKLIST.md`. To rename one, change its `src` in `manifest.ts`.
- Required + missing → a clearly labelled placeholder frame.
- Optional + missing → left out.
- A video whose file is missing but whose poster exists shows the poster as a photo.

| Type | Recommendation |
|---|---|
| Photos | JPG, longest side ≤ 2000 px, quality ~80 |
| Videos | MP4 (H.264 + AAC), ≤ 1080p, short. iPhone `.mov`: export "Most Compatible" |

## Before you send it
- [ ] Open `?media`: nothing marked **Needed**
- [ ] Read every `drafted: true` caption in `journey.ts`
- [ ] Ride the whole thing once on an iPhone with sound on, and once with Reduced Motion on
