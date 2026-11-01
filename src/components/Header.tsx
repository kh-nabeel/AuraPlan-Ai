import React from 'react';
import { Sparkles, Terminal, Moon, Sun, Contrast } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  onOpenTestModal: () => void;
  onOpenApiModal: () => void;
  isGeminiActive: boolean;
  testPassCount: number;
  totalTests: number;
  mutedText: string;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  darkMode,
  setDarkMode,
  highContrast,
  setHighContrast,
  onOpenTestModal,
  onOpenApiModal,
  isGeminiActive,
  testPassCount,
  totalTests,
  mutedText
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Continuous Marquee Ticker */}
      <div className="border-b-2 border-black dark:border-zinc-700 bg-[#FFE816] text-black text-xs font-mono font-bold uppercase tracking-wider py-2 px-4 overflow-hidden select-none">
        <div className="animate-ticker flex items-center gap-10 whitespace-nowrap">
          <span>[ AURAPLAN AI // EVENT OPERATING SYSTEM ]</span>
          <span>•</span>
          <span>100% BUDGET ALLOCATION NORMALIZATION</span>
          <span>•</span>
          <span>ZERO-LATENCY DETERMINISTIC FINANCIAL ENGINE</span>
          <span>•</span>
          <span>DATE-ANCHORED BACKWARDS TIMELINE ROADMAP</span>
          <span>•</span>
          <span>CONTEXT-AWARE VENDOR CONTRACT VETTING</span>
          <span>•</span>
          <span>DEDICATED GEMINI 3.5 FLASH CO-PILOT</span>
          <span>•</span>
          <span>[ AURAPLAN AI // EVENT OPERATING SYSTEM ]</span>
          <span>•</span>
          <span>100% BUDGET ALLOCATION NORMALIZATION</span>
        </div>
      </div>

      {/* Main Fluid Navbar */}
      <header className={`sticky top-0 z-30 border-b-2 border-black dark:border-zinc-700 backdrop-blur-md ${darkMode ? 'bg-[#101114]/90' : 'bg-[#FAF8F5]/90'}`}>
        <div className="w-full px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#C3FF16] border-2 border-black flex items-center justify-center text-black shadow-brutal transition-transform hover:-rotate-3">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-3xl font-bold tracking-tight text-black dark:text-white">
                  AuraPlan<span className="italic font-normal">.ai</span>
                </span>
                <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border border-black">
                  PRO v2.0
                </span>
              </div>
              <p className={`text-xs hidden sm:block font-medium ${mutedText}`}>
                Deterministic Event Planning &amp; Financial Architecture
              </p>
            </div>
          </div>

          {/* Quick Jump In-Page Nav Links */}
          <nav aria-label="Page Sections" className="hidden xl:flex items-center gap-2 font-mono text-xs font-bold">
            <button
              onClick={() => scrollTo('sec-controls')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              01 Controls
            </button>
            <button
              onClick={() => scrollTo('sec-budget')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              02 Budget Matrix
            </button>
            <button
              onClick={() => scrollTo('sec-timeline')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              03 Roadmap
            </button>
            <button
              onClick={() => scrollTo('sec-vendors')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              04 Vendors
            </button>
            <button
              onClick={() => scrollTo('sec-studio')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              05 Creative &amp; AI
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenApiModal}
              className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-full border-2 border-black transition-all ${
                isGeminiActive
                  ? 'bg-[#97F8B7] text-black shadow-brutal hover:-translate-y-0.5'
                  : 'bg-white dark:bg-[#202229] dark:text-white shadow-brutal hover:-translate-y-0.5'
              }`}
              title="Dedicated Google Gemini AI Service"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span className="hidden md:inline">{isGeminiActive ? 'Gemini 3.5 Flash Live' : 'AI Engine'}</span>
              {isGeminiActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenTestModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-full bg-[#C7AEE8] text-black border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all"
              title="Automated Test Suite Verifier"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Tests ({testPassCount}/{totalTests})</span>
            </button>

            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              title="Toggle High Contrast"
              aria-label="Toggle High Contrast"
              className={`p-2.5 rounded-full border-2 border-black transition-all ${
                highContrast
                  ? 'bg-yellow-400 text-black shadow-brutal'
                  : 'bg-white dark:bg-[#202229] text-black dark:text-white shadow-brutal hover:-translate-y-0.5'
              }`}
            >
              <Contrast className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
              className="p-2.5 rounded-full border-2 border-black bg-white dark:bg-[#202229] text-black dark:text-white shadow-brutal hover:-translate-y-0.5 transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#FFE816]" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
});

Header.displayName = 'Header';
