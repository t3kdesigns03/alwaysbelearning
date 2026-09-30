import { useEffect, useState } from 'preact/hooks';
import { api, type LearnerName } from '../lib/api';
import { debriefLine, nextRank, RANKS } from '../lib/scoring';
import { useMe } from '../components/hooks';
import TopBar from '../components/TopBar';
import Transmit from '../components/Transmit';
import { Arrow } from '../components/Icons';
import M from '../components/MathText';
import type { Debrief as D, Profile } from '../lib/types';

export default function Debrief({ id }: { id: string }) {
  const me = useMe();
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (me) api.complete(id).then(setD).catch((e: Error) => setErr(e.message));
  }, [me, id]);

  if (err) {
    return (
      <div class="col stack" style="padding-top:12vh">
        <p class="notice warn">{err}</p>
        <a class="btn" href={`/app/mission/${id}`}>Back to the mission</a>
      </div>
    );
  }
  if (!me || !d) return <div class="col"><Transmit sub="Debrief" lines={['Scoring the flight…', 'Updating the board…']} /></div>;
  return <View me={me} d={d} />;
}

function View({ me, d }: { me: Profile; d: D }) {
  const board = d.learnerName as LearnerName;
  const cq = me.role === 'parent' ? `?crew=${board}` : '';
  const up = d.difficultyAfter > d.difficultyBefore;
  const down = d.difficultyAfter < d.difficultyBefore;
  const nr = nextRank(d.stat?.points ?? 0);
  const again = `/app/new${cq}${cq ? '&' : '?'}subject=${encodeURIComponent(d.subject)}&topic=${encodeURIComponent(d.topic)}`;

  return (
    <div class="col">
      <TopBar me={me} here="other" crew={board} />
      <p class="eyebrow">Debrief · {d.subject}{d.coach ? ' · coach run' : ''}</p>
      <p class="muted" style="margin-top:6px">{d.topic}</p>

      <section style="margin-top:26px">
        <div class="score-hero" aria-label={`${d.score} out of 8`}>
          <span class="num">{d.score}</span><span class="of">/8</span>
        </div>
        <p class="verdict" style="margin-top:18px">{debriefLine(d.score)}</p>
        {d.score === 8 && up && <p class="muted" style="margin-top:10px">Clean sweep means we went soft. The next {d.subject} mission comes in hotter.</p>}
        {d.score <= 4 && <p class="muted" style="margin-top:10px">Warmer scaffolds next time — same topic, same rigor underneath.</p>}
      </section>

      <section class="stat-row" style="margin-top:28px">
        <div class="stat" style="--i:0">
          <p class="k">Deep Orbit</p>
          <p class={`v ${d.bonusCorrect ? 'gold' : ''}`}>{d.bonusCorrect ? 'Cleared' : 'Open'}</p>
        </div>
        <div class="stat" style="--i:1">
          <p class="k">Difficulty</p>
          <p class={`v ${up ? 'up' : ''}`}>{d.difficultyBefore}{d.difficultyAfter !== d.difficultyBefore && <> → {d.difficultyAfter}</>}<small> /5</small></p>
        </div>
        <div class="stat" style="--i:2">
          <p class="k">Streak</p>
          <p class="v">{d.coach ? '—' : d.stat?.streak ?? 0}<small>{d.coach ? '' : ' day' + ((d.stat?.streak ?? 0) === 1 ? '' : 's')}</small></p>
        </div>
        <div class="stat" style="--i:3">
          <p class="k">Rank</p>
          <p class="v">{d.rank}</p>
        </div>
      </section>

      <section class="glass pad" style="margin-top:12px">
        <div class="spread">
          <a class="chip fresh" href={`/app/board${cq}`} style="animation-delay:400ms">
            {d.subject}<span class="c-score">{d.coach ? `${d.score}/8` : `${d.stat?.lastScore ?? d.score}/8`}</span>
          </a>
          <span class="faint mono" style="font-size:var(--fs-xs)">
            {d.coach ? 'Coach run · board unchanged' : up ? 'Board updated · hotter next' : down ? 'Board updated · warmer next' : 'Board updated'}
          </span>
        </div>
        {!d.coach && (
          <div class="rank-track" style="margin-top:16px">
            {RANKS.map((r) => <span class={r.name === d.rank ? 'on' : ''}>{r.name}</span>)}
            {nr && <span class="faint" style="margin-left:auto">{nr.at - (d.stat?.points ?? 0)} pts to {nr.name}</span>}
          </div>
        )}
      </section>

      {d.missed.length > 0 && (
        <section style="margin-top:30px" class="stack">
          <p class="eyebrow">The pieces to carry</p>
          <div class="missed">
            {d.missed.map((m) => (
              <div class="mi">
                <p class="c">{m.concept}</p>
                <p class="p"><M t={m.prompt} /></p>
                <p class="w"><M t={m.why} /></p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section class="stack" style="--stack:10px;margin-top:30px">
        <a class="btn btn-primary block" href={again}>{d.score === 8 ? 'Go further' : 'Fly it again'} <Arrow /></a>
        <div class="row" style="gap:10px">
          <a class="btn grow" href={`/app/${cq}`}>Mission Control</a>
          <a class="btn grow" href={`/app/board${cq}`}>Board</a>
        </div>
      </section>

      <p class="law" style="margin-top:44px">Always Be Learning</p>
    </div>
  );
}
