// ============================================================================
// AuraPlan AI — Custom Hook: useEventPlanner
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import {
  EventConfig,
  EventVertical,
  TaskStatus,
  VendorStatus,
  MilestoneItem,
  VendorItem,
  BudgetCategory,
  EventHealthSummary,
  CreativeIdeas
} from '../types';
import {
  computeDynamicBudget,
  evaluateEventHealth,
  computeTimeline,
  computeVendors,
  generateCreativeIdeas
} from '../engine/planningEngine';
import { VERTICAL_PRESETS } from '../engine/presets';

export interface UseEventPlannerReturn {
  config: EventConfig;
  budgetItems: BudgetCategory[];
  health: EventHealthSummary;
  timelineItems: MilestoneItem[];
  vendorItems: VendorItem[];
  ideas: CreativeIdeas;
  totalActual: number;
  budgetVariance: number;
  completedTasksCount: number;
  progressPct: number;
  selectPreset: (type: EventVertical) => void;
  updateConfigField: <K extends keyof EventConfig>(key: K, value: EventConfig[K]) => void;
  handleUpdateActual: (id: string, value: number) => void;
  handleResetActuals: () => void;
  cycleTaskStatus: (task: MilestoneItem) => void;
  cycleVendorStatus: (vendor: VendorItem) => void;
  handleAddCustomTask: (title: string) => void;
  handleAddCustomVendor: (category: string, cap: number) => void;
}

/**
 * Custom hook encapsulating all event configuration, budget allocations,
 * roadmap timelines, and vendor checklist states.
 */
export function useEventPlanner(
  onToast: (msg: string) => void
): UseEventPlannerReturn {
  const [config, setConfig] = useState<EventConfig>(VERTICAL_PRESETS.wedding);
  const [customActuals, setCustomActuals] = useState<Record<string, number>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [customTasks, setCustomTasks] = useState<MilestoneItem[]>([]);
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, VendorStatus>>({});
  const [customVendors, setCustomVendors] = useState<VendorItem[]>([]);

  // Derived calculations via pure engine functions
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

  // Actions
  const selectPreset = useCallback((type: EventVertical) => {
    setConfig(VERTICAL_PRESETS[type]);
    setCustomActuals({});
    setCustomTasks([]);
    setCustomVendors([]);
    onToast(`Loaded ${type.toUpperCase()} template`);
  }, [onToast]);

  const updateConfigField = useCallback(<K extends keyof EventConfig>(key: K, value: EventConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleUpdateActual = useCallback((id: string, value: number) => {
    setCustomActuals((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleResetActuals = useCallback(() => {
    setCustomActuals({});
    onToast('Reset quote simulations to baseline target');
  }, [onToast]);

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
    onToast('Added custom milestone');
  }, [config.daysCountdown, onToast]);

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
    onToast('Added custom vendor to checklist');
  }, [onToast]);

  return {
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
  };
}
