import { describe, it, expect } from 'vitest';
import { sanitizeText, escapeHTML, clampNum } from '../src/utils/security';

describe('AuraPlan AI — Security & Input Sanitization Suite', () => {
  it('escapes complex XSS payloads containing tags, attributes, and quotes', () => {
    const payload = `<script>alert('pwned')</script><a href="javascript:evil()">click</a>`;
    const escaped = escapeHTML(payload);

    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('</script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&#39;');
  });

  it('safely handles null and undefined inputs without throwing', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });

  it('strips HTML tags completely when sanitizing plain text', () => {
    const text = '<div><span>Hello <b>World</b></span></div>';
    expect(sanitizeText(text)).toBe('Hello World');
  });

  it('enforces maximum character length truncation', () => {
    const longString = 'A'.repeat(500);
    expect(sanitizeText(longString, 50).length).toBe(50);
    expect(escapeHTML(longString, 80).length).toBe(80);
  });

  it('clamps invalid, NaN, and Infinity numeric values to fallback', () => {
    expect(clampNum(NaN, 10, 100, 50)).toBe(50);
    expect(clampNum('not-a-number', 10, 100, 25)).toBe(25);
    expect(clampNum(Infinity, 10, 100, 30)).toBe(30);
    expect(clampNum(-Infinity, 10, 100, 30)).toBe(30);
  });

  it('strictly clamps values within min and max boundaries', () => {
    expect(clampNum(5, 10, 100, 50)).toBe(10);
    expect(clampNum(150, 10, 100, 50)).toBe(100);
    expect(clampNum(45, 10, 100, 50)).toBe(45);
  });
});
