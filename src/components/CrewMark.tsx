// Small constellation mark per crew member. No avatars, no clip art.
import type { CrewName } from '../lib/types';

type Star = [number, number, number?]; // x, y, radius
const MARKS: Record<CrewName, { stars: Star[]; lines: Array<[number, number]>; hub: number }> = {
  // A five-star crown — Booty
  Booty: { stars: [[16, 60, 2.4], [32, 36, 2.8], [50, 55, 2.4], [68, 28, 3.6], [85, 47, 2.6]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]], hub: 3 },
  // A quick arrow in flight — JO
  JO: { stars: [[22, 72, 2.4], [44, 46, 2.8], [72, 28, 3.6], [60, 66, 2.2]], lines: [[0, 1], [1, 2], [1, 3]], hub: 2 },
  // A long dipper — Dad
  Dad: { stars: [[14, 40, 3.4], [30, 35, 2.4], [46, 43, 2.6], [58, 58, 2.4], [80, 55, 2.4], [84, 76, 2.2], [62, 78, 2.2]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], hub: 0 },
};

export default function CrewMark({ name, class: cls = '' }: { name: CrewName; class?: string }) {
  const m = MARKS[name];
  return (
    <svg class={`mark ${cls}`} viewBox="0 0 100 100" aria-hidden="true">
      <circle class="ring" cx="50" cy="50" r="47" />
      {m.lines.map(([a, b]) => (
        <line x1={m.stars[a][0]} y1={m.stars[a][1]} x2={m.stars[b][0]} y2={m.stars[b][1]} />
      ))}
      {m.stars.map(([x, y, r], i) => (
        <circle cx={x} cy={y} r={r ?? 2.4} class={i === m.hub ? 'hub' : ''} />
      ))}
    </svg>
  );
}
