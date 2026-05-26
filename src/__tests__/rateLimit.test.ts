import { checkRateLimit, formatResetTime } from '@/lib/rateLimit';

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('checkRateLimit', () => {
  it('allows the first call', () => {
    const result = checkRateLimit('test', 3, 60_000);
    expect(result.allowed).toBe(true);
  });

  it('tracks remaining count correctly', () => {
    checkRateLimit('test', 3, 60_000);
    const result = checkRateLimit('test', 3, 60_000);
    expect(result.remaining).toBe(1);
  });

  it('blocks when limit is reached', () => {
    checkRateLimit('test', 2, 60_000);
    checkRateLimit('test', 2, 60_000);
    const result = checkRateLimit('test', 2, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the window expires', () => {
    checkRateLimit('test', 1, 60_000);
    checkRateLimit('test', 1, 60_000); // blocked

    // Advance time past the window
    jest.advanceTimersByTime(61_000);

    const result = checkRateLimit('test', 1, 60_000);
    expect(result.allowed).toBe(true);
  });

  it('uses separate buckets for different keys', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('spinner', 5, 60_000);
    const blocked = checkRateLimit('spinner', 5, 60_000);
    expect(blocked.allowed).toBe(false);

    const other = checkRateLimit('trivia', 5, 60_000);
    expect(other.allowed).toBe(true);
  });

  it('returns resetInMs close to the window duration on first call', () => {
    const result = checkRateLimit('test', 10, 60_000);
    expect(result.resetInMs).toBeGreaterThan(59_000);
    expect(result.resetInMs).toBeLessThanOrEqual(60_000);
  });

  it('returns remaining = 0 when blocked', () => {
    checkRateLimit('test', 1, 1000);
    const result = checkRateLimit('test', 1, 1000);
    expect(result.remaining).toBe(0);
    expect(result.allowed).toBe(false);
  });
});

describe('formatResetTime', () => {
  it('formats seconds only for durations under 1 minute', () => {
    expect(formatResetTime(45_000)).toBe('45s');
    expect(formatResetTime(1_000)).toBe('1s');
  });

  it('formats minutes and seconds for 1 minute or more', () => {
    expect(formatResetTime(90_000)).toBe('1m 30s');
    expect(formatResetTime(120_000)).toBe('2m');
  });

  it('returns 0s for zero duration', () => {
    expect(formatResetTime(0)).toBe('0s');
  });
});
