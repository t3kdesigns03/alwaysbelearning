import { useEffect, useState } from 'preact/hooks';
import { api, type LearnerName } from '../lib/api';
import { useMe, chicagoLongDate, shortDate } from '../components/hooks';
import TopBar from '../components/TopBar';
import CrewMark from '../components/CrewMark';
import { Arrow } from '../components/Icons';
import type { Course, CrewStatus, MissionSummary, Profile, SubjectStat } from '../lib/types';

const SCHOOL: Record<LearnerName, string> = {
  Booty: 'Grade 11 · Iowa Connections Academy · Connexus',
  JO: 'Grade 7 · I-35 Secondary · Truro · Roadrunners',
};

export default function ParentBay() {
  const me = useMe({ role: 'parent' });
  if (!me) return <div class="col" style="min-height:60vh" />;
  return <Bay me={me} />;
}

function Bay({ me }: { me: Profile }) {
  const [crew, setCrew] = useState<CrewStatus[]>([]);
  useEffect(() => { api.crew().then(setCrew).catch(() => {}); }, []);
  return (
    <div class="wide">
      <TopBar me={me} here="parent" />
      <section class="stack" style="--stack:10px">
        <p class="mc-date">{chicagoLongDate()}</p>
        <h1 class="mc-hello">{me.displayName}</h1>
        <p class="muted">Parent bay. Latest flights for both girls. Open a board, or fly a practice run as coach.</p>
      </section>
      <div class="bay" style="margin-top:30px">
        {(['Booty', 'JO'] as LearnerName[]).map((n) => <CrewCard name={n} status={crew.find((c) => c.name === n)} />)}
      </div>
      <p class="law" style="margin-top:44px">Always Be Learning</p>
    </div>
  );
}

function CrewCard({ name, status }: { name: LearnerName; status?: CrewStatus }) {
  const [missions, setMissions] = useState<MissionSummary[] | null>(null);
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const load = () =>
    Promise.all([api.missions(name, 6), api.stats(name), api.courses(name)])
      .then(([m, s, c]) => { setMissions(m); setStats(s); setCourses(c); })
      .catch((e: Error) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const week = missions?.filter((m) => m.completedAt && Date.now() - new Date(m.completedAt).getTime() < 7 * 864e5 && !m.coach).length ?? 0;
  const latest = missions?.find((m) => m.completedAt && !m.coach);

  async function add(e: Event) {
    e.preventDefault();
    if (!newCourse.trim()) return;
    try { await api.addCourse(name, newCourse); setNewCourse(''); setMsg('Course added.'); load(); }
    catch (ex) { setMsg((ex as Error).message); }
  }
  async function remove(id: string) {
    try { await api.removeCourse(name, id); load(); } catch (ex) { setMsg((ex as Error).message); }
  }
  async function reset() {
    try { await api.resetPin(name); setConfirmReset(false); setMsg(`${name}’s PIN is cleared. She sets a new one next time she opens her name.`); }
    catch (ex) { setMsg((ex as Error).message); }
  }

  return (
    <article class="glass bay-card">
      <div class="b-head">
        <CrewMark name={name} />
        <div class="grow">
          <h2 class="b-name">{name}</h2>
          <p class="b-school">{SCHOOL[name]}</p>
        </div>
      </div>

      <div class="stat-row" style="margin-top:18px">
        <div class="stat"><p class="k">Latest</p><p class="v">{latest ? `${latest.score}/8` : '—'}</p></div>
        <div class="stat"><p class="k">This week</p><p class="v">{week}</p></div>
        <div class="stat"><p class="k">Subjects</p><p class="v">{stats.length}</p></div>
        <div class="stat"><p class="k">PIN</p><p class="v" style="font-size:1.1rem">{status ? (status.pinSet ? 'Set' : 'Not yet') : '—'}</p></div>
      </div>

      <div class="log" style="margin-top:14px">
        {!missions && <div class="skel" style="height:120px" />}
        {missions?.length === 0 && <p class="faint" style="padding:14px 0;font-size:var(--fs-sm)">No flights yet.</p>}
        {missions?.map((m) => (
          <a class="log-row" href={m.completedAt ? `/app/debrief/${m.id}` : `/app/mission/${m.id}`}>
            <span>
              <span class="l-topic">{m.topic}</span>
              <span class="l-sub" style="display:block;margin-top:4px">{m.subject} · {shortDate(m.createdAt)} · D{m.difficulty}{m.coach ? ' · coach' : ''}</span>
            </span>
            <span class="l-score">{m.completedAt ? `${m.score}/8${m.bonusCorrect ? ' +◆' : ''}` : 'In flight'}</span>
          </a>
        ))}
      </div>

      <div class="bay-actions">
        <a class="btn btn-small" href={`/app/board?crew=${name}`}>Open board <Arrow size={16} /></a>
        <a class="btn btn-small btn-primary" href={`/app/?crew=${name}`}>Fly as coach <Arrow size={16} /></a>
      </div>

      <details class="fold">
        <summary>Courses · {courses.length}</summary>
        <div class="course-list">
          {courses.map((c) => (
            <div class="cl-row"><span>{c.label}</span><button class="btn btn-ghost btn-small" onClick={() => remove(c.id)} aria-label={`Remove ${c.label}`}>Remove</button></div>
          ))}
        </div>
        <form class="row" style="margin-top:10px" onSubmit={add}>
          <input class="input grow" placeholder={name === 'JO' ? 'Add an elective, e.g. Spanish 7' : 'Add a course'} value={newCourse} maxLength={80}
            onInput={(e) => setNewCourse((e.target as HTMLInputElement).value)} aria-label="New course name" />
          <button class="btn">Add</button>
        </form>
      </details>

      <details class="fold">
        <summary>PIN</summary>
        <p class="hint" style="margin:6px 0 12px">You never see or set her PIN. Clearing it just sends her back to “Set your 6-digit PIN”.</p>
        {confirmReset ? (
          <div class="row">
            <button class="btn btn-small" onClick={reset}>Yes, clear {name}’s PIN</button>
            <button class="btn btn-ghost btn-small" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button class="btn btn-small" onClick={() => setConfirmReset(true)} disabled={!status?.pinSet}>Clear PIN</button>
        )}
      </details>

      {msg && <p class="notice" style="margin-top:14px">{msg}</p>}
    </article>
  );
}
