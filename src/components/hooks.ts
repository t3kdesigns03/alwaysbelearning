import { useEffect, useState } from 'preact/hooks';
import { api, go } from '../lib/api';
import type { Profile } from '../lib/types';

/** Session guard for /app/* islands. Redirects to the Dock when signed out. */
export function useMe(opts: { role?: 'parent' | 'learner' } = {}) {
  const [me, setMe] = useState<Profile | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((p) => {
        if (!alive) return;
        if (!p) return go('/');
        if (opts.role === 'parent' && p.role !== 'parent') return go('/app/');
        if (opts.role === 'learner' && p.role !== 'learner') return go('/app/parent');
        setMe(p);
      })
      .catch(() => go('/'));
    return () => {
      alive = false;
    };
  }, []);
  return me;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => alive && setState({ data, loading: false }))
      .catch((e: Error) => alive && setState({ error: e.message || 'Signal lost.', loading: false }));
    return () => {
      alive = false;
    };
  }, deps);
  return state;
}

export function chicagoLongDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric' }).format(d);
}

export function shortDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' }).format(new Date(iso));
}
