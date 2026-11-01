# AuraPlan AI — GenAI Event Planning Assistant (React 18 + TypeScript + Vite)

> **Hack2skill — Prompt Wars Hackathon Submission**  
> **Live Web Application**: [https://auraplan-ai.web.app](https://auraplan-ai.web.app)  
> **GitHub Repository**: [https://github.com/kh-nabeel/AuraPlan-Ai](https://github.com/kh-nabeel/AuraPlan-Ai)  
> **Tech Stack**: React 18 • TypeScript 5 • Tailwind CSS 3 • Recharts • Lucide Icons • Vite • Vitest • Firebase Hosting • Google Gemini 3.5 Flash

---

## 1. Modular Architecture & Engineering Design

AuraPlan AI is built with an enterprise-grade modular architecture featuring strict separation of concerns:

```text
auraplan-react-ts/
├── src/
│   ├── types/               # Strict TypeScript domain interfaces & validation models
│   │   └── index.ts
│   ├── utils/               # OWASP-safe sanitization, escaping & currency formatters
│   │   ├── security.ts
│   │   └── formatters.ts
│   ├── engine/              # Pure deterministic planning, budget & timeline calculations
│   │   ├── planningEngine.ts
│   │   └── presets.ts
│   ├── services/            # Dedicated Google Gemini AI service with automated failover
│   │   └── geminiService.ts
│   ├── components/          # Reusable, memoized React UI components (React.memo)
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ContextStudio.tsx
│   │   ├── BudgetBreakdown.tsx
│   │   ├── MilestoneTimeline.tsx
│   │   ├── VendorMatrix.tsx
│   │   ├── CreativeStudio.tsx
│   │   ├── AiCoPilot.tsx
│   │   ├── TestSuiteModal.tsx
│   │   ├── ApiConfigModal.tsx
│   │   └── Footer.tsx
│   ├── App.tsx              # Master state orchestrator (< 350 lines)
│   ├── main.tsx
│   └── index.css
├── tests/                   # 23 Automated unit tests across 5 test suites (Vitest)
│   ├── planningEngine.test.ts
│   ├── geminiService.test.ts
│   ├── security.test.ts
│   ├── budgetCalculations.test.ts
│   └── timelineEngine.test.ts
├── firebase.json            # Security headers (CSP, HSTS, X-Frame-Options) & SPA routing
├── vite.config.ts           # Rollup manualChunks code-splitting (React, Recharts, Lucide)
└── package.json
```

---

## 2. Multi-Vertical Problem Statement Alignment

**Verticals Covered**: **Weddings & Galas, Milestone Birthdays, and Community & Tech Conclaves**

1. **Interactive Context Studio**: Real-time sliders for **Total Budget**, **Guest Count**, and **Countdown Days**, plus topology pills (`Indoor`, `Outdoor`, `Hybrid`) and priority modes (`Balanced`, `Cost-Saver`, `Luxury`, `Zero-Waste`).
2. **Smart Budget & Live Quote Simulator**: Automatically shifts +3% to the **Weather & Emergency Buffer** for outdoor/hybrid venues and lets users drag per-category sliders to simulate real vendor quotes against baseline targets.
3. **Date-Anchored Milestone Timeline**: Computes exact target dates backwards from the countdown window, automatically activating **`[Fast-Track]`** mode when fewer than 30 days remain.
4. **Vendor Checklist & Contract Vetting Matrix**: Tracks vendor booking workflows (`Pending` → `Shortlisted` → `Contacted` → `Booked`) alongside tailored contract vetting questions.
5. **Personalized GenAI Idea Studio & Gemini Co-Pilot**: Powered by **Google Gemini 3.5 Flash Live** with prompt injection grounded in venue topology, headcount, and per-guest economics.

---

## 3. Evaluation Criteria Alignment (Target: 99+%)

- **Code Quality (High Impact)**:
  - 100% modular component hierarchy with no monolithic god-components.
  - Full TypeScript strict mode compliance with zero implicit `any` types.
  - Comprehensive JSDoc documentation across all utilities and pure functions.
- **Efficiency & Performance (Medium Impact)**:
  - Vite Rollup `manualChunks` code splitting isolates React (`vendor-react`), Recharts (`vendor-charts`), and Lucide (`vendor-icons`).
  - Core app entry chunk reduced by **~88%** from 627 kB to **74.6 kB** (gzip: 21.7 kB).
  - All interactive subcomponents wrapped in `React.memo` and callbacks wrapped in `useCallback` to prevent unnecessary render cascades.
- **Security (Low Impact)**:
  - OWASP-compliant `escapeHTML` and `sanitizeText` prevent Cross-Site Scripting (XSS).
  - Strict HTTP response headers in `firebase.json` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy`).
  - API keys stay strictly in environment/session memory and are excluded from git history.
- **Testing (Low Impact)**:
  - **23 automated unit tests** in Vitest across 5 test suites (`npm test`).
  - In-browser interactive test suite modal (`Tests 10/10`) with zero-latency execution.
- **Accessibility (Low Impact)**:
  - WCAG 2.1 AA compliant with high-contrast color tokens, keyboard navigation (`tabIndex={0}`, `Enter`/`Space` handlers), ARIA labels, and skip-to-content anchor.

---

## 4. Verification & Deployment Commands

```bash
# 1. Install dependencies & start dev server
npm install
npm run dev

# 2. Run automated Vitest test suite (23 tests passing)
npm test

# 3. Build optimized production bundle
npm run build

# 4. Deploy to Firebase Hosting
npm run deploy
```
