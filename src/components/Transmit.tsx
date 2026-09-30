import { useEffect, useState } from 'preact/hooks';

const LINES = [
  'Locking today’s idea…',
  'Plotting the harder rung…',
  'Writing the misconceptions worth missing…',
  'Tuning three signal bursts…',
  'Deep Orbit coming into view…',
];

export default function Transmit({ lines = LINES, sub = 'Incoming transmission' }: { lines?: string[]; sub?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 2600);
    return () => clearInterval(t);
  }, [lines]);
  return (
    <div class="transmit" role="status" aria-live="polite">
      <div class="orbiter" aria-hidden="true">
        <div class="o-ring" />
        <div class="o-ring r2" />
        <div class="o-ring r3" />
        <div class="o-core" />
        <div class="o-sat" />
        <div class="o-sat s2" />
      </div>
      <div class="stack" style="--stack:10px">
        <p class="t-sub">{sub}</p>
        <p class="t-line" key={i} style="animation: rise 300ms var(--ease) both">{lines[i]}</p>
      </div>
    </div>
  );
}
