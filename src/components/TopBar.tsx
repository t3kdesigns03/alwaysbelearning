import { useState } from 'preact/hooks';
import { isDemo, type LearnerName } from '../lib/api';
import type { Profile } from '../lib/types';
import { Gear } from './Icons';
import Settings from './Settings';

type Here = 'mc' | 'board' | 'parent' | 'new' | 'other';

export default function TopBar({ me, here, crew }: { me: Profile; here: Here; crew?: LearnerName }) {
  const [open, setOpen] = useState(false);
  const cq = me.role === 'parent' && crew ? `?crew=${crew}` : '';
  return (
    <header class="topbar">
      <a class="brand" href={me.role === 'parent' ? '/app/parent' : '/app/'} aria-label="ABL home">
        <span class="lockup small">
          <span class="lockup-abl">ABL</span>
          <span class="lockup-name">Always Be Learning</span>
        </span>
      </a>
      <div class="row" style="gap:8px">
        {isDemo && <span class="demo-flag" title="No Supabase configured — data lives in this browser">Demo</span>}
        <nav class="pillnav" aria-label="Primary">
          {me.role === 'parent' ? (
            <>
              <a href="/app/parent" aria-current={here === 'parent' ? 'page' : undefined}>Bay</a>
              <a href={`/app/board${cq || '?crew=Booty'}`} aria-current={here === 'board' ? 'page' : undefined}>Boards</a>
            </>
          ) : (
            <>
              <a href="/app/" aria-current={here === 'mc' || here === 'new' ? 'page' : undefined}>Mission</a>
              <a href="/app/board" aria-current={here === 'board' ? 'page' : undefined}>Board</a>
            </>
          )}
        </nav>
        <button class="icon-btn" onClick={() => setOpen(true)} aria-label="Settings">
          <Gear />
        </button>
      </div>
      {open && <Settings me={me} onClose={() => setOpen(false)} />}
    </header>
  );
}

