/**
 * Text sanitizer — strips HTML/script tags before storing user input.
 * Prevents stored XSS from reaching other users' browsers.
 *
 * Uses DOMParser in browser environments for accurate HTML parsing;
 * falls back to a regex strip on the server (SSR/middleware).
 */

function stripHtml(raw: string): string {
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    return doc.body.textContent ?? '';
  }
  // Server-side fallback: strip angle-bracket tags
  return raw.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize free-text user input: strip HTML tags and trim whitespace.
 * Use for any field stored in the database (review comments, article content, etc.).
 */
export function sanitizeText(input: string): string {
  return stripHtml(input).trim();
}

/**
 * Sanitize and enforce a maximum character length.
 * Returns null if the result is empty after sanitization.
 */
export function sanitizeAndLimit(input: string, maxLength: number): string | null {
  const clean = sanitizeText(input);
  if (!clean) return null;
  return clean.slice(0, maxLength);
}
