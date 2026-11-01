import React, { useState } from 'react';
import { ChatMessage } from '../types';
import {
  Sparkles,
  Zap,
  MessageSquare,
  AlertTriangle,
  Clock,
  Send
} from 'lucide-react';

interface AiCoPilotProps {
  messages: ChatMessage[];
  isSynthesizing: boolean;
  onSendMessage: (query: string) => void;
  cardStyle: string;
  monoTag: string;
  mutedText: string;
}

export const AiCoPilot: React.FC<AiCoPilotProps> = React.memo(({
  messages,
  isSynthesizing,
  onSendMessage,
  cardStyle,
  monoTag,
  mutedText
}) => {
  const [chatInput, setChatInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const quickChips = [
    { text: 'Cut 15% from my budget without losing quality', icon: Zap },
    { text: 'Draft a vendor negotiation & quote email', icon: MessageSquare },
    { text: 'Create our outdoor rain & weather backup plan', icon: AlertTriangle },
    { text: 'Generate an event-day hour-by-hour schedule', icon: Clock }
  ];

  return (
    <div className={`rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
      <div className="border-b-2 border-black dark:border-zinc-700 pb-4">
        <span className={monoTag}>[ CONTEXT-GROUNDED CO-PILOT ]</span>
        <h3 className="font-serif text-2xl font-bold mt-0.5">GenAI Architectural Strategist</h3>
        <p className={`text-xs mt-1 ${mutedText}`}>
          Query trade-offs, run-of-show protocols, and customized vendor negotiation letters powered by Gemini 3.5 Flash.
        </p>
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap gap-2.5">
        {quickChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.text}
              type="button"
              onClick={() => onSendMessage(chip.text)}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border-2 border-black bg-[#FAF8F5] dark:bg-zinc-800 text-black dark:text-white shadow-brutal-sm hover:bg-[#C3FF16] hover:text-black hover:-translate-y-0.5 transition-all"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{chip.text}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Message Feed */}
      <div className="h-96 overflow-y-auto space-y-4 p-4 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#111215]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-4 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed border-2 border-black ${
              m.role === 'user'
                ? 'bg-[#C3FF16] text-black ml-8 shadow-brutal-sm'
                : 'bg-white dark:bg-[#202229] text-black dark:text-white mr-6 shadow-brutal-sm'
            }`}
          >
            {m.source && (
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#C3FF16] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>{m.source}</span>
              </div>
            )}
            {m.text}
          </div>
        ))}

        {isSynthesizing && (
          <div className="font-mono text-xs text-black dark:text-[#C3FF16] font-bold animate-pulse px-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Synthesizing mathematical response with Gemini 3.5 Flash...</span>
          </div>
        )}
      </div>

      {/* Chat Form */}
      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <input
          type="text"
          placeholder="Ask about budget trade-offs, catering negotiation, rain backup..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 text-xs rounded-xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm focus:outline-hidden focus:ring-2 focus:ring-[#C3FF16]"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-6 py-3 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
});

AiCoPilot.displayName = 'AiCoPilot';
