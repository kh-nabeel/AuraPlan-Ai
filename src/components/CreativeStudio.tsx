import React from 'react';
import { CreativeIdeas } from '../types';
import { Palette, Utensils, Zap, Sparkles } from 'lucide-react';

interface CreativeStudioProps {
  ideas: CreativeIdeas;
  cardStyle: string;
  monoTag: string;
  mutedText: string;
}

export const CreativeStudio: React.FC<CreativeStudioProps> = React.memo(({
  ideas,
  cardStyle,
  monoTag,
  mutedText
}) => {
  return (
    <div className={`rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
      <div className="border-b-2 border-black dark:border-zinc-700 pb-4">
        <span className={monoTag}>[ SYNTHESIS MODULE ]</span>
        <h3 className="font-serif text-2xl font-bold mt-0.5">Bespoke Creative Direction</h3>
        <p className={`text-xs mt-1 ${mutedText}`}>
          {ideas.headline}
        </p>
      </div>

      {/* Palette Color Swatches */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Color Architecture
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ideas.palette.map((p) => (
            <div
              key={p.name}
              className="p-3 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] flex items-center gap-3 shadow-brutal-sm"
            >
              <span
                className="w-7 h-7 rounded-xl border-2 border-black shrink-0"
                style={{ backgroundColor: p.hex }}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-black dark:text-white">
                  {p.name}
                </div>
                <div className="font-mono text-[10px] text-zinc-500">
                  {p.hex}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Detail Blocks */}
      <div className="space-y-4">
        <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] space-y-2 shadow-brutal-sm">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-black dark:text-[#C3FF16]">
            <Palette className="w-4 h-4" />
            <h4>Spatial &amp; Decor Architecture</h4>
          </div>
          <ul className="text-xs space-y-2.5">
            {ideas.decor.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono font-bold text-black dark:text-[#C3FF16]">•</span>
                <span className="text-zinc-800 dark:text-zinc-200">{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] space-y-2 shadow-brutal-sm">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-black dark:text-[#C7AEE8]">
            <Utensils className="w-4 h-4" />
            <h4>Culinary Experience &amp; Beverage Curation</h4>
          </div>
          <ul className="text-xs space-y-2.5">
            {ideas.menu.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono font-bold text-black dark:text-[#C7AEE8]">•</span>
                <span className="text-zinc-800 dark:text-zinc-200">{m}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#D1FAE5] text-black space-y-2 shadow-brutal-sm">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-black">
            <Zap className="w-4 h-4 fill-black" />
            <h4>High-Impact Cost-Saving Hacks</h4>
          </div>
          <ul className="text-xs space-y-2.5">
            {ideas.savingHacks.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono font-bold text-black">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

CreativeStudio.displayName = 'CreativeStudio';
