# AuraPlan AI — GenAI Event Planning Assistant (React 18 + TypeScript + Vite)

> **Hack2skill — Prompt Wars Hackathon Submission**  
> **Tech Stack**: React 18 • TypeScript 5 • Tailwind CSS 3 • Recharts • Lucide Icons • Vite • Vitest

---

## 1. Tech Stack & Architecture

- **Frontend Framework**: **React 18** with **TypeScript** (`strict` typing across all event, budget, timeline, and vendor models)
- **Styling & Design System**: **Tailwind CSS** with modern responsive cards, interactive range sliders, Dark Mode, and WCAG High-Contrast Mode
- **Data Visualization**: **Recharts** (`PieChart` Donut allocation & `BarChart` AI Target vs. Live Quote simulator)
- **Iconography**: **Lucide React**
- **Build & Test Tooling**: **Vite** (instant HMR & optimized bundle) + **Vitest** (unit test runner)
- **GenAI Architecture**: Dual-mode **Context-Grounded Engine** (works out-of-the-box with zero API key setup + optional live **Google Gemini 2.5 Flash** API key integration held strictly in session memory)

---

## 2. Chosen Vertical & Problem Statement Alignment

**Vertical**: **Multi-Vertical Event Planning Assistant (Weddings, Birthdays & Community Events)**

1. **Interactive Context Sliders**: Real-time sliders for **Total Budget**, **Guest Count**, and **Countdown Days**, plus one-click pills for **Venue Setting** (`Indoor`, `Outdoor`, `Hybrid`) and **Optimization Mode** (`Balanced`, `Cost-Saver`, `Luxury`, `Zero-Waste`).
2. **Smart Budget & Live Quote Simulator**: Automatically shifts +3% to the **Weather & Emergency Buffer** for outdoor/hybrid venues and lets users drag per-category sliders to simulate vendor quotes and watch surplus/deficit update live.
3. **Date-Anchored Milestone Timeline**: Computes exact target dates backwards from the countdown window, automatically activating **`[Fast-Track]`** mode when fewer than 30 days remain.
4. **Vendor Checklist & Contract Vetting Matrix**: Tracks vendor booking statuses (`Pending` → `Shortlisted` → `Contacted` → `Booked`) alongside tailored contract vetting questions.
5. **Personalized GenAI Idea Studio & Chat Co-Pilot**: Synthesizes color palettes, decor styling, menu concepts, cost-saving hacks, vendor negotiation emails, and rain-backup protocols.

---

## 3. Evaluation Criteria Alignment

- **Code Quality (High Impact)**: Clean TypeScript interfaces (`EventConfig`, `BudgetCategory`, `MilestoneItem`, `VendorItem`), pure deterministic calculation functions, and modular component structure.
- **Problem Statement Alignment (High Impact)**: Complete end-to-end coverage of Weddings, Birthdays, and Community Events with budgets, timelines, vendor checklists, and personalized ideas.
- **Efficiency (Medium Impact)**: Memoized React computations (`useMemo`) prevent unnecessary re-renders; repository source footprint is **< 60 KB** (strictly under the **10 MB** hackathon limit).
- **Security (Low Impact)**: OWASP-compliant `escapeHTML` and `sanitizeText` utilities prevent XSS injection; numeric clamping prevents negative/overflow inputs; optional Gemini API keys stay strictly in ephemeral RAM.
- **Testing (Low Impact)**: Includes both a **Vitest** automated test suite (`npm test`) and an in-app **Tests (8/8)** modal verifier.
- **Accessibility (Low Impact)**: WCAG 2.1 AA compliant with ARIA labels, keyboard navigation (`Enter`/`Space` on milestone cards), Dark Mode, and a dedicated **High-Contrast Mode** toggle.

---

## 4. Quick Start & GitHub Submission Commands

```bash
# 1. Install dependencies & start dev server
npm install
npm run dev

# 2. Run automated unit tests
npm test

# 3. Push to your single-branch public GitHub repository (keep node_modules ignored via .gitignore!)
git init -b main
git add .
git commit -m "feat: AuraPlan AI event planning assistant (React + TypeScript + Vite)"
git remote add origin https://github.com/<your-username>/<your-public-repo>.git
git push -u origin main
```
