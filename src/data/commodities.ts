import { Commodity } from '../types/economy';

export const COMMODITIES: Record<string, Commodity> = {
  // Raw Materials
  'iron-ore': {
    id: 'iron-ore',
    name: 'Iron Ore',
    category: 'raw-materials',
    description: 'Basic metallic ore used in manufacturing and construction',
    basePrice: 45,
    unitSize: 1,
    unitMass: 2.5,
    volatility: 0.2,
    legalStatus: 'legal',
    perishable: false
  },
  
  'carbon-crystals': {
    id: 'carbon-crystals',
    name: 'Carbon Crystals',
    category: 'raw-materials',
    description: 'High-grade carbon formations used in electronics and weapons',
    basePrice: 120,
    unitSize: 1,
    unitMass: 0.8,
    volatility: 0.3,
    legalStatus: 'legal',
    perishable: false
  },
  
  'rare-earth-elements': {
    id: 'rare-earth-elements',
    name: 'Rare Earth Elements',
    category: 'raw-materials',
    description: 'Exotic elements essential for advanced technology',
    basePrice: 850,
    unitSize: 1,
    unitMass: 1.2,
    volatility: 0.5,
    legalStatus: 'legal',
    perishable: false
  },

  'titanium-ore': {
    id: 'titanium-ore',
    name: 'Titanium Ore',
    category: 'raw-materials',
    description: 'Lightweight, strong metal ore used in ship hull construction',
    basePrice: 180,
    unitSize: 1,
    unitMass: 3.2,
    volatility: 0.25,
    legalStatus: 'legal',
    perishable: false
  },

  'copper-ore': {
    id: 'copper-ore',
    name: 'Copper Ore',
    category: 'raw-materials',
    description: 'Conductive metal ore essential for ship wiring and electronics',
    basePrice: 65,
    unitSize: 1,
    unitMass: 2.8,
    volatility: 0.2,
    legalStatus: 'legal',
    perishable: false
  },
  
  // Manufactured Goods
  'steel-alloys': {
    id: 'steel-alloys',
    name: 'Steel Alloys',
    category: 'manufactured',
    description: 'Refined metal alloys used in ship construction',
    basePrice: 150,
    unitSize: 1,
    unitMass: 4.0,
    volatility: 0.15,
    legalStatus: 'legal',
    perishable: false
  },

  'titanium-plates': {
    id: 'titanium-plates',
    name: 'Titanium Plates',
    category: 'manufactured',
    description: 'Processed titanium hull plating for ship construction',
    basePrice: 420,
    unitSize: 2,
    unitMass: 6.0,
    volatility: 0.2,
    legalStatus: 'legal',
    perishable: false
  },

  'ship-components': {
    id: 'ship-components',
    name: 'Ship Components',
    category: 'manufactured',
    description: 'Basic ship parts including wiring, fittings, and subsystems',
    basePrice: 680,
    unitSize: 2,
    unitMass: 3.5,
    volatility: 0.25,
    legalStatus: 'legal',
    perishable: false
  },

  'fusion-drives': {
    id: 'fusion-drives',
    name: 'Fusion Drives',
    category: 'manufactured',
    description: 'Advanced ship propulsion systems',
    basePrice: 2800,
    unitSize: 4,
    unitMass: 12.0,
    volatility: 0.3,
    legalStatus: 'legal',
    perishable: false
  },

  'ship-hulls': {
    id: 'ship-hulls',
    name: 'Ship Hulls',
    category: 'manufactured',
    description: 'Complete ship hull assemblies ready for outfitting',
    basePrice: 4200,
    unitSize: 8,
    unitMass: 25.0,
    volatility: 0.2,
    legalStatus: 'legal',
    perishable: false
  },

  'complete-ships': {
    id: 'complete-ships',
    name: 'Complete Ships',
    category: 'manufactured',
    description: 'Fully assembled starships ready for delivery',
    basePrice: 15000,
    unitSize: 20,
    unitMass: 100.0,
    volatility: 0.4,
    legalStatus: 'legal',
    perishable: false
  },

  'electronics': {
    id: 'electronics',
    name: 'Electronics',
    category: 'manufactured',
    description: 'Consumer and industrial electronic components',
    basePrice: 280,
    unitSize: 1,
    unitMass: 0.5,
    volatility: 0.25,
    legalStatus: 'legal',
    perishable: false
  },
  
  'machinery': {
    id: 'machinery',
    name: 'Machinery',
    category: 'manufactured',
    description: 'Industrial equipment and mechanical systems',
    basePrice: 520,
    unitSize: 3,
    unitMass: 8.0,
    volatility: 0.2,
    legalStatus: 'legal',
    perishable: false
  },
  
  'medical-supplies': {
    id: 'medical-supplies',
    name: 'Medical Supplies',
    category: 'manufactured',
    description: 'Pharmaceuticals and medical equipment',
    basePrice: 380,
    unitSize: 1,
    unitMass: 0.3,
    volatility: 0.15,
    legalStatus: 'legal',
    perishable: true,
    shelfLife: 180 // 6 months
  },
  
  // Food
  'protein-rations': {
    id: 'protein-rations',
    name: 'Protein Rations',
    category: 'food',
    description: 'Processed protein bars and supplements',
    basePrice: 25,
    unitSize: 1,
    unitMass: 0.8,
    volatility: 0.1,
    legalStatus: 'legal',
    perishable: true,
    shelfLife: 90 // 3 months
  },
  
  'hydroponic-produce': {
    id: 'hydroponic-produce',
    name: 'Hydroponic Produce',
    category: 'food',
    description: 'Fresh fruits and vegetables grown in controlled environments',
    basePrice: 85,
    unitSize: 2,
    unitMass: 1.5,
    volatility: 0.3,
    legalStatus: 'legal',
    perishable: true,
    shelfLife: 14 // 2 weeks
  },
  
  // Energy
  'fusion-cells': {
    id: 'fusion-cells',
    name: 'Fusion Cells',
    category: 'energy',
    description: 'Compact fusion power sources for ships and equipment',
    basePrice: 450,
    unitSize: 1,
    unitMass: 2.0,
    volatility: 0.15,
    legalStatus: 'legal',
    perishable: false
  },
  
  'antimatter-pods': {
    id: 'antimatter-pods',
    name: 'Antimatter Pods',
    category: 'energy',
    description: 'Highly dangerous but efficient antimatter fuel',
    basePrice: 2500,
    unitSize: 1,
    unitMass: 0.1,
    volatility: 0.4,
    legalStatus: 'restricted',
    perishable: false
  },
  
  // Technology
  'quantum-processors': {
    id: 'quantum-processors',
    name: 'Quantum Processors',
    category: 'technology',
    description: 'Advanced computing cores using quantum effects',
    basePrice: 1800,
    unitSize: 1,
    unitMass: 0.2,
    volatility: 0.35,
    legalStatus: 'legal',
    perishable: false
  },
  
  'neural-interfaces': {
    id: 'neural-interfaces',
    name: 'Neural Interfaces',
    category: 'technology',
    description: 'Direct brain-computer interface technology',
    basePrice: 3200,
    unitSize: 1,
    unitMass: 0.1,
    volatility: 0.45,
    legalStatus: 'restricted',
    perishable: false
  },
  
  // Luxury Goods
  'exotic-spices': {
    id: 'exotic-spices',
    name: 'Exotic Spices',
    category: 'luxury',
    description: 'Rare culinary spices from distant worlds',
    basePrice: 180,
    unitSize: 1,
    unitMass: 0.2,
    volatility: 0.4,
    legalStatus: 'legal',
    perishable: true,
    shelfLife: 365 // 1 year
  },
  
  'art-objects': {
    id: 'art-objects',
    name: 'Art Objects',
    category: 'luxury',
    description: 'Valuable cultural artifacts and artistic creations',
    basePrice: 650,
    unitSize: 2,
    unitMass: 1.0,
    volatility: 0.6,
    legalStatus: 'legal',
    perishable: false
  },
  
  // Illegal/Restricted
  'combat-stims': {
    id: 'combat-stims',
    name: 'Combat Stimulants',
    category: 'manufactured',
    description: 'Military-grade performance enhancing drugs',
    basePrice: 480,
    unitSize: 1,
    unitMass: 0.1,
    volatility: 0.7,
    legalStatus: 'illegal',
    perishable: true,
    shelfLife: 30 // 1 month
  },
  
  'black-market-data': {
    id: 'black-market-data',
    name: 'Black Market Data',
    category: 'technology',
    description: 'Stolen corporate secrets and classified information',
    basePrice: 1200,
    unitSize: 1,
    unitMass: 0.01,
    volatility: 0.8,
    legalStatus: 'illegal',
    perishable: true,
    shelfLife: 7 // 1 week before it becomes stale
  }
};

// Helper function to get commodity by ID
export function getCommodity(id: string): Commodity | undefined {
  return COMMODITIES[id];
}

// Helper function to get all commodities by category
export function getCommoditiesByCategory(category: Commodity['category']): Commodity[] {
  return Object.values(COMMODITIES).filter(commodity => commodity.category === category);
}

// Helper function to get all legal commodities
export function getLegalCommodities(): Commodity[] {
  return Object.values(COMMODITIES).filter(commodity => commodity.legalStatus === 'legal');
}

// Helper function to get all restricted commodities
export function getRestrictedCommodities(): Commodity[] {
  return Object.values(COMMODITIES).filter(commodity => commodity.legalStatus === 'restricted');
}

// Helper function to get all illegal commodities
export function getIllegalCommodities(): Commodity[] {
  return Object.values(COMMODITIES).filter(commodity => commodity.legalStatus === 'illegal');
}

// Helper function to get perishable commodities
export function getPerishableCommodities(): Commodity[] {
  return Object.values(COMMODITIES).filter(commodity => commodity.perishable);
}