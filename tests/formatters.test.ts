import { describe, it, expect } from 'vitest';
import { formatMoney, safePercentage, computeTargetDate } from '../src/utils/formatters';

describe('AuraPlan AI — Formatters & Localization Utilities', () => {
  it('formats INR amounts with Indian numbering system and rupee symbol', () => {
    expect(formatMoney(100000, 'INR')).toBe('₹1,00,000');
    expect(formatMoney(1250000, 'INR')).toBe('₹12,50,000');
    expect(formatMoney(0, 'INR')).toBe('₹0');
  });

  it('formats USD amounts with US numbering system and dollar symbol', () => {
    expect(formatMoney(100000, 'USD')).toBe('$100,000');
    expect(formatMoney(1250000, 'USD')).toBe('$1,250,000');
    expect(formatMoney(0, 'USD')).toBe('$0');
  });

  it('calculates safe percentages without division by zero', () => {
    expect(safePercentage(25, 100)).toBe(25);
    expect(safePercentage(1, 3)).toBe(33);
    expect(safePercentage(50, 0)).toBe(0);
    expect(safePercentage(0, 100)).toBe(0);
  });

  it('computes forward and backward target dates accurately', () => {
    const target = computeTargetDate(30, 10);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(target).toMatch(dateRegex);

    const sameDay = computeTargetDate(10, 10);
    expect(sameDay).toMatch(dateRegex);
  });
});
