import { useEffect, useState } from 'preact/hooks';
import { api, boardFor, go, type LearnerName } from '../lib/api';
import { i35Status } from '../lib/courses';
import { useMe, chicagoLongDate, shortDate } from '../components/hooks';
import TopBar from '../components/TopBar';
import { Arrow } from '../components/Icons';
import type { Course, MissionSummary, Profile, SubjectStat } from '../lib/types';

export default function MissionControl() {
  const me = useMe();
  if (!me) return <Skeleton />;
  if (me.role === 'parent' && !new URLSearchParams(location.search).get('crew')) {
    go('/app/parent');
    return <Skeleton />;
  }
  return <Control me={me} board={boardFor(me)} />;
}

function Skeleton() {
  return (
    <div class="col stack" style="--stack:18px;padding-top:60px">
      <div class="skel" style="height:22px;width:40%" />
      <div class="skel" style="height:90px;width:70%" />
      <div class="skel" style="height:128px" />
    </div>
  );
}

function Control({ me, board }: { me: Profile; board: LearnerName }) {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [log, setLog] = useState<MissionSummary[]>([]);
  const [err, setErr] = useState('');
  const [bell, setBell] = useState(board === 'JO' ? i35Status() : '');
  const coach = me.role === 'parent';
  const cq = coach ? `?crew=${board}` : '';

  useEffect(() => {
    Promise.all([api.courses(board), api.stats(board), api.missions(board, 6)])
      .then(([c, s, m]) => { setCourses(c); setStats(s); setLog(m); })
      .catch((e: Error) => setErr(e.message));
    if (board === 'JO') {
      const t = setInterval(() => setBell(i35Status()), 30_000);
      return () => clearInterval(t);
    }
  }, [board]);

  const statFor = (label: string) => stats.find((s) => s.subject === label);
  const extra = stats.filter((s) => !courses?.some((c) => c.label === s.subject));
  const inFlight = log.find((m) => !m.completedAt && (coach ? m.coach : !m.coach));

  return (
    <div class="col">
      <TopBar me={me} here="mc" crew={board} />

      <section class="stack" style="--stack:14px">
        <div class="row wrap" style="gap:10px">
          <p class="mc-date">{chicagoLongDate()}</p>
          {board === 'JO' && bell && <span class="status-pill">{bell}</span>}
        </div>
        <h1 class="mc-hello">{me.displayName}</h1>
        <p class="muted">
          {coach
            ? <>Coach run on <b style="color:var(--text);font-weight:500">{board}</b>’s Mission Control. Practice only — her board stays hers.</>
            : board === 'Booty'
              ? 'Iowa Connections Academy · Connexus planner'
              : 'I-35 Secondary · Roadrunners · 7th'}
        </p>
      </section>

      <section style="margin-top:28px">
        <a class="btn-giant" href={`/app/new${cq}`}>
          <span class="g-orbit" aria-hidden="true" />
          <span class="g-eyebrow">{board === 'Booty' ? 'What did Connexus list today?' : 'What did class cover today?'}</span>
          <span class="g-label">New<br />transmission</span>
          <span class="g-arrow"><Arrow size={24} /></span>
        </a>
      </section>

      {inFlight && (
        <a class="glass pad row" style="margin-top:12px;justify-content:space-between" href={`/app/mission/${inFlight.id}`}>
          <span>
            <span class="eyebrow">In flight</span>
            <span style="display:block;margin-top:4px">{inFlight.topic}</span>
          </span>
          <span class="btn btn-small">Resume <Arrow size={16} /></span>
        </a>
      )}

      <section style="margin-top:34px" class="stack">
        <div class="spread">
          <p class="eyebrow">Subjects</p>
          <a class="quiet-link" href={`/app/board${cq}`}>Board <Arrow size={16} /></a>
        </div>
        {err && <p class="notice warn">{err}</p>}
        <div class="chips">
          {!courses && Array.from({ length: 6 }, () => <div class="skel" style="height:44px;width:140px;border-radius:999px" />)}
          {courses?.map((c, i) => {
            const s = statFor(c.label);
            return (
              <a class="chip" style={`--i:${i}`} href={`/app/new${cq}${cq ? '&' : '?'}subject=${encodeURIComponent(c.label)}`}>
                {c.label}
                <span class={`c-score ${s?.lastScore == null ? 'none' : ''}`}>{s?.lastScore != null ? `${s.lastScore}/8` : '—'}</span>
              </a>
            );
          })}
          {extra.map((s, i) => (
            <a class="chip" style={`--i:${(courses?.length ?? 0) + i}`} href={`/app/new${cq}${cq ? '&' : '?'}subject=${encodeURIComponent(s.subject)}`}>
              {s.subject}
              <span class="c-score">{s.lastScore != null ? `${s.lastScore}/8` : '—'}</span>
            </a>
          ))}
        </div>
      </section>

      {log.length > 0 && (
        <section style="margin-top:34px" class="stack">
          <p class="eyebrow">Recent orbits</p>
          <div class="glass pad log" style="padding-block:6px">
            {log.slice(0, 5).map((m) => (
              <a class="log-row" href={m.completedAt ? `/app/debrief/${m.id}` : `/app/mission/${m.id}`}>
                <span>
                  <span class="l-topic">{m.topic}</span>
                  <span class="l-sub" style="display:block;margin-top:4px">{m.subject} · {shortDate(m.createdAt)}{m.coach ? ' · coach' : ''}</span>
                </span>
                <span class="l-score">{m.completedAt ? `${m.score}/8${m.bonusCorrect ? ' +◆' : ''}` : 'In flight'}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <p class="law" style="margin-top:44px">Always Be Learning</p>
    </div>
  );
}
