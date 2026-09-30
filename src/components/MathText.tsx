// Renders plain-text math (x^2, 2x^-1) with real superscripts. Display only.
export default function M({ t }: { t?: string | null }) {
  if (!t) return null;
  const parts = t.split(/\^(-?\d+|[a-z](?![a-z]))/i);
  if (parts.length === 1) return <>{t}</>;
  return <>{parts.map((p, i) => (i % 2 ? <sup class="pw">{p}</sup> : p))}</>;
}
