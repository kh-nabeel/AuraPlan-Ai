import React from 'react';
import { EventVertical } from '../types';
import { Crown, PartyPopper, Users, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  currentVertical: EventVertical;
  onSelectVertical: (vertical: EventVertical) => void;
  pillActive: string;
  pillInactive: string;
  mutedText: string;
}

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({
  currentVertical,
  onSelectVertical,
  pillActive,
  pillInactive,
  mutedText
}) => {
  return (
    <section className="relative overflow-hidden py-10 lg:py-14 border-b-2 border-black dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xs">
      <div className="w-full px-6 sm:px-10 lg:px-12">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-black dark:border-zinc-700 bg-[#C3FF16] text-black text-xs font-mono font-bold shadow-brutal-sm">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>AI-POWERED MULTI-VERTICAL EVENT ARCHITECT</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black dark:text-white leading-[1.08]">
            Plan high-stakes events with <span className="italic underline decoration-[#5F5CE5] decoration-wavy decoration-2">financial precision</span> and GenAI flair.
          </h1>

          <p className={`text-base sm:text-lg max-w-2xl leading-relaxed ${mutedText}`}>
            Zero spreadsheets. Zero generic hallucinations. Dynamic 100% budget allocation, backwards milestone roadmaps, context-grounded vendor checklists, and live Gemini 3.5 Flash intelligence.
          </p>

          {/* Vertical Archetype Selector Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-zinc-500 mr-1">
              Select Vertical:
            </span>

            <button
              type="button"
              onClick={() => onSelectVertical('wedding')}
              className={`inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full transition-all ${
                currentVertical === 'wedding' ? pillActive : pillInactive
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Weddings &amp; Galas</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectVertical('birthday')}
              className={`inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full transition-all ${
                currentVertical === 'birthday' ? pillActive : pillInactive
              }`}
            >
              <PartyPopper className="w-4 h-4" />
              <span>Milestone Birthdays</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectVertical('community')}
              className={`inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full transition-all ${
                currentVertical === 'community' ? pillActive : pillInactive
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Community &amp; Tech Conclaves</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';
