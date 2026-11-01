import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GEMINI_API_KEY,
  PRIMARY_MODEL,
  FALLBACK_MODEL,
  isGeminiKeyActive,
  buildContextFrame
} from '../src/services/geminiService';

describe('AuraPlan AI — Dedicated Gemini AI Service Tests', () => {
  it('validates key activity properly', () => {
    expect(isGeminiKeyActive('AQ.mock_sample_key_for_testing_123456')).toBe(true);
    expect(isGeminiKeyActive('')).toBe(false);
  });

  it('configures proper primary and fallback models', () => {
    expect(PRIMARY_MODEL).toBe('gemini-3.5-flash');
    expect(FALLBACK_MODEL).toBe('gemini-3.5-flash-lite');
  });

  it('builds context-grounded prompt framing with all constraints', () => {
    const frame = buildContextFrame({
      eventName: 'Aarav & Diya Heritage Wedding',
      eventType: 'wedding',
      subStyle: 'Royal Traditional',
      currency: 'INR',
      budget: 1200000,
      guestCount: 250,
      daysCountdown: 75,
      city: 'Kochi, Kerala',
      setting: 'outdoor',
      priority: 'balanced',
      dietaryNotes: 'Traditional Sadhya',
      accessibilityRequired: true,
      perGuest: 4800,
      feasibilityScore: 94,
      feasibilityLabel: 'Optimal Blueprint',
      topBudgetCategories: [
        { name: 'Catering', allocated: 336000, pct: 28 },
        { name: 'Venue', allocated: 312000, pct: 26 }
      ]
    });

    expect(frame).toContain('Aarav & Diya Heritage Wedding');
    expect(frame).toContain('OUTDOOR');
    expect(frame).toContain('Mandatory Step-Free WCAG/ADA Access');
    expect(frame).toContain('94/100');
    expect(frame).toContain('Catering');
  });
});
