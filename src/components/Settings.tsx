import { useState } from 'preact/hooks';
import { api, go } from '../lib/api';
import { pinProblem } from '../lib/pin';
import type { Profile } from '../lib/types';
import { Eye } from './Icons';

/** Small, quiet settings sheet: change PIN (learners) + sign out. */
export default function Settings({ me, onClose }: { me: Profile; onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  async function change(e: Event) {
    e.preventDefault();
    setMsg(null);
    const problem = pinProblem(next, me.displayName);
    if (current.length !== 6) return setMsg({ kind: 'warn', text: 'Current PIN is six digits.' });
    if (problem) return setMsg({ kind: 'warn', text: problem });
    if (next !== confirm) return setMsg({ kind: 'warn', text: 'The new PINs don’t match.' });
    setBusy(true);
    try {
      await api.changePin(current, next, confirm);
      setMsg({ kind: 'ok', text: 'PIN changed. Transmission locked.' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setMsg({ kind: 'warn', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await api.signOut();
    go('/');
  }

  const pinInput = (label: string, value: string, set: (v: string) => void, auto: string) => (
    <label class="field">
      <span class="label">{label}</span>
      <input
        class="input mono"
        type={show ? 'text' : 'password'}
        inputMode="numeric"
        autocomplete={auto}
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onInput={(e) => set(digits((e.target as HTMLInputElement).value))}
        style="letter-spacing:0.4em;font-size:1.25rem"
      />
    </label>
  );

  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="grab" />
        <div class="spread">
          <div>
            <p class="eyebrow">Settings</p>
            <h2 style="font-size:1.75rem;margin-top:6px">{me.displayName}</h2>
          </div>
          <button class="btn btn-ghost btn-small" onClick={onClose}>Done</button>
        </div>

        {me.role === 'learner' ? (
          <form class="stack" style="--stack:14px;margin-top:22px" onSubmit={change}>
            <div class="spread">
              <p class="muted" style="font-size:var(--fs-sm)">Change PIN</p>
              <button type="button" class="quiet-link" onClick={() => setShow(!show)} aria-pressed={show}>
                <Eye off={show} /> {show ? 'Hide' : 'Show'}
              </button>
            </div>
            {pinInput('Current PIN', current, setCurrent, 'current-password')}
            {pinInput('New PIN', next, setNext, 'new-password')}
            {pinInput('New PIN again', confirm, setConfirm, 'new-password')}
            {msg && <p class={`notice ${msg.kind}`}>{msg.text}</p>}
            <button class="btn btn-primary block" disabled={busy}>{busy ? 'Saving…' : 'Change PIN'}</button>
          </form>
        ) : (
          <p class="muted" style="margin-top:18px;font-size:var(--fs-sm)">
            Dad signs in with email + password. Password changes live in Supabase Auth.
          </p>
        )}

        <hr class="hairline" />
        <button class="btn block" onClick={signOut}>Sign out of this device</button>
        <p class="faint center" style="font-size:var(--fs-xs);margin-top:14px">Stay in orbit — then leave it.</p>
      </div>
    </div>
  );
}
