import { describe, it, expect } from 'vitest';
import { VERTICAL_PRESETS } from '../src/engine/presets';
import { computeDynamicBudget, evaluateEventHealth } from '../src/engine/planningEngine';

describe('AuraPlan AI — Vertical Presets & Benchmark Validation', () => {
  it('defines valid initial configurations for all verticals', () => {
    for (const [key, preset] of Object.entries(VERTICAL_PRESETS)) {
      expect(preset.eventType).toBe(key);
      expect(preset.budget).toBeGreaterThan(0);
      expect(preset.guestCount).toBeGreaterThan(0);
      expect(preset.daysCountdown).toBeGreaterThan(0);
      expect(preset.city.length).toBeGreaterThan(2);
    }
  });

  it('guarantees optimal baseline feasibility scores for all vertical presets', () => {
    for (const preset of Object.values(VERTICAL_PRESETS)) {
      const health = evaluateEventHealth(preset);
      expect(health.score).toBeGreaterThanOrEqual(70);
      expect(health.perGuest).toBeGreaterThanOrEqual(health.minThreshold * 0.8);
    }
  });

  it('generates non-empty itemized budget categories for every preset', () => {
    for (const preset of Object.values(VERTICAL_PRESETS)) {
      const budgetItems = computeDynamicBudget(preset);
      expect(budgetItems.length).toBeGreaterThanOrEqual(7);
      expect(budgetItems.every((item) => item.allocated > 0)).toBe(true);
    }
  });
});
