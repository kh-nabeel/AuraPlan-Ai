// ============================================================================
// AuraPlan AI — Internationalized Formatting Utilities
// ============================================================================

import { CurrencyCode } from '../types';

/**
 * Formats a monetary value according to vertical currency (INR / USD).
 * @param val Numeric amount
 * @param currency Currency code ('INR' | 'USD')
 */
export function formatMoney(val: number, currency: CurrencyCode): string {
  const sym = currency === 'USD' ? '$' : '₹';
  const loc = currency === 'USD' ? 'en-US' : 'en-IN';
  return `${sym}${Math.round(val).toLocaleString(loc)}`;
}

/**
 * Calculates percentage integer safely without division by zero.
 */
export function safePercentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Formats target date as YYYY-MM-DD from today minus daysBefore.
 */
export function computeTargetDate(daysCountdown: number, daysBefore: number): string {
  const target = new Date();
  target.setDate(target.getDate() + Math.max(0, daysCountdown - daysBefore));
  return target.toISOString().split('T')[0];
}
