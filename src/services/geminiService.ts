// ============================================================================
// AuraPlan AI — Dedicated Google Gemini AI Service
// ============================================================================

export interface GeminiEventContext {
  eventName: string;
  eventType: string;
  subStyle: string;
  currency: string;
  budget: number;
  guestCount: number;
  daysCountdown: number;
  city: string;
  setting: string;
  priority: string;
  dietaryNotes: string;
  accessibilityRequired: boolean;
  perGuest: number;
  feasibilityScore: number;
  feasibilityLabel: string;
  topBudgetCategories: Array<{ name: string; allocated: number; pct: number }>;
}

export interface GeminiResponse {
  success: boolean;
  text: string;
  model: string;
  error?: string;
}

// Configured Free-tier API key & fallback models (injected via .env or runtime)
export const DEFAULT_GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string) || '';

export const PRIMARY_MODEL =
  (import.meta.env.VITE_GEMINI_PRIMARY_MODEL as string) || 'gemini-3.5-flash';

export const FALLBACK_MODEL =
  (import.meta.env.VITE_GEMINI_FALLBACK_MODEL as string) || 'gemini-3.5-flash-lite';

/**
 * Validates if a key is present and formatted
 */
export function isGeminiKeyActive(customKey?: string): boolean {
  const k = (customKey !== undefined ? customKey : DEFAULT_GEMINI_API_KEY || '').trim();
  return k.length > 15;
}

/**
 * Builds the structured Context Frame as specified in Hackathon Prompt Architecture
 */
export function buildContextFrame(ctx: GeminiEventContext): string {
  const sym = ctx.currency === 'USD' ? '$' : '₹';
  const budgetFormatted = `${sym}${ctx.budget.toLocaleString()}`;
  const perGuestFormatted = `${sym}${ctx.perGuest.toLocaleString()}`;

  const topCategories = ctx.topBudgetCategories
    .map((c) => `- ${c.name}: ${sym}${c.allocated.toLocaleString()} (${c.pct}%)`)
    .join('\n');

  return [
    `ROLE: You are AuraPlan AI, an expert senior event architect and elite financial strategist.`,
    `EVENT CONTEXT:`,
    `- Event Name: "${ctx.eventName}"`,
    `- Vertical: ${ctx.eventType.toUpperCase()} (Sub-style: ${ctx.subStyle})`,
    `- Location & Setting: ${ctx.city} (${ctx.setting.toUpperCase()} venue)`,
    `- Countdown: ${ctx.daysCountdown} days remaining`,
    `- Total Budget: ${budgetFormatted} (${perGuestFormatted}/guest across ${ctx.guestCount} guests)`,
    `- Optimization Priority: ${ctx.priority}`,
    `- Dietary & Inclusivity: ${ctx.dietaryNotes}`,
    `- Accessibility: ${ctx.accessibilityRequired ? 'Mandatory Step-Free WCAG/ADA Access' : 'Standard'}`,
    `- Feasibility Health: ${ctx.feasibilityScore}/100 (${ctx.feasibilityLabel})`,
    `TOP BUDGET MODULES:`,
    topCategories,
    ``,
    `TASK INSTRUCTIONS:`,
    `1. Provide highly structured, realistic, and mathematically consistent answers.`,
    `2. Keep responses actionable, concise, and professional with crisp markdown bullets.`,
    `3. Always account for venue setting (${ctx.setting}), countdown urgency (${ctx.daysCountdown} days), and per-guest economics.`
  ].join('\n');
}

/**
 * Internal worker to call Google Gemini API with fallback support
 */
async function callGeminiEndpoint(
  model: string,
  key: string,
  fullPrompt: string
): Promise<{ ok: boolean; status: number; text?: string; error?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    key.trim()
  )}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200
      }
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    return {
      ok: false,
      status: response.status,
      error: errorJson?.error?.message || `HTTP ${response.status}`
    };
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return { ok: false, status: 200, error: 'Empty response candidate from Gemini' };
  }

  return { ok: true, status: 200, text };
}

/**
 * Primary method to synthesize event strategy through dedicated Gemini AI
 */
export async function askGeminiEventStrategist(
  userQuery: string,
  context: GeminiEventContext,
  customKey?: string
): Promise<GeminiResponse> {
  const effectiveKey = (customKey || DEFAULT_GEMINI_API_KEY || '').trim();

  if (!effectiveKey || effectiveKey.length < 15) {
    return {
      success: false,
      text: '',
      model: 'none',
      error: 'Invalid or missing Gemini API key'
    };
  }

  const contextFrame = buildContextFrame(context);
  const fullPrompt = `${contextFrame}\n\nUSER QUESTION / TASK:\n${userQuery}\n\nProvide tailored recommendations now:`;

  // 1. Try Primary Model (gemini-3.5-flash)
  try {
    const primaryRes = await callGeminiEndpoint(PRIMARY_MODEL, effectiveKey, fullPrompt);
    if (primaryRes.ok && primaryRes.text) {
      return {
        success: true,
        text: primaryRes.text,
        model: `Google Gemini 3.5 Flash Live`
      };
    }

    // 2. Fallback Model (gemini-3.5-flash-lite) if primary model had 503/429
    console.warn(`Gemini primary model returned status ${primaryRes.status}, falling back to ${FALLBACK_MODEL}`);
    const fallbackRes = await callGeminiEndpoint(FALLBACK_MODEL, effectiveKey, fullPrompt);
    if (fallbackRes.ok && fallbackRes.text) {
      return {
        success: true,
        text: fallbackRes.text,
        model: `Google Gemini 3.5 Flash Lite Live`
      };
    }

    return {
      success: false,
      text: '',
      model: 'failed',
      error: fallbackRes.error || primaryRes.error || 'Gemini synthesis failed'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      text: '',
      model: 'error',
      error: msg
    };
  }
}
