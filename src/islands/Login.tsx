import { useEffect, useRef, useState } from 'preact/hooks';
import { api, go, isDemo, qs, type LearnerName } from '../lib/api';
import { pinProblem, PIN_LENGTH } from '../lib/pin';
import CrewMark from '../components/CrewMark';
import { Back, Delete, Eye } from '../components/Icons';
import type { CrewName } from '../lib/types';

type Mode = 'loading' | 'dad' | 'set' | 'confirm' | 'enter' | 'missing';

export default function Login() {
  const [crew, setCrew] = useState<CrewName | null>(null);
  const [mode, setMode] = useState<Mode>('loading');

  useEffect(() => {
    const q = qs('crew');
    if (q !== 'Booty' && q !== 'JO' && q !== 'Dad') return go('/');
    setCrew(q);
    (async () => {
      const me = await api.me().catch(() => null);
      if (me?.displayName === q) return go(q === 'Dad' ? '/app/parent' : '/app/');
      if (q === 'Dad') return setMode('dad');
      try {
        const list = await api.crew();
        const s = list.find((c) => c.name === q);
        if (!s) return setMode('missing');
        setMode(s.pinSet ? 'enter' : 'set');
      } catch {
        setMode('missing');
      }
    })();
  }, []);

  if (!crew || mode === 'loading') return <div class="col" style="min-height:60vh" />;

  return (
    <div class="col stack" style="--stack:28px">
      <a class="quiet-link" href="/"><Back /> Dock</a>
      <div class="login-head">
        <CrewMark name={crew} />
        <h1 class="login-name">{crew}</h1>
        <p class="muted" style="font-size:var(--fs-sm)">
          {mode === 'dad' && 'Learning Coach · email + password'}
          {mode === 'set' && 'First flight. Set your 6-digit PIN.'}
          {mode === 'confirm' && 'Once more to lock it in.'}
          {mode === 'enter' && 'Enter your PIN.'}
          {mode === 'missing' && 'Not on the roster yet.'}
        </p>
      </div>
      {mode === 'dad' && <DadLogin />}
      {(mode === 'set' || mode === 'confirm') && <SetPin name={crew as LearnerName} step={mode} onStep={setMode} />}
      {mode === 'enter' && <EnterPin name={crew as LearnerName} onNotSet={() => setMode('set')} />}
      {mode === 'missing' && (
        <p class="notice warn">
          {crew} doesn’t have a profile yet. Dad: follow README → “Seed the crew”.
        </p>
      )}
    </div>
  );
}

// ── Dad: email + password ─────────────────────────────────
function DadLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: Event) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api.parentLogin(email.trim(), password);
      go('/app/parent');
    } catch (ex) {
      setErr((ex as Error).message);
      setBusy(false);
    }
  }

  return (
    <form class="glass pad stack" style="--stack:16px" onSubmit={submit}>
      <label class="field">
        <span class="label">Email</span>
        <input class="input" type="email" autocomplete="username" required value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
      </label>
      <label class="field">
        <span class="spread"><span class="label">Password</span>
          <button type="button" class="quiet-link" style="min-height:32px" onClick={() => setShow(!show)} aria-pressed={show}><Eye off={show} /> {show ? 'Hide' : 'Show'}</button>
        </span>
        <input class="input" type={show ? 'text' : 'password'} autocomplete="current-password" required value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} />
      </label>
      {err && <p class="notice warn">{err}</p>}
      {isDemo && <p class="hint">Demo mode: any email + password opens the Parent bay.</p>}
      <button class="btn btn-primary block" disabled={busy}>{busy ? 'Opening the bay…' : 'Enter the bay'}</button>
    </form>
  );
}

// ── Shared keypad ─────────────────────────────────────────
function Keypad({
  value, onChange, onDone, disabled, dotsClass = '',
}: { value: string; onChange: (v: string) => void; onDone: (v: string) => void; disabled?: boolean; dotsClass?: string }) {
  const [show, setShow] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const valRef = useRef(value);
  valRef.current = value;
  const cb = useRef({ onChange, onDone });
  cb.current = { onChange, onDone };

  const push = (d: string) => {
    if (disabled) return;
    const v = valRef.current;
    if (v.length >= PIN_LENGTH) return;
    const next = v + d;
    valRef.current = next;
    cb.current.onChange(next);
    if (next.length === PIN_LENGTH) setTimeout(() => cb.current.onDone(next), 140);
  };
  const pop = () => {
    if (disabled) return;
    valRef.current = valRef.current.slice(0, -1);
    cb.current.onChange(valRef.current);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) { push(e.key); flash(e.key); }
      else if (e.key === 'Backspace') { pop(); flash('del'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled]);

  const flash = (k: string) => { setPressed(k); setTimeout(() => setPressed(null), 120); };

  return (
    <div class="stack" style="--stack:26px">
      <div class={`pin-dots ${show ? 'reveal' : ''} ${dotsClass}`} aria-label={`${value.length} of 6 digits`} role="status">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span class={i < value.length ? 'on' : ''}>{show ? (value[i] ?? '·') : ''}</span>
        ))}
      </div>
      <div class="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button type="button" class={`key ${pressed === d ? 'pressed' : ''}`} onClick={() => push(d)} disabled={disabled} aria-label={d}>{d}</button>
        ))}
        <button type="button" class="key fn" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? 'Hide digits' : 'Show digits'}>
          <Eye off={show} />
        </button>
        <button type="button" class={`key ${pressed === '0' ? 'pressed' : ''}`} onClick={() => push('0')} disabled={disabled} aria-label="0">0</button>
        <button type="button" class={`key fn ${pressed === 'del' ? 'pressed' : ''}`} onClick={pop} disabled={disabled} aria-label="Delete"><Delete /></button>
      </div>
    </div>
  );
}

// ── First open: set PIN, confirm once ────────────────────
function SetPin({ name, step, onStep }: { name: LearnerName; step: 'set' | 'confirm'; onStep: (m: Mode) => void }) {
  const [first, setFirst] = useState('');
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const bump = (msg: string) => {
    setErr(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
    setValue('');
  };

  async function done(v: string) {
    if (step === 'set') {
      const problem = pinProblem(v, name);
      if (problem) return bump(problem);
      setErr('');
      setFirst(v);
      setValue('');
      onStep('confirm');
      return;
    }
    if (v !== first) {
      setFirst('');
      onStep('set');
      return bump('Those didn’t match. Start fresh.');
    }
    setBusy(true);
    try {
      await api.setPin(name, first, v);
      go('/app/');
    } catch (ex) {
      setBusy(false);
      const e = ex as Error & { data?: { reason?: string } };
      if (e.data?.reason === 'already_set') return (window.location.href = `/login?crew=${name}`);
      setFirst('');
      onStep('set');
      bump(e.message);
    }
  }

  return (
    <div class="stack" style="--stack:18px">
      <p class="center eyebrow">{step === 'set' ? 'Set your 6-digit PIN' : 'Confirm your PIN'}</p>
      <Keypad value={value} onChange={setValue} onDone={done} disabled={busy} dotsClass={shake ? 'shake' : ''} />
      {err ? <p class="notice warn center">{err}</p> : <p class="hint center">Digits only. Not 000000, 123456, 111111, or your name on a keypad.</p>}
    </div>
  );
}

// ── Later opens: 6 big keys, 5 misses → 30s cool-off ─────
function EnterPin({ name, onNotSet }: { name: LearnerName; onNotSet: () => void }) {
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');
  const [cls, setCls] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!retryAt) return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= retryAt) { setRetryAt(0); setMsg(''); }
    }, 250);
    return () => clearInterval(t);
  }, [retryAt]);

  async function done(v: string) {
    setBusy(true);
    try {
      const r = await api.pinLogin(name, v);
      if (r.ok) {
        setCls('good');
        setTimeout(() => go('/app/'), 260);
        return;
      }
      setCls('shake');
      setTimeout(() => setCls(''), 450);
      setValue('');
      if (r.reason === 'wrong') setMsg(`Not that one. ${r.remaining} ${r.remaining === 1 ? 'try' : 'tries'} before a 30-second cool-off.`);
      else if (r.reason === 'cooldown') { setRetryAt(r.retryAt); setNow(Date.now()); setMsg(''); }
      else if (r.reason === 'not_set') onNotSet();
      else setMsg(r.message);
    } catch (ex) {
      setValue('');
      setMsg((ex as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cooling = retryAt > now;
  const secs = Math.max(0, Math.ceil((retryAt - now) / 1000));

  return (
    <div class="stack" style="--stack:18px">
      <Keypad value={value} onChange={setValue} onDone={done} disabled={busy || cooling} dotsClass={cls} />
      {cooling ? (
        <p class="notice warn center">Cooling off. Try again in {secs}s.</p>
      ) : msg ? (
        <p class="notice warn center">{msg}</p>
      ) : (
        <p class="hint center">Forgot it? Dad can clear it from the Parent bay — then you set a new one.</p>
      )}
    </div>
  );
}
