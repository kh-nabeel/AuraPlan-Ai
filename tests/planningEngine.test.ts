import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  escapeHTML,
  clampNum,
  computeDynamicBudget,
  evaluateEventHealth,
  computeTimeline,
  computeVendors,
  generateCreativeIdeas
} from '../src/App';

const baseConfig = {
  eventName: 'Aarav & Diya Wedding',
  eventType: 'wedding' as const,
  subStyle: 'Royal Traditional',
  currency: 'INR' as const,
  budget: 1000000,
  guestCount: 250,
  daysCountdown: 75,
  city: 'Kochi, Kerala',
  setting: 'outdoor' as const,
  priority: 'balanced' as const,
  dietaryNotes: 'Multi-Cuisine',
  accessibilityRequired: true
};

describe('AuraPlan AI — Security & Planning Engine Unit Tests', () => {
  it('escapes HTML entities to prevent XSS', () => {
    const res = escapeHTML('<img src=x onerror=evil()>');
    expect(res).not.toContain('<img');
    expect(res).toContain('&lt;img');
  });

  it('clamps out-of-range numeric values', () => {
    expect(clampNum(-500, 1000, 50000, 2000)).toBe(1000);
    expect(clampNum(999999, 1000, 50000, 2000)).toBe(50000);
  });

  it('normalizes budget allocations to 100% and exact monetary sum across all verticals', () => {
    for (const eventType of ['wedding', 'birthday', 'community'] as const) {
      const items = computeDynamicBudget({ ...baseConfig, eventType, budget: 600000 });
      const pctSum = items.reduce((a, b) => a + b.pct, 0);
      const amtSum = items.reduce((a, b) => a + b.allocated, 0);
      expect(pctSum).toBe(100);
      expect(amtSum).toBe(600000);
    }
  });

  it('increases contingency buffer automatically for outdoor settings', () => {
    const indoor = computeDynamicBudget({ ...baseConfig, setting: 'indoor' });
    const outdoor = computeDynamicBudget({ ...baseConfig, setting: 'outdoor' });
    const inPct = indoor.find((i) => i.id === 'contingency')!.pct;
    const outPct = outdoor.find((i) => i.id === 'contingency')!.pct;
    expect(outPct).toBeGreaterThan(inPct);
  });

  it('flags tight per-guest budgets and compressed schedules (<30 days)', () => {
    const health = evaluateEventHealth({ ...baseConfig, budget: 80000, guestCount: 400, daysCountdown: 14 });
    expect(health.alerts.length).toBeGreaterThanOrEqual(2);
    expect(health.score).toBeLessThan(80);
  });

  it('activates Fast-Track timeline compression when countdown < 30 days', () => {
    const tl = computeTimeline({ ...baseConfig, daysCountdown: 15 });
    expect(tl[0].phase).toContain('[Fast-Track]');
  });

  it('generates context-aware vendor checklists and creative ideas', () => {
    const vendors = computeVendors(baseConfig);
    const ideas = generateCreativeIdeas(baseConfig);
    expect(vendors.length).toBe(4);
    expect(ideas.palette.length).toBe(4);
  });
});
