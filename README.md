# ABL — Always Be Learning

A private, space-dark nightly practice system for the crew: **Booty**, **JO**, and **Dad**.

The girls already did the lesson. ABL locks today's idea, then pushes past it the same night:
8 questions + 1 Deep Orbit bonus, three "Did you know" signal bursts, difficulty that climbs when it's too easy.

> Stay in orbit — then leave it.

---

## Stack

| Layer | What |
|---|---|
| Shell | **Astro 7** + TypeScript. Static pages; only auth + quiz hydrate as Preact islands (`client:load`). |
| Styles | Vanilla CSS design system — `src/styles/tokens.css`, `src/styles/app.css`. No Tailwind, no UI kit. |
| Server | Astro endpoints in `src/pages/api/*` → deployed as one Netlify Function by `@astrojs/netlify`. |
| Data | Supabase Auth + Postgres + Row Level Security. |
| AI | Server-side only, via `src/lib/server/llm.ts`: Anthropic Messages API or Gemini `generateContent` (`ABL_PROVIDER`). One model generates, a lighter one grades short answers. |

No Next.js, no WordPress, no JVM. "Java" in the brief meant JavaScript/TypeScript.

---

## Quick start

```bash
npm i
npm run dev          # http://localhost:4321
```

**With no `.env` the app runs in local demo mode.** Everything (PINs, missions, boards) lives in that
browser's localStorage and missions come from hand-written sample transmissions
(Algebra 2 polynomial multiplication, English 11 conclusions, Science 7 lunar phases + Newton's third law, Math 7 two-step equations).
A gold **Demo** pill shows in the top bar. Use it to see the full flow before wiring Supabase.

Fill `.env.local` (below) and restart, and the same UI runs live.

---

## Environment

For local dev put these in `.env.local` (git-ignored via `.env.*`). On Netlify set the same keys under
**Site configuration → Environment variables**. Values that still read `PASTE_…` count as unset, so a fresh
`.env.local` keeps the app in demo mode until the real Supabase URL + anon key are in.

| Key | Where it's used | Secret? |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | browser + server | no |
| `PUBLIC_SUPABASE_ANON_KEY` | browser + server | no (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | server functions only | **yes** |
| `ABL_PROVIDER` | `anthropic` or `gemini`. Unset → whichever key exists (Anthropic first) | — |
| `ANTHROPIC_API_KEY` | server, when the provider is `anthropic` | **yes** |
| `ANTHROPIC_MODEL` / `ANTHROPIC_GRADER_MODEL` | optional, default `claude-sonnet-4-5` / `claude-haiku-4-5` | — |
| `GEMINI_API_KEY` | server, when the provider is `gemini` (AI Studio key) | **yes** |
| `GEMINI_MODEL` / `GEMINI_GRADER_MODEL` | optional, default `gemini-2.5-flash` / `gemini-2.5-flash-lite` | — |
| `DAD_EMAIL` / `DAD_PASSWORD` | `npm run seed` only | **yes** |

The provider is a hard choice: `ABL_PROVIDER=gemini` with no `GEMINI_API_KEY` returns a 503 — it never falls
back to Anthropic (and the reverse). Both adapters live in `src/lib/server/providers/`; generator and grader
only talk to the facade `src/lib/server/llm.ts`.

Keys are only read in `src/lib/server/*`, which no island imports. Never prefix them with `PUBLIC_`.

---|---|---|
| `PUBLIC_SUPABASE_URL` | browser + server | no |
| `PUBLIC_SUPABASE_ANON_KEY` | browser + server | no (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | server functions only | **yes** |
| `ANTHROPIC_API_KEY` | server functions only | **yes** |
| `ANTHROPIC_MODEL` | optional, default `claude-sonnet-4-5` | — |
| `ANTHROPIC_GRADER_MODEL` | optional, default `claude-haiku-4-5` | — |

`ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only read in `src/lib/server/*`, which no island imports.
Never prefix them with `PUBLIC_`.

---

## Supabase setup

### 1. Create the project and run the SQL

Supabase → **SQL Editor** → paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

It creates `profiles`, `courses`, `learner_subject_stats`, `missions`, `answers`, the RLS policies, and a
trigger that seeds each learner's course list the moment her profile is created:

- **Booty (11, ICA):** English 11 A · Algebra 2 A · Environmental Science A · High School Health · Marketing Foundations 1 A · Personal Finance
- **JO (7, I-35):** Language Arts 7 · Math 7 · Science 7 · Social Studies 7 · Health · Physical Education · Music / Band · Art

(`Other` with a custom subject line is always available in the form.)

**RLS in one line:** each learner reads only her rows; Dad (role `parent`) reads both. Scores, stats and answers are
written only by server functions with the service role, so a browser can't edit a score. PIN hashes and the
mission answer key (`missions.payload`) are column-revoked from the browser entirely.

### 2. Seed the crew (recommended: the script)

```bash
DAD_EMAIL=you@example.com DAD_PASSWORD='a-long-passphrase' npm run seed
```

This reads `.env.local` (or `.env`) for the service role key and, idempotently:

- creates **Dad** as a normal email + password Auth user → profile `Dad` / role `parent`
- creates two **learner** Auth users with internal emails (`booty@abl.local`, `jo@abl.local` — never typed, never
  emailed; override with `BOOTY_EMAIL` / `JO_EMAIL`) and random throwaway passwords → profiles `Booty` (grade 11) and
  `JO` (grade 7), `pin_set = false`

Re-running it never touches an existing PIN.

<details>
<summary>Prefer the dashboard? Manual version</summary>

1. Supabase → **Authentication → Users → Add user → Create new user**, three times, with **Auto Confirm User** checked:
   - your real email + a strong password (Dad)
   - `booty@abl.local` + any long random password
   - `jo@abl.local` + any long random password
2. SQL Editor:

```sql
insert into public.profiles (id, display_name, role, grade)
select id, 'Dad', 'parent', null from auth.users where email = 'you@example.com';

insert into public.profiles (id, display_name, role, grade)
select id, 'Booty', 'learner', 11 from auth.users where email = 'booty@abl.local';

insert into public.profiles (id, display_name, role, grade)
select id, 'JO', 'learner', 7 from auth.users where email = 'jo@abl.local';
```

Names are case-sensitive and enforced by a check constraint: exactly `Booty`, `JO`, `Dad`.
</details>

### 3. First-run PIN (each girl, on her own device)

1. Open the app → tap **Booty** (or **JO**).
2. No PIN yet → **"Set your 6-digit PIN."** Enter once, confirm once. Digits only, show/hide toggle.
   Blocked: `000000`, `123456`, `111111`, straight runs, all-same digits, and the crew name on a phone keypad
   (BOOTY → 26689, JO → 56 repeated).
3. From then on: six big keys. 5 misses → 30-second cool-off, enforced on the server.
4. Settings (gear icon) → change PIN with current PIN + new PIN twice.

The PIN is hashed with scrypt + a per-PIN salt on the server (`src/lib/server/pinhash.ts`). The raw PIN is never
stored or logged. After a correct PIN the server mints a normal Supabase session for her learner Auth user
(one-time magic-link token generated and consumed server-side; no email is sent). The session persists on that
device until she taps **Sign out**.

Forgot it? Dad → Parent bay → her card → **PIN → Clear PIN**. Dad never sees or sets her PIN; clearing just sends
her back to "Set your 6-digit PIN".

---

## Deploy to Netlify

1. Push this repo to `github.com/t3kdesigns03/alwaysbelearning`.
2. Netlify → **Add new site → Import from Git** → pick the repo. `netlify.toml` already sets
   `npm run build`, publish `dist`, Node 22.
3. Add the four environment variables. Deploy.
4. In Supabase → **Authentication → URL Configuration**, set the Site URL to your Netlify URL.

Generation runs as two **parallel** Claude calls (Q1–Q4 + signal bursts, Q5–Q8 + Deep Orbit) so a mission
usually lands in ~15–25 s — inside Netlify's synchronous function limit. Each half is schema-validated
(zod) and retried once with the validation error if there's time. Multiple-choice options are shuffled
server-side so the key is never "always B". A 15-missions-per-learner-per-day cap protects the Anthropic bill.

---

## How a mission works

**Always 8 + 1.** Same rhythm every night; only content and difficulty change.

| Items | Job |
|---|---|
| Q1–Q2 · *Lock it* | prove she still holds today's lesson |
| Q3–Q6 · *Push* | apply it harder — new numbers, new text, a model, a what-if, find-the-error |
| Q7–Q8 · *Transfer* | next idea in the unit, or the same idea in a stranger setting |
| Deep Orbit | a real, checkable fact-question one level past tonight. Scored separately. She can skip the choices and write it. |

6 multiple choice (4 options) + 2 short answer (Q4, Q8). Signal bursts after Q2, Q4 and Q6 — one on-topic,
one adjacent stretch, one wild-card; never scored, auto-advance after ~8 s (press-and-hold pauses).

- Wrong → "Almost. Here's the missing piece." → the why → a strong answer → the next rung.
- Right → "Signal clear." → what she just proved → the next rung. No parade.
- Short answers are graded semantically on the server (equivalent wording accepted).

**Subject lock.** The subject is a hard filter, not a label. `itemFitsSubject(item, subject)` in
`src/lib/subjects.ts` scores every item against the chosen course and the learner's other courses (lexicons keyed
by the existing course labels). It runs twice: when a mission is built (an off-subject item is regenerated by the
server or redrawn from the same subject's demo bank — never relabeled) and right before a question renders (a
misfit is skipped and logged with `[abl] skipped …`). A PE mission can't carry a moon-phase item; a Science 7 one can.
Custom `Other` subjects have no lexicon and aren't filtered.

**Topics.** Booty pastes her Connexus planner line — `U4, L3: Polynomial Multiplication` is parsed to unit `U4`,
lesson `L3`, concept "Polynomial Multiplication". JO types plain words (`lunar phases`, `ratios word problems`);
she never gets invented unit codes. The typed string is always the source of truth; `src/lib/courses.ts` holds the
fall-2026 *now / next* context per course that the generator leans on when the topic is thin.

**Difficulty** (per learner × subject, 1–5, starts at 3): ≥ 7/8 → +1 · 5–6 → hold · ≤ 4 → −1.
An 8/8 also tells the next prompt "the generator went soft — come in hotter."

**Board:** last, best, missions flown, streak (consecutive Chicago days in that subject), points
= (score + 2 for Deep Orbit) × difficulty, rank Cadet 0 → Pilot 60 → Navigator 200 → Commander 450.

**Coach runs:** Dad can open either girl's Mission Control from the Parent bay and fly a practice mission at her
grade + difficulty. It's logged as a coach run and does **not** change her board.

---

## Adding JO's real electives later

Parent bay → her card → **Courses** → add (e.g. `Spanish 7`, `Career Exploration`). It's a row in `courses`,
so it shows up in her dropdown immediately. Courses not in `COURSE_CONTEXT` still generate — the prompt just stays
tight on the typed topic.

---

## Project map

```
astro.config.mjs · netlify.toml · .env.example
scripts/seed.mjs                      crew seeding (service role, run locally once)
supabase/migrations/0001_init.sql     schema + RLS + course seeding trigger
src/
  layouts/Base.astro                  fonts, meta, starfield
  components/                         Starfield, Lockup, CrewMark, TopBar, Settings, Transmit, MathText, Icons
  islands/                            Dock, Login, MissionControl, NewTransmission, Mission, Debrief, Board, ParentBay
  pages/
    index.astro                       Splash / Dock
    login.astro                       PIN or email+password
    app/index.astro                   Mission Control
    app/new.astro                     New Transmission
    app/mission/[id].astro            Mission (on-demand)
    app/debrief/[id].astro            Debrief (on-demand)
    app/board.astro                   Scoreboard
    app/parent.astro                  Parent bay
    api/crew.ts                       GET  roster (names, roles, pin_set)
    api/pin-set.ts                    POST first PIN → session
    api/pin-login.ts                  POST PIN → session (5 misses → 30 s)
    api/pin-change.ts                 POST current + new
    api/pin-reset.ts                  POST parent clears a PIN
    api/generate-mission.ts           POST subject + topic → mission (Claude)
    api/mission.ts                    GET  mission without answer key
    api/check-answer.ts               POST multiple choice
    api/grade-short.ts                POST short answer / Deep Orbit text (Claude, semantic)
    api/complete-mission.ts           POST score, stats, difficulty, streak
  lib/
    types.ts · courses.ts · scoring.ts · pin.ts · grading.ts
    api.ts (client data layer) · supabase.ts (browser client) · demo.ts + samples.ts (local demo mode)
    server/  env · supabase · pinhash · pinlock · llm · providers/{anthropic,gemini} · generator · grader · missions
  styles/tokens.css · styles/app.css
```

---

## Out of scope (on purpose)

- **Connexus is out of scope.** No scraping, no sync, no school passwords. Paste planner lines by hand.
- No Infinite Campus integration for JO. She (or Dad) types what class covered.
- No homework upload, chat, payments, teacher accounts, printables, social, or avatars beyond the constellation mark.

---

## Troubleshooting

- **"Not on the roster yet"** on a name → run `npm run seed` (or the manual SQL).
- **"Server is missing …"** → an env var isn't set on Netlify (or `.env` locally). Redeploy after adding.
- **"The generator took too long"** → try again; if it keeps happening, set `ANTHROPIC_MODEL` to a faster Sonnet.
- **Dad's login says "isn't attached to Dad's profile"** → the Auth user exists but the `profiles` row doesn't.
- **Reset the demo** → browser devtools → Application → Local Storage → delete `abl-demo-v1`.

T3KDesigns · built dark.
