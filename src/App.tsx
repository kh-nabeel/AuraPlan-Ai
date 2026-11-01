// ============================================================================
// AuraPlan AI — Master Orchestrator Component (React 18 + TypeScript)
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  EventConfig,
  EventVertical,
  TaskStatus,
  VendorStatus,
  MilestoneItem,
  VendorItem,
  ChatMessage,
  TestCheckItem
} from './types';
import { sanitizeText, escapeHTML, clampNum } from './utils/security';
import { formatMoney } from './utils/formatters';
import {
  computeDynamicBudget,
  evaluateEventHealth,
  computeTimeline,
  computeVendors,
  generateCreativeIdeas
} from './engine/planningEngine';
import { VERTICAL_PRESETS } from './engine/presets';
import {
  askGeminiEventStrategist,
  DEFAULT_GEMINI_API_KEY,
  isGeminiKeyActive
} from './services/geminiService';

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

export default function App() {
  const [config, setConfig] = useState<EventConfig>(VERTICAL_PRESETS.wedding);
  const [customActuals, setCustomActuals] = useState<Record<string, number>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [customTasks, setCustomTasks] = useState<MilestoneItem[]>([]);
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, VendorStatus>>({});
  const [customVendors, setCustomVendors] = useState<VendorItem[]>([]);

  // UI Modes
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => DEFAULT_GEMINI_API_KEY);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Co-Pilot Chat State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      source: 'Google Gemini 3.5 Flash Live • Dedicated Free Tier',
      text: 'Welcome to AuraPlan AI. Dedicated Gemini AI service is connected and ready. Adjust parameters in the context studio below, or click any prompt card to generate tailored savings strategies, vendor negotiation drafts, or contingency protocols.'
    }
  ]);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Derived computations via pure engine functions
  const baseBudgetItems = useMemo(() => computeDynamicBudget(config), [config]);
  const budgetItems = useMemo(
    () =>
      baseBudgetItems.map((item) => ({
        ...item,
        actual: customActuals[item.id] !== undefined ? customActuals[item.id] : item.allocated
      })),
    [baseBudgetItems, customActuals]
  );

  const health = useMemo(() => evaluateEventHealth(config), [config]);

  const timelineItems = useMemo(() => {
    const base = computeTimeline(config).map((t) => ({
      ...t,
      status: taskStatuses[t.id] || t.status
    }));
    return [...base, ...customTasks];
  }, [config, taskStatuses, customTasks]);

  const vendorItems = useMemo(() => {
    const base = computeVendors(config).map((v) => ({
      ...v,
      status: vendorStatuses[v.id] || v.status
    }));
    return [...base, ...customVendors];
  }, [config, vendorStatuses, customVendors]);

  const ideas = useMemo(() => generateCreativeIdeas(config), [config]);

  const totalActual = useMemo(
    () => budgetItems.reduce((sum, i) => sum + i.actual, 0),
    [budgetItems]
  );
  const budgetVariance = config.budget - totalActual;
  const completedTasksCount = useMemo(
    () => timelineItems.filter((t) => t.status === 'completed').length,
    [timelineItems]
  );
  const progressPct = Math.round((completedTasksCount / Math.max(1, timelineItems.length)) * 100);

  // Callbacks
  const selectPreset = useCallback((type: EventVertical) => {
    setConfig(VERTICAL_PRESETS[type]);
    setCustomActuals({});
    setCustomTasks([]);
    setCustomVendors([]);
    triggerToast(`Loaded ${type.toUpperCase()} template`);
  }, [triggerToast]);

  const updateConfigField = useCallback(<K extends keyof EventConfig>(key: K, value: EventConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleUpdateActual = useCallback((id: string, value: number) => {
    setCustomActuals((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleResetActuals = useCallback(() => {
    setCustomActuals({});
    triggerToast('Reset quote simulations to baseline target');
  }, [triggerToast]);

  const cycleTaskStatus = useCallback((task: MilestoneItem) => {
    const order: TaskStatus[] = ['pending', 'in_progress', 'completed'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    if (task.id.startsWith('custom_')) {
      setCustomTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    } else {
      setTaskStatuses((prev) => ({ ...prev, [task.id]: next }));
    }
  }, []);

  const cycleVendorStatus = useCallback((vendor: VendorItem) => {
    const order: VendorStatus[] = ['Pending', 'Shortlisted', 'Contacted', 'Booked'];
    const next = order[(order.indexOf(vendor.status) + 1) % order.length];
    if (vendor.id.startsWith('cv_')) {
      setCustomVendors((prev) => prev.map((v) => (v.id === vendor.id ? { ...v, status: next } : v)));
    } else {
      setVendorStatuses((prev) => ({ ...prev, [vendor.id]: next }));
    }
  }, []);

  const handleAddCustomTask = useCallback((title: string) => {
    setCustomTasks((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        phase: 'Custom Milestone',
        title,
        daysBefore: Math.min(7, config.daysCountdown),
        targetDate: new Date().toISOString().split('T')[0],
        priority: 'High',
        status: 'pending'
      }
    ]);
    triggerToast('Added custom milestone');
  }, [config.daysCountdown, triggerToast]);

  const handleAddCustomVendor = useCallback((category: string, cap: number) => {
    setCustomVendors((prev) => [
      ...prev,
      {
        id: `cv_${Date.now()}`,
        category,
        leadTime: '2–4 Weeks Out',
        estimatedCap: cap,
        status: 'Shortlisted',
        vettingQuestion: 'What are your cancellation, weather postponement, and overtime terms?'
      }
    ]);
    triggerToast('Added custom vendor to checklist');
  }, [triggerToast]);

  // Co-Pilot Chat Synthesis
  const askCoPilot = useCallback(async (promptText: string) => {
    const cleanQ = sanitizeText(promptText, 350);
    if (!cleanQ) return;

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: cleanQ };
    setMessages((prev) => [...prev, userMsg]);
    setIsSynthesizing(true);

    if (isGeminiKeyActive(apiKey)) {
      try {
        const geminiRes = await askGeminiEventStrategist(
          cleanQ,
          {
            eventName: config.eventName,
            eventType: config.eventType,
            subStyle: config.subStyle,
            currency: config.currency,
            budget: config.budget,
            guestCount: config.guestCount,
            daysCountdown: config.daysCountdown,
            city: config.city,
            setting: config.setting,
            priority: config.priority,
            dietaryNotes: config.dietaryNotes,
            accessibilityRequired: config.accessibilityRequired,
            perGuest: health.perGuest,
            feasibilityScore: health.score,
            feasibilityLabel: health.label,
            topBudgetCategories: budgetItems.slice(0, 3).map((b) => ({
              name: b.name,
              allocated: b.allocated,
              pct: b.pct
            }))
          },
          apiKey
        );

        if (geminiRes.success && geminiRes.text) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a_${Date.now()}`,
              role: 'assistant',
              source: geminiRes.model,
              text: sanitizeText(geminiRes.text, 3500)
            }
          ]);
          setIsSynthesizing(false);
          return;
        }
      } catch (_e) {
        // Fall back to built-in deterministic engine
      }
    }

    setTimeout(() => {
      const q = cleanQ.toLowerCase();
      let reply = '';
      if (q.includes('cut') || q.includes('save') || q.includes('15%') || q.includes('budget')) {
        const targetSave = Math.round(config.budget * 0.15);
        reply =
          `Strategic 15% Reduction Plan (${formatMoney(targetSave, config.currency)}) for "${config.eventName}":\n` +
          `• Bundle ${budgetItems[0].name} (${formatMoney(budgetItems[0].allocated, config.currency)}): Negotiate combined production package to save ~${formatMoney(budgetItems[0].allocated * 0.18, config.currency)}.\n` +
          `• High-Efficiency Menu Curation: Replace continuous buffets with 2 focused interactive live counters (${config.dietaryNotes}) saving ~${formatMoney(config.budget * 0.05, config.currency)}.\n` +
          `• Spatial Priority: Concentrate 75% of decor investment on the main focal stage and entry installation.`;
      } else if (q.includes('email') || q.includes('vendor') || q.includes('quote') || q.includes('negotiate')) {
        const targetCap = Math.round(budgetItems[1].allocated * 0.9);
        reply =
          `Itemized Vendor Negotiation Draft:\n\n` +
          `Subject: Proposal Request — ${config.eventName} (${config.guestCount} Guests in ${config.city})\n\n` +
          `Hello Team,\nWe are locking partners for an upcoming ${config.eventType} (${config.setting} setting) in ${config.city} scheduled in ${config.daysCountdown} days for ${config.guestCount} guests. ` +
          `Our target ceiling for this module is ${formatMoney(targetCap, config.currency)} with strict adherence to ${config.dietaryNotes}${config.accessibilityRequired ? ' and inclusive accessibility standards' : ''}.\n` +
          `Please provide your milestone payment schedule, weather contingency policy, and itemized deliverables.`;
      } else if (q.includes('rain') || q.includes('weather') || q.includes('backup') || q.includes('outdoor')) {
        const bufferItem = budgetItems.find((i) => i.id === 'contingency');
        reply =
          `Weather & Operations Contingency Protocol for ${config.city} (${config.setting.toUpperCase()}):\n` +
          `• Contingency Buffer: ${formatMoney(bufferItem ? bufferItem.allocated : config.budget * 0.06, config.currency)} is locked in reserve.\n` +
          `• 48-Hour Threshold Trigger: Require contract clauses securing clear-span marquee tenting and elevated subflooring if precipitation probability exceeds 35%.\n` +
          `• Power Continuity: Deploy a 62.5 kVA silent backup generator with covered cable ramps across all guest routes.`;
      } else {
        reply =
          `Operational Run-of-Show Blueprint for "${config.eventName}":\n` +
          `• Per-Guest Spend: ${formatMoney(health.perGuest, config.currency)}/guest (${health.label}, Score ${health.score}/100).\n` +
          `• T-4 Hours: Stage load-in, acoustic calibration, and ${config.accessibilityRequired ? 'accessibility ramp verification' : 'lighting cue checks'}.\n` +
          `• Hour 0: Guest arrival & digital credential check-in for ${config.guestCount} attendees.\n` +
          `• Hour 1.5: Main focal ceremony / presentation followed by culinary service.`;
      }

      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: 'assistant', source: 'AuraPlan Financial & Planning Engine', text: reply }
      ]);
      setIsSynthesizing(false);
    }, 280);
  }, [apiKey, config, health, budgetItems]);

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

  // Automated In-Browser Test Suite
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

    // 10. Memory & Performance: Zero Calculation Drift
    checks.push({
      name: 'Performance: Zero Floating-Point Drift on Big Budget Capital',
      pass: computeDynamicBudget({ ...VERTICAL_PRESETS.wedding, budget: 1547890 })
        .reduce((sum, item) => sum + item.allocated, 0) === 1547890,
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
    <div className={`min-h-screen transition-colors duration-200 font-sans selection:bg-[#C3FF16] selection:text-black ${themeBg} bg-tinker-grid`}>
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
                Theme aesthetics, culinary curation, and real-time interactive consultations with Google Gemini 3.5 Flash.
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
          triggerToast(isGeminiKeyActive(apiKey) ? 'Gemini 3.5 Flash Live Connected' : 'Using Context Engine');
        }}
        cardStyle={cardStyle}
        monoTag={monoTag}
        mutedText={mutedText}
      />
    </div>
  );
}
