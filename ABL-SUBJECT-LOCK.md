# ABL — subject is a lock, not a label
# Live: https://alwaysbelearning.netlify.app
# Repo: Always Be Learning (not T3KDESIGNSHOME). Open that project.
# Do not rebuild the app. Do not start a Supabase migration in this pass unless the generator already lives in the DB.

## Bug (live)

Mission `84efcbcc-9942-46b1-aeea-fc104666e19c`, Q3:

- Chip: `PHYSICAL EDUCATION` · `COACH RUN` · `PUSH`
- Stem: "During a full moon, how are the Sun, Earth, and Moon arranged?"
- A new-moon geometry / B Earth between Sun and Moon / C right angle / D Moon behind the Sun

That item is space science. It must never wear a PE chip. B is the correct astronomy answer; that is irrelevant. The item is in the wrong mission.

## Rule

`subject` (and any finer tag like `push` / `run`) is a **hard filter** at generate time and at render time.

- If the mission subject is `physical-education` / PE / sport / movement: every stem is body, rules of a game, fitness, safety, or a drill. No moon, no fractions, no presidents.
- If an item fails the filter, drop it and draw/generate another. Do not show it with the wrong chip.
- Same rule for every subject: math stays math, science stays science.

Coach-run: the create screen shows the subject **before** Q1. Changing subject mid-mission regenerates or refuses the off-subject items. It does not relabel them.

## Where to look

Find the mission generator / question bank / seed (LLM prompt, static JSON, or both). Add a subject allow-list and a reject step. One function: `itemFitsSubject(item, subject) → boolean`. Use it twice: when the mission is built, and when a question is about to render. If render fails the check, skip to the next item and log it.

Do not "fix" this one UUID by hand and leave the generator loose.

## Do not

- Do not restyle the quiz chrome.
- Do not treat this as the Supabase/.env ticket. Demo mode is a separate pass.
- Do not add a new subject taxonomy unless the code already has one — use the existing enum.

## Done when

A PE coach-run of 8 cannot contain a moon-phase item. A science coach-run can. Re-roll PE until you get eight on-subject stems. Build clean.
