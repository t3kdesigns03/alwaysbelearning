import { useEffect, useState } from 'preact/hooks';
import { api, go, isDemo } from '../lib/api';
import CrewMark from '../components/CrewMark';
import { Arrow } from '../components/Icons';
import type { CrewName, CrewStatus, Profile } from '../lib/types';

const META: Record<CrewName, string> = {
  Booty: '11 · Connexus',
  JO: '7 · I-35 Roadrunners',
  Dad: 'Learning Coach',
};

/** Splash dock: three crew marks. Hydrates to show PIN status + resume. */
export default function Dock() {
  const [crew, setCrew] = useState<CrewStatus[] | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.crew().then(setCrew).catch((e: Error) => setErr(e.message));
    api.me().then(setMe).catch(() => {});
  }, []);

  const names: CrewName[] = ['Booty', 'JO', 'Dad'];
  const status = (n: CrewName) => crew?.find((c) => c.name === n);

  function hint(n: CrewName) {
    if (me?.displayName === n) return 'Signed in · resume';
    if (n === 'Dad') return 'Email + password';
    const s = status(n);
    if (!crew) return '';
    if (!s) return 'Not on the roster yet';
    return s.pinSet ? '6-digit PIN' : 'First flight · set PIN';
  }

  function enter(n: CrewName) {
    if (me?.displayName === n) return go(n === 'Dad' ? '/app/parent' : '/app/');
    go(`/login?crew=${n}`);
  }

  return (
    <div class="stack" style="--stack:18px">
      <div class="dock">
        {names.map((n, i) => (
          <button class="crew" style={`--i:${i}`} onClick={() => enter(n)} aria-label={`Enter as ${n}`}>
            <CrewMark name={n} />
            <div>
              <div class="c-name">{n}</div>
              <div class="c-meta">{META[n]}</div>
              <div class="c-hint">{hint(n) || '\u00a0'}</div>
            </div>
            <span class="c-go"><Arrow /></span>
          </button>
        ))}
      </div>
      {err && <p class="notice warn">{err}</p>}
      {isDemo && (
        <p class="notice">
          <span class="demo-flag" style="margin-right:10px">Demo mode</span>
          No Supabase keys yet — everything stays in this browser. Add <span class="mono">.env</span> to go live.
        </p>
      )}
    </div>
  );
}
