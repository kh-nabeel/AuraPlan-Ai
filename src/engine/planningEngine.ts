// ============================================================================
// AuraPlan AI — Context-Driven Pure Planning & Financial Engine
// ============================================================================

import {
  EventConfig,
  BudgetCategory,
  EventVertical,
  CurrencyCode,
  EventHealthSummary,
  MilestoneItem,
  VendorItem,
  CreativeIdeas
} from '../types';
import { computeTargetDate } from '../utils/formatters';

export const CHART_PALETTE = [
  '#5F5CE5',
  '#C3FF16',
  '#FF7A59',
  '#C7AEE8',
  '#97F8B7',
  '#FFE816',
  '#0D0D0D'
];

export const BASE_SPLITS: Record<
  EventVertical,
  Array<{ id: string; name: string; pct: number; priority: 'Critical' | 'High' | 'Medium' }>
> = {
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

export const MIN_PER_GUEST: Record<CurrencyCode, Record<EventVertical, number>> = {
  INR: { wedding: 1800, birthday: 700, community: 350 },
  USD: { wedding: 65, birthday: 25, community: 15 }
};

/**
 * Computes deterministic budget distribution normalized to 100% and exact monetary sum.
 * Adapts to outdoor/hybrid weather contingencies and optimization priorities.
 */
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

  // Normalize percentages strictly to 100%
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

  // Distribute exact currency values with zero rounding leakage
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

/**
 * Evaluates feasibility score, financial health, and schedule constraints.
 */
export function evaluateEventHealth(config: EventConfig): EventHealthSummary {
  const perGuest = Math.round(config.budget / Math.max(1, config.guestCount));
  const minThreshold = MIN_PER_GUEST[config.currency][config.eventType];
  let score = 94;
  const alerts: string[] = [];
  const tips: string[] = [];

  const sym = config.currency === 'INR' ? '₹' : '$';

  if (perGuest < minThreshold) {
    score -= 22;
    alerts.push(
      `Tight Per-Guest Budget (${sym}${perGuest.toLocaleString()}/guest vs recommended ${sym}${minThreshold.toLocaleString()}).`
    );
    tips.push('Switch from plated service to 2 curated live stations or trim guest count by 15% to restore cushion.');
  } else {
    tips.push(
      `Healthy per-guest allocation (${sym}${perGuest.toLocaleString()}/guest) comfortably supports quality vendors.`
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

/**
 * Computes backwards date-anchored milestone timeline with Fast-Track compression.
 */
export function computeTimeline(config: EventConfig): MilestoneItem[] {
  const d = Math.max(3, config.daysCountdown);
  const fast = d < 30;
  const prefix = fast ? '[Fast-Track] ' : '';

  const templates: Record<
    EventVertical,
    Array<{ phase: string; title: string; ratio: number; priority: 'Critical' | 'High' | 'Medium' }>
  > = {
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
      targetDate: computeTargetDate(d, daysBefore),
      priority: item.priority,
      status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending'
    };
  });
}

/**
 * Computes context-specific vendor checklist and contract vetting questions.
 */
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

/**
 * Generates personalized theme palette, decor styling, culinary menu, and cost-saving hacks.
 */
export function generateCreativeIdeas(config: EventConfig): CreativeIdeas {
  const bank: Record<EventVertical, CreativeIdeas> = {
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
