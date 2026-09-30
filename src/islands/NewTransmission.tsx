import { useEffect, useMemo, useState } from 'preact/hooks';
import { api, boardFor, go, qs, type LearnerName } from '../lib/api';
import { OTHER, parseTopic, TOPIC_PLACEHOLDER, TOPIC_PROMPT } from '../lib/courses';
import { useMe } from '../components/hooks';
import TopBar from '../components/TopBar';
import Transmit from '../components/Transmit';
import { Arrow, Back } from '../components/Icons';
import type { Course, Profile } from '../lib/types';

export default function NewTransmission() {
  const me = useMe();
  if (!me) return <div class="col" style="min-height:60vh" />;
  return <Form me={me} board={boardFor(me)} />;
}

function Form({ me, board }: { me: Profile; board: LearnerName }) {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [subject, setSubject] = useState('');
  const [custom, setCustom] = useState('');
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const coach = me.role === 'parent';
  const cq = coach ? `?crew=${board}` : '';

  useEffect(() => {
    api.courses(board).then((c) => {
      setCourses(c);
      const want = qs('subject');
      if (want && c.some((x) => x.label === want)) setSubject(want);
      else if (want) { setSubject(OTHER); setCustom(want); }
      const t = qs('topic');
      if (t) setTopic(t);
    }).catch((e: Error) => setErr(e.message));
  }, [board]);

  const parsed = useMemo(() => parseTopic(topic), [topic]);
  const subjectLabel = subject === OTHER ? custom.trim() : subject;
  const ready = subjectLabel.length > 0 && topic.trim().length >= 2 && !sending;

  async function submit(e: Event) {
    e.preventDefault();
    if (!ready) {
      setErr(!subjectLabel ? 'Pick a subject.' : 'Type today’s topic — that’s the source of truth.');
      return;
    }
    setErr('');
    setSending(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const { id, mission } = await api.generate({ learnerName: board, subject: subjectLabel, topic: topic.trim(), note: note.trim() || undefined });
      try { sessionStorage.setItem(`abl-m-${id}`, JSON.stringify(mission)); } catch { /* ignore */ }
      go(`/app/mission/${id}`);
    } catch (ex) {
      setSending(false);
      setErr((ex as Error).message);
    }
  }

  if (sending) {
    return (
      <div class="col">
        <TopBar me={me} here="new" crew={board} />
        <Transmit sub={`${subjectLabel} · ${parsed.title}`} />
        <p class="center faint" style="font-size:var(--fs-sm)">Eight items, three signal bursts, one Deep Orbit. Usually 15–25 seconds.</p>
      </div>
    );
  }

  return (
    <div class="col">
      <TopBar me={me} here="new" crew={board} />
      <a class="quiet-link" href={`/app/${cq}`}><Back /> Mission Control</a>
      <form class="stack" style="--stack:26px;margin-top:10px" onSubmit={submit}>
        <header class="stack" style="--stack:8px">
          <p class="eyebrow">New transmission{coach ? ` · coaching ${board}` : ''}</p>
          <h1 style="font-size:var(--fs-2xl)">{TOPIC_PROMPT[board]}</h1>
        </header>

        <fieldset class="field" style="border:0;padding:0;margin-inline:0;margin-bottom:0;min-width:0">
          <legend class="label" style="margin-bottom:10px">Subject</legend>
          <div class="subjects" role="radiogroup" aria-label="Subject">
            {!courses && Array.from({ length: 6 }, () => <div class="skel" style="height:56px" />)}
            {courses && [...courses.map((c) => c.label), OTHER].map((label) => (
              <button type="button" class="subject" role="radio" aria-checked={subject === label} onClick={() => setSubject(label)}>
                <span class="s-dot" />{label}
              </button>
            ))}
          </div>
          {subject === OTHER && (
            <input class="input" style="margin-top:10px" placeholder={board === 'JO' ? 'e.g. Career exploration, Spanish, Computer science' : 'Course name'} value={custom} maxLength={60}
              onInput={(e) => setCustom((e.target as HTMLInputElement).value)} aria-label="Custom subject" autoFocus />
          )}
        </fieldset>

        <label class="field">
          <span class="label">Topic of the day</span>
          <input class="input big" required placeholder={TOPIC_PLACEHOLDER[board]} value={topic} maxLength={200}
            onInput={(e) => setTopic((e.target as HTMLInputElement).value)} autocomplete="off" autocapitalize="sentences" enterkeyhint="go" />
          <span class="parsed" aria-live="polite">
            {parsed.unit ? (
              <>
                <span class="tag">{parsed.unit}</span><span class="tag">{parsed.lesson}</span><span>→ {parsed.title}</span>
              </>
            ) : topic.trim() ? (
              <span class="faint">Concept: {parsed.title}</span>
            ) : board === 'Booty' ? (
              <span class="faint">Paste the planner line. Unit + lesson codes are read automatically.</span>
            ) : (
              <span class="faint">Plain words are perfect: “ratios word problems”, “Earth-Sun-Moon”.</span>
            )}
          </span>
        </label>

        <label class="field">
          <span class="label">Note <span class="faint" style="text-transform:none;letter-spacing:0">· optional</span></span>
          <textarea class="textarea" rows={3} maxLength={300} placeholder={board === 'Booty' ? 'e.g. The LiveLesson went fast on the division part' : 'e.g. We did a lab with carts'} value={note}
            onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} style="min-height:88px" />
        </label>

        {err && <p class="notice warn">{err}</p>}

        <div class="next-bar" style="margin-top:0">
          <button class="btn btn-primary block" style="min-height:60px;font-size:1.1rem" aria-disabled={!ready}>
            Generate mission <Arrow />
          </button>
          <p class="center faint" style="font-size:var(--fs-xs);margin-top:10px;font-family:var(--mono);letter-spacing:.12em;text-transform:uppercase">8 items · 3 signal bursts · 1 Deep Orbit</p>
        </div>
      </form>
    </div>
  );
}
