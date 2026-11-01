import React, { useState } from 'react';
import { MilestoneItem, TaskStatus } from '../types';
import { sanitizeText } from '../utils/security';
import { Clock, CheckCircle2, Circle, AlertCircle, Plus } from 'lucide-react';

interface MilestoneTimelineProps {
  timelineItems: MilestoneItem[];
  daysCountdown: number;
  completedCount: number;
  progressPct: number;
  onCycleStatus: (item: MilestoneItem) => void;
  onAddCustomTask: (title: string) => void;
  cardStyle: string;
  monoTag: string;
  mutedText: string;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = React.memo(({
  timelineItems,
  daysCountdown,
  completedCount,
  progressPct,
  onCycleStatus,
  onAddCustomTask,
  cardStyle,
  monoTag,
  mutedText
}) => {
  const [taskInput, setTaskInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeText(taskInput, 120);
    if (!clean) return;
    onAddCustomTask(clean);
    setTaskInput('');
  };

  const statusIcons: Record<TaskStatus, React.ReactNode> = {
    completed: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />,
    in_progress: <Clock className="w-4 h-4 text-[#5F5CE5] animate-spin" />,
    pending: <Circle className="w-4 h-4 text-zinc-400" />
  };

  const statusBadges: Record<TaskStatus, { label: string; color: string }> = {
    completed: { label: 'Completed', color: 'bg-[#97F8B7] text-black border-black' },
    in_progress: { label: 'In Progress', color: 'bg-[#C7AEE8] text-black border-black' },
    pending: { label: 'Pending', color: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-400' }
  };

  return (
    <section id="sec-timeline" className="py-12 border-b-2 border-black dark:border-zinc-700">
      <div className="w-full px-6 sm:px-10 lg:px-12 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className={monoTag}>[ SECTION 03 // DATE-ANCHORED ROADMAP ENGINE ]</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1 tracking-tight">
              Backwards Milestone Execution Roadmap
            </h2>
            <p className={`text-sm mt-1 max-w-2xl ${mutedText}`}>
              Target dates auto-anchor to exact countdown remaining with automatic Fast-Track schedule compression.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-mono text-zinc-500 font-bold uppercase">Roadmap Progress</div>
              <div className="font-mono text-base font-black text-black dark:text-white">
                {completedCount} / {timelineItems.length} Locked ({progressPct}%)
              </div>
            </div>
            <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full border border-black overflow-hidden">
              <div
                className="h-full bg-[#C3FF16] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timelineItems.map((task) => {
            const isFastTrack = task.phase.includes('[Fast-Track]');
            const badge = statusBadges[task.status];

            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => onCycleStatus(task)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCycleStatus(task);
                  }
                }}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer select-none space-y-4 hover:-translate-y-1 ${cardStyle} ${
                  task.status === 'completed'
                    ? 'border-emerald-500/60 dark:border-emerald-500/40'
                    : ''
                }`}
                aria-label={`Milestone: ${task.title}, Status: ${task.status}. Click to cycle status.`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcons[task.status]}
                    <span className="font-mono text-xs font-bold text-zinc-500">
                      T-{task.daysBefore} Days
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {isFastTrack && (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm bg-[#FF7A59] text-white">
                        [Fast-Track]
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold text-[#5F5CE5] dark:text-[#C7AEE8]">
                      {task.phase.replace('[Fast-Track] ', '')}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm leading-snug text-black dark:text-white">
                    {task.title}
                  </h4>
                </div>

                <div className="pt-2 border-t border-black/10 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Target Date: {task.targetDate}</span>
                  <span className="text-[10px] text-zinc-400">Click to advance ➔</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Milestone Form */}
        <form
          onSubmit={handleSubmit}
          className={`p-5 rounded-3xl border-2 border-dashed border-black dark:border-zinc-700 flex flex-wrap sm:flex-nowrap gap-3 items-center ${cardStyle}`}
        >
          <div className="p-2.5 rounded-xl bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Add custom milestone (e.g. Book Traditional Kerala Percussion Troupe)..."
            className="flex-1 text-xs font-semibold px-4 py-3 rounded-xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
          />
          <button
            type="submit"
            className="bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-6 py-3 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all shrink-0"
          >
            Add Milestone
          </button>
        </form>
      </div>
    </section>
  );
});

MilestoneTimeline.displayName = 'MilestoneTimeline';
