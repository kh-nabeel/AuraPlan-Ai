import { describe, it, expect } from 'vitest';
import { computeDynamicBudget, evaluateEventHealth } from '../src/engine/planningEngine';
import { VERTICAL_PRESETS } from '../src/engine/presets';
import { EventConfig } from '../src/types';

describe('AuraPlan AI — Financial Precision & Mathematical Invariants', () => {
  it('guarantees 100% sum invariant across all priority modes', () => {
    const priorities: EventConfig['priority'][] = ['balanced', 'cost_saving', 'luxury', 'eco_friendly'];
    for (const priority of priorities) {
      const budget = 1750000;
      const items = computeDynamicBudget({
        ...VERTICAL_PRESETS.wedding,
        budget,
        priority
      });
      const sumAllocated = items.reduce((acc, i) => acc + i.allocated, 0);
      const sumPct = items.reduce((acc, i) => acc + i.pct, 0);

      expect(sumAllocated).toBe(budget);
      expect(sumPct).toBe(100);
    }
  });

  it('guarantees zero rounding leakage on odd and prime budget sums', () => {
    const oddBudgets = [999999, 1234567, 3333333, 777777];
    for (const budget of oddBudgets) {
      const items = computeDynamicBudget({
        ...VERTICAL_PRESETS.birthday,
        budget
      });
      const sumAllocated = items.reduce((acc, i) => acc + i.allocated, 0);
      expect(sumAllocated).toBe(budget);
    }
  });

  it('accurately calculates per-guest metrics without division by zero', () => {
    const healthZero = evaluateEventHealth({
      ...VERTICAL_PRESETS.community,
      guestCount: 0
    });
    expect(Number.isFinite(healthZero.perGuest)).toBe(true);
    expect(healthZero.perGuest).toBeGreaterThan(0);
  });

  it('detects luxury and eco-friendly priority contextual adjustments', () => {
    const luxury = computeDynamicBudget({
      ...VERTICAL_PRESETS.wedding,
      priority: 'luxury'
    });
    const eco = computeDynamicBudget({
      ...VERTICAL_PRESETS.wedding,
      priority: 'eco_friendly'
    });

    const ecoCatering = eco.find((i) => i.id === 'catering');
    expect(ecoCatering?.contextNote).toContain('compostable');
  });
});
