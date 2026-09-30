import { useEffect, useState } from 'preact/hooks';
import { api, boardFor, type LearnerName } from '../lib/api';
import { nextRank, rankFor, RANKS } from '../lib/scoring';
import { useMe, shortDate } from '../components/hooks';
import TopBar from '../components/TopBar';
import CrewMark from '../components/CrewMark';
import type { Course, Profile, SubjectStat } from '../lib/types';

export default function Board() {
  const me = useMe();
  if (!me) return <div class="col" style="min-height:60vh" />;
  return <View me={me} />;
}

function View({ me }: { me: Profile }) {
  const [board, setBoard] = useState<LearnerName>(boardFor(me));
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [err, setErr] = useState('');
  const parent = me.role === 'parent';

  useEffect(() => {
    setCourses(null);
    Promise.all([api.courses(board), api.stats(board)])
      .then(([c, s]) => { setCourses(c); setStats(s); })
      .catch((e: Error) => setErr(e.message));
    if (parent) history.replaceState(null, '', `/app/board?crew=${board}`);
  }, [board]);

  const labels = [...(courses?.map((c) => c.label) ?? []), ...stats.map((s) => s.subject).filter((s) => !courses?.some((c) => c.label === s))];
  const total = stats.reduce((a, s) => a + s.missions, 0);
  const points = stats.reduce((a, s) => a + s.points, 0);
  const best = stats.reduce((a, s) => Math.max(a, s.streak), 0);

  return (
    <div class="wide">
      <TopBar me={me} here="board" crew={board} />
      <div class="board-head">
        <div class="row" style="gap:16px">
          <CrewMark name={board} class="board-mark" />
          <div>
            <p class="eyebrow">Scoreboard</p>
            <h1 class="board-name">{board}</h1>
          </div>
        </div>
        {parent && (
          <div class="tabs" role="tablist" aria-label="Crew">
            {(['Booty', 'JO'] as LearnerName[]).map((n) => (
              <button role="tab" aria-selected={board === n} onClick={() => setBoard(n)}>{n}</button>
            ))}
          </div>
        )}
      </div>

      <div class="stat-row" style="margin-top:22px">
        <div class="stat" style="--i:0"><p class="k">Missions flown</p><p class="v">{total}</p></div>
        <div class="stat" style="--i:1"><p class="k">Points</p><p class="v">{points}</p></div>
        <div class="stat" style="--i:2"><p class="k">Best streak</p><p class="v">{best}<small> {best === 1 ? 'day' : 'days'}</small></p></div>
        <div class="stat" style="--i:3"><p class="k">Overall</p><p class="v">{rankFor(Math.round(points / Math.max(1, stats.length)))}</p></div>
      </div>

      {err && <p class="notice warn" style="margin-top:16px">{err}</p>}

      <div class="board" style="margin-top:16px">
        {!courses && Array.from({ length: 6 }, () => <div class="skel" style="height:190px;border-radius:24px" />)}
        {courses && labels.map((label, i) => <SubjectCard i={i} label={label} stat={stats.find((s) => s.subject === label)} />)}
      </div>

      <p class="faint" style="font-size:var(--fs-xs);margin-top:18px;font-family:var(--mono);letter-spacing:.08em">
        RANKS · {RANKS.map((r) => `${r.name} ${r.min}+`).join(' → ')} · points = (score + 2 for Deep Orbit) × difficulty
      </p>
      <p class="law" style="margin-top:36px">Always Be Learning</p>
    </div>
  );
}

function SubjectCard({ label, stat, i }: { label: string; stat?: SubjectStat; i: number }) {
  const rank = rankFor(stat?.points ?? 0);
  const nr = nextRank(stat?.points ?? 0);
  const d = stat?.difficulty ?? 3;
  return (
    <article class={`sub-card ${stat ? '' : 'empty'}`} style={`--i:${i}`}>
      <div class="sc-top">
        <h3 class="sc-name">{label}</h3>
        <span class={`rank ${rank}`}>{rank}</span>
      </div>
      <div class="sc-grid">
        <div><p class="k">Last</p><p class="v">{stat?.lastScore ?? '—'}</p></div>
        <div><p class="k">Best</p><p class="v">{stat?.bestScore ?? '—'}</p></div>
        <div><p class="k">Flown</p><p class="v">{stat?.missions ?? 0}</p></div>
        <div><p class="k">Streak</p><p class="v">{stat?.streak ?? 0}</p></div>
      </div>
      <div class="sc-foot">
        <span class="row" style="gap:8px">
          <span class="meter" aria-label={`Difficulty ${d} of 5`}>{[1, 2, 3, 4, 5].map((n) => <i class={n <= d ? 'on' : ''} />)}</span>
          <span>D{d}</span>
        </span>
        <span>{stat ? (nr ? `${nr.at - stat.points} to ${nr.name}` : 'Top rank') : 'Not flown yet'}</span>
      </div>
      {stat?.lastFlownOn && <p class="faint mono" style="font-size:.66rem;margin-top:8px;letter-spacing:.08em">LAST ORBIT {shortDate(stat.lastFlownOn + 'T12:00:00')}</p>}
    </article>
  );
}
