# Always Be Learning — Claude Build Prompt (V1)

## How to run this
Use **Claude Code** (or a Claude Project with the folder attached) on **Claude Opus 5.5**.

Do **not** start on Fable 5 / Fable 5.1 unless you are on Max and want to spend extra credits. On Pro, Opus 5.5 is the included coding model. Fable is stronger on long unattended builds; this V1 is a single focused product and Opus will ship it. Same prompt either way.

Working directory: `E:\T3KDesigns\ABL`
Git remote: `https://github.com/t3kdesigns03/alwaysbelearning`
Deploy: Netlify
Database: Supabase

Copy everything below the line.

---

You are building **Always Be Learning (ABL)** — a private, beautiful, space-themed daily practice app for two sisters at **Iowa Connections Academy** (Pearson Connexus).

## Crew (names are case-sensitive — never change spelling or case)
- **Booty** — 11th grade, age 17. School roster name Isabella Reilly. Display name in the app is exactly `Booty`. Role `learner`.
- **JO** — 7th grade, age 12. Interstate 35 Community School District, Truro, IA (Roadrunners), I-35 Secondary grades 7–8. Display name in the app is exactly `JO`. Role `learner`.
- **Dad** — parent / Learning Coach, Brandon Reilly (T3KDesigns). Display name in the app is exactly `Dad`. Role `parent`. Dad has a real login, not a hidden admin bypass.

Seed these three profiles. Dock, scoreboards, and greetings must render `Booty`, `JO`, and `Dad` exactly.

## School reality — no LMS API
Two different schools. No shared feed.

- **Booty** — Iowa Connections Academy on Pearson Connexus. Parent view is Planner / Learning Coach Central (`www.connexus.com`). No usable parent API for lesson bodies.
- **JO** — Interstate 35 CSD, Truro. Brick-and-mortar. No public daily lesson agenda. No Infinite Campus lesson API for V1.

Do **not** scrape Connexus or Infinite Campus. Do **not** store school passwords. Do **not** build LMS integrations.

Each girl (or Dad) types today’s subject + topic into ABL. That string is the source of truth.

Example Connexus planner lines from Booty’s week of Sep 28–Oct 2, 2026 — her topic field must accept this exact shape:

- `U4, L3: Polynomial Multiplication`
- `U4, L11: Informational Text Conclusions`
- `U2, L1: Domestic vs. Wild`
- `U2, L3: The Water Cycle`
- `U8, L4: Products vs. Services`

Parse unit/lesson codes when present (`U4, L3`) and use the title after the colon as the concept. If they only type a title, that is enough.

## Booty’s live ICA courses (11th) — subject dropdown for her
Required defaults, in this order:
1. English 11 A
2. Algebra 2 A
3. Environmental Science A
4. High School Health
5. Marketing Foundations 1 A
6. Personal Finance

Also allow `Other` with a custom subject line.

Live ICA context — late September 2026 **and the next units after it**. Use what she typed first. If the topic is thin, prefer the *upcoming* idea in the unit, not a recap of last semester.

Current + next (fall 2026):
- English 11 A — now: Format and Style, Informational Text Conclusions, Explanatory Text Portfolio. Next: synthesis of sources, rhetorical situation, claim + counterclaim in an explanatory frame
- Algebra 2 A — now: Successive Differences, Polynomial Multiplication / Division / Operations. Next: polynomial identities, factoring special products, remainder theorem as a stretch
- Environmental Science A — now: Domestic vs. Wild, The Water Cycle. Next: watersheds, human impact on cycles, groundwater vs surface water
- High School Health — now: What is Health, Identifying Health Risks, Taking Responsibility, Healthy Decisions unit test. Next: advocacy / influence, sleep and stress as performance
- Marketing Foundations 1 A — now: wrapping Unit 7, Products vs. Services. Next: branding vs product, target market vs segment, price vs value
- Personal Finance — now: Types of Creditors and Credits. Next: interest, credit score levers, installment vs revolving
- LiveLessons exist for English 11 A and Algebra 2 A; ignore clock times in V1

Questions must feel like this week and next week, not a 2019 review packet.

## JO’s school — Interstate 35 CSD (brick-and-mortar)
JO does **not** use Connexus. She attends Interstate 35 Community School District in Truro, Iowa (Roadrunner Pride). Campus: I-35 Secondary, 405 E. North Street, Truro, IA 50257. Grades 7–8 run on the middle-school bell schedule in the 2025–26 Secondary Handbook.

There is **no public daily lesson API** and no unit/lesson codes like Booty’s planner. Do not invent Connexus-style `U4, L3` topics for JO. She (or Dad) types what class covered today in plain language: `ratios word problems`, `Earth-Sun-Moon`, `textual evidence`.

### 7–8 bell schedule (agenda of the day)
Use this as Mission Control flavor / optional period hint only. Do not require a period to start a mission.
- 1st 8:15–8:59
- 2nd 9:02–9:46
- 3rd 9:49–10:33
- Advisory 10:36–10:56
- 4th WIN / Music 10:59–11:42
- Lunch 11:45–12:08
- 5th 12:11–12:59
- 6th 1:02–1:46
- 7th 1:49–2:33
- 8th 2:36–3:20

WIN = What I Need (intervention / enrichment block). Advisory is homeroom. Neither is a scored academic subject unless she types a real topic.

### JO subject dropdown (I-35 7th + Iowa 7–8 required program)
Seed in this order:
1. Language Arts 7
2. Math 7
3. Science 7
4. Social Studies 7
5. Health
6. Physical Education
7. Music / Band
8. Art
9. Other

Iowa statute requires 7–8 to teach ELA, social studies, math, science, health, human growth & development, career exploration, PE, music, visual art. Computer science is offered somewhere in the district. Keep `Other` for exploratory / career / computer science / Spanish if she has it.

Known I-35 secondary teachers (context only — do not put teacher names in the kid UI unless Dad adds a note):
- 7th/8th ELA: Polly Blum
- 7th/8th Social Studies: Anna Valdez
- Secondary math: Brooke Miller, Jennifer Offield, Carrie Thompson
- Secondary science: Zadie Henrichs, Paige McDuffy, Kelsey Stonehocker
- PE / health: Blake Bauer, Mike Stuart
- Music: Nathan Kitrell, Shauna Pickering, Nick McKinney
- Art: Laura Haines, Amy Maiers

### JO rigor — Iowa Grade 7, current year (2026–27), not archived units
Do **not** recycle old I-35 blog units (Typhoid Mary, compost bins, etc.). Generate from **this year’s Iowa Academic Standards** and a fresh fall/early-year bank. Honor whatever topic she types first. When she types a thin topic, pull from the current bank below — never from a years-old classroom anecdote.

Fall 2026 starter bank (use, remix, advance — do not treat as a closed list):
- Language Arts 7 — citing several pieces of evidence; theme vs central idea; narrator vs author point of view; argument vs explanatory; precise verbs; sentence combining; a short mentor text she might actually meet in September/October (informational current-events article, a contemporary YA excerpt, a poem), not a dusty set piece
- Math 7 — scale drawings; unit rates that are not whole numbers; proportional relationships on a graph; adding/subtracting rational numbers on a number line; real-world integer situations; two-step equations with negatives
- Science 7 (Iowa Science 2025, Grade 7) — colliding objects / Newton’s 3rd; kinetic energy transfers; Earth-Sun-Moon (phases, eclipses, seasons) as a living model; gravity in the solar system; animal behavior + plant structures and reproductive success
- Social Studies 7 — inquiry questions; globalization and international organizations; maps and physical regions of North America and Europe; how Iowa connects to a current global issue (ag exports, river systems, manufacturing) without politics-as-gotcha
- Health / PE — decision-making, risk vs hazard, sleep/movement, sportsmanship. Age-appropriate. No scare tactics.
- Music / Art — rhythm vs beat, major/minor color, composition choices, perspective, value. Keep it a real 7th-grade ask.

When difficulty rises, stay on today’s topic and add a 2020s application (data, model, claim-evidence-reasoning), not an old worksheet clone.

Topic placeholder for JO: `what we covered in class today`

Keep the course list data-driven so Dad can add her real elective names later without a rewrite.

## Product job
**ALWAYS BE LEARNING.** That is the product. Not a grade booster. Not a homework clone. Not a cozy recap.

The girls already did the lesson. ABL exists to keep the mind moving: lock today’s idea, then push past it the same night. Comfortable is the failure state. Confused-for-ten-seconds-then-taught is the win.

Feel like a T3KDesigns product, not school software and not Connexus-purple.

## Design north star
Match https://t3kdesigns.app — a studio in the dark. **Do not** use Iowa Connections Academy magenta, the Pearson planner aesthetic, or kid-cartoon space.

Visual system:
- Background: near-black navy `#05040C` → `#0B0720`
- Nebula: lavender `#B9A6FF`, violet `#7B5CFF`, pale lilac highlights
- Text: `#F4F1FF` / muted `#9B96B0`
- Glass cards, 1px violet hairline, 16–24px radius, backdrop blur
- Pill navigation, huge type, air
- Language: Mission, Orbit, Transmission, Constellation, Dock, Crew, Signal, Deep Orbit
- Subtle starfield + slow nebula drift. No clip-art planets. No cartoon rockets.
- Motion 200–400ms ease-out, CSS first
- Mobile first. One question on screen. Min 48px targets. Safe-area padding. Beautiful at 390px and 1440px

Lockup: **ABL** small, then **Always Be Learning**. Tagline: *Always Be Learning.* Secondary line allowed: *Stay in orbit — then leave it.* Never “you’ve got this!” fluff.

## Stack (do not change)
- Astro + TypeScript. Astro is for buffering / partial hydration — static shell, islands only for auth + quiz.
- Vanilla CSS design system: `src/styles/tokens.css`, `src/styles/app.css`. No Tailwind. No UI kit.
- “Java” in the original brief means **JavaScript/TypeScript**. Not Java the language. No JVM.
- Netlify + Netlify Functions (or Astro endpoints on Netlify) for secrets
- Supabase Auth + Postgres + RLS
- Anthropic API server-side only for generation and short-answer grading. Prefer `claude-sonnet-4-5` or current Sonnet for generation cost; Opus only if quality needs a second pass.
- No Next.js, no WordPress, no Java backend

## V1 screens only
1. **Splash / Dock** — “Enter the system.” Three crew marks: `Booty`, `JO`, `Dad`.
2. **Login**
   - Tap a name, then authenticate.
   - **Dad:** email + password (Supabase Auth). After login he lands in Parent bay, with a path into either girl’s Mission Control if he wants to fly a practice mission as coach.
   - **Booty and JO:** 6-digit PIN only. No email on their daily path.
     - First login (no PIN stored yet): show “Set your 6-digit PIN.” Enter once, confirm once. Digits only. Show/hide toggle. Weak-PIN block: reject `000000`, `123456`, `111111`, and the crew name as digits. Store a one-way hash of the PIN on the profile (or a Supabase Auth user created for that learner). Never store or log the raw PIN.
     - Later logins: six large digit keys, mobile-first. 5 failed attempts → 30s cool-off.
     - After they are in: Settings (small, quiet) lets them change PIN — current PIN + new PIN twice.
   - Session persists on that device until they tap Sign out.
3. **Mission Control** — date, exact display name (`Booty` / `JO` / `Dad` if coaching), subject score chips, giant **New transmission**.
4. **New Transmission** — one-column mobile form:
   - Subject (her dropdown)
   - Topic of the day (required; placeholder `U4, L3: Polynomial Multiplication`)
   - Optional note
   - Generate mission
5. **Mission** — same format every time for both girls:
   - 8 questions on that subject + topic
   - 6 multiple choice (4 options), 2 short answer (own words)
   - **Signal shorts (“Did you know”)** between questions — not scored, not skip-walled. After questions 2, 4, and 6, show a compact glass card:
     - Label: `Did you know`
     - 1–2 sentences, max ~40 words
     - Mix: one tied to today’s topic, one adjacent stretch, one wild-card from any field (space, language, sports science, Iowa, music, food chemistry — keep it true and surprising)
     - Tiny “copy that” / “next” control. Auto-advance after ~8s if they don’t tap, but never block the quiz
     - No question on this card. No points. Pure spark.
   - Then 1 **Deep Orbit** bonus: a fun, more advanced fact-question adjacent to the day’s topic. Own words or multiple choice.
   - One question per view. Progress dots. Immediate right/wrong.
   - Wrong → explain why, then the correct idea. Never shame. Then one sentence that points at the harder version of the same idea.
   - Right → no parade. Name what she just proved, then hint the next rung.
6. **Debrief** — score /8, bonus separate, subject chip updates. If she went 8/8, copy is “Good. Tomorrow we go further.” If she struggled, copy is “Now you have the piece. Fly it again.” Never “nice try.”
7. **Scoreboard** — per crew member, per subject: last, best, missions flown, streak, rank Cadet → Pilot → Navigator → Commander.
8. **Parent bay** — `Dad` sees both `Booty` and `JO` latest missions and scores. No analytics suite. Dad can open either girl’s board. He does not take over their PIN.

Do not build: Connexus sync, homework upload, chat, payments, teacher accounts, printables, social, avatars beyond a small constellation mark.

## Assessment rules
- Always 8 + 1. Same rhythm. Only content and difficulty change.
- Booty missions = grade 11, tied to the ICA course she picked — then one notch toward the next lesson or an honors read of the same idea.
- JO missions = grade 7 — then one notch toward grade 8 on the same thread.
- **Always Be Learning mix inside every mission** (do not write eight warm-ups):
  - Q1–Q2: prove she still holds today’s lesson
  - Q3–Q6: apply it harder (new numbers, new text, a model, a “what if”)
  - Q7–Q8: transfer — next idea in the unit, or the same idea in a stranger setting
  - Deep Orbit: required closer, scored separately. She can skip the keypad and write. This is the “keep going” muscle.
- Learning, not a gotcha. Hard is allowed. Tricky-for-trick’s-sake is not. If she misses, the why must make her able to take the next one.
- A perfect 8/8 with no sweat means the generator went soft. Next mission must come in hotter.
- `difficulty` 1–5 per learner × subject. **Start at 3.** We are pushing. Floor 1 exists so a rough night does not spiral. Cap 5 is honors-adjacent, still on the typed topic.
  - ≥ 7/8 → +1 (cap 5)
  - 5–6 → hold
  - ≤ 4 → −1 (floor 1) and warmer scaffolds
- Short answers graded semantically on the server. Accept equivalent wording.
- Fact-check contract:
  - Established curriculum knowledge only
  - No contested claims, no medical advice as diagnosis, no politics-as-gotcha
  - Health / finance / marketing questions stay age-appropriate and factual
  - Every item has `concept` + `why`
  - Thin topic → review the surrounding unit rather than invent trivia
  - Deep Orbit must be a real, checkable interesting fact, one level harder than the lesson
  - Signal shorts must also be true, checkable, and current-feeling. No recycled trivia-night fossils unless they are still the best fact. Prefer a 21st-century hook (JWST, mRNA-as-idea is fine at a high level for 11th only, Iowa wind/ag data, polynomial patterns in music) over “did you know the sun is a star.”

## Question JSON
```ts
type MissionPayload = {
  subject: string
  topic: string
  grade: 7 | 11
  difficulty: 1 | 2 | 3 | 4 | 5
  unit?: string
  lesson?: string
  questions: Array<{
    id: string
    type: 'mc' | 'short'
    prompt: string
    choices?: string[]
    correctIndex?: number
    acceptable?: string[]
    concept: string
    why: string
    stretch?: string
  }>
  shorts: Array<{
    id: string
    afterQuestion: 2 | 4 | 6
    text: string
    tag: string            // e.g. "Did you know · Europa"
    related: boolean       // true if tied to today's topic
  }>  // exactly 3
  bonus: {
    id: string
    type: 'mc' | 'short'
    prompt: string
    fact: string
    choices?: string[]
    correctIndex?: number
    acceptable?: string[]
    why: string
    topicLabel: string
  }
}
```

When the topic is `U4, L3: Polynomial Multiplication`, set `unit` to `U4`, `lesson` to `L3`, and write eight questions that actually test polynomial multiplication (and the idea of successive differences if difficulty ≥ 4), not generic “what is algebra.”

## Supabase
```sql
-- profiles: id uuid pk references auth.users
--   display_name text  -- exact: 'Booty' | 'JO' | 'Dad'
--   role text check (role in ('parent','learner'))
--   grade int null     -- 11, 7, or null for Dad
--   pin_set boolean default false
--   pin_hash text null -- learners only; never raw PIN
--   pin_failed_at timestamptz null
--   pin_fail_count int default 0
--   created_at timestamptz

-- courses: id, learner_id, label, sort_order
--   Booty seeded with the six ICA courses
--   JO seeded with the I-35 7th-grade subject list (LA 7, Math 7, Science 7, SS 7, Health, PE, Music/Band, Art, Other)

-- learner_subject_stats:
--   learner_id, subject_label, difficulty int default 2,
--   missions int default 0, last_score int, best_score int,
--   streak int default 0, points int default 0, updated_at

-- missions:
--   id uuid, learner_id, subject_label, topic text,
--   unit text, lesson text, grade int, difficulty int,
--   payload jsonb, score int, bonus_correct boolean,
--   completed_at timestamptz, created_at

-- answers:
--   id, mission_id, question_id, raw_answer text,
--   is_correct boolean, feedback text, created_at
```

RLS: each learner reads/writes only her rows. Parent reads both.

No passwords or PINs in the repo. README explains:
- Create Dad as a normal Supabase Auth email user and attach profile `Dad` / role `parent`
- Create two learner auth users (email can be internal, e.g. booty@local / jo@local, unused for UI) and attach profiles `Booty` and `JO` with `pin_set = false`
- First time each girl opens her name, she sets her own 6-digit PIN

## Server functions
1. `POST /api/generate-mission` — auth. Input: subject, topic, learnerId. Load grade + difficulty + course list. Call Claude. Validate JSON. Store mission. Return payload.
2. `POST /api/grade-short` — semantic grade for short / bonus free text.
3. `POST /api/complete-mission` — score, stats, difficulty, streak.

Never put `ANTHROPIC_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in client code.

Generator system prompt must say:
- You are a rigorous Iowa Connections Academy practice author.
- Honor the typed unit/lesson title. Original questions only — no copied test-bank items.
- JSON only, MissionPayload shape.
- Difficulty 1 = scaffolded review. 3 = default push. 5 = honors stretch still on that lesson. Default missions must feel like 3 even on day one.
- Always Be Learning: at least three of the eight items must require transfer, not recognition.
- Wrong MC options are plausible misconceptions.
- Reading level: grade 7 for JO, grade 11 for Booty.
- Use her display name in feedback only if natural, exact case.

## UX copy
Quiet, warm, cosmic. Not cutesy. Not Connexus. Not corporate edtech.

- Booty: “What did Connexus list today?”
- JO: “What did class cover today?”
- “Transmission locked.”
- “Almost. Here’s the missing piece.”
- “Signal clear. Keep going.”
- “Deep Orbit — this is the point.”
- Debrief 8/8: “Good. Tomorrow we go further.”
- The phrase **Always Be Learning** appears on splash, Mission Control, and debrief. Treat it as the law of the house, not a slogan sticker.
- Shorts: “Did you know” / “Signal burst” / “One orbit over.” Never “fun fact!!”

## Project structure
```
/
  astro.config.mjs
  netlify.toml
  package.json
  .env.example
  README.md
  src/
    layouts/Base.astro
    pages/index.astro
    pages/login.astro
    pages/app/index.astro
    pages/app/new.astro
    pages/app/mission/[id].astro
    pages/app/debrief/[id].astro
    pages/app/board.astro
    pages/app/parent.astro
    components/
    lib/supabase.ts
    lib/types.ts
    lib/courses.ts
    styles/tokens.css
    styles/app.css
  netlify/functions/ or src/pages/api/
  supabase/migrations/0001_init.sql
```

## README
- npm i / npm run dev
- Env: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- SQL to run
- Create `Dad` (email + password) + `Booty` + `JO` auth users
- First-run PIN setup for each girl (6 digits, hashed)
- Netlify from this GitHub repo
- Explicit: Connexus is out of scope; paste planner lines by hand

## Definition of done
- `npm run dev` shows a finished-looking mobile-first space UI
- Crew picker shows `Booty`, `JO`, and `Dad` with exact case
- First open for a girl: set-PIN screen. Second open: 6-digit keypad unlocks her dock
- Dad logs in with email + password and sees both boards
- Booty can pick Algebra 2 A, paste `U4, L3: Polynomial Multiplication`, fly 8+1, see explanations, watch Algebra 2 A update on her board
- JO can pick Science 7, type `lunar phases` or `Newton’s third law`, same 8+1 format, three Did-you-know shorts between items, grade-7 reading level, no fake Connexus unit codes
- Shorts appear after Q2, Q4, Q6, never steal a point, and at least one is off-topic on purpose
- Difficulty ticks after a strong mission
- Parent bay lists both girls
- Deployable to Netlify with Supabase + one Anthropic key
- Looks like a T3KDesigns piece, not a school portal

Build the full working concept now. Do not stop at a wireframe. Make version one look finished.
