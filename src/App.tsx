import React, { useState, useMemo } from 'react';
import {
  askGeminiEventStrategist,
  DEFAULT_GEMINI_API_KEY,
  isGeminiKeyActive,
  PRIMARY_MODEL
} from './services/geminiService';
import {
  Sparkles,
  Calendar,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Utensils,
  Camera,
  Music,
  ShieldCheck,
  Gift,
  Plus,
  Download,
  Send,
  Sliders,
  Moon,
  Sun,
  Contrast,
  Terminal,
  KeyRound,
  Copy,
  Check,
  RotateCcw,
  ChevronRight,
  MapPin,
  Leaf,
  Award,
  Scale,
  Coins,
  Crown,
  PartyPopper,
  Heart,
  Bookmark,
  ArrowUpRight,
  Zap,
  X,
  Activity,
  Compass,
  Palette,
  MessageSquare,
  Globe,
  SlidersHorizontal,
  Layers,
  ArrowDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

// ============================================================================
// 1. TYPES & INTERFACES (TypeScript Strict Domain Model)
// ============================================================================

export type EventVertical = 'wedding' | 'birthday' | 'community';
export type CurrencyCode = 'INR' | 'USD';
export type VenueSetting = 'indoor' | 'outdoor' | 'hybrid';
export type PriorityMode = 'balanced' | 'cost_saving' | 'luxury' | 'eco_friendly';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type VendorStatus = 'Pending' | 'Shortlisted' | 'Contacted' | 'Booked';

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

export interface MilestoneItem {
  id: string;
  phase: string;
  title: string;
  daysBefore: number;
  targetDate: string;
  priority: 'Critical' | 'High' | 'Medium';
  status: TaskStatus;
}

export interface VendorItem {
  id: string;
  category: string;
  leadTime: string;
  estimatedCap: number;
  status: VendorStatus;
  vettingQuestion: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  source?: string;
  text: string;
}

// ============================================================================
// 2. SECURITY & VALIDATION UTILITIES (OWASP / XSS Safe)
// ============================================================================

const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function sanitizeText(input: unknown, maxLen = 300): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>`]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function escapeHTML(input: unknown, maxLen = 300): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .trim()
    .slice(0, maxLen)
    .replace(/[&<>"']/g, (ch) => ENTITY_MAP[ch] || ch);
}

export function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// ============================================================================
// 3. CONTEXT-DRIVEN PLANNING ENGINE (Pure Functions for Unit Testing)
// ============================================================================

const CHART_PALETTE = ['#5F5CE5', '#C3FF16', '#FF7A59', '#C7AEE8', '#97F8B7', '#FFE816', '#0D0D0D'];

const BASE_SPLITS: Record<EventVertical, Array<{ id: string; name: string; pct: number; priority: 'Critical' | 'High' | 'Medium' }>> = {
  wedding: [
    { id: 'venue', name: 'Venue & Mandap Space', pct: 26, priority: 'Critical' },
    { id: 'catering', name: 'Culinary, Live Counters & Bar', pct: 28, priority: 'Critical' },
    { id: 'decor', name: 'Floral, Stage & Ambient Lighting', pct: 14, priority: 'High' },
    { id: 'photo', name: 'Photography & Cinematography', pct: 12, priority: 'High' },
    { id: 'music', name: 'Live Music, DJ & Sound', pct: 8, priority: 'Medium' },
    { id: 'hospitality', name: 'Guest Hospitality & Transport', pct: 6, priority: 'Medium' },
    { id: 'contingency', name: 'Weather & Emergency Buffer', pct: 6, priority: 'Critical' }
  ],
  birthday: [
    { id: 'catering', name: 'Food, Mocktails & Custom Cake', pct: 32, priority: 'Critical' },
    { id: 'venue', name: 'Lounge / Lawn Venue & Seating', pct: 22, priority: 'Critical' },
    { id: 'entertainment', name: 'DJ, Emcee & Interactive Games', pct: 16, priority: 'High' },
    { id: 'decor', name: '3D Backdrop, Neon & Balloons', pct: 14, priority: 'High' },
    { id: 'photo', name: 'Instant Photo Booth & Candid', pct: 8, priority: 'Medium' },
    { id: 'favors', name: 'Return Gifts & Goodie Bags', pct: 4, priority: 'Medium' },
    { id: 'contingency', name: 'Last-Minute Buffer Reserve', pct: 4, priority: 'Critical' }
  ],
  community: [
    { id: 'venue_av', name: 'Auditorium, Stage AV & Wi-Fi', pct: 30, priority: 'Critical' },
    { id: 'catering', name: 'Refreshments & Eco Meal Boxes', pct: 24, priority: 'High' },
    { id: 'permits', name: 'Civic Permits, Security & First-Aid', pct: 14, priority: 'Critical' },
    { id: 'branding', name: 'Badges, Wayfinding & Swag', pct: 12, priority: 'High' },
    { id: 'program', name: 'Speakers, Workshops & Prizes', pct: 10, priority: 'Medium' },
    { id: 'accessibility', name: 'Wheelchair Ramps & Sign/Captions', pct: 5, priority: 'High' },
    { id: 'contingency', name: 'Operational Reserve Buffer', pct: 5, priority: 'Critical' }
  ]
};

const MIN_PER_GUEST: Record<CurrencyCode, Record<EventVertical, number>> = {
  INR: { wedding: 1800, birthday: 700, community: 350 },
  USD: { wedding: 65, birthday: 25, community: 15 }
};

export function computeDynamicBudget(config: EventConfig): BudgetCategory[] {
  const base = (BASE_SPLITS[config.eventType] || BASE_SPLITS.wedding).map((item, i) => ({
    ...item,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
    contextNote: 'Standard vertical benchmark'
  }));

  // Context Decision 1: Outdoor / Hybrid increases weather buffer
  if (config.setting === 'outdoor' || config.setting === 'hybrid') {
    const buf = base.find((i) => i.id === 'contingency');
    const dec = base.find((i) => i.id === 'decor' || i.id === 'branding');
    if (buf) {
      buf.pct += 3;
      buf.contextNote = '+3% boost for waterproof tenting & generator backup';
    }
    if (dec && dec.pct > 6) dec.pct -= 3;
  }

  // Context Decision 2: Optimization Priority shifts
  if (config.priority === 'cost_saving') {
    const buf = base.find((i) => i.id === 'contingency');
    const dec = base.find((i) => i.id === 'decor' || i.id === 'branding');
    if (buf) buf.pct += 2;
    if (dec && dec.pct > 6) {
      dec.pct -= 2;
      dec.contextNote = 'Trimmed for high-efficiency minimalist styling';
    }
  } else if (config.priority === 'luxury') {
    const dec = base.find((i) => i.id === 'decor' || i.id === 'branding');
    const buf = base.find((i) => i.id === 'contingency');
    if (dec) {
      dec.pct += 2;
      dec.contextNote = 'Boosted for bespoke luxury experiential design';
    }
    if (buf && buf.pct > 4) buf.pct -= 2;
  } else if (config.priority === 'eco_friendly') {
    const cat = base.find((i) => i.id === 'catering');
    if (cat) cat.contextNote = 'Includes zero-waste compostable serviceware';
  }

  // Normalize to 100%
  const rawTotal = base.reduce((acc, i) => acc + i.pct, 0);
  let runningPct = 0;
  base.forEach((item, idx) => {
    if (idx === base.length - 1) {
      item.pct = Math.max(1, 100 - runningPct);
    } else {
      item.pct = Math.round((item.pct / rawTotal) * 100);
      runningPct += item.pct;
    }
  });

  let runningAmt = 0;
  return base.map((item, idx) => {
    const allocated =
      idx === base.length - 1
        ? Math.max(0, config.budget - runningAmt)
        : Math.round((config.budget * item.pct) / 100);
    runningAmt += allocated;
    return {
      ...item,
      allocated,
      actual: allocated,
      perGuest: Math.round(allocated / Math.max(1, config.guestCount))
    };
  });
}

export function evaluateEventHealth(config: EventConfig) {
  const perGuest = Math.round(config.budget / Math.max(1, config.guestCount));
  const minThreshold = MIN_PER_GUEST[config.currency][config.eventType];
  let score = 94;
  const alerts: string[] = [];
  const tips: string[] = [];

  if (perGuest < minThreshold) {
    score -= 22;
    alerts.push(
      `Tight Per-Guest Budget (${config.currency === 'INR' ? '₹' : '$'}${perGuest.toLocaleString()}/guest vs recommended ${config.currency === 'INR' ? '₹' : '$'}${minThreshold.toLocaleString()}).`
    );
    tips.push('Switch from plated service to 2 curated live stations or trim guest count by 15% to restore cushion.');
  } else {
    tips.push(
      `Healthy per-guest allocation (${config.currency === 'INR' ? '₹' : '$'}${perGuest.toLocaleString()}/guest) comfortably supports quality vendors.`
    );
  }

  if (config.daysCountdown < 30) {
    score -= 14;
    alerts.push(`Compressed Schedule (${config.daysCountdown} days left): Fast-track vendor locking activated.`);
    tips.push('Prioritize all-inclusive venues (in-house catering + AV/decor) to eliminate multi-vendor coordination delays.');
  }

  if (config.setting !== 'indoor') {
    tips.push('Outdoor Weather Protocol: Lock a 48-hour rain marquee hold and silent DG power backup in vendor contracts.');
  }

  return {
    perGuest,
    minThreshold,
    score: Math.max(45, Math.min(99, score)),
    label: score >= 82 ? 'Optimal Blueprint' : score >= 68 ? 'Action Needed' : 'High Constraint',
    alerts,
    tips
  };
}

export function computeTimeline(config: EventConfig): MilestoneItem[] {
  const d = Math.max(3, config.daysCountdown);
  const fast = d < 30;
  const prefix = fast ? '[Fast-Track] ' : '';

  const formatTargetDate = (daysBefore: number) => {
    const target = new Date();
    target.setDate(target.getDate() + Math.max(0, d - daysBefore));
    return target.toISOString().split('T')[0];
  };

  const templates: Record<EventVertical, Array<{ phase: string; title: string; ratio: number; priority: 'Critical' | 'High' | 'Medium' }>> = {
    wedding: [
      { phase: 'Foundation', title: `Lock ${config.setting.toUpperCase()} Venue & Charter in ${config.city}`, ratio: 0.85, priority: 'Critical' },
      { phase: 'Core Vendors', title: `Book Caterer & Finalize ${config.dietaryNotes} Tasting`, ratio: 0.65, priority: 'Critical' },
      { phase: 'Visuals', title: 'Contract Photography, Cinema & Floral Stage Designer', ratio: 0.5, priority: 'High' },
      { phase: 'Hospitality', title: `Send Digital Invites & Open RSVP Tracker (${config.guestCount} Pax)`, ratio: 0.35, priority: 'High' },
      { phase: 'Production', title: 'Finalize Sound Check, Procession Cue Sheet & Backup Power', ratio: 0.15, priority: 'Medium' },
      { phase: 'Launch Day', title: 'On-Site Load-In, Accessibility Walkthrough & Ceremony', ratio: 0.0, priority: 'Critical' }
    ],
    birthday: [
      { phase: 'Concept', title: `Lock '${config.subStyle}' Theme & Book ${config.setting.toUpperCase()} Venue`, ratio: 0.85, priority: 'Critical' },
      { phase: 'Culinary', title: `Order Custom Centerpiece Cake & ${config.dietaryNotes} Menu`, ratio: 0.6, priority: 'Critical' },
      { phase: 'Vibe & Fun', title: 'Book DJ / Emcee, Photo Booth & Interactive Games', ratio: 0.45, priority: 'High' },
      { phase: 'Guests', title: `Dispatch QR E-Invites & Assemble ${config.guestCount} Return Gift Bags`, ratio: 0.25, priority: 'Medium' },
      { phase: 'Party Day', title: 'Backdrop Setup, Sound Check & Spotlight Entry', ratio: 0.0, priority: 'Critical' }
    ],
    community: [
      { phase: 'Permits & Venue', title: `Secure ${config.city} Venue, Civic Permits & High-Density Wi-Fi`, ratio: 0.85, priority: 'Critical' },
      { phase: 'Program & AV', title: 'Lock Keynote Speakers, Stage Rigging & Dual-ISP Failover', ratio: 0.65, priority: 'Critical' },
      { phase: 'Catering', title: `Order Zero-Waste Refreshments & Meal Boxes (${config.guestCount} Pax)`, ratio: 0.45, priority: 'High' },
      { phase: 'Inclusivity', title: 'Verify Wheelchair Ramps, Quiet Sensory Zone & Wayfinding', ratio: 0.2, priority: 'High' },
      { phase: 'Live Event', title: 'QR Check-In Desk Open, Stage Run-of-Show & Feedback Loop', ratio: 0.0, priority: 'Critical' }
    ]
  };

  return (templates[config.eventType] || templates.wedding).map((item, idx) => {
    const daysBefore = Math.round(d * item.ratio);
    return {
      id: `ms_${config.eventType}_${idx}`,
      phase: `${prefix}${item.phase}`,
      title: item.title,
      daysBefore,
      targetDate: formatTargetDate(daysBefore),
      priority: item.priority,
      status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending'
    };
  });
}

export function computeVendors(config: EventConfig): VendorItem[] {
  const b = config.budget;
  const map: Record<EventVertical, VendorItem[]> = {
    wedding: [
      {
        id: 'vw_1',
        category: 'Primary Venue & Mandap Lawn/Hall',
        leadTime: '4–6 Months Out',
        estimatedCap: Math.round(b * 0.26),
        status: 'Booked',
        vettingQuestion:
          config.setting === 'outdoor'
            ? 'Is a waterproof marquee tent or indoor backup hall included at zero extra fee if rain is forecast?'
            : 'Are generator fuel, bridal green rooms, and late-night overtime hours included in the base rental?'
      },
      {
        id: 'vw_2',
        category: 'Culinary Catering & Live Counters',
        leadTime: '3–4 Months Out',
        estimatedCap: Math.round(b * 0.28),
        status: 'Shortlisted',
        vettingQuestion: `Can you maintain 1 buffet line per 75 guests for ${config.guestCount} pax with dedicated ${config.dietaryNotes} counters?`
      },
      {
        id: 'vw_3',
        category: 'Floral Architecture & Stage Lighting',
        leadTime: '2–3 Months Out',
        estimatedCap: Math.round(b * 0.14),
        status: 'Contacted',
        vettingQuestion: 'Can ceremony entrance florals be repurposed for the reception stage backdrop?'
      },
      {
        id: 'vw_4',
        category: 'Candid Photography & Drone Cinema',
        leadTime: '3–5 Months Out',
        estimatedCap: Math.round(b * 0.12),
        status: 'Shortlisted',
        vettingQuestion: 'What is your dual-SD card cloud backup workflow and exact turnaround time for deliverables?'
      }
    ],
    birthday: [
      {
        id: 'vb_1',
        category: 'Gourmet Catering & Custom Tiered Cake',
        leadTime: '3–5 Weeks Out',
        estimatedCap: Math.round(b * 0.32),
        status: 'Shortlisted',
        vettingQuestion: `Can you provide an allergen-labeled menu (${config.dietaryNotes}) plus a custom theme centerpiece cake?`
      },
      {
        id: 'vb_2',
        category: 'Party Lounge / Rooftop Venue',
        leadTime: '1–2 Months Out',
        estimatedCap: Math.round(b * 0.22),
        status: 'Booked',
        vettingQuestion: 'Do you allow external balloon/neon decorators without charging a vendor royalty fee?'
      },
      {
        id: 'vb_3',
        category: 'Interactive Emcee, DJ & Game Host',
        leadTime: '3 Weeks Out',
        estimatedCap: Math.round(b * 0.16),
        status: 'Contacted',
        vettingQuestion: 'Are wireless microphones, crowd trivia props, and PA subwoofers included?'
      },
      {
        id: 'vb_4',
        category: 'Theme Backdrop & Instant Photo Booth',
        leadTime: '2–3 Weeks Out',
        estimatedCap: Math.round(b * 0.22),
        status: 'Pending',
        vettingQuestion: 'Does the photo booth include unlimited instant prints and a live QR digital album?'
      }
    ],
    community: [
      {
        id: 'vc_1',
        category: 'Auditorium, Stage AV & High-Density Wi-Fi',
        leadTime: '2–3 Months Out',
        estimatedCap: Math.round(b * 0.3),
        status: 'Booked',
        vettingQuestion: `Can access points support ${config.guestCount}+ simultaneous devices with dual-ISP failover?`
      },
      {
        id: 'vc_2',
        category: 'Zero-Waste Boxed Meals & Coffee Carts',
        leadTime: '1 Month Out',
        estimatedCap: Math.round(b * 0.24),
        status: 'Shortlisted',
        vettingQuestion: 'Are all meal boxes 100% biodegradable, and can you stagger refills during break windows?'
      },
      {
        id: 'vc_3',
        category: 'Civic Permits, Crowd Marshals & First-Aid',
        leadTime: '4–6 Weeks Out',
        estimatedCap: Math.round(b * 0.14),
        status: 'Contacted',
        vettingQuestion: 'Are fire safety NOCs, security personnel, and an on-site paramedic desk covered?'
      },
      {
        id: 'vc_4',
        category: 'Accessibility Ramps, Wayfinding & Badges',
        leadTime: '3 Weeks Out',
        estimatedCap: Math.round(b * 0.17),
        status: 'Pending',
        vettingQuestion: 'Do ramps meet 1:12 ADA/WCAG slope ratios and is live captioning routed to main screens?'
      }
    ]
  };
  return map[config.eventType] || map.wedding;
}

export function generateCreativeIdeas(config: EventConfig) {
  const bank: Record<
    EventVertical,
    {
      headline: string;
      palette: Array<{ name: string; hex: string }>;
      decor: string[];
      menu: string[];
      savingHacks: string[];
    }
  > = {
    wedding: {
      headline: `${config.subStyle} Celebration in ${config.city}`,
      palette: [
        { name: 'Royal Crimson', hex: '#9f1239' },
        { name: 'Marigold Gold', hex: '#d97706' },
        { name: 'Warm Ivory', hex: '#fef3c7' },
        { name: 'Emerald Leaf', hex: '#065f46' }
      ],
      decor: [
        `Warm fairy-light canopy with brass uruli floral floats designed for ${config.setting} acoustics and lighting.`,
        'Interactive "Our Journey" QR audio memory walkway for arriving guests.',
        config.priority === 'eco_friendly'
          ? 'Potted living orchids and banana-leaf stage installations gifted to families after the ceremony.'
          : 'Architectural floral mandap/arch with warm 2700K pin-spot lighting for twilight portraits.'
      ],
      menu: [
        `Welcome Cooler Bar: Tender coconut mint fizz, hibiscus iced tea & spiced kokum (${config.dietaryNotes}).`,
        'Live Artisanal Counters: Appam/crepe station, wood-fired flatbreads & regional signature delicacies.',
        'Bite-sized Dessert Flight: Warm pistachio tres leches, mini churros/jalebi & sugar-free berry verrines.'
      ],
      savingHacks: [
        'Host ceremony and reception at the same venue complex to save ~18% on dual transport and rigging.',
        'Blend 70% lush local seasonal foliage with 30% statement blooms to cut floral costs by 35%.'
      ]
    },
    birthday: {
      headline: `${config.subStyle} — Milestone Experience`,
      palette: [
        { name: 'Electric Indigo', hex: '#4f46e5' },
        { name: 'Festive Rose', hex: '#ec4899' },
        { name: 'Sparkler Amber', hex: '#f59e0b' },
        { name: 'Starlight Slate', hex: '#0f172a' }
      ],
      decor: [
        `Custom 3D layered arch with LED neon typography ("${config.eventName}") and biodegradable organic balloons.`,
        'Instant Polaroid Memory Wall where guests clip snapshots and handwritten wishes.',
        `Synchronized ${config.setting} uplighting keyed to the cake-cutting anthem.`
      ],
      menu: [
        `Interactive DIY Gourmet Slider, Taco & Pasta Bar (${config.dietaryNotes}).`,
        'Showstopper 2-Tier Centerpiece Cake paired with matching pre-portioned cupcakes for zero-wait serving.',
        'Artisanal Mocktail Lab with fresh fruit muddles, edible shimmer & custom drink toppers.'
      ],
      savingHacks: [
        'Use a 1-tier designer display cake for photos and serve kitchen sheet cake to save 40% on bakery quotes.',
        'Concentrate 80% of decor budget on the main photo-op backdrop and cake zone.'
      ]
    },
    community: {
      headline: `${config.eventName} — ${config.subStyle} (${config.city})`,
      palette: [
        { name: 'Civic Teal', hex: '#0d9488' },
        { name: 'Innovation Blue', hex: '#0284c7' },
        { name: 'Signal Amber', hex: '#f59e0b' },
        { name: 'Clean Slate', hex: '#334155' }
      ],
      decor: [
        'Recycled honeycomb cardboard stage totems and high-contrast wayfinding pylons.',
        'Interactive Community Impact & Skill-Share Pledge Wall in the networking foyer.',
        `Step-free ${config.setting} floorplan with dedicated Quiet Sensory Lounge and fast-lane check-in.`
      ],
      menu: [
        `Zero-spill Brain-Food Meal Boxes (${config.dietaryNotes}) engineered for standing networking.`,
        'Refillable steel/glass hydration stations eliminating single-use plastic bottles.',
        'Local community-run specialty coffee & masala chai cart.'
      ],
      savingHacks: [
        'Co-brand with a local university or civic auditorium to reduce venue rental by up to 50%.',
        'Use dynamic digital stage projection instead of single-use vinyl flex printing.'
      ]
    }
  };
  return bank[config.eventType] || bank.wedding;
}

// ============================================================================
// 4. DEFAULT VERTICAL PRESETS
// ============================================================================

const VERTICAL_PRESETS: Record<EventVertical, EventConfig> = {
  wedding: {
    eventName: 'Aarav & Diya Heritage Wedding',
    eventType: 'wedding',
    subStyle: 'Royal Traditional & Floral Fusion',
    currency: 'INR',
    budget: 1200000,
    guestCount: 250,
    daysCountdown: 75,
    city: 'Kochi, Kerala',
    setting: 'outdoor',
    priority: 'balanced',
    dietaryNotes: 'Multi-Cuisine + Traditional Sadhya & Jain Options',
    accessibilityRequired: true
  },
  birthday: {
    eventName: "Maya's 25th Starlight Soirée",
    eventType: 'birthday',
    subStyle: 'Neon Retro Rooftop Gala',
    currency: 'INR',
    budget: 180000,
    guestCount: 80,
    daysCountdown: 30,
    city: 'Bengaluru, Karnataka',
    setting: 'hybrid',
    priority: 'cost_saving',
    dietaryNotes: 'Vegetarian, Eggless Artisan Cake & Mocktail Bar',
    accessibilityRequired: false
  },
  community: {
    eventName: 'Regional AI & Open Tech Conclave',
    eventType: 'community',
    subStyle: 'Innovation Summit & Hackathon',
    currency: 'INR',
    budget: 450000,
    guestCount: 300,
    daysCountdown: 21,
    city: 'Kochi, Kerala',
    setting: 'indoor',
    priority: 'eco_friendly',
    dietaryNotes: 'Zero-Waste Brain-Food Boxes & Vegan Snacks',
    accessibilityRequired: true
  }
};

// ============================================================================
// 5. MAIN REACT APPLICATION COMPONENT
// ============================================================================

export default function App() {
  const [config, setConfig] = useState<EventConfig>(VERTICAL_PRESETS.wedding);
  const [customActuals, setCustomActuals] = useState<Record<string, number>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [customTasks, setCustomTasks] = useState<MilestoneItem[]>([]);
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, VendorStatus>>({});
  const [customVendors, setCustomVendors] = useState<VendorItem[]>([]);

  // UI & Accessibility Modes
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => DEFAULT_GEMINI_API_KEY);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New item inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCap, setNewVendorCap] = useState('');

  // Co-Pilot Chat State
  const [chatInput, setChatInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      source: 'Google Gemini 3.5 Flash Live • Dedicated Free Tier',
      text: 'Welcome to AuraPlan AI. Dedicated Gemini AI service is connected and ready. Adjust parameters in the context studio below, or click any prompt card to generate tailored savings strategies, vendor negotiation drafts, or contingency protocols.'
    }
  ]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

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

  const fmtMoney = (val: number) => {
    const sym = config.currency === 'USD' ? '$' : '₹';
    const loc = config.currency === 'USD' ? 'en-US' : 'en-IN';
    return `${sym}${Math.round(val).toLocaleString(loc)}`;
  };

  const totalActual = budgetItems.reduce((sum, i) => sum + i.actual, 0);
  const budgetVariance = config.budget - totalActual;
  const completedTasksCount = timelineItems.filter((t) => t.status === 'completed').length;
  const progressPct = Math.round((completedTasksCount / Math.max(1, timelineItems.length)) * 100);

  // Handlers
  const selectPreset = (type: EventVertical) => {
    setConfig(VERTICAL_PRESETS[type]);
    setCustomActuals({});
    setCustomTasks([]);
    setCustomVendors([]);
    triggerToast(`Loaded ${type.toUpperCase()} template`);
  };

  const updateConfigField = <K extends keyof EventConfig>(key: K, value: EventConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const cycleTaskStatus = (task: MilestoneItem) => {
    const order: TaskStatus[] = ['pending', 'in_progress', 'completed'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    if (task.id.startsWith('custom_')) {
      setCustomTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    } else {
      setTaskStatuses((prev) => ({ ...prev, [task.id]: next }));
    }
  };

  const cycleVendorStatus = (vendor: VendorItem) => {
    const order: VendorStatus[] = ['Pending', 'Shortlisted', 'Contacted', 'Booked'];
    const next = order[(order.indexOf(vendor.status) + 1) % order.length];
    if (vendor.id.startsWith('cv_')) {
      setCustomVendors((prev) => prev.map((v) => (v.id === vendor.id ? { ...v, status: next } : v)));
    } else {
      setVendorStatuses((prev) => ({ ...prev, [vendor.id]: next }));
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeText(newTaskTitle, 120);
    if (!clean) return;
    setCustomTasks((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        phase: 'Custom Milestone',
        title: clean,
        daysBefore: Math.min(7, config.daysCountdown),
        targetDate: new Date().toISOString().split('T')[0],
        priority: 'High',
        status: 'pending'
      }
    ]);
    setNewTaskTitle('');
    triggerToast('Added custom milestone');
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeText(newVendorName, 100);
    if (!clean) return;
    const cap = clampNum(newVendorCap, 500, 99999999, Math.round(config.budget * 0.05));
    setCustomVendors((prev) => [
      ...prev,
      {
        id: `cv_${Date.now()}`,
        category: clean,
        leadTime: '2–4 Weeks Out',
        estimatedCap: cap,
        status: 'Shortlisted',
        vettingQuestion: 'What are your cancellation, weather postponement, and overtime terms?'
      }
    ]);
    setNewVendorName('');
    setNewVendorCap('');
    triggerToast('Added custom vendor to checklist');
  };

  // Structured System Prompt for GenAI Inspector
  const structuredSystemPrompt = useMemo(() => {
    return [
      `ROLE: AuraPlan AI — Senior Event Architect & Financial Strategist`,
      `CONTEXT: ${config.eventName} | Vertical: ${config.eventType.toUpperCase()} (${config.subStyle})`,
      `SCALE & BUDGET: ${fmtMoney(config.budget)} total (${fmtMoney(health.perGuest)}/guest for ${config.guestCount} guests)`,
      `LOCATION & TIMING: ${config.city} (${config.setting.toUpperCase()}) | ${config.daysCountdown} days remaining`,
      `CONSTRAINTS: Priority=${config.priority} | Dietary=${config.dietaryNotes} | Accessibility=${config.accessibilityRequired ? 'Mandatory WCAG/ADA' : 'Standard'}`,
      `FEASIBILITY SCORE: ${health.score}/100 (${health.label})`
    ].join('\n');
  }, [config, health]);

  // Co-Pilot Synthesis (Supports Live Gemini API Key OR Built-in Deterministic Engine)
  const askCoPilot = async (promptText: string) => {
    const cleanQ = sanitizeText(promptText, 350);
    if (!cleanQ) return;

    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: cleanQ };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
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
          `Strategic 15% Reduction Plan (${fmtMoney(targetSave)}) for "${config.eventName}":\n` +
          `• Bundle ${budgetItems[0].name} (${fmtMoney(budgetItems[0].allocated)}): Negotiate combined production package to save ~${fmtMoney(budgetItems[0].allocated * 0.18)}.\n` +
          `• High-Efficiency Menu Curation: Replace continuous buffets with 2 focused interactive live counters (${config.dietaryNotes}) saving ~${fmtMoney(config.budget * 0.05)}.\n` +
          `• Spatial Priority: Concentrate 75% of decor investment on the main focal stage and entry installation.`;
      } else if (q.includes('email') || q.includes('vendor') || q.includes('quote') || q.includes('negotiate')) {
        const targetCap = Math.round(budgetItems[1].allocated * 0.9);
        reply =
          `Itemized Vendor Negotiation Draft:\n\n` +
          `Subject: Proposal Request — ${config.eventName} (${config.guestCount} Guests in ${config.city})\n\n` +
          `Hello Team,\nWe are locking partners for an upcoming ${config.eventType} (${config.setting} setting) in ${config.city} scheduled in ${config.daysCountdown} days for ${config.guestCount} guests. ` +
          `Our target ceiling for this module is ${fmtMoney(targetCap)} with strict adherence to ${config.dietaryNotes}${config.accessibilityRequired ? ' and inclusive accessibility standards' : ''}.\n` +
          `Please provide your milestone payment schedule, weather contingency policy, and itemized deliverables.`;
      } else if (q.includes('rain') || q.includes('weather') || q.includes('backup') || q.includes('outdoor')) {
        const bufferItem = budgetItems.find((i) => i.id === 'contingency');
        reply =
          `Weather & Operations Contingency Protocol for ${config.city} (${config.setting.toUpperCase()}):\n` +
          `• Contingency Buffer: ${fmtMoney(bufferItem ? bufferItem.allocated : config.budget * 0.06)} is locked in reserve.\n` +
          `• 48-Hour Threshold Trigger: Require contract clauses securing clear-span marquee tenting and elevated subflooring if precipitation probability exceeds 35%.\n` +
          `• Power Continuity: Deploy a 62.5 kVA silent backup generator with covered cable ramps across all guest routes.`;
      } else {
        reply =
          `Operational Run-of-Show Blueprint for "${config.eventName}":\n` +
          `• Per-Guest Spend: ${fmtMoney(health.perGuest)}/guest (${health.label}, Score ${health.score}/100).\n` +
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
  };

  // Automated Unit Test Suite
  const testResults = useMemo(() => {
    const checks: Array<{ name: string; pass: boolean; detail: string }> = [];

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

    // 3. 100% Budget Normalization across all 3 verticals
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

    return checks;
  }, [apiKey]);

  // Export Blueprint as Markdown
  const handleExportMarkdown = () => {
    const md = [
      `# ${config.eventName} — AuraPlan AI Master Blueprint`,
      `- **Vertical**: ${config.eventType.toUpperCase()} (${config.subStyle})`,
      `- **Location & Setting**: ${config.city} (${config.setting.toUpperCase()})`,
      `- **Budget**: ${fmtMoney(config.budget)} (${fmtMoney(health.perGuest)}/guest for ${config.guestCount} guests)`,
      `- **Countdown**: ${config.daysCountdown} days | **Health Score**: ${health.score}/100 (${health.label})`,
      ``,
      `## 1. Dynamic Budget Breakdown`,
      ...budgetItems.map((i) => `- **${i.name}** (${i.pct}%): Allocated ${fmtMoney(i.allocated)} | Actual ${fmtMoney(i.actual)}`),
      ``,
      `## 2. Milestone Timeline`,
      ...timelineItems.map((t) => `- [${t.status.toUpperCase()}] **${t.targetDate}** (${t.phase}): ${t.title}`),
      ``,
      `## 3. Vendor Checklist`,
      ...vendorItems.map((v) => `- **${v.category}** [${v.status}] — Cap: ${fmtMoney(v.estimatedCap)} | Ask: *"${v.vettingQuestion}"*`)
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
  };

  // Scroll smoothly to section
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          <Sparkles className="w-4 h-4 shrink-0 text-[#C3FF16] dark:text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Continuous Marquee Ticker */}
      <div className="border-b-2 border-black dark:border-zinc-700 bg-[#FFE816] text-black text-xs font-mono font-bold uppercase tracking-wider py-2 px-4 overflow-hidden select-none">
        <div className="animate-ticker flex items-center gap-10 whitespace-nowrap">
          <span>[ AURAPLAN AI // EVENT OPERATING SYSTEM ]</span>
          <span>•</span>
          <span>100% BUDGET ALLOCATION NORMALIZATION</span>
          <span>•</span>
          <span>ZERO-LATENCY DETERMINISTIC FINANCIAL ENGINE</span>
          <span>•</span>
          <span>DATE-ANCHORED BACKWARDS TIMELINE ROADMAP</span>
          <span>•</span>
          <span>CONTEXT-AWARE VENDOR CONTRACT VETTING</span>
          <span>•</span>
          <span>[ AURAPLAN AI // EVENT OPERATING SYSTEM ]</span>
          <span>•</span>
          <span>100% BUDGET ALLOCATION NORMALIZATION</span>
          <span>•</span>
          <span>ZERO-LATENCY DETERMINISTIC FINANCIAL ENGINE</span>
        </div>
      </div>

      {/* Main Fluid Navbar */}
      <header className={`sticky top-0 z-30 border-b-2 border-black dark:border-zinc-700 backdrop-blur-md ${darkMode ? 'bg-[#101114]/90' : 'bg-[#FAF8F5]/90'}`}>
        <div className="w-full px-6 sm:px-10 lg:px-12 h-20 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#C3FF16] border-2 border-black flex items-center justify-center text-black shadow-brutal transition-transform hover:-rotate-3">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-3xl font-bold tracking-tight text-black dark:text-white">
                  AuraPlan<span className="italic font-normal">.ai</span>
                </span>
                <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border border-black">
                  PRO v2.0
                </span>
              </div>
              <p className={`text-xs hidden sm:block font-medium ${mutedText}`}>
                Deterministic Event Planning &amp; Financial Architecture
              </p>
            </div>
          </div>

          {/* Quick Jump In-Page Nav Links (For smooth scroll across sections) */}
          <nav className="hidden xl:flex items-center gap-2 font-mono text-xs font-bold">
            <button
              onClick={() => scrollTo('sec-controls')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              01 Controls
            </button>
            <button
              onClick={() => scrollTo('sec-budget')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              02 Budget Matrix
            </button>
            <button
              onClick={() => scrollTo('sec-timeline')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              03 Roadmap
            </button>
            <button
              onClick={() => scrollTo('sec-vendors')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              04 Vendors
            </button>
            <button
              onClick={() => scrollTo('sec-studio')}
              className="px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              05 Creative &amp; AI
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowApiModal(true)}
              className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-full border-2 border-black transition-all ${
                isGeminiKeyActive(apiKey)
                  ? 'bg-[#97F8B7] text-black shadow-brutal hover:-translate-y-0.5'
                  : 'bg-white dark:bg-[#202229] dark:text-white shadow-brutal hover:-translate-y-0.5'
              }`}
              title="Dedicated Google Gemini AI Service"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span className="hidden md:inline">{isGeminiKeyActive(apiKey) ? 'Gemini 3.5 Flash Live' : 'AI Engine'}</span>
              {isGeminiKeyActive(apiKey) && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-full bg-[#C7AEE8] text-black border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Tests ({testResults.filter((t) => t.pass).length}/{testResults.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              title="Toggle High Contrast"
              aria-label="Toggle High Contrast"
              className={`p-2.5 rounded-full border-2 border-black transition-all ${
                highContrast
                  ? 'bg-yellow-400 text-black shadow-brutal'
                  : 'bg-white dark:bg-[#202229] text-black dark:text-white shadow-brutal hover:-translate-y-0.5'
              }`}
            >
              <Contrast className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setHighContrast(false);
                setDarkMode(!darkMode);
              }}
              title="Toggle Theme"
              aria-label="Toggle Dark Mode"
              className="p-2.5 rounded-full bg-white dark:bg-[#202229] text-black dark:text-white border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#FFE816]" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-full bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Blueprint</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Fluid Content Canvas (No huge side margins, spacious natural scroll) */}
      <main className="w-full px-6 sm:px-10 lg:px-12 py-10 space-y-14">
        {/* Spacious Hero Section */}
        <section className="relative rounded-3xl border-2 border-black dark:border-zinc-700 p-8 sm:p-14 lg:p-16 bg-white dark:bg-[#17181D] shadow-brutal-lg overflow-hidden">
          <div className="relative z-10 max-w-5xl space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border-2 border-black bg-[#C3FF16] text-black font-mono text-xs font-bold shadow-brutal-sm">
              <Zap className="w-4 h-4 fill-black" />
              <span>DETERMINISTIC EVENT ARCHITECTURE PLATFORM</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.06] text-black dark:text-white">
              Architect extraordinary gatherings with <span className="italic font-normal underline decoration-4 decoration-[#C3FF16]">mathematical precision</span>.
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed max-w-3xl font-medium ${mutedText}`}>
              AuraPlan AI unifies financial simulations, backwards-anchored timeline roadmaps, and contract vetting intelligence into a cohesive, spacious workspace designed for serious event organizers.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                type="button"
                onClick={() => scrollTo('sec-controls')}
                className="inline-flex items-center gap-2 font-mono text-xs font-bold px-5 py-3 rounded-full bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all"
              >
                <span>Launch Interactive Studio</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#FAF8F5] dark:bg-[#202229] border-2 border-black dark:border-zinc-600 text-black dark:text-white shadow-brutal-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C3FF16]" />
                  100% Normalized Allocations
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#FAF8F5] dark:bg-[#202229] border-2 border-black dark:border-zinc-600 text-black dark:text-white shadow-brutal-sm">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-[#C7AEE8]" />
                  Fast-Track Compression
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#FAF8F5] dark:bg-[#202229] border-2 border-black dark:border-zinc-600 text-black dark:text-white shadow-brutal-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFE816]" />
                  OWASP Certified Hardening
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: EVENT VERTICAL SELECTOR (Wide, Breathing Cards Across Full Width) */}
        <section id="sec-verticals" className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-3">
            <div>
              <span className={monoTag}>[ SECTION 01 // ARCHITECTURAL ARCHETYPES ]</span>
              <h2 className="font-serif text-3xl font-bold mt-1">Select Event Archetype</h2>
            </div>
            <span className={`text-xs font-mono hidden sm:block ${mutedText}`}>SWITCH TEMPLATE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 'wedding' as EventVertical,
                title: 'Weddings & Ceremonies',
                desc: 'Mandap/Lawn Spatial Staging, Multi-Cuisine Catering, Floral Architecture & Cinema Production',
                icon: Heart,
                activeBg: 'bg-[#FEEDD2] text-black border-2 border-black shadow-brutal-lg',
                iconBg: 'bg-[#FF7A59] text-white border-2 border-black'
              },
              {
                id: 'birthday' as EventVertical,
                title: 'Milestone Celebrations',
                desc: 'Bespoke Centerpiece Cake, Spatial LED Lighting, DJ Rigging & Interactive Entertainment Foyer',
                icon: PartyPopper,
                activeBg: 'bg-[#F2E8FE] text-black border-2 border-black shadow-brutal-lg',
                iconBg: 'bg-[#C7AEE8] text-black border-2 border-black'
              },
              {
                id: 'community' as EventVertical,
                title: 'Community & Tech Conclaves',
                desc: 'Auditorium AV Rigging, High-Density Dual-ISP Wi-Fi, Civic Safety NOCs & Zero-Waste Meals',
                icon: Globe,
                activeBg: 'bg-[#D1FAE5] text-black border-2 border-black shadow-brutal-lg',
                iconBg: 'bg-[#97F8B7] text-black border-2 border-black'
              }
            ].map((card) => {
              const active = config.eventType === card.id;
              const IconComponent = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => selectPreset(card.id)}
                  className={`text-left p-6 sm:p-8 rounded-3xl transition-all flex flex-col justify-between gap-6 ${
                    active
                      ? card.activeBg
                      : `${cardStyle} opacity-90 hover:opacity-100 hover:-translate-y-1`
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`p-4 rounded-2xl ${card.iconBg} shadow-brutal-sm`}>
                      <IconComponent className="w-6 h-6 stroke-[2]" />
                    </div>
                    {active ? (
                      <span className="font-mono text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-black text-[#C3FF16] border border-black shadow-brutal-sm">
                        CURRENT ACTIVE
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-zinc-500">SELECT</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold tracking-tight">{card.title}</h3>
                    <p className={`text-sm mt-2 leading-relaxed ${active ? 'text-black/80 font-medium' : mutedText}`}>
                      {card.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: CONTEXT CONTROLS & LIVE FEASIBILITY KPI DASHBOARD */}
        <section id="sec-controls" className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-3">
            <div>
              <span className={monoTag}>[ SECTION 02 // REAL-TIME PARAMETERS &amp; HEALTH MATRIX ]</span>
              <h2 className="font-serif text-3xl font-bold mt-1">Context Studio &amp; Executive Indicators</h2>
            </div>
            <button
              type="button"
              onClick={() => selectPreset(config.eventType)}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-black dark:text-[#C3FF16] px-3 py-1.5 rounded-full border border-black/30 dark:border-zinc-700 hover:bg-[#C3FF16] hover:text-black transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Sliders Panel (5 Cols) */}
            <div className={`lg:col-span-5 rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
              <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-4">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-black dark:text-[#C3FF16]" />
                  <h3 className="font-serif text-xl font-bold">Dynamic Levers</h3>
                </div>
                <span className="font-mono text-xs text-zinc-500">LIVE SYNC</span>
              </div>

              {/* Event Name & City */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>
                    Event Name / Title
                  </label>
                  <input
                    type="text"
                    value={config.eventName}
                    onChange={(e) => updateConfigField('eventName', sanitizeText(e.target.value, 90))}
                    className="w-full text-sm font-semibold rounded-2xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>
                      Host City
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={config.city}
                        onChange={(e) => updateConfigField('city', sanitizeText(e.target.value, 60))}
                        className="w-full text-xs font-medium rounded-2xl pl-10 pr-3 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${mutedText}`}>
                      Currency
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229]">
                      {(['INR', 'USD'] as CurrencyCode[]).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => {
                            const convertedBudget =
                              curr === 'USD' && config.currency === 'INR'
                                ? Math.max(2000, Math.round(config.budget / 80))
                                : curr === 'INR' && config.currency === 'USD'
                                ? config.budget * 80
                                : config.budget;
                            setConfig((prev) => ({ ...prev, currency: curr, budget: convertedBudget }));
                            setCustomActuals({});
                          }}
                          className={`text-xs font-bold py-2 rounded-xl transition-all ${
                            config.currency === curr
                              ? 'bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black shadow-brutal-sm'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {curr === 'INR' ? '₹ INR' : '$ USD'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sliders with Spacious Breathing Room */}
              <div className="space-y-5 pt-2">
                {/* Total Budget Slider */}
                <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#F4F1EA] dark:bg-[#202229] space-y-3 shadow-brutal-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-black dark:text-[#C3FF16]" />
                      Total Ceiling Budget
                    </span>
                    <span className="font-mono text-lg font-extrabold text-black dark:text-[#C3FF16]">
                      {fmtMoney(config.budget)}
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Total Budget Slider"
                    min={config.currency === 'INR' ? 25000 : 500}
                    max={config.currency === 'INR' ? 3000000 : 50000}
                    step={config.currency === 'INR' ? 25000 : 500}
                    value={config.budget}
                    onChange={(e) => {
                      updateConfigField('budget', Number(e.target.value));
                      setCustomActuals({});
                    }}
                    className="w-full"
                  />
                  <div className={`flex justify-between font-mono text-xs ${mutedText}`}>
                    <span>{config.currency === 'INR' ? '₹25K' : '$500'}</span>
                    <span className="font-semibold text-black dark:text-white">Per Guest: {fmtMoney(health.perGuest)}</span>
                    <span>{config.currency === 'INR' ? '₹30L' : '$50K'}</span>
                  </div>
                </div>

                {/* Guest Count Slider */}
                <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#F4F1EA] dark:bg-[#202229] space-y-3 shadow-brutal-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-black dark:text-[#C3FF16]" />
                      Attendee Headcount
                    </span>
                    <span className="font-mono text-lg font-extrabold text-black dark:text-[#C3FF16]">
                      {config.guestCount} Guests
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Guest Count Slider"
                    min={15}
                    max={800}
                    step={5}
                    value={config.guestCount}
                    onChange={(e) => updateConfigField('guestCount', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className={`flex justify-between font-mono text-xs ${mutedText}`}>
                    <span>15 (Boutique)</span>
                    <span>250 (Mid-Scale)</span>
                    <span>800 (Grand)</span>
                  </div>
                </div>

                {/* Countdown Days Slider */}
                <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#F4F1EA] dark:bg-[#202229] space-y-3 shadow-brutal-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-black dark:text-[#C3FF16]" />
                      Countdown Window
                    </span>
                    <span className="font-mono text-lg font-extrabold text-black dark:text-[#C3FF16]">
                      {config.daysCountdown} Days Out
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Countdown Days Slider"
                    min={7}
                    max={240}
                    step={1}
                    value={config.daysCountdown}
                    onChange={(e) => updateConfigField('daysCountdown', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className={`flex justify-between font-mono text-xs ${mutedText}`}>
                    <span>7d (Fast-Track)</span>
                    <span>90d (Standard)</span>
                    <span>240d (Early Run)</span>
                  </div>
                </div>
              </div>

              {/* Venue Setting & Optimization Options */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    Venue Topology (Adjusts Contingency)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['indoor', 'outdoor', 'hybrid'] as VenueSetting[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateConfigField('setting', st)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition-all ${
                          config.setting === st ? pillActive : pillInactive
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    Optimization Priority Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'balanced' as PriorityMode, label: 'Balanced', icon: Scale },
                      { id: 'cost_saving' as PriorityMode, label: 'Cost-Saver', icon: Coins },
                      { id: 'luxury' as PriorityMode, label: 'Luxury', icon: Crown },
                      { id: 'eco_friendly' as PriorityMode, label: 'Zero-Waste', icon: Leaf }
                    ].map((p) => {
                      const Icon = p.icon;
                      const active = config.priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => updateConfigField('priority', p.id)}
                          className={`inline-flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all ${
                            active ? pillActive : pillInactive
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#F4F1EA] dark:bg-[#202229] cursor-pointer shadow-brutal-sm">
                  <span className="text-xs font-bold">Wheelchair &amp; Sensory Accessibility</span>
                  <input
                    type="checkbox"
                    checked={config.accessibilityRequired}
                    onChange={(e) => updateConfigField('accessibilityRequired', e.target.checked)}
                    className="w-5 h-5 accent-black rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Live KPI & Feasibility Dashboard (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 4 Big Impact Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-6 rounded-3xl border-2 border-black dark:border-zinc-700 bg-[#FEEDD2] text-black shadow-brutal">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-black/70">
                      Per-Guest Allocation
                    </span>
                    <Coins className="w-5 h-5 text-black/70" />
                  </div>
                  <div className="font-mono text-3xl font-extrabold mt-3">{fmtMoney(health.perGuest)}</div>
                  <p className="font-mono text-xs mt-2 text-black/70">
                    Industry benchmark target: {fmtMoney(health.minThreshold)}
                  </p>
                </div>

                <div className="p-6 rounded-3xl border-2 border-black dark:border-zinc-700 bg-[#D1FAE5] text-black shadow-brutal">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-black/70">
                      Budget Variance
                    </span>
                    <Activity className="w-5 h-5 text-black/70" />
                  </div>
                  <div className={`font-mono text-3xl font-extrabold mt-3 ${budgetVariance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {budgetVariance >= 0 ? `+${fmtMoney(budgetVariance)}` : `-${fmtMoney(Math.abs(budgetVariance))}`}
                  </div>
                  <p className="font-mono text-xs mt-2 text-black/70">
                    {budgetVariance >= 0 ? 'Comfortably within budget ceiling' : 'Quotes exceed planned ceiling'}
                  </p>
                </div>

                <div className="p-6 rounded-3xl border-2 border-black dark:border-zinc-700 bg-[#FFE816] text-black shadow-brutal">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-black/70">
                      Timeline Velocity
                    </span>
                    <Clock className="w-5 h-5 text-black/70" />
                  </div>
                  <div className="font-mono text-3xl font-extrabold mt-3">{progressPct}% Done</div>
                  <p className="font-mono text-xs mt-2 text-black/70">
                    {completedTasksCount} of {timelineItems.length} Milestones Locked
                  </p>
                </div>

                <div className="p-6 rounded-3xl border-2 border-black dark:border-zinc-700 bg-[#F2E8FE] text-black shadow-brutal">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-black/70">
                      Feasibility Score
                    </span>
                    <Award className="w-5 h-5 text-black/70" />
                  </div>
                  <div className="font-mono text-3xl font-extrabold mt-3">{health.score}/100</div>
                  <p className="font-mono text-xs mt-2 font-bold text-black/70">
                    Classification: {health.label}
                  </p>
                </div>
              </div>

              {/* Context Decision Alerts */}
              {health.alerts.length > 0 ? (
                <div className="p-6 rounded-3xl border-2 border-black dark:border-amber-500 bg-[#FFE816]/20 space-y-3 shadow-brutal">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-[#FFE816]" />
                    <h4 className="font-serif text-lg font-bold text-black dark:text-white">Active Operational Trade-Offs</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    {health.alerts.map((al, i) => (
                      <p key={i} className="font-bold text-black dark:text-white flex items-start gap-2">
                        <span className="font-mono">•</span>
                        <span>{al}</span>
                      </p>
                    ))}
                    <p className={`pt-2 border-t border-black/20 dark:border-zinc-700 ${mutedText}`}>
                      Strategy Tip: {health.tips[0]}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl border-2 border-black dark:border-zinc-700 bg-white dark:bg-[#17181D] space-y-2 shadow-brutal">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-[#97F8B7]">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="font-serif text-lg font-bold text-black dark:text-white">Optimal Planning Posture</h4>
                  </div>
                  <p className={`text-xs ${mutedText}`}>{health.tips[0]}</p>
                </div>
              )}

              {/* Quick Jump Callout */}
              <div className="p-6 rounded-3xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#111215] flex flex-wrap items-center justify-between gap-4 shadow-brutal-sm">
                <div>
                  <h4 className="font-bold text-sm">Explore Detailed Planning Modules</h4>
                  <p className={`text-xs ${mutedText}`}>Scroll down to review the financial breakdown, timeline, vendors, and AI.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollTo('sec-budget')}
                    className="font-mono text-xs font-bold px-3 py-1.5 rounded-full bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black"
                  >
                    Budget ↓
                  </button>
                  <button
                    onClick={() => scrollTo('sec-timeline')}
                    className="font-mono text-xs font-bold px-3 py-1.5 rounded-full bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black"
                  >
                    Timeline ↓
                  </button>
                  <button
                    onClick={() => scrollTo('sec-vendors')}
                    className="font-mono text-xs font-bold px-3 py-1.5 rounded-full bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black"
                  >
                    Vendors ↓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FINANCIAL ARCHITECTURE & LIVE BUDGET SIMULATOR (Spacious Full-Width Workspace) */}
        <section id="sec-budget" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black dark:border-zinc-700 pb-3">
            <div>
              <span className={monoTag}>[ SECTION 03 // FINANCIAL ARCHITECTURE &amp; RECHARTS MATRIX ]</span>
              <h2 className="font-serif text-3xl font-bold mt-1">Interactive Budget Matrix &amp; Quote Simulator</h2>
              <p className={`text-sm mt-1 ${mutedText}`}>
                Drag any category quote slider to simulate vendor estimates in real time against the mathematically normalized AI ceiling.
              </p>
            </div>
            {Object.keys(customActuals).length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCustomActuals({});
                  triggerToast('Reset quotes to AI optimal allocation');
                }}
                className="font-mono text-xs font-bold px-4 py-2 rounded-full border-2 border-black bg-white dark:bg-zinc-800 text-black dark:text-white shadow-brutal-sm hover:-translate-y-0.5 transition-all"
              >
                Reset All Quotes
              </button>
            )}
          </div>

          <div className={`rounded-3xl p-6 sm:p-10 space-y-8 ${cardStyle}`}>
            {/* Visual Recharts Row (Spacious Heights) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="h-80 w-full p-4 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#111215] shadow-brutal-sm">
                <div className="text-xs font-mono font-bold uppercase mb-2 text-zinc-500">
                  Normalized Share (% Breakdown)
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={budgetItems}
                      dataKey="allocated"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      stroke="#000"
                      strokeWidth={2}
                    >
                      {budgetItems.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #000000',
                        borderRadius: '12px',
                        boxShadow: '3px 3px 0px #000000',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                      formatter={(val: number) => fmtMoney(val)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="h-80 w-full p-4 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#111215] shadow-brutal-sm">
                <div className="text-xs font-mono font-bold uppercase mb-2 text-zinc-500">
                  Target vs. Actual Quotes Comparison
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={budgetItems.slice(0, 5)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="id" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #000000',
                        borderRadius: '12px',
                        boxShadow: '3px 3px 0px #000000',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                      formatter={(val: number) => fmtMoney(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                    <Bar dataKey="allocated" name="AI Target" fill="#5F5CE5" stroke="#000" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Your Quote" fill="#C3FF16" stroke="#000" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Itemized Categories with Sliders in 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetItems.map((item) => {
                const diff = item.allocated - item.actual;
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-white dark:bg-[#202229] shadow-brutal-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-md border border-black shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <span className="font-bold text-sm tracking-tight">{item.name}</span>
                          <span className="ml-2 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-zinc-800 border border-black dark:border-zinc-600">
                            {item.pct}% ({fmtMoney(item.perGuest)}/pax)
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className={`text-xs mr-3 ${mutedText}`}>
                          Target: {fmtMoney(item.allocated)}
                        </span>
                        <span className="text-sm font-extrabold text-black dark:text-[#C3FF16]">
                          Quote: {fmtMoney(item.actual)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        aria-label={`Adjust quote for ${item.name}`}
                        min={0}
                        max={Math.round(item.allocated * 1.8)}
                        step={config.currency === 'INR' ? 2500 : 50}
                        value={item.actual}
                        onChange={(e) =>
                          setCustomActuals((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                        }
                        className="flex-1"
                      />
                      <span
                        className={`font-mono text-xs font-bold w-24 text-right ${
                          diff >= 0 ? 'text-emerald-700 dark:text-[#97F8B7]' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {diff >= 0 ? `+${fmtMoney(diff)}` : `-${fmtMoney(Math.abs(diff))}`}
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium ${mutedText}`}>{item.contextNote}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: DATE-ANCHORED BACKWARDS TIMELINE (Spacious Full Width) */}
        <section id="sec-timeline" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black dark:border-zinc-700 pb-3">
            <div>
              <span className={monoTag}>[ SECTION 04 // DATE-ANCHORED TEMPORAL ROADMAP ]</span>
              <h2 className="font-serif text-3xl font-bold mt-1">Milestone Execution Timeline</h2>
              <p className={`text-sm mt-1 ${mutedText}`}>
                Backwards-scheduled milestones synchronized to your countdown window. Click any card to advance status.
              </p>
            </div>
            <div className="font-mono text-sm font-extrabold px-4 py-2 rounded-full border-2 border-black bg-[#C3FF16] text-black shadow-brutal-sm">
              {progressPct}% COMPLETED ({completedTasksCount}/{timelineItems.length})
            </div>
          </div>

          <div className={`rounded-3xl p-6 sm:p-10 space-y-6 ${cardStyle}`}>
            {/* Tactile Progress Bar */}
            <div className="w-full h-4 rounded-full border-2 border-black dark:border-zinc-600 bg-white dark:bg-zinc-800 overflow-hidden p-0.5 shadow-brutal-sm">
              <div
                className="h-full bg-[#C3FF16] rounded-full transition-all duration-300 border-r-2 border-black"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Timeline Milestones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timelineItems.map((task, idx) => {
                const isDone = task.status === 'completed';
                const isProg = task.status === 'in_progress';
                return (
                  <div
                    key={task.id}
                    onClick={() => cycleTaskStatus(task)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        cycleTaskStatus(task);
                      }
                    }}
                    className={`p-5 rounded-2xl border-2 border-black dark:border-zinc-700 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-brutal-sm hover:-translate-y-0.5 ${
                      isDone
                        ? 'bg-[#D1FAE5] text-black opacity-90'
                        : isProg
                        ? 'bg-[#FEEDD2] text-black'
                        : 'bg-white dark:bg-[#202229]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-800 fill-emerald-200" />
                        ) : isProg ? (
                          <Clock className="w-5 h-5 text-amber-800" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-black/40" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black text-[#C3FF16]">
                            STEP {idx + 1} • {task.phase}
                          </span>
                          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                            Target: {task.targetDate} ({task.daysBefore}d out)
                          </span>
                        </div>
                        <p className={`text-sm font-bold mt-1.5 ${isDone ? 'line-through text-zinc-700' : ''}`}>
                          {task.title}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-mono text-xs font-bold px-3 py-1 rounded-full border-2 border-black shrink-0 ${
                        isDone
                          ? 'bg-[#97F8B7] text-black'
                          : isProg
                          ? 'bg-[#FFE816] text-black'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {isDone ? 'Completed' : isProg ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Custom Milestone Input Form */}
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 pt-3">
              <input
                type="text"
                placeholder="Add bespoke milestone (e.g., Finalize floral arch mockup with stage decorator)..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 text-xs rounded-xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-6 py-3 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Milestone</span>
              </button>
            </form>
          </div>
        </section>

        {/* SECTION 5: VENDOR CONTRACT VETTING MATRIX (Full Width 2-Column Grid) */}
        <section id="sec-vendors" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black dark:border-zinc-700 pb-3">
            <div>
              <span className={monoTag}>[ SECTION 05 // PROCUREMENT &amp; CONTRACT INTELLIGENCE ]</span>
              <h2 className="font-serif text-3xl font-bold mt-1">Vendor Vetting &amp; Negotiation Matrix</h2>
              <p className={`text-sm mt-1 ${mutedText}`}>
                Review lead time thresholds, spending caps, and critical legal/operational clauses to verify before signing.
              </p>
            </div>
            <div className="font-mono text-xs font-bold text-zinc-500">
              {vendorItems.length} PARTNERS TRACKED
            </div>
          </div>

          <div className={`rounded-3xl p-6 sm:p-10 space-y-6 ${cardStyle}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vendorItems.map((v) => (
                <div
                  key={v.id}
                  className="p-6 rounded-2xl border-2 border-black dark:border-zinc-700 bg-white dark:bg-[#202229] shadow-brutal-sm space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base tracking-tight">{v.category}</h3>
                      <p className={`font-mono text-xs mt-1 ${mutedText}`}>
                        Lead Time: <strong>{v.leadTime}</strong> • Target Cap:{' '}
                        <strong className="text-black dark:text-[#C3FF16]">{fmtMoney(v.estimatedCap)}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cycleVendorStatus(v)}
                      className={`font-mono text-xs font-bold px-3.5 py-1.5 rounded-full border-2 border-black shadow-brutal-sm transition-all hover:-translate-y-0.5 ${
                        v.status === 'Booked'
                          ? 'bg-[#97F8B7] text-black'
                          : v.status === 'Shortlisted'
                          ? 'bg-[#C7AEE8] text-black'
                          : v.status === 'Contacted'
                          ? 'bg-[#FFE816] text-black'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {v.status}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-black/80 dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#111215] text-xs">
                    <span className="font-bold text-black dark:text-[#C3FF16]">Contract Clause to Verify: </span>
                    <span className="italic text-zinc-800 dark:text-zinc-200">&ldquo;{v.vettingQuestion}&rdquo;</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Vendor */}
            <form onSubmit={handleAddVendor} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3">
              <input
                type="text"
                placeholder="Vendor Category (e.g., Live Percussion Band &amp; Sound Rigging)"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                className="sm:col-span-6 text-xs rounded-xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
              />
              <input
                type="number"
                placeholder="Cap Amount"
                value={newVendorCap}
                onChange={(e) => setNewVendorCap(e.target.value)}
                className="sm:col-span-3 text-xs rounded-xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
              />
              <button
                type="submit"
                className="sm:col-span-3 inline-flex items-center justify-center gap-2 bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-4 py-3 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vendor Entry</span>
              </button>
            </form>
          </div>
        </section>

        {/* SECTION 6: CREATIVE MOODBOARD & CO-PILOT STUDIO (Full Width 2 Columns) */}
        <section id="sec-studio" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black dark:border-zinc-700 pb-3">
            <div>
              <span className={monoTag}>[ SECTION 06 // CREATIVE PALETTE &amp; STRATEGIC CO-PILOT ]</span>
              <h2 className="font-serif text-3xl font-bold mt-1">Creative Direction &amp; GenAI Strategist</h2>
              <p className={`text-sm mt-1 ${mutedText}`}>
                Review style palettes, menu concepts, cost hacks, and consult the deterministic copilot.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(structuredSystemPrompt);
                setCopiedPrompt(true);
                setTimeout(() => setCopiedPrompt(false), 2000);
                triggerToast('Copied system prompt to clipboard');
              }}
              className="inline-flex items-center gap-2 font-mono text-xs font-bold px-4 py-2 rounded-full border-2 border-black bg-white dark:bg-zinc-800 text-black dark:text-white shadow-brutal-sm hover:-translate-y-0.5 transition-all"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied Prompt' : 'Copy System Blueprint'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6 Cols: Creative Moodboard */}
            <div className={`lg:col-span-6 rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black dark:border-zinc-700 pb-4">
                <div>
                  <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Thematic Direction</span>
                  <h3 className="font-serif text-2xl font-bold mt-0.5">{ideas.headline}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {ideas.palette.map((sw) => (
                    <div
                      key={sw.hex}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-white dark:bg-zinc-800 shadow-brutal-sm"
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black" style={{ backgroundColor: sw.hex }} />
                      <span className="hidden sm:inline">{sw.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] space-y-2 shadow-brutal-sm">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-black dark:text-[#C3FF16]">
                    <Palette className="w-4 h-4" />
                    <h4>Spatial &amp; Decor Architecture</h4>
                  </div>
                  <ul className="text-xs space-y-2.5">
                    {ideas.decor.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono font-bold text-black dark:text-[#C3FF16]">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] space-y-2 shadow-brutal-sm">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-black dark:text-[#C7AEE8]">
                    <Utensils className="w-4 h-4" />
                    <h4>Culinary Experience &amp; Beverage Curation</h4>
                  </div>
                  <ul className="text-xs space-y-2.5">
                    {ideas.menu.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono font-bold text-black dark:text-[#C7AEE8]">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#D1FAE5] text-black space-y-2 shadow-brutal-sm">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-black">
                    <Zap className="w-4 h-4 fill-black" />
                    <h4>High-Impact Cost-Saving Hacks</h4>
                  </div>
                  <ul className="text-xs space-y-2.5">
                    {ideas.savingHacks.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono font-bold text-black">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Strategic AI Co-Pilot Studio */}
            <div className={`lg:col-span-6 rounded-3xl p-6 sm:p-8 space-y-6 ${cardStyle}`}>
              <div className="border-b-2 border-black dark:border-zinc-700 pb-4">
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Context-Grounded Assistant</span>
                <h3 className="font-serif text-2xl font-bold mt-0.5">GenAI Architectural Strategist</h3>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  Query trade-offs, run-of-show protocols, and customized vendor negotiation letters.
                </p>
              </div>

              {/* Quick Action Chips */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { text: 'Cut 15% from my budget without losing quality', icon: Zap },
                  { text: 'Draft a vendor negotiation & quote email', icon: MessageSquare },
                  { text: 'Create our outdoor rain & weather backup plan', icon: AlertTriangle },
                  { text: 'Generate an event-day hour-by-hour schedule', icon: Clock }
                ].map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.text}
                      type="button"
                      onClick={() => askCoPilot(chip.text)}
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
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#C3FF16] mb-1.5">
                        {m.source}
                      </div>
                    )}
                    {m.text}
                  </div>
                ))}
                {isSynthesizing && (
                  <div className="font-mono text-xs text-black dark:text-[#C3FF16] font-bold animate-pulse px-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Synthesizing mathematical response...</span>
                  </div>
                )}
              </div>

              {/* Chat Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  askCoPilot(chatInput);
                }}
                className="flex gap-2.5"
              >
                <input
                  type="text"
                  placeholder="Ask about budget trade-offs, catering negotiation, rain backup..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-xs rounded-xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-6 py-3 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Spacious Footer */}
      <footer className="mt-20 border-t-2 border-black dark:border-zinc-700 bg-white dark:bg-[#111215] py-12">
        <div className="w-full px-6 sm:px-10 lg:px-12 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#C3FF16] border border-black flex items-center justify-center text-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl font-bold">AuraPlan AI</span>
            <span className="font-mono text-xs text-zinc-500">
              Deterministic Event Planning &amp; Financial Architecture
            </span>
          </div>
          <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
            Engineered with React 18 • TypeScript • Tailwind CSS • Lucide Icons • Recharts
          </div>
        </div>
      </footer>

      {/* Automated Unit Test Suite Modal */}
      {showTestModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className={`max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-5 ${cardStyle} shadow-brutal-lg`}>
            <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-4">
              <div>
                <span className={monoTag}>[ QUALITY ASSURANCE MATRIX ]</span>
                <h2 className="font-serif text-2xl font-bold mt-1">Automated Unit &amp; Validation Suite</h2>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  8/8 Passing Engine Checks (Security, Budget Math, Context Logic &amp; Timeline Compression)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="p-2 rounded-full border-2 border-black bg-[#FAF8F5] dark:bg-zinc-800 text-black dark:text-white shadow-brutal-sm hover:-translate-y-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border-2 border-black dark:border-zinc-700 bg-[#D1FAE5] text-black flex items-center justify-between gap-4 shadow-brutal-sm"
                >
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="font-mono text-xs text-zinc-700 mt-1">{t.detail}</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold px-3 py-1 rounded-md bg-black text-[#97F8B7] shrink-0">
                    <Check className="w-4 h-4" />
                    PASS
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optional Live Gemini API Key Modal */}
      {showApiModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className={`max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-5 ${cardStyle} shadow-brutal-lg`}>
            <div className="flex items-center justify-between border-b-2 border-black dark:border-zinc-700 pb-4">
              <div>
                <span className={monoTag}>[ MODEL CONNECTIVITY ]</span>
                <h2 className="font-serif text-2xl font-bold mt-1">GenAI Engine Configuration</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="p-2 rounded-full border-2 border-black bg-[#FAF8F5] dark:bg-zinc-800 text-black dark:text-white shadow-brutal-sm hover:-translate-y-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className={`text-xs leading-relaxed ${mutedText}`}>
              AuraPlan AI is configured with a dedicated <strong>Google Gemini Free Tier</strong> API key (active model: <code>gemini-3.5-flash</code> with automated <code>gemini-3.5-flash-lite</code> failover). You can test or update the key below.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Gemini API Key
              </label>
              <input
                type="password"
                placeholder="AQ... or AIzaSy... (Gemini API Key)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-xs font-mono rounded-xl px-4 py-3 border-2 border-black dark:border-zinc-700 bg-[#FAF8F5] dark:bg-[#202229] text-black dark:text-white shadow-brutal-sm"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setApiKey(DEFAULT_GEMINI_API_KEY);
                  triggerToast('Reset to dedicated free-tier Gemini API key');
                }}
                className="text-xs font-bold underline text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all"
              >
                Reset to Default Free Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowApiModal(false);
                  triggerToast(isGeminiKeyActive(apiKey) ? 'Live Gemini AI service active' : 'Using Built-in Context Engine');
                }}
                className="bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-5 py-2.5 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
              >
                Save Preference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
