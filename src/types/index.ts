// ============================================================================
// AuraPlan AI — Strict TypeScript Domain Models & Interfaces
// ============================================================================

export type EventVertical = 'wedding' | 'birthday' | 'community';
export type CurrencyCode = 'INR' | 'USD';
export type VenueSetting = 'indoor' | 'outdoor' | 'hybrid';
export type PriorityMode = 'balanced' | 'cost_saving' | 'luxury' | 'eco_friendly';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type VendorStatus = 'Pending' | 'Shortlisted' | 'Contacted' | 'Booked';

/** Master Event Configuration */
export interface EventConfig {
  eventName: string;
  eventType: EventVertical;
  subStyle: string;
  currency: CurrencyCode;
  budget: number;
  guestCount: number;
  daysCountdown: number;
  city: string;
  setting: VenueSetting;
  priority: PriorityMode;
  dietaryNotes: string;
  accessibilityRequired: boolean;
}

/** Itemized Category Budget Model */
export interface BudgetCategory {
  id: string;
  name: string;
  pct: number;
  allocated: number;
  actual: number;
  perGuest: number;
  priority: 'Critical' | 'High' | 'Medium';
  color: string;
  contextNote: string;
}

/** Milestone Timeline Task Model */
export interface MilestoneItem {
  id: string;
  phase: string;
  title: string;
  daysBefore: number;
  targetDate: string;
  priority: 'Critical' | 'High' | 'Medium';
  status: TaskStatus;
}

/** Vendor Checklist & Contract Vetting Model */
export interface VendorItem {
  id: string;
  category: string;
  leadTime: string;
  estimatedCap: number;
  status: VendorStatus;
  vettingQuestion: string;
}

/** Co-Pilot Conversation Message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  source?: string;
  text: string;
}

/** Event Health Feasibility Diagnostics */
export interface EventHealthSummary {
  perGuest: number;
  minThreshold: number;
  score: number;
  label: string;
  alerts: string[];
  tips: string[];
}

/** Creative Theme Palette and Styling Model */
export interface CreativeIdeas {
  headline: string;
  palette: Array<{ name: string; hex: string }>;
  decor: string[];
  menu: string[];
  savingHacks: string[];
}

/** Automated Test Verification Item */
export interface TestCheckItem {
  name: string;
  pass: boolean;
  detail: string;
}
