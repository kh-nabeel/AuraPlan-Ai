import React from 'react';
import { BudgetCategory, CurrencyCode } from '../types';
import { formatMoney } from '../utils/formatters';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { PieChart as PieIcon, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface BudgetBreakdownProps {
  budgetItems: BudgetCategory[];
  totalBudget: number;
  totalActual: number;
  budgetVariance: number;
  currency: CurrencyCode;
  onUpdateActual: (id: string, value: number) => void;
  onResetActuals: () => void;
  cardStyle: string;
  monoTag: string;
  mutedText: string;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = React.memo(({
  budgetItems,
  totalBudget,
  totalActual,
  budgetVariance,
  currency,
  onUpdateActual,
  onResetActuals,
  cardStyle,
  monoTag,
  mutedText
}) => {
  const chartData = budgetItems.map((item) => ({
    name: item.name,
    value: item.allocated,
    color: item.color,
    pct: item.pct
  }));

  return (
    <section id="sec-budget" className="py-12 border-b-2 border-black dark:border-zinc-700">
      <div className="w-full px-6 sm:px-10 lg:px-12 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={monoTag}>[ SECTION 02 // FINANCIAL MATRIX &amp; LIVE QUOTE SIMULATOR ]</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
              Deterministic Budget Normalization (100% Exact)
            </h2>
            <p className={`text-sm mt-1 max-w-2xl ${mutedText}`}>
              Mathematical allocation guaranteed to equal 100% of the target capital with automated contingency weather buffering.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onResetActuals}
              className="text-xs font-bold underline text-zinc-500 hover:text-black dark:hover:text-white transition-all"
            >
              Reset Quote Simulations
            </button>
            <div className={`px-4 py-2 rounded-2xl border-2 border-black ${
              budgetVariance >= 0
                ? 'bg-[#97F8B7] text-black shadow-brutal-sm'
                : 'bg-[#FF7A59] text-white shadow-brutal-sm'
            }`}>
              <div className="text-[10px] uppercase font-bold tracking-wider">
                {budgetVariance >= 0 ? 'Surplus Cushion' : 'Deficit Overrun'}
              </div>
              <div className="font-mono text-lg font-black">
                {budgetVariance >= 0 ? '+' : ''}{formatMoney(budgetVariance, currency)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 5 Cols: Interactive Recharts Donut Pie */}
          <div className={`lg:col-span-5 rounded-3xl p-6 sm:p-8 space-y-4 ${cardStyle}`}>
            <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-3">
              <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider font-bold">
                Capital Allocation Donut
              </span>
              <PieIcon className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#000"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatMoney(value, currency), 'Target']}
                    contentStyle={{
                      backgroundColor: '#111215',
                      border: '2px solid #000',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 text-center text-xs font-mono text-zinc-500">
              Total Target: <span className="font-bold text-black dark:text-white">{formatMoney(totalBudget, currency)}</span> (100%)
            </div>
          </div>

          {/* Right 7 Cols: Live Quote Sliders & Variance Matrix */}
          <div className={`lg:col-span-7 rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
            <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-3">
              <div>
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider font-bold">
                  Live Vendor Quote Simulator
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Adjust simulated quotes to test real-world vendor negotiations against your allocated baseline.
                </p>
              </div>
              <SlidersHorizontal className="w-5 h-5 text-zinc-500 shrink-0" />
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
              {budgetItems.map((item) => {
                const diff = item.actual - item.allocated;
                const min = Math.round(item.allocated * 0.4);
                const max = Math.round(item.allocated * 1.8);
                const step = Math.max(500, Math.round(item.allocated * 0.02));

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] space-y-2.5 shadow-brutal-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-bold text-black dark:text-white">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-bold">
                          {item.pct}%
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-black dark:text-white">
                          Quote: {formatMoney(item.actual, currency)}
                        </span>
                        {diff !== 0 && (
                          <span
                            className={`block text-[10px] font-mono font-bold ${
                              diff > 0 ? 'text-[#FF7A59]' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {diff > 0 ? `+${formatMoney(diff, currency)} over` : `${formatMoney(diff, currency)} saved`}
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={item.actual}
                      onChange={(e) => onUpdateActual(item.id, Number(e.target.value))}
                      className="w-full accent-black dark:accent-[#C3FF16] h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                      aria-label={`${item.name} Quote Slider`}
                    />

                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Target: {formatMoney(item.allocated, currency)}</span>
                      <span className="italic">{item.contextNote}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

BudgetBreakdown.displayName = 'BudgetBreakdown';
