# Hack Club NUST

The site for Hack Club NUST — the chapter of [Hack Club](https://hackclub.com) at the
National University of Sciences and Technology, Islamabad.

One page, in this order:

| Section | What it is |
|---|---|
| Announcement bar | the orientation headline — a red flip board with a live countdown; click it for the details |
| Hero | mouse-scrubbed video, the club's line, the two CTAs |
| About | what Hack Club is, its published numbers, its stated beliefs |
| Events | what the club runs — hackathons, workshops, tech & cyber events — and what is up next |
| Chapter | what this club has already run: The Cyber Hackathon ’26 in full, then the rest of the record |
| Team | the club's office bearers, from `src/team.ts` |
| Games | the two games the club built, playable in place |
| Footer | socials, WhatsApp, contact |

Plus two internal tools at fixed paths: `/staff` (HackPass redemption desk) and
`/applications` (the exec team's inbox of the applications received before
recruitment closed). Both are gated by one shared staff key.

### The games

- **AI vs Human** — playable. 15 rounds of prose, code and images. Some rounds hand
  you one artifact and ask who made it; some put two side by side and ask which is
  the model's. Every call is answered with the tell you missed.
- **Cipher Tunes** — playable. Seven letters, each with its own recorded tune.
  Learn them on the practice board, then a word plays as one melody and you spell
  back what you heard.

Players sign in once with name and email; runs land in MongoDB with per-game
leaderboards.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS 3 · Framer Motion 12 · Express · MongoDB

## Run

```bash
npm install
docker run -d -p 27017:27017 --name mongo mongo:7   # MongoDB, or set MONGODB_URI
npm run dev      # API on :8787 + Vite on :5173 (both, via concurrently)
npm run build    # typecheck + production bundle
```

`npm run dev:api` and `npm run dev:web` run the halves separately.

## Design

- **Type:** Space Mono everywhere (Tailwind's `sans`, `serif` and `mono` keys are all
  overridden to it). Anton SC is used only for the hero watermark.
- **Palette:** sampled from the club banner — coral `#F26251` → crimson `#EB4554`,
  white text, on an `#0B0507` near-black base. The gradient is available as
  `bg-brand-grad` and the `brand.*` / `ink` Tailwind colors.
- **Icons:** Bootstrap Icons via CDN (Slack, socials, hourglass), plus lucide-react
  for the two game card glyphs.

## Structure

```
src/
  App.tsx             pathname switch: /staff, /applications, or the site
  components/
    AnnouncementBar.tsx the orientation flip board + countdown, pinned above the navbar
    OrientationModal.tsx  Minecraft-themed orientation details
    HackClubLogo.tsx    the circuit-shield "HC" mark, a CSS mask over currentColor (public/brand)
    Navbar.tsx          expanding glass pill menu + Join CTA
    ScrambleIn.tsx      entrance reveal (0.5 chars/frame, 25ms)
    ScrambleText.tsx    hover scramble (4 frames/char, 25ms)
    SquashHamburger.tsx spring-animated 3-bar hamburger
  sections/
    Hero.tsx        mouse-scrubbed video, watermark, scramble headings
    About.tsx       what Hack Club is; numbers and beliefs, as HQ publishes them
    Events.tsx      what the club runs + the "up next" card that opens the orientation modal
    Chapter.tsx     brand-gradient record of events the club has run
    Team.tsx        the office bearers, as initials cards
    Games.tsx       the two game cards  <-- game entry points live here
    Footer.tsx      video panel + socials
  recruitment.ts    client half of the applications inbox: types + API calls
  orientation.ts    the orientation dates the announcement bar counts down to
  team.ts           the office bearers, in order of office
  events.ts         the club's own events: orientation details, pillars, the record
  links.ts          the WhatsApp community invite
  ApplicationsPage.tsx  the exec team's inbox at /applications
  StaffPage.tsx         the HackPass desk at /staff
  videos.ts         the CloudFront background clips
```

## The AI vs Human game

Playable end to end. Click **Play Now** on the AI vs Human card.

### Sign-in

Players give a name and email before the first run. The email is the identity key
(case-insensitive upsert, so `BILAL@` and `bilal@` are one player) and is **never
returned to the browser** — the leaderboard carries names only. The identity is
remembered in `localStorage` so returning players see their details prefilled.

The gate talks to the API, so the game needs the API running. No API, no run.

### A run

**15 rounds**, mixed across three media and two modes:

| | |
|---|---|
| Media | prose · code · image |
| Single rounds | one artifact — person or model? (10 per run) |
| Compare rounds | two side by side — which one is the model's? (5 per run) |
| Composition | 4 text + 4 code + 2 image singles, 2 image + 2 text + 1 code compares |

Singles are drawn 50/50 model vs person so the split is never itself a tell, and no
sample repeats inside a run.

**The clock is per round**, not flat — `limitFor()` in `scoring.ts`:

```
limit = BASE[difficulty] × KIND_FACTOR[kind] × (compare ? 1.5 : 1)
BASE: easy 20s · medium 16s · hard 13s
KIND_FACTOR: text 1.0 · code 1.15 · image 0.6
```

So a hard image single gives ~8s and an easy code compare ~35s. Running out is a
miss and breaks the streak.

**Keys:** `A`/`H` on single rounds, `1`/`2` on compare rounds (arrows work for both),
`Enter` to advance, `Esc` to quit.

**Scoring:** base 100/200/300 by difficulty, ×1.4 on compare rounds; up to +50% of
base as a speed bonus scaled by the clock left; streak bonuses of +100/+250/+500/
+1000/+2000 at 3/5/7/10/15. Ranks run Signal Reader → Sharp Eye → Calibrated →
Suspicious → Coin Flip → Model Food.

After every call the game reveals the answer **and the tell** — the specific
giveaway in that sample. Image credits are deliberately hidden until after the
answer, since a "Public domain / DALL-E 2" byline would give the round away.

### The database

MongoDB, reached through a small Express API that runs beside Vite in dev and as a
single Vercel function in production.

```
server/
  db.mjs     connection + indexes (client cached for serverless reuse)
  repo.mjs   every database query in the project lives here
  app.mjs    routes + validation, with no listener attached
  index.mjs  binds a port for local dev
api/
  index.mjs  the same app, exported as a Vercel function
```

| Route | Does |
|---|---|
| `POST /api/players` | upsert by email, returns player + standing |
| `POST /api/runs` | records a run, returns standing + fresh leaderboard |
| `GET /api/leaderboard?game=&limit=` | best run per player, ranked, plus the champion |
| `GET /api/health` | liveness + per-game row counts |
| `GET /api/hackpass/mine?playerId=` | a player's own progress + pass, if any |
| `GET /api/hackpass/lookup/:code` | public — validity + redeemed status, never the email |
| `POST /api/hackpass/lookup/:code/redeem` | staff-key gated, one-time |

Two collections. `players` is `{ name, email, createdAt }` with a unique index on a
lowercased email, so `BILAL@` and `bilal@` are one person. `runs` is
`{ playerId, game, score, correct, total, maxCombo, accuracy, rankTitle, playedAt }`
indexed on `{ game, score }`.

The leaderboard is one aggregation: match the game, sort by score, `$group` on
player taking `$first` as their best run, sort again, `$lookup` the name. **Emails
are never projected**, so they cannot reach the browser.

`repo.mjs` is the only module that touches the database — nothing above it knows
which store is behind. That is what made the SQLite-to-Mongo move a single-file job.

#### Connections and serverless

A serverless invocation reuses a warm container, so the Mongo client is cached on
`globalThis`. Reconnecting per request would exhaust the connection pool under any
real traffic. A failed connection clears the cache so the next request retries
rather than inheriting a poisoned promise, and every route is wrapped so a database
outage answers 503 instead of crashing the function.

#### Local setup

```bash
docker run -d -p 27017:27017 --name mongo mongo:7   # or use an Atlas URI
cp .env.example .env.local                           # then edit if needed
npm run dev
```

`.env.local` is gitignored and loaded by `--env-file-if-exists`, so the app still
starts without it (falling back to `mongodb://127.0.0.1:27017`).

#### Migrating the old SQLite data

The leaderboard used to be SQLite. `npm run migrate:mongo` copies
`server/data/hackclub-game.db` into MongoDB — idempotent, matching players on email
and skipping runs that are already there.

### Adding samples

`src/game/data/samples.ts` is a flat array of 48. Append and `buildRun()` picks it
up. Compare rounds are assembled at runtime by pairing one AI and one human sample
of the same kind, so adding a sample grows both modes at once.

```ts
{
  id: 'i-ai-6',
  kind: 'image',          // 'text' | 'code' | 'image'
  difficulty: 'hard',     // sets base points and the clock
  isAI: true,
  content: '/game/images/whatever.jpg',   // body, or a path under public/
  tell: '...',            // the giveaway, shown after the answer
  credit: { license, author, source },    // images only
}
```

**On provenance.** The prose and code samples are curated exemplars written to
demonstrate stylistic tells — including four deliberate traps that invert the
obvious heuristic (an AI sample that fakes a scrappy comment, a human one that
reads like model prose). They teach register, not forensics.

The **20 images are genuinely sourced**, all from Wikimedia with license and author
recorded in `public/game/images/CREDITS.json` and shown in-game after each answer:

| | |
|---|---|
| 10 AI | 5 photorealistic (StyleGAN portraits, a face swap, the Midjourney puffer-jacket Pope) + 5 stylized (Stable Diffusion landscapes, DALL-E, the Midjourney art-prize piece) |
| 10 human | photographs of Islamabad and Rawalpindi — streets, interchanges, parks, campus buildings |

The photorealistic tier is what makes image rounds hard: on a GAN portrait the face
is flawless, so the tell is always at the edges — smeared backgrounds, hair fusing
into shoulders, a crucifix chain that passes over then under then stops existing.

Sourcing note: `commons.wikimedia.org` is unreachable from this machine, and pulling
full-size originals gets you rate-limited fast. The route that works is the
`en.wikipedia.org` API with `iiurlwidth=900`, which returns server-side **thumbnail**
URLs — smaller, faster, and the access pattern Wikimedia actually asks for.

## Cipher Tunes

Playable. Click **Play Now** on the Cipher Tunes card.

Seven letters — **A G H L M O R** — each have a tune recorded by the club. A word is
played as those tunes back to back, and the player spells back what they heard.

### The audio pipeline

The raw recordings are ~10 seconds each, which does not survive concatenation: a
five-letter word would be 50 seconds of audio per listen. Two problems had to be
solved before the game was playable at all.

**Length.** Every letter is represented in play by a 2.5s **signature**. Rather than
taking the first few seconds, `scripts/prepare-tunes.py` scores every candidate
window on how little its pitch content (chroma) resembles the *other* letters, and
keeps the most distinctive one. On the first seven letters that halved average
confusability — mean similarity 0.84 → 0.67, worst pair 0.968 → 0.916.

**Loudness.** The raw takes ranged from -16 dB to -45 dB mean, so R was nearly
inaudible beside O. Everything is normalised to -16 LUFS, which brought the spread
from 29 dB down to 1.2 dB.

### Adding the rest of the alphabet

Record the new letters, name them `Letter X.mp3`, and run:

```bash
python3 scripts/prepare-tunes.py "path/to/recordings"
```

It writes `<L>.mp3` (signature) and `<L>-full.mp3` (whole take) into
`public/game/tunes/`, prints the distinctiveness score for each, and saves the
chosen windows to `SOURCE.json`. Then add the letters to `LETTERS` and
`LETTER_COLOR` in `src/game/tunes/alphabet.ts`, and extend `words.ts`.

**Watch the distinctiveness numbers.** Anything below ~0.1 means that letter sounds
like one of its neighbours and words containing both will feel unfair.

### The word bank

Constrained to the letters that have tunes. The system dictionary yields 276
candidates from {A,G,H,L,M,O,R}, but most are unusable at a stall (AAL, AHO, GRA),
so `words.ts` is hand-picked to 37 words a first-year will recognise on sight.
`unplayableWords()` guards against a typo shipping a word that cannot be played.

### UX decisions worth keeping

The game is aimed at someone who has never heard the alphabet before, so:

- **Practice first, no timer.** The run cannot start until the player has met the
  practice board. Full 10s recordings are available there, and only there.
- **Tap = hear *and* place.** One gesture does both, so comparing "what I heard"
  against "what I am spelling" is the same action. No modes to learn.
- **Spelling is allowed during playback**, but tapping stays silent then, so the
  letter tune never collides with the melody. Waiting out 17 seconds of audio before
  being allowed to touch anything was the first thing that felt wrong in testing.
- **The clock starts when the melody ends**, and is generous — 25s plus 8s per
  letter. A tight clock would punish the listening the game exists to teach.
- **Slots light up in sync** with the melody, so a player sees which sound maps to
  which position. That is the teaching mechanism, not the score.
- **Words get longer** through a run (3,3,4,4,5,5,6) so the first one is winnable.

Scoring: 100 per letter, up to +40% for speed, two free replays then −10% each, −30%
per revealed letter (max 2), streak bonuses at 3/5/7. Ranks run Perfect Pitch →
Golden Ear → Tuned In → Getting It → Warming Up → All Ears.

### Files

```
src/game/tunes/
  alphabet.ts          letters, asset paths, timing, colours
  audio.ts             loads/decodes signatures, schedules words on the audio clock
  words.ts             the curated bank
  scoring.ts           clocks, points, ranks, run building
  useCipherTunes.ts    phase machine, timer, guessing, hints
  components/          practice board, round view, results, slots, loader
scripts/prepare-tunes.py   raw recordings -> game assets
```

## Per-game leaderboards

Every run carries a `game` field and every query is scoped to it, so each game gets
an independent board while players are shared — one sign-in covers all of them.
Adding a game means adding its id to `GAMES` in `server/db.mjs`; an unrecognised id
falls back to the first entry rather than erroring.

## HackPass

A discount code, earned by clearing a high score bar in **both** games (best
single run each — the bars are independent, not summed). Redeemable at
participating cafes.

### The bar

Set by simulating the real scoring code, not guessed. See `server/hackpass.mjs`
for the full methodology; the short version:

| Game | True ceiling | Bar | What it takes |
|---|---|---|---|
| AI vs Human | 11,050 (60k simulated runs) | **7,500** | ~90%+ accuracy and good speed |
| Cipher Tunes | 5,050 (deterministic — fixed word-length mix every run) | **3,800** | 7/7 words, ~0-1 hints, no dawdling |

Both sit at roughly 70-75% of the true ceiling — reachable by a genuinely sharp,
attentive player, out of reach for a casual one. There is one completed run in
the database as of writing this, so treat these as a calibrated starting point
and revisit once real stall data exists.

### How it is issued

Checked after every run submission (either game) and on sign-in, so a player
whose bests already qualify — reached across separate sessions — is caught up
immediately rather than needing one more run to trigger it. One pass per player,
enforced by a unique index rather than a lock: concurrent qualifying submissions
race the database, not application logic.

The code is `HACK-XXXXXX`, drawn from an alphabet with no `0/O/1/I/L` — it gets
read aloud and typed by a barista.

### Redeeming one

`/staff` — a plain pathname check in `App.tsx`, not a router; it is a one-page
internal tool, not a second app. Enter the shared key (`HACKPASS_STAFF_KEY`) once
per session, look up a code, confirm it with the player, redeem. Redemption is
atomic and one-time: a code can't be redeemed twice even under a race, and
looking up a code never exposes the holder's email.

### The honest limitation

**The API trusts the score the browser reports.** Neither game re-derives round
outcomes server-side, so a technically inclined user could open devtools and
submit a fabricated `POST /api/runs` for their own already-registered player.
`server/hackpass.mjs` closes the blatant version of this — any score above the
game's true mathematical ceiling is rejected outright — but a plausible forged
number just under the ceiling would still be accepted. Full protection means the
server owning round generation and grading, which is a real redesign of both
game engines, not a quick patch. Worth doing before this scales past a supervised
club stall; out of scope for this pass.

### Files

```
server/hackpass.mjs   thresholds, ceilings, code generator (pure, no DB)
server/repo.mjs       issueHackpassIfNew / redeemHackpass / lookup (the only
                       module touching the hackpasses collection)
server/app.mjs        evaluateHackpass() orchestration + the four routes
src/game/hackpass.ts  client-side mirror of the thresholds, for display only —
                       the server is the actual authority
src/game/components/HackPassPanel.tsx   shared by both games' results/intro
                                         screens: progress bars, or the won state
src/StaffPage.tsx      the /staff redemption tool
```

## The announcement bar

One solid red bar pinned above the navbar (56px on a phone, 64px from `md` up)
for **Orientation 26–27** (6 October 2026). It carries three things and nothing
else: the headline, the date, and a live countdown. It is display only — nothing
to click.

There is too little text to scroll, so it works like a departure board instead:

- **Flip slot.** The headline and the date share one slot and flip over every
  2.5s. Showing one at a time is what lets the type be this big on a phone. An
  invisible copy of the longest message holds the slot's width, so nothing
  shifts — keep the longest first in `MESSAGES`.
- **Rolling digits.** Each countdown digit rolls up as it changes, so the seconds
  move every second.
- **Glow, sheen, live dot.** A glow breathes under the bar (`glow` in
  `tailwind.config.js`), a sheen crosses it every few seconds, and the dot pings.
- **Hover pops it out.** The bar grows 12px, the content scales up and the glow
  swells, on the navbar's pill spring. 12px keeps it clear of the navbar pills.

The headline and date are in Anton SC — the hero watermark's font — because it
is condensed enough to go large; the countdown stays in Space Mono so its digits
do not change width. `prefers-reduced-motion` swaps the flip and the roll for
plain fades and turns the glow, sheen and ping off.

- **Dates** live in `src/orientation.ts`, in Pakistan time. The countdown runs to
  `ORIENTATION_STARTS_AT` — 2pm on 6 October — and reads "Today" from then on.
- **It takes itself down.** Past `ORIENTATION_ENDS_AT` the bar stops rendering and
  the navbar moves back to the top, so nobody has to remember to remove it.
- It sits at `z-[60]` — above the navbar, below the game overlays, which cover it.

To reuse it for the next event: change the two dates, and `MESSAGES` in
`src/components/AnnouncementBar.tsx`.

## Applications inbox (recruitment closed)

Executive recruitment for this tenure is over. The Recruit section, the form and
every route that accepted an application are gone; what remains is the staff side,
so the exec team can still work through what was received. Nothing in the
`applications` collection was deleted.

| Route | Does | Auth |
|---|---|---|
| `GET /api/applications` | the inbox, with contact details | staff key |
| `POST /api/applications/:id/status` | new / shortlisted / accepted / rejected | staff key |

`/applications` uses the same shared staff key as the HackPass desk, read from the
same `sessionStorage` entry, so moving between the two tools does not ask for it
twice. Filter by portfolio, expand a row for the full answers and contact details,
set a status, or export the current filter to CSV. Status changes are optimistic
and roll back if the write fails.

`STAFF_KEY` is the env var going forward; `HACKPASS_STAFF_KEY` is still honoured so
the deployed environment keeps working unchanged.

**Reopening recruitment** means bringing back the public half — the form section,
`POST /api/applications` and its validator. They are in git history, last present
in commit `717d69e`.

## Design system

Everything below the hero follows `docs/design-system.md`: three surfaces (ink,
graphite/arcade, paper) instead of one red-black, a cool `signal` accent, red kept
as light rather than paint (kicker LEDs, one primary button per section), Instrument
Sans for reading copy, and one pointer-driven toy per section — the dot-field lens
(About), the rack (Events), the torch (Record), the swinging badges (Team), the CRT
attract screens (Games) and the scrambling wordmark (Footer). Section-specific code
lives in `src/sections/<name>/`. Sections set `data-surface="paper" | "dark"`, which
the navbar reads to switch its pills.

## The club's events

Everything in the Events and Chapter sections comes from `src/events.ts`, and every
line in it is a claim about something the club actually ran — sourced from the
club's Instagram (@hackclub.nust) and, for The Cyber Hackathon ’26, PKCERT's event
page. Add an event when it happens; leave a detail out rather than guess at it.

The orientation modal (`components/OrientationModal.tsx`) is dressed like the
orientation poster — a Minecraft inventory panel, in Press Start 2P. The poster
image is the club's six-tile Instagram grid stitched back into one. The modal opens
itself once per visit and from the announcement bar, and goes away with the bar at
`ORIENTATION_ENDS_AT`.

These sections used to list Hack Club HQ's own programs, fetched live from HQ's
events API. None of those were things this chapter runs, and HQ scopes most of them
to ages 13–18, so they were removed along with `/api/programs`.

Hack Club's brand rules also require the name be written **Hack Club**, never
"Hackclub" — including the hero watermark.

## Deploying to Vercel

`vercel.json` builds the Vite app to `dist` and rewrites `/api/*` to the single
function in `api/index.mjs`.

1. Create a MongoDB Atlas cluster (the free tier is plenty for a club).
2. In the Vercel project, set `MONGODB_URI`, `MONGODB_DB` and `STAFF_KEY` (the
   shared key for `/staff` and `/applications`). Never commit these — `.env*` is
   gitignored and `.env.example` holds only localhost defaults.
3. Allow Vercel's egress in Atlas. Serverless functions do not have fixed IPs, so
   either allow `0.0.0.0/0` with a strong password or put the cluster behind a
   Vercel integration.
4. `vercel --prod`, or connect the GitHub repo for automatic deploys.

**If the driver fails with `tlsv1 alert internal error` (SSL alert 80)**, the cluster
is usually still provisioning rather than misconfigured. A freshly created M0 brings
its three replica endpoints up one at a time, and the driver needs the set — plain
`mongosh` and one of the three hosts will connect while the other two still reject.
It clears itself within a few minutes; retry before changing any settings.

The browser is same-origin with the API in both dev (Vite proxy) and production
(the rewrite), so there is no CORS layer anywhere.

## Notes

- The hero video never plays — it is **scrubbed** by horizontal pointer movement
  (sensitivity `0.8`, so a full-width sweep covers 80% of the clip). Seeks chain
  through the `seeked` event so fast movement queues one pending target instead of
  dropping frames. Touch-drag works the same way.
- Full-viewport sections use `.h-screen-dvh`, which declares `100vh` then `100dvh`
  so mobile browser chrome is handled with a real CSS fallback.
