import React, { useState } from 'react';
import { VendorItem, VendorStatus, CurrencyCode } from '../types';
import { formatMoney } from '../utils/formatters';
import { sanitizeText, clampNum } from '../utils/security';
import { ShieldCheck, Plus, CheckCircle2, Clock, HelpCircle, Briefcase } from 'lucide-react';

interface VendorMatrixProps {
  vendorItems: VendorItem[];
  currency: CurrencyCode;
  onCycleStatus: (item: VendorItem) => void;
  onAddCustomVendor: (category: string, cap: number) => void;
  cardStyle: string;
  monoTag: string;
  mutedText: string;
}

export const VendorMatrix: React.FC<VendorMatrixProps> = React.memo(({
  vendorItems,
  currency,
  onCycleStatus,
  onAddCustomVendor,
  cardStyle,
  monoTag,
  mutedText
}) => {
  const [vendorCategory, setVendorCategory] = useState('');
  const [vendorCap, setVendorCap] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(vendorCategory, 100);
    if (!cleanName) return;
    const cap = clampNum(vendorCap, 500, 99999999, 50000);
    onAddCustomVendor(cleanName, cap);
    setVendorCategory('');
    setVendorCap('');
  };

  const statusStyles: Record<VendorStatus, { bg: string; text: string }> = {
    Booked: { bg: 'bg-[#97F8B7]', text: 'text-black' },
    Contacted: { bg: 'bg-[#C3FF16]', text: 'text-black' },
    Shortlisted: { bg: 'bg-[#C7AEE8]', text: 'text-black' },
    Pending: { bg: 'bg-zinc-200 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300' }
  };

  return (
    <section id="sec-vendors" className="py-12 border-b-2 border-black dark:border-zinc-700">
      <div className="w-full px-6 sm:px-10 lg:px-12 space-y-8">
        <div>
          <span className={monoTag}>[ SECTION 04 // VENDOR VETTING MATRIX ]</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
            Vendor Procurement &amp; Contract Vetting Matrix
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${mutedText}`}>
            Pre-loaded booking lead times, allocated price caps, and high-stakes contract protection questions.
          </p>
        </div>

        {/* Vendor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vendorItems.map((v) => {
            const badge = statusStyles[v.status];
            return (
              <div
                key={v.id}
                role="button"
                tabIndex={0}
                onClick={() => onCycleStatus(v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCycleStatus(v);
                  }
                }}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer select-none space-y-4 hover:-translate-y-1 ${cardStyle}`}
                aria-label={`Vendor Category: ${v.category}, Status: ${v.status}. Click to cycle status.`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#5F5CE5]" />
                    <span className="text-sm font-bold text-black dark:text-white">
                      {v.category}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border-2 border-black ${badge.bg} ${badge.text}`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Lead Window: {v.leadTime}</span>
                  <span className="font-bold text-black dark:text-[#C3FF16]">
                    Budget Cap: {formatMoney(v.estimatedCap, currency)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#202229] border border-black/20 dark:border-zinc-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <HelpCircle className="w-3.5 h-3.5 text-[#5F5CE5]" />
                    <span>Contract Vetting Question</span>
                  </div>
                  <p className="text-xs leading-relaxed italic text-zinc-800 dark:text-zinc-200">
                    &ldquo;{v.vettingQuestion}&rdquo;
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-1">
                  <span>Cycle status: Pending ➔ Shortlisted ➔ Contacted ➔ Booked</span>
                  <span className="font-bold text-black dark:text-white">Click card ➔</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Vendor Form */}
        <form
          onSubmit={handleAdd}
          className={`p-5 rounded-3xl border-2 border-dashed border-black dark:border-zinc-700 flex flex-wrap sm:flex-nowrap gap-3 items-center ${cardStyle}`}
        >
          <div className="p-2.5 rounded-xl bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={vendorCategory}
            onChange={(e) => setVendorCategory(e.target.value)}
            placeholder="Add vendor category (e.g. Drone Cinematography & Live Stream)..."
            className="flex-1 text-xs font-semibold px-4 py-3 rounded-xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
          />
          <input
            type="number"
            value={vendorCap}
            onChange={(e) => setVendorCap(e.target.value)}
            placeholder="Budget Cap (e.g. 85000)"
            className="w-full sm:w-44 text-xs font-mono px-4 py-3 rounded-xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
          />
          <button
            type="submit"
            className="bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-6 py-3 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all shrink-0"
          >
            Add Vendor
          </button>
        </form>
      </div>
    </section>
  );
});

VendorMatrix.displayName = 'VendorMatrix';
