import { sanitizeText, sanitizeAndLimit } from '@/lib/sanitize';

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('strips script tags', () => {
    const result = sanitizeText('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
  });

  it('strips inline event handlers', () => {
    const result = sanitizeText('<img src=x onerror="alert(1)">caption');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('<img');
  });

  it('strips anchor tags while keeping text', () => {
    const result = sanitizeText('<a href="http://evil.com">Click me</a>');
    expect(result).not.toContain('<a');
    expect(result).toContain('Click me');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeText('   ')).toBe('');
  });

  it('preserves plain text unchanged', () => {
    expect(sanitizeText('Nasi lemak is delicious!')).toBe('Nasi lemak is delicious!');
  });

  it('preserves unicode characters', () => {
    expect(sanitizeText('Sedap 🍛 很好吃')).toBe('Sedap 🍛 很好吃');
  });
});

describe('sanitizeAndLimit', () => {
  it('returns null for empty string after sanitization', () => {
    expect(sanitizeAndLimit('', 100)).toBeNull();
    expect(sanitizeAndLimit('<script></script>', 100)).toBeNull();
  });

  it('truncates to maxLength', () => {
    const result = sanitizeAndLimit('a'.repeat(200), 50);
    expect(result).toHaveLength(50);
  });

  it('returns full string when under limit', () => {
    const result = sanitizeAndLimit('Hello', 100);
    expect(result).toBe('Hello');
  });

  it('sanitizes before enforcing limit', () => {
    // The tag itself should not count toward visible character limit
    const result = sanitizeAndLimit('<b>Bold</b>', 10);
    expect(result).toBe('Bold');
  });
});
