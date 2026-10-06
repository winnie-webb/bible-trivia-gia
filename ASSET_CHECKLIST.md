# Chapter 20: Media Checklist

Put each file at the path shown (inside `public/`). It appears by itself; no code changes needed.
Everything is listed in one place in `src/content/manifest.ts`. To use a different file name, change `src` there.

- **Required**: until the file exists, a labelled placeholder frame shows the expected path.
- **Optional**: if the file is missing, it's simply left out (nothing shows in its place).
- Open the app with **`?media`** at the end of the address to see which files are found and which are still placeholders.

Formats: photos as **JPG** (long side about 1600–2000 px). Videos as **MP4 (H.264 + AAC)**, ideally under 30 MB each. iPhone "Most Compatible" exports work. Posters are a single JPG frame from the video.

## Supplied so far (2026-10-06)
Your files sit directly in `public/assets/`, and `manifest.ts` points at them by name:

- Stop 1: `bday2025recap.mp4`
- Stop 2: `melissa.jpeg` (the hurricane), `christmas-dinner.jpeg`
- Stop 3: `valentine.jpeg` (the letter; the flowers and chocolates photos are optional extras)
- Stop 4: `makeup-1.jpeg`, `makeup-2.jpeg`, `gala-look.jpeg`, `rising-star.jpeg`, and `grades-4-0.jpg` (cropped from `4.0.jpeg` to Spring 2026 only)
- Stop 5: `sign-language.mp4`, `nails.jpeg` (the skipping-rope photo was removed)
- Stop 6: `lintons.jpeg`
- Stop 7: `license.jpeg`, shown in full (there is no licence video)
- Stop 8: `hospital.jpeg`
- Finale: `chapter-20-1.jpeg`

**Still needed:** `sign-language.mp4` is an empty (0-byte) file, so copy it again. `young-gia.jpeg` is not used yet.

The table below lists each slot's default name; the paths above replace them where supplied.

| # | Stop | What to supply | Req. | File (inside `public/`) | Orientation and guidance |
|---|---|---|---|---|---|
| 1 | 1 · Your last birthday | The short video from her 19th birthday | **Required** | `assets/1-last-birthday/last-birthday.mp4` | Portrait (vertical) preferred. Under ~90 s. She plays it herself; Skip / Continue are always there |
| 2 | 1 · Your last birthday | Poster: one clear frame from that video | Optional | `assets/1-last-birthday/last-birthday-poster.jpg` | Same orientation as the video. Shown before she presses play |
| 3 | 2 · Through the storm | A real photo of the Hurricane Melissa damage | **Required** | `assets/2-storm-christmas/hurricane-damage.jpg` | **Landscape**. Nothing graphic; no faces needed |
| 4 | 2 · Our first Christmas | Your Christmas food | **Required** | `assets/2-storm-christmas/christmas-food.jpg` | **Square** (or portrait cropped square). Tight on the plate. The labels (mutton, fried chicken, curry, pork) float around it |
| 5 | 3 · Valentine's | The flowers | **Required** | `assets/3-valentines/flowers.jpg` | Portrait |
| 6 | 3 · Valentine's | Gia with the chocolates | **Required** | `assets/3-valentines/gia-with-chocolates.jpg` | Portrait; her face in the upper half |
| 7 | 3 · Valentine's | One more Valentine's picture | Optional | `assets/3-valentines/extra.jpg` | Portrait. With it, three prints fan out instead of two |
| 8 | 4 · Learning makeup | Makeup practice photo (earlier) | **Required** | `assets/4-gala-comeback/practice-1.jpg` | Portrait, face centred |
| 9 | 4 · Learning makeup | Makeup practice photo (later) | **Required** | `assets/4-gala-comeback/practice-2.jpg` | Portrait, face centred |
| 10 | 4 · Learning makeup | A third practice photo | Optional | `assets/4-gala-comeback/practice-3.jpg` | Portrait, face centred |
| 11 | 4 · The gala | Her finished gala look (the big reveal) | **Required** | `assets/4-gala-comeback/gala.jpg` | Portrait, best quality you have. Framed on her face (about the top third) |
| 12 | 4 · Rising Star & 4.0 | Gia with the Rising Star Award | **Required** | `assets/4-gala-comeback/rising-star.jpg` | Portrait |
| 13 | 5 · Playful new skills | The sign-language video | **Required** | `assets/5-summer/sign-language.mp4` | Portrait. 10–30 s is ideal; trim if longer |
| 14 | 5 · Playful new skills | Poster frame for the sign-language video | Optional | `assets/5-summer/sign-language-poster.jpg` | Portrait |
| 15 | 5 · Playful new skills | Gia with her skipping rope | **Required** | `assets/5-summer/skipping-rope.jpg` | Portrait |
| 16 | 5 · The nail milestone | Her long nails now | **Required** | `assets/5-summer/nails-now.jpg` | **Square**, close up, good light |
| 17 | 5 · The nail milestone | An earlier nail photo | Optional | `assets/5-summer/nails-before.jpg` | Square. **Only if a real earlier photo exists.** Without it, no comparison is shown |
| 18 | 6 · One year since baptism | Baptism photo (or a still from a video) | Optional | `assets/6-faith/baptism.jpg` | Portrait. Without it, the stop shows a soft light instead |
| 19 | 6 · The Lintons | Mr. and Mrs. Linton together | **Required** | `assets/6-faith/lintons.jpg` | **Landscape** (square also works). Ask their permission first |
| 20 | 7 · "I actually did it!" | Her new licence (photo) | **Required** | `assets/license.jpeg` | Shown in full. No video for this stop |
| 22 | 8 · A quiet reset | One calm photo you're both comfortable with | **Required** | `assets/8-quiet-reset/quiet.jpg` | Portrait. Her smiling, a sky, a Bible, hands. **No hospital images or records** |
| 23 | Finale | A beautiful current photo of Gia | **Required** | `assets/9-finale/gia-today.jpg` | Portrait, high resolution; her face in the upper third |

**Not needed:** character reference photos. The three riders are drawn in code. If you'd like the figures closer to life, just tell me hair and outfit colours (`src/content/ride.ts`).

**Optional soundtrack:** `assets/audio/main-theme.mp3` (starts with the first ride) and `assets/audio/finale.mp3`. Uncomment them in `src/content/config.ts`. Until then a soft generated tone plays, and only if she entered with sound.

## Words to check (`src/content/journey.ts`)
Captions marked `drafted: true` were written from your notes. Read them once and change anything that isn't how you'd say it. In particular:
- Stop 2 hurricane: *"After days without a connection, I ran two miles to a Starlink signal to text you that I was safe."*
- Stop 2 Christmas: *"You teased that the hurricane clearly hadn't touched me at all."*
- Stop 3: *"Flowers and chocolates, sent with love across the miles."*
- Stop 5: the sign-language joke and the deliverance line (*"This summer, God brought us deliverance concerning spiritual spouses and dreams, and with it, freedom from nail biting."*)
- Stop 7: the title *"I actually did it!"* is in quote marks, so it should be her real words.
- Stop 8: the hospital caption deliberately does not name the diagnosis, add any spiritual interpretation, or claim a recovery.
- The gala date (April 25, 2026) is from your recollection; edit it in `journey.ts` if needed.
