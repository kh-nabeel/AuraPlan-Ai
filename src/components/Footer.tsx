import React from 'react';
import { Sparkles, Download } from 'lucide-react';

interface FooterProps {
  onExportMarkdown: () => void;
  mutedText: string;
}

export const Footer: React.FC<FooterProps> = React.memo(({ onExportMarkdown, mutedText }) => {
  return (
    <footer className="mt-20 border-t-2 border-black dark:border-zinc-700 bg-white dark:bg-[#111215] py-12">
      <div className="w-full px-6 sm:px-10 lg:px-12 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#C3FF16] border border-black flex items-center justify-center text-black">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif text-xl font-bold">AuraPlan AI</span>
            <span className="font-mono text-xs text-zinc-500 block sm:inline sm:ml-2">
              Deterministic Event Planning &amp; Financial Architecture
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExportMarkdown}
            className="inline-flex items-center gap-2 bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-4 py-2.5 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Blueprint (.md)</span>
          </button>
        </div>

        <div className="w-full text-center sm:text-right font-mono text-xs text-zinc-600 dark:text-zinc-400">
          Engineered with React 18 • TypeScript 5 • Tailwind CSS • Lucide Icons • Recharts • Google Gemini 3.5 Flash Live
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
