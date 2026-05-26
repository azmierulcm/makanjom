/**
 * Client-side rate limiter backed by localStorage.
 *
 * This is a UX guard, not a security boundary — a determined user can
 * clear localStorage and bypass it. Pair with Supabase RLS policies for
 * hard server-side limits.
 *
 * Usage:
 *   const result = checkRateLimit('spinner', 10, 60_000); // 10 spins per minute
 *   if (!result.allowed) {
 *     alert(`Slow down! Try again in ${formatResetTime(result.resetInMs)}`);
 *     return;
 *   }
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

const PREFIX = 'makanjom_rl_';

export interface RateLimitResult {
  /** Whether the action is allowed under the current limit. */
  allowed: boolean;
  /** How many calls remain in the current window (after this one). */
  remaining: number;
  /** Milliseconds until the window resets. */
  resetInMs: number;
}

/**
 * @param key      Unique action key — e.g. 'spinner', 'trivia', 'review'
 * @param limit    Maximum calls allowed within the time window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  // Always allow on the server (SSR/build) — rate limiting is client-only
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: limit, resetInMs: 0 };
  }

  const storageKey = PREFIX + key;
  const now = Date.now();

  let entry: RateLimitEntry;
  try {
    const raw = localStorage.getItem(storageKey);
    entry = raw ? (JSON.parse(raw) as RateLimitEntry) : { count: 0, resetAt: now + windowMs };
  } catch {
    entry = { count: 0, resetAt: now + windowMs };
  }

  // Reset counter if the window has expired
  if (now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  const resetInMs = Math.max(0, entry.resetAt - now);

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetInMs };
  }

  entry.count += 1;
  try {
    localStorage.setItem(storageKey, JSON.stringify(entry));
  } catch {
    // localStorage is full — allow the action rather than silently blocking
  }

  return { allowed: true, remaining: limit - entry.count, resetInMs };
}

/** Format a millisecond duration as a human-readable string: "1m 30s" or "45s". */
export function formatResetTime(resetInMs: number): string {
  const secs = Math.ceil(resetInMs / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}
