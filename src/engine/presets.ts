// ============================================================================
// AuraPlan AI — Default Vertical Presets
// ============================================================================

import { EventConfig, EventVertical } from '../types';

export const VERTICAL_PRESETS: Record<EventVertical, EventConfig> = {
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
