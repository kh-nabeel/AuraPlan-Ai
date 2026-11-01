import React from 'react';
import {
  EventConfig,
  VenueSetting,
  PriorityMode,
  EventHealthSummary
} from '../types';
import { formatMoney } from '../utils/formatters';
import {
  Building2,
  TreePine,
  Layers,
  Scale,
  Coins,
  Crown,
  Leaf,
  Activity,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface ContextStudioProps {
  config: EventConfig;
  health: EventHealthSummary;
  onUpdateField: <K extends keyof EventConfig>(key: K, value: EventConfig[K]) => void;
  cardStyle: string;
  pillActive: string;
  pillInactive: string;
  monoTag: string;
  mutedText: string;
}

export const ContextStudio: React.FC<ContextStudioProps> = React.memo(({
  config,
  health,
  onUpdateField,
  cardStyle,
  pillActive,
  pillInactive,
  monoTag,
  mutedText
}) => {
  const budgetMin = config.currency === 'USD' ? 5000 : 100000;
  const budgetMax = config.currency === 'USD' ? 250000 : 5000000;
  const budgetStep = config.currency === 'USD' ? 1000 : 25000;

  return (
    <section id="sec-controls" className="py-12 border-b-2 border-black dark:border-zinc-700">
      <div className="w-full px-6 sm:px-10 lg:px-12 space-y-8">
        <div>
          <span className={monoTag}>[ SECTION 01 // ARCHITECTURAL CONTEXT STUDIO ]</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
            Dynamic Event Constraints &amp; Health Feasibility
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${mutedText}`}>
            Drag sliders in real time to simulate budget shifts, guest density constraints, and schedule compression.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 8 Cols: Input Controls & Interactive Sliders */}
          <div className={`lg:col-span-8 rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
            {/* Row 1: Event Name & Setting Topology */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-6 space-y-2">
                <label htmlFor="input-event-name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Event Title / Couple / Host
                </label>
                <input
                  id="input-event-name"
                  type="text"
                  value={config.eventName}
                  onChange={(e) => onUpdateField('eventName', e.target.value)}
                  className="w-full text-sm font-semibold rounded-2xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm focus:outline-hidden focus:ring-2 focus:ring-[#C3FF16]"
                  placeholder="e.g. Maya & Kabir Royal Wedding"
                />
              </div>

              <div className="md:col-span-6 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  Venue Topology (Rain Contingency Trigger)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'indoor', label: 'Indoor', icon: Building2 },
                    { id: 'outdoor', label: 'Outdoor', icon: TreePine },
                    { id: 'hybrid', label: 'Hybrid', icon: Layers }
                  ].map((v) => {
                    const Icon = v.icon;
                    const active = config.setting === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onUpdateField('setting', v.id as VenueSetting)}
                        className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold py-3 px-2 rounded-xl transition-all ${
                          active ? pillActive : pillInactive
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Optimization Priority Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                Financial Optimization Objective
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'balanced', label: 'Balanced', icon: Scale },
                  { id: 'cost_saving', label: 'Cost-Saver', icon: Coins },
                  { id: 'luxury', label: 'Ultra Luxury', icon: Crown },
                  { id: 'eco_friendly', label: 'Zero-Waste', icon: Leaf }
                ].map((p) => {
                  const Icon = p.icon;
                  const active = config.priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onUpdateField('priority', p.id as PriorityMode)}
                      className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl transition-all ${
                        active ? pillActive : pillInactive
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders Container */}
            <div className="space-y-6 pt-4 border-t-2 border-black/20 dark:border-zinc-700">
              {/* Slider 1: Total Budget */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Total Event Budget
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-black dark:text-[#C3FF16]">
                    {formatMoney(config.budget, config.currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min={budgetMin}
                  max={budgetMax}
                  step={budgetStep}
                  value={config.budget}
                  onChange={(e) => onUpdateField('budget', Number(e.target.value))}
                  className="w-full accent-black dark:accent-[#C3FF16] h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  aria-label="Total Budget Slider"
                />
                <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                  <span>{formatMoney(budgetMin, config.currency)}</span>
                  <span>Per-guest: {formatMoney(health.perGuest, config.currency)}/guest</span>
                  <span>{formatMoney(budgetMax, config.currency)}</span>
                </div>
              </div>

              {/* Slider 2: Guest Count */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Guest Headcount
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-black dark:text-[#C7AEE8]">
                    {config.guestCount} <span className="text-sm font-normal text-zinc-500">Guests</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={config.guestCount}
                  onChange={(e) => onUpdateField('guestCount', Number(e.target.value))}
                  className="w-full accent-black dark:accent-[#C7AEE8] h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  aria-label="Guest Headcount Slider"
                />
                <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                  <span>20 Pax (Intimate)</span>
                  <span>1,000 Pax (Grand Scale)</span>
                </div>
              </div>

              {/* Slider 3: Countdown Days */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Countdown Days Remaining
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-black dark:text-[#FF7A59]">
                    {config.daysCountdown} <span className="text-sm font-normal text-zinc-500">Days</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="365"
                  step="1"
                  value={config.daysCountdown}
                  onChange={(e) => onUpdateField('daysCountdown', Number(e.target.value))}
                  className="w-full accent-black dark:accent-[#FF7A59] h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                  aria-label="Countdown Days Slider"
                />
                <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                  <span>7 Days (Express)</span>
                  <span>{config.daysCountdown < 30 ? '🔥 Fast-Track Activated' : 'Normal Pace'}</span>
                  <span>365 Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Live Feasibility Health Card */}
          <div className={`lg:col-span-4 rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
            <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-4">
              <div>
                <span className={monoTag}>[ HEALTH DIAGNOSTIC ]</span>
                <h3 className="font-serif text-2xl font-bold mt-0.5">Feasibility Score</h3>
              </div>
              <div className="p-2.5 rounded-2xl bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* Score Ring Display */}
            <div className="text-center py-2 space-y-1">
              <div className="font-mono text-6xl font-black tracking-tight text-black dark:text-white">
                {health.score}
                <span className="text-xl font-medium text-zinc-400">/100</span>
              </div>
              <span className={`inline-block font-mono text-xs font-extrabold uppercase px-3 py-1 rounded-full border-2 border-black ${
                health.score >= 82
                  ? 'bg-[#97F8B7] text-black'
                  : health.score >= 68
                  ? 'bg-[#FFE816] text-black'
                  : 'bg-[#FF7A59] text-white'
              }`}>
                {health.label}
              </span>
            </div>

            {/* Diagnostic Alerts */}
            {health.alerts.length > 0 && (
              <div className="space-y-2 p-4 rounded-2xl bg-[#FFECE8] dark:bg-red-950/40 border-2 border-[#FF7A59] text-black dark:text-zinc-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#FF7A59]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Feasibility Flags</span>
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
                  {health.alerts.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Architectural Recommendations */}
            <div className="space-y-2 p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-800/60 border-2 border-black/20 dark:border-zinc-700 text-xs">
              <div className="flex items-center gap-2 font-bold text-black dark:text-[#C3FF16]">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>Engine Optimization</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {health.tips.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

ContextStudio.displayName = 'ContextStudio';
