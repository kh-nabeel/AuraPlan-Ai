import React from 'react';
import { X } from 'lucide-react';
import { DEFAULT_GEMINI_API_KEY, isGeminiKeyActive } from '../services/geminiService';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onSave: () => void;
  cardStyle: string;
  monoTag: string;
  mutedText: string;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = React.memo(({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  onSave,
  cardStyle,
  monoTag,
  mutedText
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className={`max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-5 ${cardStyle} shadow-brutal-lg`}>
        <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-4">
          <div>
            <span className={monoTag}>[ MODEL CONNECTIVITY ]</span>
            <h2 className="font-serif text-2xl font-bold mt-1">GenAI Engine Configuration</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full border-2 border-black bg-[#FAF8F5] dark:bg-zinc-800 text-black dark:text-white shadow-brutal-sm hover:-translate-y-0.5"
            aria-label="Close API Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className={`text-xs leading-relaxed ${mutedText}`}>
          AuraPlan AI is configured with a dedicated <strong>Google Gemini Free Tier</strong> API service (active model: <code>gemini-3.5-flash</code> with automated <code>gemini-3.5-flash-lite</code> failover). You can test or update the key below.
        </p>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Gemini API Key
          </label>
          <input
            type="password"
            placeholder="AQ... or AIzaSy... (Gemini API Key)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full text-xs font-mono rounded-xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm focus:outline-hidden focus:ring-2 focus:ring-[#C3FF16]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setApiKey(DEFAULT_GEMINI_API_KEY);
            }}
            className="text-xs font-bold underline text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all"
          >
            Reset to Default Key
          </button>
          <button
            type="button"
            onClick={onSave}
            className="bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-5 py-2.5 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
          >
            Save Preference
          </button>
        </div>
      </div>
    </div>
  );
});

ApiConfigModal.displayName = 'ApiConfigModal';
