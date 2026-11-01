import React from 'react';
import { TestCheckItem } from '../types';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  testResults: TestCheckItem[];
  cardStyle: string;
  monoTag: string;
  mutedText: string;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = React.memo(({
  isOpen,
  onClose,
  testResults,
  cardStyle,
  monoTag,
  mutedText
}) => {
  if (!isOpen) return null;

  const passedCount = testResults.filter((t) => t.pass).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className={`max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${cardStyle} shadow-brutal-lg`}>
        <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-4">
          <div>
            <span className={monoTag}>[ AUTOMATED TEST VERIFIER ]</span>
            <h2 className="font-serif text-2xl font-bold mt-1">
              Test Suite Verification ({passedCount}/{testResults.length} Passing)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full border-2 border-black bg-[#FAF8F5] dark:bg-zinc-800 text-black dark:text-white shadow-brutal-sm hover:-translate-y-0.5"
            aria-label="Close Test Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className={`text-xs ${mutedText}`}>
          All critical security, mathematical normalization, schedule compression, and Gemini AI integration unit tests run live in-browser.
        </p>

        <div className="space-y-3">
          {testResults.map((t, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] flex items-start gap-3 shadow-brutal-sm"
            >
              {t.pass ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-black dark:text-white">
                  {t.name}
                </div>
                <div className="font-mono text-[11px] text-zinc-500 mt-0.5">
                  {t.detail}
                </div>
              </div>
              <span
                className={`font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  t.pass
                    ? 'bg-[#97F8B7] text-black'
                    : 'bg-red-200 text-red-900'
                }`}
              >
                {t.pass ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

TestSuiteModal.displayName = 'TestSuiteModal';
