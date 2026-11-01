# Prompt Engineering Architecture & Methodology (`PROMPTS.md`)

This document details how **AuraPlan AI** structures context-grounded prompts for Weddings, Birthdays, and Community Events in the **Hack2skill Prompt Wars** challenge.

---

## 1. Dynamic Context Injection Pattern

Rather than sending vague, ungrounded queries to an LLM (e.g., *"Plan a wedding for me"*), `GenAIService.buildStructuredPrompt(config)` compiles a deterministic **Context Frame** before every generation:

```text
ROLE: You are AuraPlan AI, an expert senior event architect and financial planner.
EVENT CONTEXT:
- Event Name: {eventName}
- Vertical: {eventType} (Style: {subStyle})
- Location & Setting: {city} ({setting})
- Target Date: {eventDate} ({daysRemaining} days remaining)
- Total Budget: {currency} {budget} ({currency} {perGuestTotal} per guest for {guestCount} guests)
- Priority Focus: {priority}
- Dietary & Inclusivity: {dietaryNotes} | Wheelchair/Accessibility Required: {accessibilityRequired}

TASK INSTRUCTIONS:
1. Validate whether the per-guest allocation is realistic for the city and setting; flag any deficit and propose 3 concrete trade-offs.
2. Provide an itemized percentage and monetary budget split across 7 core categories.
3. Generate a backwards milestone timeline anchored to the exact days remaining.
4. List top 5 vendor categories with booking lead times and specific contract vetting questions.
5. Suggest bespoke theme, decor, menu, and sustainability ideas tailored to the cultural/regional context.
```

---

## 2. Specialized Task Prompts Used in the Co-Pilot

### A. 15% Budget Reduction Without Guest Experience Loss
- **Trigger**: User asks to cut costs or optimize budget.
- **Logic**: Identifies the top 2 highest-weight categories (`budgetItems[0]` and `budgetItems[1]`), calculates exact 15% target savings (`budget * 0.15`), and recommends high-leverage structural savings (bundling venue + basic AV/lighting, trimming buffet sprawl to 2 live counters, and concentrating 75% of decor on the main focal stage).

### B. Vendor Negotiation & Quote Request Email Generator
- **Trigger**: User asks to draft a vendor outreach or negotiation email.
- **Logic**: Automatically sets the target quote ceiling to **90% of the category's allocated budget** (preserving a 10% negotiation buffer) and injects exact guest headcount, date, dietary constraints, and weather/cancellation clause requests.

### C. Outdoor Weather & Risk Contingency Protocol
- **Trigger**: User asks about rain, weather, or backup plans.
- **Logic**: References the exact monetary reserve in `Emergency & Weather Buffer` and specifies a 48-hour precipitation trigger, clear-span marquee tenting, raised flooring, and 62.5 kVA silent generator backup.
