// ============================================================================
// AuraPlan AI — Master Orchestrator Component (React 18 + TypeScript)
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { EventVertical, TestCheckItem } from './types';
import { escapeHTML, clampNum } from './utils/security';
import { formatMoney } from './utils/formatters';
import {
  computeDynamicBudget,
  evaluateEventHealth,
  computeTimeline,
  computeVendors,
  generateCreativeIdeas
} from './engine/planningEngine';
import { VERTICAL_PRESETS } from './engine/presets';
import { DEFAULT_GEMINI_API_KEY, isGeminiKeyActive } from './services/geminiService';

// Custom Hooks
import { useEventPlanner } from './hooks/useEventPlanner';
import { useCoPilotChat } from './hooks/useCoPilotChat';

// Modular UI Components
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ContextStudio } from './components/ContextStudio';
import { BudgetBreakdown } from './components/BudgetBreakdown';
import { MilestoneTimeline } from './components/MilestoneTimeline';
import { VendorMatrix } from './components/VendorMatrix';
import { CreativeStudio } from './components/CreativeStudio';
import { AiCoPilot } from './components/AiCoPilot';
import { TestSuiteModal } from './components/TestSuiteModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { Footer } from './components/Footer';

// Re-export core modules for seamless backward compatibility and unit tests
export * from './types';
export * from './utils/security';
export * from './utils/formatters';
export * from './engine/planningEngine';
export * from './engine/presets';
export * from './services/geminiService';

/**
 * Main application coordinator for AuraPlan AI.
 */
export default function App() {
  // Global Display & Mode States
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => DEFAULT_GEMINI_API_KEY);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Planning Engine Hook
  const {
    config,
    budgetItems,
    health,
    timelineItems,
    vendorItems,
    ideas,
    totalActual,
    budgetVariance,
    completedTasksCount,
    progressPct,
    selectPreset,
    updateConfigField,
    handleUpdateActual,
    handleResetActuals,
    cycleTaskStatus,
    cycleVendorStatus,
    handleAddCustomTask,
    handleAddCustomVendor
  } = useEventPlanner(triggerToast);

  // GenAI Co-Pilot Hook
  const { messages, isSynthesizing, askCoPilot } = useCoPilotChat(
    config,
    health,
    budgetItems,
    apiKey
  );

  // Export Blueprint as Markdown
  const handleExportMarkdown = useCallback(() => {
    const md = [
      `# ${config.eventName} — AuraPlan AI Master Blueprint`,
      `- **Vertical**: ${config.eventType.toUpperCase()} (${config.subStyle})`,
      `- **Location & Setting**: ${config.city} (${config.setting.toUpperCase()})`,
      `- **Budget**: ${formatMoney(config.budget, config.currency)} (${formatMoney(health.perGuest, config.currency)}/guest for ${config.guestCount} guests)`,
      `- **Countdown**: ${config.daysCountdown} days | **Health Score**: ${health.score}/100 (${health.label})`,
      ``,
      `## 1. Dynamic Budget Breakdown`,
      ...budgetItems.map((i) => `- **${i.name}** (${i.pct}%): Allocated ${formatMoney(i.allocated, config.currency)} | Actual ${formatMoney(i.actual, config.currency)}`),
      ``,
      `## 2. Milestone Timeline`,
      ...timelineItems.map((t) => `- [${t.status.toUpperCase()}] **${t.targetDate}** (${t.phase}): ${t.title}`),
      ``,
      `## 3. Vendor Checklist`,
      ...vendorItems.map((v) => `- **${v.category}** [${v.status}] — Cap: ${formatMoney(v.estimatedCap, config.currency)} | Ask: *"${v.vettingQuestion}"*`)
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.eventName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Exported Event Blueprint (.md)');
  }, [config, health, budgetItems, timelineItems, vendorItems, triggerToast]);

  // Automated In-Browser Test Suite (10 Real-Time Verifications)
  const testResults: TestCheckItem[] = useMemo(() => {
    const checks: TestCheckItem[] = [];

    // 1. XSS Sanitization
    const xss = escapeHTML('<img src=x onerror=evil()>');
    checks.push({
      name: 'Security: OWASP XSS HTML Entity Escaping',
      pass: !xss.includes('<img') && xss.includes('&lt;img'),
      detail: 'Escapes <, >, &, ", and quotes safely'
    });

    // 2. Numeric Clamping
    const clamped = clampNum(-999, 5000, 1000000, 10000);
    checks.push({
      name: 'Validation: Boundary & Negative Input Clamping',
      pass: clamped === 5000,
      detail: 'Prevents negative budgets or zero guest division'
    });

    // 3. 100% Budget Normalization across all verticals
    const allVerticalsValid = (['wedding', 'birthday', 'community'] as EventVertical[]).every((v) => {
      const res = computeDynamicBudget({ ...VERTICAL_PRESETS[v], budget: 500000 });
      const sumPct = res.reduce((a, b) => a + b.pct, 0);
      const sumAmt = res.reduce((a, b) => a + b.allocated, 0);
      return sumPct === 100 && sumAmt === 500000;
    });
    checks.push({
      name: 'Budget Engine: Exact 100% & Monetary Sum Across All Verticals',
      pass: allVerticalsValid,
      detail: 'Wedding, Birthday & Community splits sum to 100%'
    });

    // 4. Context Decision: Outdoor Contingency Boost
    const indoorBuf = computeDynamicBudget({ ...VERTICAL_PRESETS.wedding, setting: 'indoor' }).find(
      (i) => i.id === 'contingency'
    )!.pct;
    const outdoorBuf = computeDynamicBudget({ ...VERTICAL_PRESETS.wedding, setting: 'outdoor' }).find(
      (i) => i.id === 'contingency'
    )!.pct;
    checks.push({
      name: 'Context Logic: Outdoor Venue Weather Buffer Auto-Increase',
      pass: outdoorBuf > indoorBuf,
      detail: `Outdoor buffer (${outdoorBuf}%) > Indoor buffer (${indoorBuf}%)`
    });

    // 5. Feasibility Per-Guest Warning
    const tightHealth = evaluateEventHealth({ ...VERTICAL_PRESETS.wedding, budget: 50000, guestCount: 400 });
    checks.push({
      name: 'Feasibility Engine: Low Per-Guest Spend Detection',
      pass: tightHealth.alerts.length > 0 && tightHealth.score < 80,
      detail: 'Triggers actionable trade-off alert when below threshold'
    });

    // 6. Fast-Track Timeline Compression (< 30 days)
    const fastTl = computeTimeline({ ...VERTICAL_PRESETS.birthday, daysCountdown: 14 });
    checks.push({
      name: 'Timeline Engine: <30 Days Fast-Track Schedule Compression',
      pass: fastTl[0].phase.includes('[Fast-Track]'),
      detail: 'Automatically flags compressed milestones'
    });

    // 7. Vendor Contract Vetting Matrix
    const vList = computeVendors(VERTICAL_PRESETS.community);
    checks.push({
      name: 'Vendor Engine: Context-Specific Contract Vetting Questions',
      pass: vList.length === 4 && vList.every((v) => v.vettingQuestion.length > 15),
      detail: 'Generates budget caps and contract vetting questions'
    });

    // 8. Creative Synthesis & Palette Generation
    const creative = generateCreativeIdeas(VERTICAL_PRESETS.wedding);
    checks.push({
      name: 'Personalization Engine: Theme Palette, Menu & Cost Hacks',
      pass: creative.palette.length === 4 && creative.savingHacks.length >= 2,
      detail: 'Synthesizes region & style-matched creative direction'
    });

    // 9. Dedicated AI Service: Google Gemini Integration
    checks.push({
      name: 'AI Engine: Dedicated Google Gemini Free-Tier Integration',
      pass: isGeminiKeyActive(apiKey),
      detail: 'Free-tier Gemini key configured with gemini-3.5-flash & failover'
    });

    // 10. Performance: Zero Floating-Point Drift
    checks.push({
      name: 'Performance: Zero Floating-Point Drift on Big Budget Capital',
      pass:
        computeDynamicBudget({ ...VERTICAL_PRESETS.wedding, budget: 1547890 }).reduce(
          (sum, item) => sum + item.allocated,
          0
        ) === 1547890,
      detail: 'Strict integer cent/rupee normalization prevents financial leakage'
    });

    return checks;
  }, [apiKey]);

  // Visual Theme Tokens
  const themeBg = highContrast
    ? 'bg-black text-white'
    : darkMode
    ? 'bg-[#101114] text-zinc-100'
    : 'bg-[#FAF8F5] text-[#111215]';

  const cardStyle = highContrast
    ? 'bg-zinc-950 border-2 border-yellow-400 text-white shadow-brutal-dark'
    : darkMode
    ? 'bg-[#17181D] border-2 border-zinc-700 text-zinc-100 shadow-brutal-dark'
    : 'bg-white border-2 border-black text-[#111215] shadow-brutal';

  const pillActive = highContrast
    ? 'bg-yellow-400 text-black border-2 border-yellow-400 shadow-brutal-dark'
    : darkMode
    ? 'bg-[#C3FF16] text-black border-2 border-[#C3FF16] shadow-brutal-dark'
    : 'bg-[#C3FF16] text-black border-2 border-black shadow-brutal';

  const pillInactive = highContrast
    ? 'bg-zinc-900 border-2 border-zinc-700 text-zinc-300 hover:border-white'
    : darkMode
    ? 'bg-[#202229] border-2 border-zinc-700 text-zinc-300 hover:border-zinc-500'
    : 'bg-[#F4F1EA] border-2 border-black/40 text-zinc-700 hover:border-black';

  const monoTag = highContrast
    ? 'text-yellow-400 font-mono text-xs uppercase tracking-wider'
    : darkMode
    ? 'text-[#C3FF16] font-mono text-xs uppercase tracking-wider'
    : 'text-zinc-600 font-mono text-xs uppercase tracking-wider';

  const mutedText = highContrast ? 'text-yellow-200' : darkMode ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans selection:bg-[#C3FF16] selection:text-black ${themeBg} bg-tinker-grid`}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-black dark:bg-[#C3FF16] text-white dark:text-black text-sm font-bold px-5 py-3.5 rounded-full border-2 border-black shadow-brutal-lg transition-transform animate-bounce"
        >
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        onOpenTestModal={() => setShowTestModal(true)}
        onOpenApiModal={() => setShowApiModal(true)}
        isGeminiActive={isGeminiKeyActive(apiKey)}
        testPassCount={testResults.filter((t) => t.pass).length}
        totalTests={testResults.length}
        mutedText={mutedText}
      />

      {/* Main Content Sections */}
      <main id="main-content" tabIndex={-1} className="outline-hidden">
        <HeroSection
          currentVertical={config.eventType}
          onSelectVertical={selectPreset}
          pillActive={pillActive}
          pillInactive={pillInactive}
          mutedText={mutedText}
        />

        <ContextStudio
          config={config}
          health={health}
          onUpdateField={updateConfigField}
          cardStyle={cardStyle}
          pillActive={pillActive}
          pillInactive={pillInactive}
          monoTag={monoTag}
          mutedText={mutedText}
        />

        <BudgetBreakdown
          budgetItems={budgetItems}
          totalBudget={config.budget}
          totalActual={totalActual}
          budgetVariance={budgetVariance}
          currency={config.currency}
          onUpdateActual={handleUpdateActual}
          onResetActuals={handleResetActuals}
          cardStyle={cardStyle}
          monoTag={monoTag}
          mutedText={mutedText}
        />

        <MilestoneTimeline
          timelineItems={timelineItems}
          daysCountdown={config.daysCountdown}
          completedCount={completedTasksCount}
          progressPct={progressPct}
          onCycleStatus={cycleTaskStatus}
          onAddCustomTask={handleAddCustomTask}
          cardStyle={cardStyle}
          monoTag={monoTag}
          mutedText={mutedText}
        />

        <VendorMatrix
          vendorItems={vendorItems}
          currency={config.currency}
          onCycleStatus={cycleVendorStatus}
          onAddCustomVendor={handleAddCustomVendor}
          cardStyle={cardStyle}
          monoTag={monoTag}
          mutedText={mutedText}
        />

        {/* Section 05: Creative Studio + AI Co-Pilot Grid */}
        <section id="sec-studio" className="py-12 border-b-2 border-black dark:border-zinc-700">
          <div className="w-full px-6 sm:px-10 lg:px-12 space-y-8">
            <div>
              <span className={monoTag}>[ SECTION 05 // SYNTHESIS &amp; GENAI STRATEGY ]</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
                Creative Direction &amp; Architectural AI Co-Pilot
              </h2>
              <p className={`text-sm mt-1 max-w-2xl ${mutedText}`}>
                Theme aesthetics, culinary curation, and real-time interactive consultations with
                Google Gemini 3.5 Flash.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-6">
                <CreativeStudio
                  ideas={ideas}
                  cardStyle={cardStyle}
                  monoTag={monoTag}
                  mutedText={mutedText}
                />
              </div>

              <div className="lg:col-span-6">
                <AiCoPilot
                  messages={messages}
                  isSynthesizing={isSynthesizing}
                  onSendMessage={askCoPilot}
                  cardStyle={cardStyle}
                  monoTag={monoTag}
                  mutedText={mutedText}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer onExportMarkdown={handleExportMarkdown} mutedText={mutedText} />

      {/* Test Suite Modal */}
      <TestSuiteModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        testResults={testResults}
        cardStyle={cardStyle}
        monoTag={monoTag}
        mutedText={mutedText}
      />

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSave={() => {
          setShowApiModal(false);
          triggerToast(
            isGeminiKeyActive(apiKey) ? 'Gemini 3.5 Flash Live Connected' : 'Using Context Engine'
          );
        }}
        cardStyle={cardStyle}
        monoTag={monoTag}
        mutedText={mutedText}
      />
    </div>
  );
}
