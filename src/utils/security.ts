// ============================================================================
// AuraPlan AI — OWASP-Compliant Security & Validation Utilities
// ============================================================================

const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Strips HTML tags and forbidden characters to sanitize user input for safe plain-text rendering.
 * @param input Raw user input
 * @param maxLen Maximum permitted character length (default 300)
 */
export function sanitizeText(input: unknown, maxLen = 300): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>`]/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Encodes special HTML entities to neutralize Cross-Site Scripting (XSS) vectors.
 * @param input Raw text containing potential entity characters
 * @param maxLen Maximum permitted character length (default 300)
 */
export function escapeHTML(input: unknown, maxLen = 300): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .trim()
    .slice(0, maxLen)
    .replace(/[&<>"']/g, (ch) => ENTITY_MAP[ch] || ch);
}

/**
 * Clamps numeric inputs to safe mathematical boundaries, handling NaN, null, and non-finite values.
 * @param val Raw input value
 * @param min Permitted lower bound
 * @param max Permitted upper bound
 * @param fallback Value returned if input is non-finite or invalid
 */
export function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
