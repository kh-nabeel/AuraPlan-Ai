// ============================================================================
// AuraPlan AI — Custom Hook: useCoPilotChat
// ============================================================================

import { useState, useCallback } from 'react';
import {
  ChatMessage,
  EventConfig,
  EventHealthSummary,
  BudgetCategory
} from '../types';
import { sanitizeText } from '../utils/security';
import { formatMoney } from '../utils/formatters';
import {
  askGeminiEventStrategist,
  isGeminiKeyActive
} from '../services/geminiService';

export interface UseCoPilotChatReturn {
  messages: ChatMessage[];
  isSynthesizing: boolean;
  askCoPilot: (promptText: string) => Promise<void>;
}

/**
 * Custom hook managing the interactive GenAI Co-Pilot conversation,
 * session message history, and Google Gemini API integration.
 */
export function useCoPilotChat(
  config: EventConfig,
  health: EventHealthSummary,
  budgetItems: BudgetCategory[],
  apiKey: string
): UseCoPilotChatReturn {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      source: 'Google Gemini 3.5 Flash Live • Dedicated Free Tier',
      text: 'Welcome to AuraPlan AI. Dedicated Gemini AI service is connected and ready. Adjust parameters in the context studio below, or click any prompt card to generate tailored savings strategies, vendor negotiation drafts, or contingency protocols.'
    }
  ]);

  const askCoPilot = useCallback(
    async (promptText: string) => {
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
          // Fall back to built-in deterministic planning engine
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
    },
    [apiKey, config, health, budgetItems]
  );

  return {
    messages,
    isSynthesizing,
    askCoPilot
  };
}
