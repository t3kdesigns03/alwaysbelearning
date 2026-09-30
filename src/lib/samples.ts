// ─────────────────────────────────────────────────────────────
// Hand-written sample transmissions for LOCAL DEMO MODE only
// (no Supabase / Anthropic configured). Live missions are always
// generated fresh from the typed topic. These double as the
// quality bar the generator is held to.
// ─────────────────────────────────────────────────────────────
import type { MissionPayload } from './types';
import { itemFitsSubject } from './subjects';

type Sample = Omit<MissionPayload, 'difficulty' | 'topic' | 'subject' | 'unit' | 'lesson'> & {
  key: string;
  subject: string;
  match: RegExp;
  unit?: string;
  lesson?: string;
};

export const SAMPLES: Sample[] = [
  // ── Booty · Algebra 2 A · U4, L3: Polynomial Multiplication ──
  {
    key: 'alg2-poly-mult',
    subject: 'Algebra 2 A',
    match: /polynomial|multipl|binomial|foil|successive/i,
    grade: 11,
    unit: 'U4',
    lesson: 'L3',
    questions: [
      {
        id: 'q1', type: 'mc',
        prompt: 'Multiply: (x + 4)(x − 7)',
        choices: ['x^2 − 3x − 28', 'x^2 − 28', 'x^2 + 3x − 28', 'x^2 − 11x − 28'],
        correctIndex: 0,
        concept: 'Distributing two binomials',
        why: 'x·x = x^2. The cross terms are x·(−7) + 4·x = −3x. The constants give 4·(−7) = −28. Dropping the middle term (x^2 − 28) is the classic miss — every term in the first factor has to meet every term in the second.',
        stretch: 'Next rung: three factors — (x + 4)(x − 7)(x + 1) — same rule, one more pass.',
      },
      {
        id: 'q2', type: 'mc',
        prompt: 'Expand: (2x − 3)^2',
        choices: ['4x^2 + 9', '4x^2 − 12x + 9', '4x^2 − 6x + 9', '2x^2 − 12x + 9'],
        correctIndex: 1,
        concept: 'Square of a binomial',
        why: '(a − b)^2 = a^2 − 2ab + b^2 with a = 2x and b = 3: 4x^2 − 2(2x)(3) + 9 = 4x^2 − 12x + 9. Squaring each piece separately (4x^2 + 9) forgets that (2x − 3)^2 means (2x − 3)(2x − 3).',
        stretch: 'Next rung: run it backward — factor 9x^2 − 30x + 25 by spotting the perfect square.',
      },
      {
        id: 'q3', type: 'mc',
        prompt: 'Multiply: (x^2 − 2x + 5)(3x − 1)',
        choices: ['3x^3 − 5x^2 + 17x − 5', '3x^3 − 7x^2 + 13x − 5', '3x^3 − 7x^2 + 17x − 5', '3x^3 − 6x^2 + 15x − 5'],
        correctIndex: 2,
        concept: 'Trinomial × binomial',
        why: 'Six partial products: 3x^3, −x^2, −6x^2, 2x, 15x, −5. Combine: −x^2 − 6x^2 = −7x^2 and 2x + 15x = 17x. The tempting slips are a sign on −2x·(−1) (giving 13x) or on −6x^2 + (−x^2) (giving −5x^2).',
        stretch: 'Next rung: a box/grid method makes 3 × 3 = 9 partial products just as clean.',
      },
      {
        id: 'q4', type: 'short',
        prompt: 'Before you multiply (x^2 + 3x − 2)(x + 4): how many partial products will you get before combining like terms, and what will the degree of the answer be? Say how you know.',
        acceptable: [
          '6 partial products; degree 3',
          '3 terms times 2 terms is 6 products, and the degrees add: 2 + 1 = 3',
          'six terms before combining, and it will be a cubic',
        ],
        concept: 'Structure before arithmetic',
        why: 'Every term meets every term, so a 3-term factor times a 2-term factor makes 3 × 2 = 6 partial products. The highest-degree terms multiply to x^2 · x = x^3, so degrees add: 2 + 1 = 3.',
        stretch: 'Next rung: predict the degree of (x^3 − 1)^4 without touching it.',
      },
      {
        id: 'q5', type: 'mc',
        prompt: 'A garden measures (x + 5) ft by (2x − 1) ft, so its area is 2x^2 + 9x − 5. If both sides grow by 2 ft, what is the new area?',
        choices: ['2x^2 + 9x − 1', '2x^2 + 15x + 7', '2x^2 + 13x + 7', '2x^2 + 15x − 7'],
        correctIndex: 1,
        concept: 'Modeling area with polynomials',
        why: 'New sides are (x + 7) and (2x + 1). Multiply: 2x^2 + x + 14x + 7 = 2x^2 + 15x + 7. Adding 4 to the old area (2x^2 + 9x − 1) treats a growing rectangle like a growing number — area grows along both sides.',
        stretch: 'Next rung: subtract the old area from the new one — the difference 6x + 12 is the added strip.',
      },
      {
        id: 'q6', type: 'mc',
        prompt: 'Maya multiplied (x − 3)(x^2 + 3x + 9) and wrote x^3 − 6x^2 − 27. What went wrong?',
        choices: [
          'She combined 3x^2 and −3x^2 into −6x^2 — they cancel, so the answer is x^3 − 27',
          'Nothing — x^3 − 6x^2 − 27 is correct',
          'The 9x and −9x should add to 18x',
          'The constant should be +27, so the answer is x^3 + 27',
        ],
        correctIndex: 0,
        concept: 'Find the error · difference of cubes',
        why: 'x·x^2 = x^3, x·3x = 3x^2, x·9 = 9x, then −3x^2, −9x, −27. The x^2 terms and the x terms cancel in pairs, leaving x^3 − 27. A sign slip on one of the x^2 terms produces her −6x^2.',
        stretch: 'Next rung: that is the identity a^3 − b^3 = (a − b)(a^2 + ab + b^2) — factoring special products is coming.',
      },
      {
        id: 'q7', type: 'mc',
        prompt: 'p(0), p(1), p(2), p(3), p(4) are 1, 2, 9, 28, 65. The first differences are 1, 7, 19, 37. What do successive differences tell you?',
        choices: [
          'Second differences are constant, so p is quadratic',
          'Third differences are constant (6), so p is degree 3',
          'The differences keep growing, so p is exponential',
          'Third differences equal 1, so the leading coefficient is 1/6',
        ],
        correctIndex: 1,
        concept: 'Successive differences → degree',
        why: 'Second differences: 6, 12, 18 (not constant). Third differences: 6, 6 — constant, so p is cubic. For a cubic with step 1, the constant third difference is 3! × a = 6a, so here a = 1 (p(x) = x^3 + 1).',
        stretch: 'Next rung: what constant do the fourth differences of 2x^4 settle on? (4! × 2)',
      },
      {
        id: 'q8', type: 'short',
        prompt: 'Without expanding everything, give the leading term and the constant term of (2x − 1)(x + 3)(x^2 − 4). What shortcut did you use?',
        acceptable: [
          'leading term 2x^4, constant term 12',
          '2x^4 and 12 — multiply the leading terms together and the constants together',
          'leading 2x·x·x^2 = 2x^4; constant (−1)(3)(−4) = 12',
        ],
        concept: 'Leading and constant terms by structure',
        why: 'Only the highest-degree pieces can make the highest-degree term: 2x · x · x^2 = 2x^4. Only the constants can make the constant: (−1)(3)(−4) = 12. Everything else lands in the middle.',
        stretch: 'Next rung: the constant term equals p(0) — the start of the remainder theorem idea.',
      },
    ],
    shorts: [
      { id: 's1', afterQuestion: 2, tag: 'Did you know · Font curves', related: true, text: 'The letters on this screen are polynomials. Font outlines are Bézier curves — quadratic in TrueType, cubic in most OpenType fonts — each one a polynomial in a single variable t.' },
      { id: 's2', afterQuestion: 4, tag: 'Signal burst · QR codes', related: false, text: 'A QR code can still scan with up to about 30% of it damaged. Reed–Solomon error correction treats the data as coefficients of a polynomial and rebuilds what’s missing.' },
      { id: 's3', afterQuestion: 6, tag: 'One orbit over · JWST', related: false, text: 'The James Webb Space Telescope works from near L2, about 1.5 million km from Earth — roughly four times farther than the Moon — shaded by a sunshield the size of a tennis court.' },
    ],
    bonus: {
      id: 'bonus', type: 'mc',
      prompt: '(x^2 + 2x + 3)(4x + 5) = 4x^3 + 13x^2 + 22x + 15. Now set x = 10 on both sides. Which multiplication did you just do?',
      choices: ['123 × 45 = 5535', '123 × 45 = 5335', '1234 × 5 = 6170', '12 × 345 = 4140'],
      correctIndex: 0,
      acceptable: ['123 × 45 = 5535', '123 times 45', '5535'],
      fact: 'Long multiplication is polynomial multiplication with x = 10 — carrying is what happens when a coefficient reaches 10. Fast algorithms for giant numbers (Karatsuba, FFT methods) treat numbers as polynomials on purpose.',
      why: 'x^2 + 2x + 3 at x = 10 is 123 and 4x + 5 is 45. The right side becomes 4000 + 1300 + 220 + 15 = 5535, which is 123 × 45.',
      topicLabel: 'Numbers are polynomials',
    },
  },

  // ── Booty · English 11 A · Informational Text Conclusions ──
  {
    key: 'eng11-conclusions',
    subject: 'English 11 A',
    match: /conclusion|informational|explanatory|format|style|portfolio/i,
    grade: 11,
    unit: 'U4',
    lesson: 'L11',
    questions: [
      {
        id: 'q1', type: 'mc',
        prompt: 'What is the main job of a conclusion in an informational or explanatory text?',
        choices: [
          'Restate the introduction as closely as possible',
          'Follow from the information presented and show why it matters',
          'Introduce a brand-new topic so readers stay interested',
          'Save the strongest evidence for the very end',
        ],
        correctIndex: 1,
        concept: 'Purpose of an explanatory conclusion',
        why: 'An explanatory conclusion grows out of what the text actually showed and points to its significance or implications. Pure restatement adds nothing; new topics or new evidence belong in the body.',
        stretch: 'Next rung: a conclusion that raises the question the evidence can’t yet answer.',
      },
      {
        id: 'q2', type: 'mc',
        prompt: 'An explanatory essay explains how Iowa farmers use cover crops to reduce soil erosion and nitrate runoff. Which is the strongest concluding sentence?',
        choices: [
          'In conclusion, cover crops reduce erosion and runoff, as this essay has explained.',
          'Cover crops such as cereal rye are planted after harvest and hold the soil in place.',
          'Cover crops won’t solve every runoff problem, but they show how a change in one field can ripple downstream to cleaner rivers.',
          'Every Iowa farmer should be required to plant cover crops this fall.',
        ],
        correctIndex: 2,
        concept: 'Conclusion vs summary vs argument',
        why: 'The strongest option follows from the explanation and widens the lens to significance — with an honest limit. The first only restates, the second is a body-paragraph detail, and the fourth quietly turns the essay into an argument.',
        stretch: 'Next rung: add one concrete downstream consequence without new evidence.',
      },
      {
        id: 'q3', type: 'mc',
        prompt: 'In a survey at one (fictional) high school, students who kept phones in another room at night reported falling asleep about 20 minutes sooner. Students who silenced phones but kept them on the nightstand reported little difference. Which conclusion does this support?',
        choices: [
          'Phones cause insomnia in all teenagers.',
          'Silencing a phone is the best way to fall asleep faster.',
          'For these students, distance from the phone — not just silencing it — was linked to falling asleep sooner.',
          'Students who fell asleep sooner earned higher grades.',
        ],
        correctIndex: 2,
        concept: 'Drawing supported conclusions',
        why: 'The data compares two groups at one school, so the supported claim is narrow and uses “linked to.” “All teenagers” overgeneralizes, the silencing option contradicts the data, and grades never appear.',
        stretch: 'Next rung: name what kind of study could test whether distance causes the difference.',
      },
      {
        id: 'q4', type: 'short',
        prompt: 'That study covered one school and used students’ own reports of their sleep. Write ONE sentence a careful conclusion could include to acknowledge the limit without throwing out the findings.',
        acceptable: [
          'Because the study covered only one school and relied on self-reported sleep, the results suggest a pattern rather than prove it.',
          'These findings are promising, but a larger study with measured sleep would be needed to confirm them.',
          'Since students reported their own sleep at a single school, the conclusion should be treated as a starting point, not a rule.',
        ],
        concept: 'Qualifying a conclusion',
        why: 'A qualified conclusion names the limit (one school, self-report) and still keeps what the data can support (a pattern worth testing). That is precision, not weakness.',
        stretch: 'Next rung: turn the limit into the next research question.',
      },
      {
        id: 'q5', type: 'mc',
        prompt: 'Revise for a formal, objective explanatory style: “So basically, phones are super bad for sleep and you’d be crazy not to ditch them.”',
        choices: [
          'Phones are literally destroying our generation’s sleep.',
          'The evidence suggests that keeping phones out of the bedroom may help students fall asleep sooner.',
          'I think phones are bad for sleep, and I’m right.',
          'Phones = bad sleep. End of story.',
        ],
        correctIndex: 1,
        concept: 'Format and style: objective tone',
        why: 'Formal explanatory style drops slang and second-person pressure, and hedges to match the evidence (“suggests,” “may”). The others keep the exaggeration, the first person, or the shorthand.',
        stretch: 'Next rung: keep it formal AND vivid — one precise verb instead of “help.”',
      },
      {
        id: 'q6', type: 'mc',
        prompt: 'A student concludes: “Clearly, wind power is the only solution to climate change, as shown by Iowa producing a lot of wind energy.” What is the main problem?',
        choices: [
          'It overreaches — one state’s wind output can’t support “the only solution.”',
          'It is too short to be a conclusion.',
          'Conclusions should never mention data.',
          'It needs to start with “In conclusion.”',
        ],
        correctIndex: 0,
        concept: 'Find the error: overreach',
        why: 'The evidence (Iowa generates a lot of wind power) is real but far too narrow for a global “only solution” claim. Length, data, and transition words are not the problem — the size of the claim is.',
        stretch: 'Next rung: rewrite it so the claim is exactly as big as the evidence.',
      },
      {
        id: 'q7', type: 'mc',
        prompt: 'Source A: a city’s new bike lanes raised cycling 30%. Source B: nearby store owners report fewer parking spots and mixed sales changes. Which sentence SYNTHESIZES the sources?',
        choices: [
          'Source A is about bikes, and Source B is about stores.',
          'Source A is right and Source B is wrong.',
          'Together, the sources suggest bike lanes can boost cycling while creating trade-offs for businesses that depend on parking.',
          'Bike lanes increased cycling by 30%.',
        ],
        correctIndex: 2,
        concept: 'Synthesis of sources',
        why: 'Synthesis builds a new idea from how sources relate — here, benefit plus trade-off. Listing sources side by side, picking a winner, or repeating one statistic is summary, not synthesis.',
        stretch: 'Next rung: add the question neither source answers yet.',
      },
      {
        id: 'q8', type: 'short',
        prompt: 'You are writing the cover-crop conclusion for two audiences: a 7th-grade science class and a farm newsletter. Name ONE thing you would change and why.',
        acceptable: [
          'Vocabulary: define terms like nitrate runoff for 7th graders, but use technical terms for farmers who already know them.',
          'Which implications I emphasize — cleaner rivers for students, cost and yield for farmers.',
          'Examples: a simple field-to-river example for students, specific practices or data for farmers.',
        ],
        concept: 'Rhetorical situation',
        why: 'Audience and purpose shape word choice, examples and which implications matter. The facts stay the same; the framing changes.',
        stretch: 'Next rung: keep the same claim and change only the purpose — inform vs persuade.',
      },
    ],
    shorts: [
      { id: 's1', afterQuestion: 2, tag: 'Did you know · Inverted pyramid', related: true, text: 'News writing uses an “inverted pyramid”: the most important facts first, details after. It’s why many news stories barely need a conclusion — the lead already did that job.' },
      { id: 's2', afterQuestion: 4, tag: 'Signal burst · Plain language', related: false, text: 'The U.S. Plain Writing Act of 2010 requires federal agencies to write public documents people can actually use — clear, organized, and in plain language.' },
      { id: 's3', afterQuestion: 6, tag: 'One orbit over · Popcorn', related: false, text: 'Popcorn pops because water inside each kernel turns to steam. Pressure builds until the hull bursts at roughly 180 °C (about 355 °F).' },
    ],
    bonus: {
      id: 'bonus', type: 'mc',
      prompt: 'In most scientific journals, where does a reader first meet a study’s conclusions?',
      choices: ['In the abstract, at the very top', 'In the final paragraph only', 'In the reference list', 'In the acknowledgments'],
      correctIndex: 0,
      acceptable: ['the abstract', 'at the top in the abstract', 'the summary at the beginning'],
      fact: 'Research papers front-load their conclusions in the abstract so busy readers can decide in seconds whether to read on. Same content, different rhetorical situation.',
      why: 'An abstract compresses purpose, method, results and conclusion into one paragraph at the start. The final discussion expands on it.',
      topicLabel: 'Rhetorical situation in science',
    },
  },

  // ── JO · Science 7 · Earth-Sun-Moon / lunar phases ──
  {
    key: 'sci7-lunar',
    subject: 'Science 7',
    match: /moon|lunar|phase|eclipse|earth.?sun|season|tide/i,
    grade: 7,
    questions: [
      {
        id: 'q1', type: 'mc',
        prompt: 'Why do we see phases of the Moon?',
        choices: [
          'Earth’s shadow covers part of the Moon',
          'We see different amounts of the Moon’s sunlit half as it orbits Earth',
          'The Moon gives off less light on some nights',
          'Clouds on the Moon block part of it',
        ],
        correctIndex: 1,
        concept: 'What causes phases',
        why: 'The Sun always lights half the Moon. As the Moon orbits, we see more or less of that lit half. Earth’s shadow only matters during a lunar eclipse — that is the most common mix-up.',
        stretch: 'Next rung: why is a full moon always rising around sunset?',
      },
      {
        id: 'q2', type: 'mc',
        prompt: 'Tonight is a first quarter moon. About how long until the full moon?',
        choices: ['About 1 day', 'About 7 days', 'About 14 days', 'About 29 days'],
        correctIndex: 1,
        concept: 'The phase cycle',
        why: 'A full cycle of phases takes about 29.5 days, so each quarter step is about a week. First quarter → full is one of those steps.',
        stretch: 'Next rung: which phase comes one week after full?',
      },
      {
        id: 'q3', type: 'mc',
        prompt: 'During a full moon, how are the Sun, Earth, and Moon arranged?',
        choices: [
          'The Moon is between the Sun and Earth',
          'Earth is roughly between the Sun and the Moon',
          'The three form a right angle',
          'The Moon is behind the Sun',
        ],
        correctIndex: 1,
        concept: 'Positions in the system',
        why: 'At full moon, the lit half of the Moon faces us, so the Moon is on the far side of Earth from the Sun. Moon-between is new moon; a right angle is a quarter moon.',
        stretch: 'Next rung: draw the arrangement for a waning crescent.',
      },
      {
        id: 'q4', type: 'short',
        prompt: 'There’s a full moon about every month. So why don’t we get a lunar eclipse every month? Explain in 1–2 sentences.',
        acceptable: [
          'The Moon’s orbit is tilted compared to Earth’s orbit, so it usually passes above or below Earth’s shadow.',
          'Because the Moon’s path is tilted about 5 degrees, it usually misses Earth’s shadow.',
          'The Sun, Earth and Moon only line up exactly sometimes because the Moon’s orbit is tilted.',
        ],
        concept: 'Tilted orbit and eclipses',
        why: 'The Moon’s orbit is tilted about 5° from Earth’s orbit around the Sun. Most full moons pass a little above or below Earth’s shadow, so an eclipse needs a full moon AND a perfect line-up.',
        stretch: 'Next rung: that same tilt explains why solar eclipses are rare too.',
      },
      {
        id: 'q5', type: 'mc',
        prompt: 'What if the Moon took about 60 days to orbit Earth instead of about 27? What would change?',
        choices: [
          'The phases would stop happening',
          'The cycle of phases would take about twice as long',
          'The Moon would change phases twice as fast',
          'Full moons would be twice as bright',
        ],
        correctIndex: 1,
        concept: 'Model: orbit speed and phases',
        why: 'Phases come from the Moon’s changing position around Earth. A slower orbit means the positions change more slowly, so the whole cycle stretches out. Brightness at full depends on distance and sunlight, not orbit time.',
        stretch: 'Next rung: what would a slower orbit mean for tides?',
      },
      {
        id: 'q6', type: 'mc',
        prompt: 'Moonrise times: Monday 6:10 pm, Tuesday 7:00 pm, Wednesday 7:52 pm. What best explains the pattern?',
        choices: [
          'The Moon spins more slowly each day',
          'The Moon moves along its orbit each day, so Earth has to turn a little extra to bring it back into view',
          'Earth’s rotation slows down by about 50 minutes a day',
          'Daylight saving time shifts the Moon',
        ],
        correctIndex: 1,
        concept: 'Data: moonrise delay',
        why: 'While Earth spins once, the Moon moves about 1/27 of the way around its orbit in the same direction. Earth needs roughly 50 more minutes to “catch up,” so moonrise is later each day.',
        stretch: 'Next rung: estimate when the Moon rises on Friday.',
      },
      {
        id: 'q7', type: 'mc',
        prompt: 'An astronaut on the near side of the Moon looks at Earth while people on Earth see a new moon. What does she see?',
        choices: ['A dark, “new” Earth', 'A nearly full Earth', 'A half-lit Earth', 'No Earth — it has set below her horizon'],
        correctIndex: 1,
        concept: 'Transfer: phases from the Moon',
        why: 'At new moon the Moon sits between Earth and the Sun, so the astronaut is looking back at Earth’s fully sunlit side. Earth’s phases seen from the Moon are opposite ours. From the near side, Earth stays in roughly the same spot in the sky.',
        stretch: 'Next rung: what does she see during our full moon?',
      },
      {
        id: 'q8', type: 'short',
        prompt: 'Jupiter’s moon Europa always keeps the same face toward Jupiter, like our Moon does toward Earth. What does that tell you about how long Europa takes to spin once compared to one orbit?',
        acceptable: [
          'They take the same amount of time — one spin per orbit.',
          'Its rotation period equals its orbital period.',
          'Europa spins exactly once every time it goes around Jupiter (tidally locked).',
        ],
        concept: 'Transfer: tidal locking',
        why: 'To keep one face pointed inward, a moon has to turn exactly once per trip around. Gravity’s tidal pull locked both our Moon and Europa into that match.',
        stretch: 'Next rung: is anything tidally locked to the Moon?',
      },
    ],
    shorts: [
      { id: 's1', afterQuestion: 2, tag: 'Did you know · Earthshine', related: true, text: 'On a thin crescent you can sometimes see the “dark” part glowing faintly. That’s earthshine — sunlight bouncing off Earth and lighting the Moon’s night side.' },
      { id: 's2', afterQuestion: 4, tag: 'Signal burst · Eclipse math', related: true, text: 'The Sun is about 400 times wider than the Moon and also about 400 times farther away. That coincidence makes them look nearly the same size — and makes total solar eclipses possible.' },
      { id: 's3', afterQuestion: 6, tag: 'One orbit over · Iowa wind', related: false, text: 'Iowa makes more than half of its electricity from wind — the highest share of any U.S. state. Some turbine blades are longer than a football field is wide.' },
    ],
    bonus: {
      id: 'bonus', type: 'mc',
      prompt: 'Lasers bounced off mirrors left on the Moon show the Moon is slowly moving. Which is true?',
      choices: [
        'It drifts about 3.8 cm farther from Earth each year',
        'It drifts about 3.8 m closer to Earth each year',
        'It drifts about 38 km farther each year',
        'It isn’t moving — the mirrors just age',
      ],
      correctIndex: 0,
      acceptable: ['about 3.8 cm farther each year', 'it moves away about as fast as fingernails grow', 'a few centimeters a year farther away'],
      fact: 'Apollo astronauts left reflectors on the Moon. Timing laser pulses to them shows the Moon moves about 3.8 cm farther from Earth every year — roughly how fast your fingernails grow.',
      why: 'Tides on Earth tug on the Moon and slowly pass it energy, pushing its orbit outward while Earth’s spin very slowly lengthens.',
      topicLabel: 'Tides and orbital drift',
    },
  },

  // ── JO · Science 7 · Newton's third law / collisions ──
  {
    key: 'sci7-newton3',
    subject: 'Science 7',
    match: /newton|third law|force|collision|collid|push|momentum|kinetic|energy/i,
    grade: 7,
    questions: [
      {
        id: 'q1', type: 'mc',
        prompt: 'A skateboarder pushes backward on a wall and rolls away. What is the other force in this pair?',
        choices: [
          'The skateboarder’s momentum pushes her',
          'The wall pushes the skateboarder forward with an equal force',
          'Gravity pulls her away from the wall',
          'The wall pushes back with a smaller force',
        ],
        correctIndex: 1,
        concept: 'Force pairs',
        why: 'Newton’s third law: when she pushes on the wall, the wall pushes on her — equal size, opposite direction. That push from the wall is what moves her.',
        stretch: 'Next rung: which force would change if she pushed twice as hard?',
      },
      {
        id: 'q2', type: 'mc',
        prompt: 'A bug hits a car’s windshield on the highway. How do the two forces compare?',
        choices: [
          'The car pushes much harder on the bug',
          'The bug pushes harder on the car',
          'The forces are equal in size and opposite in direction',
          'Only the car exerts a force',
        ],
        correctIndex: 2,
        concept: 'Equal and opposite',
        why: 'Force pairs are always equal, even when the objects are wildly different. The bug and the windshield push on each other with the same size force.',
        stretch: 'Next rung: so why do the results look so different? (Q3)',
      },
      {
        id: 'q3', type: 'mc',
        prompt: 'If the forces are equal, why does the bug get squashed while the car barely changes?',
        choices: [
          'The car’s force is actually bigger',
          'The same force on a much smaller mass causes a much bigger change in motion',
          'The bug’s force cancels itself out',
          'The windshield absorbs the reaction force, so there isn’t one',
        ],
        correctIndex: 1,
        concept: 'Same force, different mass',
        why: 'Equal forces don’t mean equal effects. The bug’s tiny mass gets a huge change in motion; the car’s huge mass barely notices. (Being fragile doesn’t help the bug either.)',
        stretch: 'Next rung: that link between force, mass and change in motion is Newton’s second law.',
      },
      {
        id: 'q4', type: 'short',
        prompt: 'Sam (40 kg) and Riley (80 kg) stand on skateboards facing each other. Sam pushes on Riley. Describe what happens to BOTH of them, and why.',
        acceptable: [
          'They both roll apart in opposite directions; Sam moves faster (about twice as fast) because he has less mass.',
          'Riley pushes back on Sam with an equal force, so both move apart, and the lighter one speeds up more.',
          'Both move away from each other; equal forces but Sam has half the mass so he moves faster.',
        ],
        concept: 'Apply: equal forces, unequal masses',
        why: 'When Sam pushes Riley, Riley pushes Sam back with an equal force. Both roll apart. Sam has half the mass, so he ends up moving about twice as fast.',
        stretch: 'Next rung: what if they both had the same mass?',
      },
      {
        id: 'q5', type: 'mc',
        prompt: 'A rocket in empty space has no air to push against. How does it speed up?',
        choices: [
          'Its exhaust pushes on the air behind it',
          'It pushes exhaust gas backward, and the gas pushes the rocket forward',
          'Rockets can’t speed up in space',
          'The Sun’s gravity pulls it forward',
        ],
        correctIndex: 1,
        concept: 'Model: rocket propulsion',
        why: 'The rocket pushes gas out the back; the gas pushes the rocket forward with an equal force. No air needed — that’s why rockets work better in space, not worse.',
        stretch: 'Next rung: why does throwing the gas out faster give more push?',
      },
      {
        id: 'q6', type: 'mc',
        prompt: 'Cart A (1 kg) and cart B (3 kg) collide. Force sensors are on both. Sensor A reads 12 N during the crash. What does sensor B read?',
        choices: ['4 N', '12 N, in the opposite direction', '36 N', '0 N'],
        correctIndex: 1,
        concept: 'Data: collision forces',
        why: 'The forces in a collision are a third-law pair, so they match exactly: 12 N each way. Mass changes how each cart’s motion changes, not the size of the forces. 4 N and 36 N come from mixing mass into the force.',
        stretch: 'Next rung: which cart’s speed changes more? By about how much?',
      },
      {
        id: 'q7', type: 'mc',
        prompt: 'You’re standing still on smooth ice and throw a heavy backpack forward. What happens to you?',
        choices: [
          'Nothing — you let go of the backpack',
          'You slide forward with the backpack',
          'You slide backward, slower than the backpack moves forward',
          'You slide backward, faster than the backpack moves forward',
        ],
        correctIndex: 2,
        concept: 'Transfer: recoil',
        why: 'While you push the backpack forward, it pushes you backward. You have more mass, so you slide back more slowly. The push happens while your hands are still on it — that’s when the forces act.',
        stretch: 'Next rung: this trade-off has a name in 8th grade — momentum.',
      },
      {
        id: 'q8', type: 'short',
        prompt: 'A swimmer pushes water backward with her hands and moves forward. Write a claim and one piece of reasoning using Newton’s third law.',
        acceptable: [
          'Claim: the water pushes her forward. Reasoning: her hands push the water backward, so the water pushes back on her with an equal and opposite force.',
          'She moves forward because the water pushes on her hands with an equal force in the opposite direction.',
          'Pushing water back creates a reaction force from the water pushing her forward.',
        ],
        concept: 'Transfer: claim + reasoning',
        why: 'Her hands exert a backward force on the water; the water exerts an equal, forward force on her. That forward force from the water is what moves her.',
        stretch: 'Next rung: why do swimmers use flat, wide hands instead of pointed fingers?',
      },
    ],
    shorts: [
      { id: 's1', afterQuestion: 2, tag: 'Did you know · Jumping', related: true, text: 'Every time you jump, you push Earth down as hard as it pushes you up. Earth really moves — by far less than the width of an atom, because it’s so massive.' },
      { id: 's2', afterQuestion: 4, tag: 'Signal burst · Squid jets', related: false, text: 'Squid swim by jet propulsion: they squeeze water out through a tube called a siphon, and the water pushes them the opposite way — a third-law engine made of muscle.' },
      { id: 's3', afterQuestion: 6, tag: 'One orbit over · Robots', related: false, text: 'The word “robot” comes from a 1920 Czech play, R.U.R., by Karel Čapek. It’s built from “robota,” meaning forced labor.' },
    ],
    bonus: {
      id: 'bonus', type: 'mc',
      prompt: 'In 2022, NASA’s DART spacecraft crashed into Dimorphos, a small moon of the asteroid Didymos, on purpose. What did it change?',
      choices: [
        'Dimorphos’s orbit around Didymos got about 32 minutes shorter',
        'It broke Dimorphos into dust',
        'Nothing measurable — the spacecraft was too small',
        'It knocked Dimorphos out of the solar system',
      ],
      correctIndex: 0,
      acceptable: ['its orbit got about 32 minutes shorter', 'it changed the moon’s orbit', 'it sped up / shortened Dimorphos’s orbit'],
      fact: 'DART hit Dimorphos at about 6 km per second. Its orbit around Didymos shrank from about 11 hours 55 minutes by roughly 32 minutes — the first time humans changed a space object’s motion on purpose.',
      why: 'The crash pushed on Dimorphos and Dimorphos pushed back on DART. Blasted-off rock flying the other way added extra push — the same recoil idea as the backpack on ice.',
      topicLabel: 'Momentum in planetary defense',
    },
  },

  // ── JO · Math 7 · two-step equations / rational numbers ──
  {
    key: 'math7-two-step',
    subject: 'Math 7',
    match: /equation|integer|negative|rational|two.?step|number line|ratio|rate|proportion|scale/i,
    grade: 7,
    questions: [
      {
        id: 'q1', type: 'mc', prompt: 'Solve: 2x − 7 = −15',
        choices: ['x = −4', 'x = 4', 'x = −11', 'x = −1'], correctIndex: 0,
        concept: 'Two-step equation with a negative',
        why: 'Undo the −7 first: add 7 to both sides to get 2x = −8. Then divide by 2: x = −4. Getting 4 usually means the sign got dropped when adding 7 to −15.',
        stretch: 'Next rung: 7 − 2x = −15 — now the x term is negative too.',
      },
      {
        id: 'q2', type: 'mc', prompt: 'What is −3 − (−8)?',
        choices: ['−11', '5', '−5', '11'], correctIndex: 1,
        concept: 'Subtracting a negative',
        why: 'Subtracting −8 is the same as adding 8: −3 + 8 = 5. On a number line, start at −3 and move 8 to the right.',
        stretch: 'Next rung: −3 − (−8) − (−2) — keep the number line in your head.',
      },
      {
        id: 'q3', type: 'mc', prompt: 'Solve: −3x + 5 = 20',
        choices: ['x = 5', 'x = −5', 'x = 15', 'x = −25/3'], correctIndex: 1,
        concept: 'Dividing by a negative',
        why: 'Subtract 5: −3x = 15. Divide by −3: x = −5. Check: −3(−5) + 5 = 15 + 5 = 20. Forgetting that the −3 is negative gives 5.',
        stretch: 'Next rung: −3x + 5 = −x − 3 — variables on both sides (grade 8).',
      },
      {
        id: 'q4', type: 'short',
        prompt: 'A submarine is at −120 m. It rises 15 m every minute. Write an equation for when it reaches −30 m, and solve it.',
        acceptable: ['−120 + 15m = −30, so m = 6 minutes', '15m − 120 = −30; m = 6', '6 minutes'],
        concept: 'Model a situation with an equation',
        why: 'Start + rate × time = end: −120 + 15m = −30. Add 120: 15m = 90. Divide by 15: m = 6 minutes.',
        stretch: 'Next rung: when would it reach the surface (0 m)?',
      },
      {
        id: 'q5', type: 'mc', prompt: 'Jalen solved x/4 + 3 = −5 and wrote: x/4 = −2, so x = −8. What went wrong?',
        choices: [
          'He added 3 instead of subtracting it: x/4 = −8, so x = −32',
          'Nothing — x = −8 is correct',
          'He should have divided by 4, so x = −0.5',
          'The answer should be positive 8',
        ],
        correctIndex: 0,
        concept: 'Find the error',
        why: 'To undo +3 you subtract 3 from both sides: −5 − 3 = −8, so x/4 = −8 and x = −32. He moved in the wrong direction on the number line.',
        stretch: 'Next rung: always check by plugging back in — (−32)/4 + 3 = −5. ✓',
      },
      {
        id: 'q6', type: 'mc', prompt: 'At 6 a.m. in Des Moines it was −9 °F. By noon it was 12 °F, rising steadily. How fast did the temperature rise?',
        choices: ['0.5 °F per hour', '3.5 °F per hour', '−3.5 °F per hour', '21 °F per hour'], correctIndex: 1,
        concept: 'Rate from integers',
        why: 'Change = 12 − (−9) = 21 °F over 6 hours, so 21 ÷ 6 = 3.5 °F per hour. Using 12 − 9 = 3 gives 0.5 — the classic sign miss.',
        stretch: 'Next rung: what was the temperature at 9 a.m.?',
      },
      {
        id: 'q7', type: 'mc', prompt: 'Which equation has the same solution as 2(x − 3) = −10?',
        choices: ['2x − 3 = −10', 'x − 3 = −20', '2x − 6 = −10', '2x = −13'], correctIndex: 2,
        concept: 'Transfer: distributive property',
        why: 'Distribute the 2 to both terms: 2x − 6 = −10. Both give x = −2. Multiplying only the x (2x − 3) is the common slip.',
        stretch: 'Next rung: you could also divide both sides by 2 first — x − 3 = −5. Same answer, fewer steps.',
      },
      {
        id: 'q8', type: 'short', prompt: 'Solve 5 − 2x = 11 and explain the step where most people slip.',
        acceptable: ['x = −3; subtract 5 to get −2x = 6, then divide by −2', 'x = -3 because you divide 6 by negative 2', '−2x = 6 so x = −3'],
        concept: 'Transfer: negative coefficient',
        why: 'Subtract 5: −2x = 6. The x term is negative, so divide by −2: x = −3. The slip is dropping the negative and writing x = 3.',
        stretch: 'Next rung: 5 − 2x > 11 — inequalities flip when you divide by a negative.',
      },
    ],
    shorts: [
      { id: 's1', afterQuestion: 2, tag: 'Did you know · Red and black', related: true, text: 'Over 2,000 years ago, Chinese mathematicians used red counting rods for positive numbers and black rods for negatives — the opposite of “in the red” in modern accounting.' },
      { id: 's2', afterQuestion: 4, tag: 'Signal burst · Iowa cold', related: false, text: 'Iowa’s coldest temperature on record is −47 °F. At −40, Fahrenheit and Celsius finally agree on the number.' },
      { id: 's3', afterQuestion: 6, tag: 'One orbit over · Sprint starts', related: false, text: 'In elite sprinting, reacting to the gun in under 0.1 seconds counts as a false start — faster than humans are thought to reliably react to sound.' },
    ],
    bonus: {
      id: 'bonus', type: 'mc',
      prompt: 'Mount Everest’s summit is about +8,849 m. The bottom of the Challenger Deep is about −10,935 m. About how far apart are they vertically?',
      choices: ['About 19,800 m', 'About 2,100 m', 'About −2,100 m', 'About 8,800 m'], correctIndex: 0,
      acceptable: ['about 19,800 meters', '19,784 m', 'almost 20 km'],
      fact: 'From Everest’s top to the deepest known point of the ocean is roughly 19.8 km — more than twice the height of Everest above sea level.',
      why: 'Distance on a number line is the difference: 8,849 − (−10,935) = 8,849 + 10,935 = 19,784 m. Adding the negative instead gives about 2,100 m.',
      topicLabel: 'Distance on a number line',
    },
  },

  // ── JO · Physical Education · fitness, rules, safety, sportsmanship ──
  {
    key: 'pe7-fitness',
    subject: 'Physical Education',
    match: /warm|stretch|heart|fitness|sport|game|team|basket|soccer|volley|rule|safety|heat|train|overload|drill|sportsman|endurance|sprint|run/i,
    grade: 7,
    questions: [
      {
        id: 'q1', type: 'mc', prompt: 'What is the main job of a warm-up before a game or workout?',
        choices: [
          'Tire your muscles out so you feel calmer',
          'Gradually raise your heart rate and body temperature so your muscles are ready to work',
          'Hold the deepest stretch you can while your muscles are still cold',
          'Replace the need to drink water during practice',
        ],
        correctIndex: 1,
        concept: 'Purpose of a warm-up',
        why: 'A warm-up eases the body from rest to effort: heart rate climbs, muscles warm up and move more easily, and injury risk drops. Deep stretching on cold muscles is the common mix-up — warm first, then stretch.',
        stretch: 'Next rung: why do dynamic moves (leg swings, high knees) usually beat long static holds before a sprint?',
      },
      {
        id: 'q2', type: 'mc', prompt: 'In basketball, a player takes several steps while holding the ball without dribbling. What is the call?',
        choices: ['Double dribble', 'Charging', 'Traveling', 'Goaltending'],
        correctIndex: 2,
        concept: 'Rules of the game',
        why: 'Moving your feet too many times while holding the ball is traveling. A double dribble is dribbling again after stopping; charging is running into a defender who has set position.',
        stretch: 'Next rung: what is a pivot foot, and how does it let you move without traveling?',
      },
      {
        id: 'q3', type: 'mc', prompt: 'A common estimate of max heart rate is 220 minus your age. For a 12-year-old, which is about 60–80% of that — a solid workout zone?',
        choices: ['About 60–80 beats per minute', 'About 125–166 beats per minute', 'About 150–200 beats per minute', 'About 208–220 beats per minute'],
        correctIndex: 1,
        concept: 'Target heart rate zone',
        why: 'Estimated max = 220 − 12 = 208 beats per minute. 60% of 208 is about 125 and 80% is about 166, so the workout zone is roughly 125–166. The first option mixes up percent with beats; the last is max effort, not a zone you hold.',
        stretch: 'Next rung: take your pulse for 15 seconds right after a lap and multiply by 4 — are you in the zone?',
      },
      {
        id: 'q4', type: 'short',
        prompt: 'A teammate makes a mistake that costs your team a point. Name one thing a good teammate does next, and why it helps the team.',
        acceptable: [
          'Encourage them and say "next play" so they refocus instead of getting down on themselves.',
          'Stay positive and support them, because a teammate who feels supported plays better and the team stays together.',
          'Help them reset — high five, move on — since blaming makes the whole team play worse.',
        ],
        concept: 'Sportsmanship and teamwork',
        why: 'Mistakes happen in every game. Quick support (“next play”) keeps the teammate focused and keeps the team working together. Blame or eye-rolling spreads frustration and usually leads to more mistakes.',
        stretch: 'Next rung: how can a team captain help the whole team bounce back after a bad quarter?',
      },
      {
        id: 'q5', type: 'mc', prompt: 'Training is specific: you get better at what you practice. A soccer player keeps fading in the second half. Which plan fits best?',
        choices: [
          'Max-weight bench press, nothing else',
          'Interval runs that copy a match — sprints mixed with jogging — a few times a week',
          'Stretching only',
          'Resting all week before every game',
        ],
        correctIndex: 1,
        concept: 'Training specificity',
        why: 'Soccer is repeated sprints with jogging in between, so intervals build exactly the endurance she is missing. Bench press trains upper-body strength, and stretching trains flexibility — useful, but not for second-half fade.',
        stretch: 'Next rung: design a 20-minute interval drill for a soccer practice.',
      },
      {
        id: 'q6', type: 'mc', prompt: 'Maya holds a deep static stretch for 60 seconds right before a sprint race and says it is the best warm-up. What is the problem?',
        choices: [
          'Nothing — long static stretches are always the best pre-sprint warm-up',
          'Long static holds right before sprinting can briefly reduce power; a dynamic warm-up works better first',
          'She should hold the stretch for five minutes instead',
          'Stretching should never be part of a workout',
        ],
        correctIndex: 1,
        concept: 'Find the error: warm-up choice',
        why: 'Long static holds just before explosive efforts can temporarily reduce power. Jogging plus dynamic moves prepares muscles for speed. Static stretching still has a place — during the cool-down.',
        stretch: 'Next rung: put these in order for sprint day — jog, dynamic drills, race, cool-down, static stretch.',
      },
      {
        id: 'q7', type: 'mc', prompt: 'Overload principle: to get stronger, muscles must work a little harder than they are used to. Which is a safe way to use it?',
        choices: [
          'Double the weight every workout',
          'Push through sharp pain so the muscle adapts',
          'Add a few reps or a little weight each week while keeping good form',
          'Keep the same easy workout forever',
        ],
        correctIndex: 2,
        concept: 'Progressive overload',
        why: 'Small, steady increases with good form let muscles adapt safely. Doubling the load or training through sharp pain invites injury; never increasing means no progress.',
        stretch: 'Next rung: overload works for endurance too — how would you apply it to a mile run?',
      },
      {
        id: 'q8', type: 'short',
        prompt: 'It is a hot, humid August football practice in Iowa. Name two things that lower the risk of heat illness.',
        acceptable: [
          'Drink water before, during and after practice, and take breaks in the shade.',
          'Hydrate often and wear light, loose clothing.',
          'Get used to the heat gradually and tell a coach right away if you feel dizzy or have cramps.',
        ],
        concept: 'Heat safety',
        why: 'Water replaces what sweat takes out, and shade and rest breaks let the body cool down. Light clothing and easing into hot-weather practice help too. Dizziness, headache or cramps mean stop and tell a coach.',
        stretch: 'Next rung: why is humid heat harder on the body than dry heat at the same temperature?',
      },
    ],
    shorts: [
      { id: 's1', afterQuestion: 2, tag: 'Did you know · Resting heart rate', related: true, text: 'Well-trained endurance athletes can have resting heart rates in the 40s. For most people, a resting rate of about 60–100 beats per minute is normal.' },
      { id: 's2', afterQuestion: 4, tag: 'Signal burst · Pickleball', related: false, text: 'Pickleball was invented in 1965 on Bainbridge Island, Washington — and has been one of the fastest-growing sports in the U.S. in recent years.' },
      { id: 's3', afterQuestion: 6, tag: 'One orbit over · Octopus', related: false, text: 'An octopus has three hearts and blue blood. Its blood carries oxygen with a copper-based protein instead of the iron-based one ours uses.' },
    ],
    bonus: {
      id: 'bonus', type: 'mc',
      prompt: 'Sprinter Usain Bolt ran 100 m in 9.58 seconds in 2009. About how fast was he at top speed during that race?',
      choices: ['About 15 mph', 'About 27 mph', 'About 45 mph', 'About 60 mph'],
      correctIndex: 1,
      acceptable: ['about 27 mph', 'around 44 km/h', 'about 12 meters per second at top speed'],
      fact: 'Bolt averaged about 10.4 m/s over the whole race but hit roughly 12.4 m/s (about 27–28 mph) between 60 and 80 m. Sprinters don’t hold top speed to the finish — races are often won by whoever slows down least.',
      why: 'His average for the full race was about 23 mph, but that includes the start from zero. At full speed in the middle of the race he was near 27–28 mph. 45 and 60 mph are car speeds, not human sprint speeds.',
      topicLabel: 'Sprint speed and pacing',
    },
  },
];

/**
 * Demo mode: draw a mission from the bank for EXACTLY this subject.
 * Every item passes itemFitsSubject; a misfit is dropped and redrawn from another
 * sample of the same subject. If the bank can't fill all 8 + 1, return null —
 * the caller refuses. Nothing is ever relabeled into another subject.
 */
export function drawSampleMission(
  subject: string,
  topic: string,
  grade: 7 | 11,
  rand: () => number = Math.random,
): { sample: Sample; exact: boolean; dropped: string[] } | null {
  const pool = SAMPLES.filter((s) => s.grade === grade && s.subject === subject);
  if (!pool.length) return null;
  const primary = pool.find((s) => s.match.test(topic)) ?? pool[Math.floor(rand() * pool.length)];
  const spares = pool.filter((s) => s !== primary);
  const used = new Set<string>();
  const dropped: string[] = [];

  const questions = [];
  for (const q of primary.questions) {
    if (itemFitsSubject(q, subject)) {
      questions.push(q);
      continue;
    }
    dropped.push(`${primary.key}:${q.id}`);
    const spare = spares
      .flatMap((s) => s.questions.map((x) => ({ s, x })))
      .find(({ s, x }) => x.type === q.type && !used.has(`${s.key}:${x.id}`) && itemFitsSubject(x, subject));
    if (!spare) return null;
    used.add(`${spare.s.key}:${spare.x.id}`);
    questions.push(spare.x);
  }

  let bonus = primary.bonus;
  if (!itemFitsSubject(bonus, subject)) {
    dropped.push(`${primary.key}:bonus`);
    const alt = spares.map((s) => s.bonus).find((b) => itemFitsSubject(b, subject));
    if (!alt) return null;
    bonus = alt;
  }

  return {
    sample: { ...primary, questions: questions.map((q, i) => ({ ...q, id: `q${i + 1}` })), bonus: { ...bonus, id: 'bonus' } },
    exact: primary.match.test(topic),
    dropped,
  };
}
