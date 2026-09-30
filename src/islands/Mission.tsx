import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { api, go } from '../lib/api';
import { useMe } from '../components/hooks';
import Transmit from '../components/Transmit';
import { Arrow, Check, Close } from '../components/Icons';
import M from '../components/MathText';
import type { AnswerResult, Profile, PublicMission, SignalShort } from '../lib/types';

type Step = { kind: 'q'; index: number } | { kind: 'short'; short: SignalShort } | { kind: 'bonus' };
const LETTERS = ['A', 'B', 'C', 'D'];

function band(n: number) {
  if (n <= 2) return 'Lock it';
  if (n <= 6) return 'Push';
  return 'Transfer';
}

export default function Mission({ id }: { id: string }) {
  const me = useMe();
  const [mission, setMission] = useState<PublicMission | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!me) return;
    let cached: PublicMission | null = null;
    try {
      const raw = sessionStorage.getItem(`abl-m-${id}`);
      if (raw) cached = JSON.parse(raw);
      sessionStorage.removeItem(`abl-m-${id}`);
    } catch { /* ignore */ }
    if (cached) return setMission(cached);
    api.mission(id).then(setMission).catch((e: Error) => setErr(e.message));
  }, [me, id]);

  if (err) {
    return (
      <div class="col stack" style="padding-top:12vh">
        <p class="notice warn">{err}</p>
        <a class="btn" href="/app/">Back to Mission Control</a>
      </div>
    );
  }
  if (!me || !mission) return <div class="col"><Transmit sub="Reacquiring signal" lines={['Loading the mission…']} /></div>;
  return <Flight me={me} mission={mission} />;
}

function Flight({ me, mission }: { me: Profile; mission: PublicMission }) {
  const steps = useMemo<Step[]>(() => {
    const out: Step[] = [];
    mission.questions.forEach((_, i) => {
      out.push({ kind: 'q', index: i });
      const s = mission.shorts.find((x) => x.afterQuestion === i + 1);
      if (s) out.push({ kind: 'short', short: s });
    });
    out.push({ kind: 'bonus' });
    return out;
  }, [mission]);

  const [answers, setAnswers] = useState<Record<string, AnswerResult>>(mission.answers ?? {});
  const pilot = mission.coach ? 'Dad' : mission.learnerName;
  const readOnly = me.displayName !== pilot;

  const firstOpen = useMemo(() => {
    const idx = steps.findIndex((s) =>
      s.kind === 'q' ? !answers[mission.questions[s.index].id] : s.kind === 'bonus' ? !answers[mission.bonus.id] : false,
    );
    return idx;
  }, []);

  const [at, setAt] = useState(firstOpen === -1 ? steps.length - 1 : firstOpen);
  const debrief = () => go(`/app/debrief/${mission.id}`);

  useEffect(() => {
    if (firstOpen === -1 || mission.completedAt) debrief();
  }, []);

  const step = steps[at];
  const next = () => {
    window.scrollTo({ top: 0 });
    if (at >= steps.length - 1) return debrief();
    setAt(at + 1);
  };
  const record = (r: AnswerResult) => setAnswers((a) => ({ ...a, [r.questionId]: r }));

  const qNumber = step.kind === 'q' ? step.index + 1 : null;
  const back = me.role === 'parent' ? `/app/?crew=${mission.learnerName}` : '/app/';

  if (readOnly) {
    return (
      <div class="col stack" style="padding-top:10vh">
        <p class="eyebrow">{mission.subject}</p>
        <h1 style="font-size:var(--fs-2xl)">{mission.topic}</h1>
        <p class="notice">This flight belongs to {pilot}. It opens for review once it’s debriefed.</p>
        <a class="btn" href={back}>Back</a>
      </div>
    );
  }

  return (
    <div class="col">
      <div class="m-top">
        <a class="icon-btn" href={back} aria-label="Leave mission (progress is saved)"><Close /></a>
        <div class="progress" aria-hidden="true">
          {mission.questions.map((q, i) => {
            const r = answers[q.id];
            const now = step.kind === 'q' && step.index === i;
            return <span class={`dot ${r ? (r.correct ? 'right' : 'wrong') : ''} ${now && !r ? 'now' : ''}`} />;
          })}
          <span class={`dot bonus ${answers[mission.bonus.id] ? (answers[mission.bonus.id].correct ? 'right' : 'wrong') : ''} ${step.kind === 'bonus' ? 'now' : ''}`} />
        </div>
        <span class="m-count">{qNumber ? `${qNumber}/8` : step.kind === 'bonus' ? 'DEEP' : 'SIGNAL'}</span>
      </div>

      <div class="m-meta">
        <span>{mission.subject}</span>
        {mission.unit && <span>{mission.unit} · {mission.lesson}</span>}
        <span class="pip" aria-label={`Difficulty ${mission.difficulty} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => <i class={n <= mission.difficulty ? 'on' : ''} />)}
        </span>
        {mission.coach && <span style="color:var(--gold)">Coach run</span>}
      </div>
      {mission.demoNote && at === 0 && <p class="notice" style="margin-top:14px;font-size:var(--fs-xs)">{mission.demoNote}</p>}

      <div style="margin-top:26px">
        {step.kind === 'short' && <SignalCard key={step.short.id} short={step.short} onNext={next} />}
        {step.kind === 'q' && (
          <QuestionStage
            key={mission.questions[step.index].id}
            mission={mission}
            index={step.index}
            result={answers[mission.questions[step.index].id]}
            onResult={record}
            onNext={next}
          />
        )}
        {step.kind === 'bonus' && (
          <BonusStage key="bonus" mission={mission} result={answers[mission.bonus.id]} onResult={record} onNext={next} />
        )}
      </div>
    </div>
  );
}

// ── One question per view ───────────────────────────────────
function QuestionStage({
  mission, index, result, onResult, onNext,
}: { mission: PublicMission; index: number; result?: AnswerResult; onResult: (r: AnswerResult) => void; onNext: () => void }) {
  const q = mission.questions[index];
  const n = index + 1;
  const [picked, setPicked] = useState<number | null>(result?.choiceIndex ?? null);
  const [text, setText] = useState(result?.rawAnswer ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nextRef = useRef<HTMLButtonElement>(null);

  async function lock() {
    if (busy || result) return;
    setErr('');
    setBusy(true);
    try {
      const r = q.type === 'mc'
        ? await api.checkAnswer(mission.id, q.id, picked!)
        : await api.gradeShort(mission.id, q.id, text);
      onResult(r);
      setTimeout(() => nextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useKeys({
    choose: (i) => q.type === 'mc' && !result && i < (q.choices?.length ?? 0) && setPicked(i),
    enter: () => (result ? onNext() : q.type === 'mc' && picked !== null ? lock() : undefined),
  });

  const canLock = q.type === 'mc' ? picked !== null : text.trim().length >= 2;

  return (
    <section class="stage">
      <p class="q-kicker">Q{n} <span class="band">· {band(n)}{q.type === 'short' ? ' · own words' : ''}</span></p>
      <h2 class="q-prompt"><M t={q.prompt} /></h2>

      {q.type === 'mc' ? (
        <div class={`choices ${result ? 'locked' : ''}`} role="radiogroup" aria-label="Choices">
          {q.choices?.map((c, i) => {
            let cls = '';
            if (result) {
              if (i === result.correctIndex) cls = 'right';
              else if (i === result.choiceIndex) cls = 'wrong';
              else cls = 'dim';
            } else if (picked === i) cls = 'picked';
            return (
              <button type="button" class={`choice ${cls}`} style={`--i:${i}`} role="radio" aria-checked={picked === i} onClick={() => !result && setPicked(i)}>
                <span class="letter">{result && i === result.correctIndex ? <Check /> : LETTERS[i]}</span>
                <span><M t={c} /></span>
              </button>
            );
          })}
        </div>
      ) : result ? (
        <div class="answer">
          <p class={`your-words ${result.correct ? 'right' : 'wrong'}`}>{result.rawAnswer ?? text}</p>
        </div>
      ) : (
        <div class="answer">
          <textarea class="textarea" rows={4} maxLength={1200} placeholder="In your own words…" value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} aria-label="Your answer" />
          <span class="count">{text.length}/1200</span>
        </div>
      )}

      {err && <p class="notice warn" style="margin-top:14px">{err}</p>}
      {result && <Feedback result={result} kind="question" />}

      <div class="next-bar">
        {result ? (
          <button ref={nextRef} class="btn btn-primary block" onClick={onNext}>
            {n === 8 ? 'Deep Orbit' : 'Next'} <Arrow />
          </button>
        ) : (
          <button class="btn btn-primary block" onClick={lock} disabled={!canLock || busy}>
            {busy ? (q.type === 'short' ? 'Reading your signal…' : 'Checking…') : q.type === 'short' ? 'Transmit' : 'Lock it in'}
          </button>
        )}
      </div>
    </section>
  );
}

// ── Deep Orbit bonus ────────────────────────────────────────
function BonusStage({
  mission, result, onResult, onNext,
}: { mission: PublicMission; result?: AnswerResult; onResult: (r: AnswerResult) => void; onNext: () => void }) {
  const b = mission.bonus;
  const [write, setWrite] = useState(b.type === 'short' || Boolean(result?.rawAnswer));
  const [picked, setPicked] = useState<number | null>(result?.choiceIndex ?? null);
  const [text, setText] = useState(result?.rawAnswer ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function lock() {
    if (busy || result) return;
    setBusy(true);
    setErr('');
    try {
      const r = write ? await api.gradeShort(mission.id, b.id, text) : await api.checkAnswer(mission.id, b.id, picked!);
      onResult(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useKeys({
    choose: (i) => !write && !result && b.choices && i < b.choices.length && setPicked(i),
    enter: () => (result ? onNext() : !write && picked !== null ? lock() : undefined),
  });

  const canLock = write ? text.trim().length >= 2 : picked !== null;

  return (
    <section class="stage deep-orbit">
      <div class="deep-orbit-banner">
        <span class="d-ring" aria-hidden="true" />
        <p class="d-title">Deep Orbit — this is the point.</p>
        <p class="d-sub">{b.topicLabel} · scored separately · one level past tonight</p>
      </div>
      <p class="q-kicker">Deep Orbit <span class="band">· {write ? 'own words' : 'choose or write'}</span></p>
      <h2 class="q-prompt"><M t={b.prompt} /></h2>

      {!write && b.choices ? (
        <div class={`choices ${result ? 'locked' : ''}`} role="radiogroup">
          {b.choices.map((c, i) => {
            let cls = '';
            if (result) cls = i === result.correctIndex ? 'right' : i === result.choiceIndex ? 'wrong' : 'dim';
            else if (picked === i) cls = 'picked';
            return (
              <button type="button" class={`choice ${cls}`} style={`--i:${i}`} role="radio" aria-checked={picked === i} onClick={() => !result && setPicked(i)}>
                <span class="letter">{result && i === result.correctIndex ? <Check /> : LETTERS[i]}</span>
                <span><M t={c} /></span>
              </button>
            );
          })}
        </div>
      ) : result ? (
        <div class="answer"><p class={`your-words ${result.correct ? 'right' : 'wrong'}`}>{result.rawAnswer ?? text}</p></div>
      ) : (
        <div class="answer">
          <textarea class="textarea" rows={4} maxLength={1200} placeholder="Write it your way…" value={text}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} aria-label="Your Deep Orbit answer" />
        </div>
      )}

      {!result && b.type === 'mc' && b.choices && (
        <button type="button" class="quiet-link toggle-write" onClick={() => setWrite(!write)}>
          {write ? '← Back to the four choices' : 'Skip the choices — write it instead →'}
        </button>
      )}

      {err && <p class="notice warn" style="margin-top:14px">{err}</p>}
      {result && <Feedback result={result} kind="bonus" />}

      <div class="next-bar">
        {result ? (
          <button class="btn btn-primary block" onClick={onNext}>Debrief <Arrow /></button>
        ) : (
          <button class="btn btn-primary block" onClick={lock} disabled={!canLock || busy}>
            {busy ? 'Reading your signal…' : write ? 'Transmit' : 'Lock it in'}
          </button>
        )}
      </div>
    </section>
  );
}

// ── Feedback: right → name the proof + next rung; wrong → why, then the idea ─
function Feedback({ result, kind }: { result: AnswerResult; kind: 'question' | 'bonus' }) {
  const ok = result.correct;
  const showModel = !ok && result.rawAnswer !== undefined && result.modelAnswer;
  return (
    <div class={`feedback ${ok ? 'ok' : 'almost'}`} role="status" aria-live="polite">
      <p class="f-head">
        <span class="glyph">{ok ? <Check /> : <Arrow size={14} />}</span>
        {ok ? (kind === 'bonus' ? 'Deep Orbit cleared.' : 'Signal clear.') : 'Almost. Here’s the missing piece.'}
      </p>
      <p class="f-concept">{ok ? 'You just proved' : 'The idea'} · {result.concept}</p>
      {result.feedback && result.rawAnswer !== undefined && <p class="f-body">{result.feedback}</p>}
      {!ok && <p class="f-body"><M t={result.why} /></p>}
      {showModel && (
        <p class="f-model"><b>A strong answer</b><M t={result.modelAnswer} /></p>
      )}
      {kind === 'bonus' && result.fact && <p class="fact"><b>The fact</b><M t={result.fact} /></p>}
      {kind === 'bonus' && ok && <p class="f-body"><M t={result.why} /></p>}
      {result.stretch && <p class="f-stretch"><span><M t={result.stretch} /></span></p>}
    </div>
  );
}

// ── Signal short: not scored, never a wall, auto-advance ~8s ─
function SignalCard({ short, onNext }: { short: SignalShort; onNext: () => void }) {
  const [label, subject] = short.tag.includes('·') ? short.tag.split('·').map((s) => s.trim()) : ['Did you know', short.tag];
  const [held, setHeld] = useState(false);
  const done = useRef(false);
  const go1 = () => { if (!done.current) { done.current = true; onNext(); } };

  useEffect(() => {
    if (held) return;
    const t = setTimeout(go1, 8000);
    return () => clearTimeout(t);
  }, [held]);

  useKeys({ enter: go1 });

  return (
    <section class="signal" aria-live="polite"
      onPointerDown={() => setHeld(true)} onPointerUp={() => setHeld(false)} onPointerLeave={() => setHeld(false)}>
      <p class="s-label"><span class="pulse" />{label || 'Did you know'}</p>
      <p class="s-tag">{subject}</p>
      <p class="s-text"><M t={short.text} /></p>
      <div class="s-foot">
        <span class="s-offtopic">{short.related ? 'On tonight’s thread' : 'One orbit over'}</span>
        <button class="btn btn-small" onClick={go1}>Copy that <Arrow size={16} /></button>
      </div>
      <span class={`s-timer ${held ? 'paused' : ''}`} />
    </section>
  );
}

// ── Keyboard: 1–4 / A–D to pick, Enter to lock / next ───────
function useKeys(h: { choose?: (i: number) => unknown; enter?: () => unknown }) {
  const ref = useRef(h);
  ref.current = h;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ref.current.enter?.(); }
        return;
      }
      const k = e.key.toLowerCase();
      const idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k);
      if (idx >= 0 && ref.current.choose) { ref.current.choose(idx); return; }
      if (e.key === 'Enter' && !(t && t.tagName === 'BUTTON')) { e.preventDefault(); ref.current.enter?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
