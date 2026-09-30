// PIN rules shared by the set-PIN screen and the server.
// The raw PIN never leaves the request body and is never stored or logged.

export const PIN_LENGTH = 6;
export const MAX_ATTEMPTS = 5;
export const COOLDOWN_MS = 30_000;

const T9: Record<string, string> = {
  a: '2', b: '2', c: '2', d: '3', e: '3', f: '3', g: '4', h: '4', i: '4',
  j: '5', k: '5', l: '5', m: '6', n: '6', o: '6', p: '7', q: '7', r: '7', s: '7',
  t: '8', u: '8', v: '8', w: '9', x: '9', y: '9', z: '9',
};

/** BOOTY → 26689, JO → 56 (phone keypad). */
export function nameAsDigits(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map((c) => T9[c] ?? '')
    .join('');
}

/** Returns a reason string if the PIN is not allowed, else null. */
export function pinProblem(pin: string, crewName: string): string | null {
  if (!/^\d{6}$/.test(pin)) return 'Six digits. Numbers only.';
  const blocked = new Set(['000000', '123456', '111111', '654321', '012345', '121212', '696969']);
  if (blocked.has(pin)) return 'Too easy to guess. Pick another six.';
  if (/^(\d)\1{5}$/.test(pin)) return 'All one digit is too easy to guess.';
  const asc = '01234567890';
  const desc = '09876543210';
  if (asc.includes(pin) || desc.includes(pin)) return 'Straight runs are too easy to guess.';
  const nd = nameAsDigits(crewName);
  if (nd) {
    const repeated = nd.repeat(Math.ceil(PIN_LENGTH / nd.length)).slice(0, PIN_LENGTH);
    if (pin === repeated) return 'That spells your name on a keypad. Pick another six.';
    if (nd.length >= 4 && (pin.startsWith(nd) || pin.endsWith(nd)))
      return 'That spells your name on a keypad. Pick another six.';
  }
  return null;
}
