/**
 * Remembers emails the user has successfully signed in with, so the login form
 * can suggest them (via a <datalist>). Stored locally only — never sent anywhere.
 * Not sensitive (emails, no passwords/tokens).
 */
const KEY = 'crp_known_emails';
const MAX = 5;

export function getRememberedEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((e): e is string => typeof e === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberEmail(email: string): void {
  if (typeof window === 'undefined') return;
  const clean = email.trim().toLowerCase();
  if (!clean) return;
  try {
    // Most-recent first, deduped, capped.
    const next = [clean, ...getRememberedEmails().filter((e) => e !== clean)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

/** Removes one remembered email and returns the updated list. */
export function forgetEmail(email: string): string[] {
  if (typeof window === 'undefined') return [];
  const next = getRememberedEmails().filter((e) => e !== email.trim().toLowerCase());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* non-fatal */
  }
  return next;
}
