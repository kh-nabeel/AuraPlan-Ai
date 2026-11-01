import { describe, it, expect } from 'vitest';
import { computeTimeline } from '../src/engine/planningEngine';
import { VERTICAL_PRESETS } from '../src/engine/presets';

describe('AuraPlan AI — Backwards Timeline & Fast-Track Engine', () => {
  it('activates [Fast-Track] when countdown is strictly below 30 days', () => {
    const fast = computeTimeline({
      ...VERTICAL_PRESETS.wedding,
      daysCountdown: 29
    });
    const standard = computeTimeline({
      ...VERTICAL_PRESETS.wedding,
      daysCountdown: 30
    });

    expect(fast[0].phase).toContain('[Fast-Track]');
    expect(standard[0].phase).not.toContain('[Fast-Track]');
  });

  it('generates strictly valid ISO YYYY-MM-DD target dates', () => {
    const timeline = computeTimeline(VERTICAL_PRESETS.wedding);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const item of timeline) {
      expect(item.targetDate).toMatch(dateRegex);
      expect(new Date(item.targetDate).toString()).not.toBe('Invalid Date');
    }
  });

  it('safely handles extremely short countdowns (minimum 3 days threshold)', () => {
    const rushTimeline = computeTimeline({
      ...VERTICAL_PRESETS.birthday,
      daysCountdown: 2
    });
    expect(rushTimeline.length).toBeGreaterThanOrEqual(4);
    expect(rushTimeline[0].daysBefore).toBeGreaterThanOrEqual(0);
  });
});
