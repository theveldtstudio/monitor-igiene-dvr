const PIN_HASH_KEY = 'app_pin_hash';
const LOCK_STATE_KEY = 'app_locked';

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function savePin(pin: string): Promise<void> {
  const hash = await sha256(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await sha256(pin);
  return hash === stored;
}

export function hasPinSet(): boolean {
  return !!localStorage.getItem(PIN_HASH_KEY);
}

export function clearPin(): void {
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(LOCK_STATE_KEY);
}

export function setLocked(locked: boolean): void {
  if (locked) {
    localStorage.setItem(LOCK_STATE_KEY, '1');
  } else {
    localStorage.removeItem(LOCK_STATE_KEY);
  }
}

export function isLocked(): boolean {
  if (!hasPinSet()) return false;
  // Default locked at open/refresh; '0' means explicitly unlocked this session
  const flag = localStorage.getItem(LOCK_STATE_KEY);
  return flag !== '0';
}

export function markUnlocked(): void {
  localStorage.setItem(LOCK_STATE_KEY, '0');
}
