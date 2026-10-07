import { CONFIG } from '../config';
import { sha256 } from './sha256';

const KEY = 'qge_session_v1';
const DAY = 24 * 60 * 60 * 1000;

interface Session {
  u: string;
  p: string;
  exp: number;
}

function stores(): Storage[] {
  const list: Storage[] = [];
  try {
    list.push(window.localStorage);
  } catch {
    /* blocked */
  }
  try {
    list.push(window.sessionStorage);
  } catch {
    /* blocked */
  }
  return list;
}

export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const [u, p] = await Promise.all([sha256(username.trim().toUpperCase()), sha256(password.trim())]);
  return u === CONFIG.auth.usernameSha256 && p === CONFIG.auth.passwordSha256;
}

export function saveSession(remember: boolean): void {
  const session: Session = {
    u: CONFIG.auth.usernameSha256,
    p: CONFIG.auth.passwordSha256,
    exp: Date.now() + (remember ? CONFIG.auth.rememberDays * DAY : DAY / 2),
  };
  try {
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage blocked — session lasts until page reload */
  }
}

/** A saved session is valid only while the configured credentials are unchanged. */
export function hasValidSession(): boolean {
  for (const store of stores()) {
    try {
      const raw = store.getItem(KEY);
      if (!raw) continue;
      const s = JSON.parse(raw) as Partial<Session>;
      if (
        s.u === CONFIG.auth.usernameSha256 &&
        s.p === CONFIG.auth.passwordSha256 &&
        typeof s.exp === 'number' &&
        s.exp > Date.now()
      ) {
        return true;
      }
      store.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  return false;
}

export function clearSession(): void {
  for (const store of stores()) {
    try {
      store.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}
