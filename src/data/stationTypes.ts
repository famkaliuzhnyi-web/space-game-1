/**
 * Diverse Station Types - Phase 7.1 Content Creation
 * 
 * This module defines various station types with unique characteristics,
 * services, visual styles, and gameplay opportunities.
 */

export type StationType = 
  | 'trade' 
  | 'industrial' 
  | 'military' 
  | 'research' 
  | 'mining' 
  | 'agricultural'
  | 'luxury_resort'
  | 'diplomatic'
  | 'black_market'
  | 'refinery'
  | 'shipyard'
  | 'frontier_outpost'
  | 'corporate_headquarters'
  | 'prison_facility'
  | 'medical_center'
  | 'university'
  | 'monastery'
  | 'casino_station'
  | 'manufacturing_hub'
  | 'data_center'
  | 'colonial'
  | 'exploration'
  | 'energy';

export interface EnhancedStationInfo {
  id: string;
  name: string;
  type: StationType;
  description: string;
  faction: string;
  services: string[];
  specialties: string[];
  atmosphere: string;
  visualStyle: {
    architecture: string;
    lighting: string;
    colors: string[];
    atmosphere: string;
  };
  economy: {
    wealthLevel: 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'luxurious';
    primaryIndustries: string[];
    majorExports: string[];
    majorImports: string[];
  };
  population: {
    size: 'tiny' | 'small' | 'medium' | 'large' | 'massive';
    demographics: string[];
    culture: string;
  };
  security: {
    level: 'minimal' | 'light' | 'standard' | 'heavy' | 'maximum';
    enforcementAgency: string;
    restrictions: string[];
  };
  uniqueFeatures: string[];
  questOpportunities: string[];
  secrets?: string[];
}

/**
 * CORE WORLDS STATIONS
 * High-tech, well-established stations in the heart of civilization
 */
export const CORE_WORLDS_STATIONS: EnhancedStationInfo[] = [
  {
    id: 'earth-station-alpha',
    name: 'Earth Station Alpha',
    type: 'corporate_headquarters',
    description: 'The crown jewel of human space, serving as the primary orbital platform around Earth and headquarters for multiple galactic corporations.',
    faction: 'Earth Federation',
    services: ['refuel', 'repair', 'trading', 'missions', 'banking', 'insurance', 'luxury_shopping', 'fine_dining'],
    specialties: ['diplomatic_services', 'corporate_networking', 'high_finance', 'luxury_goods'],
    atmosphere: 'The marble corridors echo with the conversations of diplomats, corporate executives, and wealthy traders conducting billion-credit deals.',
    visualStyle: {
      architecture: 'Neo-classical with holographic displays and crystalline structures',
      lighting: 'Warm golden illumination with accent blues',
      colors: ['gold', 'white', 'deep blue', 'silver'],
      atmosphere: 'Luxurious and prestigious'
    },
    economy: {
      wealthLevel: 'luxurious',
      primaryIndustries: ['finance', 'diplomacy', 'luxury_goods', 'corporate_services'],
      majorExports: ['financial_services', 'luxury_items', 'information', 'diplomatic_agreements'],
      majorImports: ['rare_materials', 'exotic_foods', 'art_objects', 'technological_prototypes']
    },
    population: {
      size: 'massive',
      demographics: ['corporate_executives', 'diplomats', 'wealthy_traders', 'government_officials', 'service_staff'],
      culture: 'Formal, hierarchical, focused on status and networking'
    },
    security: {
      level: 'maximum',
      enforcementAgency: 'Earth Federation Security',
      restrictions: ['weapon_scanning', 'background_checks', 'diplomatic_immunity_zones']
    },
    uniqueFeatures: [
      'Zero-G diplomatic chambers',
      'Holographic art galleries',
      'Executive trading floors',
      'Corporate merger amphitheater',
      'Earth observation deck'
    ],
    questOpportunities: [
      'corporate_espionage',
      'diplomatic_missions',
      'high_stakes_trading',
      'political_intrigue',
      'luxury_item_delivery'
    ],
    secrets: [
      'Hidden meeting rooms for shadow government',
      'Secret financial records of illegal corporate activities',
      'Diplomatic immunity abuse coverups'
    ]
  },

  {
    id: 'new-geneva-research',
    name: 'New Geneva Research Complex',
    type: 'research',
    description: 'A cutting-edge scientific research facility developing the next generation of human technology, from FTL drives to AI systems.',
    faction: 'Earth Federation',
    services: ['refuel', 'repair', 'equipment_upgrade', 'data_analysis', 'prototype_testing'],
    specialties: ['advanced_technology', 'prototype_equipment', 'scientific_data', 'research_contracts'],
    atmosphere: 'Clean white laboratories buzz with the hum of advanced machinery and the quiet conversations of brilliant scientists.',
    visualStyle: {
      architecture: 'Minimalist white and chrome with transparent aluminum walls',
      lighting: 'Cool blue-white LED with accent holographic displays',
      colors: ['white', 'chrome', 'electric blue', 'transparent'],
      atmosphere: 'Sterile and futuristic'
    },
    economy: {
      wealthLevel: 'wealthy',
      primaryIndustries: ['research_and_development', 'prototype_manufacturing', 'data_analysis', 'scientific_services'],
      majorExports: ['prototype_technology', 'scientific_data', 'research_reports', 'advanced_equipment'],
      majorImports: ['rare_elements', 'precision_instruments', 'exotic_materials', 'computing_hardware']
    },
    population: {
      size: 'medium',
      demographics: ['research_scientists', 'engineers', 'graduate_students', 'lab_technicians', 'security_personnel'],
      culture: 'Academic, collaborative, innovation-focused'
    },
    security: {
      level: 'heavy',
      enforcementAgency: 'Federation Research Security',
      restrictions: ['clearance_levels', 'intellectual_property_protection', 'no_recording_devices']
    },
    uniqueFeatures: [
      'Zero-gravity manufacturing lab',
      'Quantum computing center',
      'Prototype testing ranges',
      'AI development chambers',
      'Temporal physics laboratory'
    ],
    questOpportunities: [
      'prototype_testing',
      'scientific_espionage',
      'technology_theft_prevention',
      'research_data_delivery',
      'equipment_calibration'
    ],
    secrets: [
      'Classified military weapon prototypes',
      'Illegal AI consciousness experiments',
      'Time manipulation research'
    ]
  },

  {
    id: 'vega-luxury-resort',
    name: 'Vega Paradise Resort',
    type: 'luxury_resort',
    description: 'An opulent resort station catering to the galaxy\'s elite, offering unparalleled luxury and entertainment in the scenic Vega system.',
    faction: 'Independent',
    services: ['luxury_accommodation', 'fine_dining', 'entertainment', 'spa_services', 'exclusive_shopping', 'private_docking'],
    specialties: ['luxury_experiences', 'exclusive_events', 'high_end_networking', 'recreational_activities'],
    atmosphere: 'Opulent golden halls filled with the laughter of the wealthy, the clink of crystal glasses, and the soft music of live orchestras.',
    visualStyle: {
      architecture: 'Art Deco with flowing curves and gold inlays',
      lighting: 'Warm amber with crystal chandeliers',
      colors: ['gold', 'deep red', 'cream', 'royal purple'],
      atmosphere: 'Decadent and sophisticated'
    },
    economy: {
      wealthLevel: 'luxurious',
      primaryIndustries: ['hospitality', 'entertainment', 'luxury_services', 'exclusive_retail'],
      majorExports: ['luxury_experiences', 'exclusive_memberships', 'high_end_services'],
      majorImports: ['luxury_goods', 'exotic_foods', 'rare_wines', 'precious_materials', 'entertainment_acts']
    },
    population: {
      size: 'medium',
      demographics: ['wealthy_tourists', 'celebrities', 'service_staff', 'entertainers', 'security_personnel'],
      culture: 'Hedonistic, status-conscious, pleasure-seeking'
    },
    security: {
      level: 'heavy',
      enforcementAgency: 'Private Resort Security',
      restrictions: ['wealth_verification', 'behavior_standards', 'privacy_protection']
    },
    uniqueFeatures: [
      'Zero-gravity dance floors',
      'Holographic entertainment suites',
      'Private asteroid mining viewing',
      'Exclusive member-only areas',
      'Celebrity chef restaurants'
    ],
    questOpportunities: [
      'luxury_item_delivery',
      'celebrity_protection',
      'exclusive_event_catering',
      'high_society_espionage',
      'wealth_verification_investigation'
    ]
  }
];

/**
 * INDUSTRIAL STATIONS
 * Stations focused on processing raw materials and manufacturing
 */
export const INDUSTRIAL_STATIONS: EnhancedStationInfo[] = [
  {
    id: 'titan-ore-refinery',
    name: 'Titan Ore Refinery',
    type: 'refinery',
    description: 'A massive industrial station specializing in processing raw ores into refined materials for the Core Worlds manufacturing industry.',
    faction: 'Industrial Consortium',
    services: ['refuel', 'repair', 'raw_materials_trading', 'refined_materials_trading', 'industrial_equipment'],
    specialties: ['ore_processing', 'metal_refining', 'bulk_materials', 'industrial_contracts'],
    atmosphere: 'The constant rumble of massive processing machinery fills the air, while streams of molten metal flow through transparent tubes overhead.',
    visualStyle: {
      architecture: 'Heavy industrial with massive processing towers and conveyor systems',
      lighting: 'Intense orange glow from smelters with harsh industrial lighting',
      colors: ['industrial gray', 'molten orange', 'steel blue', 'warning yellow'],
      atmosphere: 'Industrial and powerful'
    },
    economy: {
      wealthLevel: 'comfortable',
      primaryIndustries: ['ore_refining', 'metal_processing', 'bulk_materials', 'industrial_logistics'],
      majorExports: ['steel_alloys', 'copper_ingots', 'aluminum_sheets', 'titanium_plates'],
      majorImports: ['iron_ore', 'copper_ore', 'aluminum_ore', 'titanium_ore', 'carbon_crystals']
    },
    population: {
      size: 'large',
      demographics: ['industrial_workers', 'process_engineers', 'logistics_coordinators', 'maintenance_crews', 'safety_inspectors'],
      culture: 'Hardworking, safety-focused, proud of their industrial output'
    },
    security: {
      level: 'standard',
      enforcementAgency: 'Industrial Safety Authority',
      restrictions: ['safety_equipment_required', 'hazardous_materials_control', 'industrial_access_permits']
    },
    uniqueFeatures: [
      'Zero-gravity smelting chambers',
      'Automated ore sorting facilities',
      'Molten metal rivers',
      'Quality testing laboratories',
      'Bulk material storage bays'
    ],
    questOpportunities: [
      'industrial_equipment_delivery',
      'quality_control_missions',
      'supply_chain_optimization',
      'safety_inspection_contracts',
      'bulk_transport_coordination'
    ],
    secrets: [
      'Illegal dumping of industrial waste',
      'Worker safety violations coverups',
      'Black market rare metal trading'
    ]
  },

  {
    id: 'nexus-manufacturing-hub',
    name: 'Nexus Manufacturing Hub',
    type: 'manufacturing_hub',
    description: 'An advanced manufacturing complex that transforms refined materials into high-tech consumer goods and ship components.',
    faction: 'Galactic Manufacturers Union',
    services: ['refuel', 'repair', 'equipment_trading', 'consumer_goods_trading', 'manufacturing_contracts', 'tech_upgrades'],
    specialties: ['advanced_manufacturing', 'consumer_electronics', 'ship_components', 'synthetic_materials'],
    atmosphere: 'Clean automated assembly lines hum efficiently while robotic arms precision-craft everything from personal devices to starship parts.',
    visualStyle: {
      architecture: 'Modern automated factory with glass-walled production lines',
      lighting: 'Bright white LED with blue accent lighting from machinery',
      colors: ['clean white', 'tech blue', 'silver', 'status green'],
      atmosphere: 'High-tech and efficient'
    },
    economy: {
      wealthLevel: 'wealthy',
      primaryIndustries: ['advanced_manufacturing', 'consumer_electronics', 'automation_systems', 'quality_assurance'],
      majorExports: ['advanced_electronics', 'consumer_goods', 'ship_components', 'synthetic_fabrics'],
      majorImports: ['steel_alloys', 'copper_ingots', 'silicon_wafers', 'aluminum_sheets', 'rare_earth_elements']
    },
    population: {
      size: 'large',
      demographics: ['automation_engineers', 'quality_specialists', 'product_designers', 'logistics_managers', 'tech_researchers'],
      culture: 'Innovation-focused, quality-obsessed, efficiency-minded'
    },
    security: {
      level: 'heavy',
      enforcementAgency: 'Corporate Security Division',
      restrictions: ['intellectual_property_protection', 'industrial_espionage_prevention', 'quality_control_access']
    },
    uniqueFeatures: [
      'Automated assembly megafactories',
      'Quality control testing chambers',
      'Product design laboratories',
      'Finished goods warehouses',
      'Consumer showcase galleries'
    ],
    questOpportunities: [
      'prototype_testing',
      'supply_chain_management',
      'quality_assurance_missions',
      'industrial_espionage_prevention',
      'new_product_launches'
    ],
    secrets: [
      'Planned obsolescence conspiracies',
      'Corporate espionage operations',
      'Illegal worker automation programs'
    ]
  },

  {
    id: 'asteroid-mining-station',
    name: 'Ceres Mining Complex',
    type: 'mining',
    description: 'A sprawling mining operation built into a large asteroid, extracting valuable ores and rare minerals from the asteroid belt.',
    faction: 'Asteroid Miners Guild',
    services: ['refuel', 'repair', 'raw_materials_trading', 'mining_equipment', 'prospector_supplies'],
    specialties: ['asteroid_mining', 'rare_mineral_extraction', 'prospecting_services', 'mining_equipment'],
    atmosphere: 'The deep thrrum of mining equipment echoes through tunnels carved from solid rock, while dust motes dance in the harsh lighting.',
    visualStyle: {
      architecture: 'Carved asteroid chambers with reinforced tunnel networks',
      lighting: 'Harsh floodlights with dust-filtered beams',
      colors: ['asteroid gray', 'dust brown', 'mineral veins', 'safety orange'],
      atmosphere: 'Raw and excavated'
    },
    economy: {
      wealthLevel: 'modest',
      primaryIndustries: ['asteroid_mining', 'rare_mineral_extraction', 'prospecting', 'mining_support_services'],
      majorExports: ['iron_ore', 'copper_ore', 'aluminum_ore', 'titanium_ore', 'rare_earth_elements', 'carbon_crystals'],
      majorImports: ['mining_equipment', 'food', 'water', 'medical_supplies', 'safety_equipment']
    },
    population: {
      size: 'medium',
      demographics: ['miners', 'prospectors', 'equipment_operators', 'geological_surveyors', 'safety_coordinators'],
      culture: 'Tough, risk-taking, community-minded'
    },
    security: {
      level: 'light',
      enforcementAgency: 'Mining Guild Security',
      restrictions: ['mining_claim_registration', 'safety_compliance', 'environmental_monitoring']
    },
    uniqueFeatures: [
      'Deep core mining shafts',
      'Zero-gravity ore processing',
      'Mineral analysis laboratories',
      'Mining equipment yards',
      'Emergency shelter networks'
    ],
    questOpportunities: [
      'new_mining_claims',
      'equipment_maintenance',
      'geological_surveys',
      'emergency_rescues',
      'rare_mineral_discoveries'
    ],
    secrets: [
      'Hidden valuable ore veins',
      'Illegal claim jumping operations',
      'Dangerous unstable mining areas'
    ]
  }
];

/**
 * FRONTIER STATIONS
 * Rough, practical stations on the edge of civilized space
 */
export const FRONTIER_STATIONS: EnhancedStationInfo[] = [
  {
    id: 'kepler-mining-outpost',
    name: 'Kepler Mining Outpost Zeta',
    type: 'frontier_outpost',
    description: 'A rough-and-tumble mining station carved into an asteroid, where fortunes are made and lost in the dangerous outer rim.',
    faction: 'Outer Colonies Coalition',
    services: ['basic_refuel', 'emergency_repair', 'raw_materials_trading', 'mining_equipment', 'cantina'],
    specialties: ['asteroid_mining', 'raw_materials', 'survival_gear', 'frontier_contracts'],
    atmosphere: 'Dusty metal corridors echo with the sound of mining equipment, rough laughter from the cantina, and the occasional emergency klaxon.',
    visualStyle: {
      architecture: 'Industrial scaffolding and reinforced metal plates',
      lighting: 'Harsh fluorescent with red emergency lights',
      colors: ['rust brown', 'industrial gray', 'warning orange', 'dirty yellow'],
      atmosphere: 'Gritty and utilitarian'
    },
    economy: {
      wealthLevel: 'modest',
      primaryIndustries: ['asteroid_mining', 'raw_material_processing', 'survival_equipment', 'prospecting_services'],
      majorExports: ['rare_metals', 'precious_stones', 'raw_materials', 'mining_data'],
      majorImports: ['food', 'water', 'mining_equipment', 'medical_supplies', 'entertainment']
    },
    population: {
      size: 'small',
      demographics: ['miners', 'prospectors', 'engineers', 'traders', 'drifters'],
      culture: 'Hardworking, independent, skeptical of authority'
    },
    security: {
      level: 'minimal',
      enforcementAgency: 'Local Militia',
      restrictions: ['mining_claim_disputes', 'basic_weapon_control']
    },
    uniqueFeatures: [
      'Asteroid core drilling platform',
      'Zero-gravity ore processing',
      'Cantina with real Earth whiskey',
      'Prospector guild meeting hall',
      'Emergency shelter networks'
    ],
    questOpportunities: [
      'mining_claim_disputes',
      'emergency_supply_runs',
      'prospector_rescue_missions',
      'equipment_delivery',
      'claim_jumper_investigations'
    ],
    secrets: [
      'Hidden valuable asteroid claims',
      'Illegal mining operations',
      'Abandoned corporate mining sites'
    ]
  },

  {
    id: 'frontier-trade-hub',
    name: 'Last Stop Trade Hub',
    type: 'trade',
    description: 'The final major trading post before entering truly unexplored space, serving as a supply depot for explorers and a marketplace for exotic discoveries.',
    faction: 'Independent',
    services: ['refuel', 'repair', 'trading', 'exploration_supplies', 'information_broker', 'ship_upgrades'],
    specialties: ['exploration_gear', 'exotic_materials', 'frontier_maps', 'survival_equipment'],
    atmosphere: 'A bustling marketplace where exotic goods from unknown worlds are traded alongside essential supplies for the next journey into the void.',
    visualStyle: {
      architecture: 'Modular pre-fab construction with improvised additions',
      lighting: 'Mixed practical lighting with colorful market displays',
      colors: ['steel blue', 'market green', 'warning yellow', 'practical gray'],
      atmosphere: 'Busy and eclectic'
    },
    economy: {
      wealthLevel: 'comfortable',
      primaryIndustries: ['frontier_trading', 'exploration_services', 'information_brokerage', 'supply_depot'],
      majorExports: ['exploration_data', 'exotic_materials', 'frontier_maps', 'survival_equipment'],
      majorImports: ['manufactured_goods', 'food', 'medical_supplies', 'communication_equipment']
    },
    population: {
      size: 'medium',
      demographics: ['traders', 'explorers', 'information_brokers', 'mechanics', 'refugees'],
      culture: 'Adventurous, opportunistic, diverse'
    },
    security: {
      level: 'light',
      enforcementAgency: 'Station Security',
      restrictions: ['basic_customs', 'no_violence_policy']
    },
    uniqueFeatures: [
      'Explorer guild headquarters',
      'Exotic materials exchange',
      'Map room with star charts',
      'Emergency beacon network',
      'Cultural exchange center'
    ],
    questOpportunities: [
      'exploration_missions',
      'exotic_material_procurement',
      'information_trading',
      'rescue_operations',
      'first_contact_preparation'
    ]
  }
];

/**
 * SPECIALIZED STATIONS
 * Unique stations with specific purposes and atmospheres
 */
export const SPECIALIZED_STATIONS: EnhancedStationInfo[] = [
  {
    id: 'shadowport-black-market',
    name: 'Shadowport',
    type: 'black_market',
    description: 'A hidden station in an asteroid field where anything can be bought or sold, no questions asked.',
    faction: 'Criminal Organizations',
    services: ['black_market_trading', 'illegal_modifications', 'false_documentation', 'contraband_storage'],
    specialties: ['illegal_goods', 'black_market_information', 'criminal_contacts', 'off_the_books_services'],
    atmosphere: 'Dark corridors filled with suspicious characters conducting business in hushed tones, while security scanners remain conspicuously offline.',
    visualStyle: {
      architecture: 'Cobbled together from salvaged parts with hidden compartments',
      lighting: 'Dim red emergency lighting with deep shadows',
      colors: ['dark red', 'matte black', 'shadow gray', 'danger orange'],
      atmosphere: 'Secretive and dangerous'
    },
    economy: {
      wealthLevel: 'wealthy',
      primaryIndustries: ['black_market_trading', 'illegal_services', 'contraband_smuggling', 'criminal_networking'],
      majorExports: ['illegal_weapons', 'stolen_goods', 'false_identities', 'criminal_services'],
      majorImports: ['stolen_merchandise', 'illegal_substances', 'wanted_fugitives', 'dirty_money']
    },
    population: {
      size: 'small',
      demographics: ['smugglers', 'criminals', 'fugitives', 'corrupt_officials', 'desperate_people'],
      culture: 'Paranoid, opportunistic, honor among thieves'
    },
    security: {
      level: 'minimal',
      enforcementAgency: 'Criminal Syndicates',
      restrictions: ['no_law_enforcement', 'criminal_code_of_conduct', 'information_security']
    },
    uniqueFeatures: [
      'Hidden docking bays',
      'Encrypted communication networks',
      'Money laundering operations',
      'Black market auction house',
      'Safe house network'
    ],
    questOpportunities: [
      'contraband_smuggling',
      'criminal_information_gathering',
      'illegal_modifications',
      'fugitive_transport',
      'black_market_negotiations'
    ],
    secrets: [
      'Major crime syndicate headquarters',
      'Stolen government secrets',
      'Hidden treasure caches'
    ]
  },

  {
    id: 'monastery-station',
    name: 'Stellar Sanctuary',
    type: 'monastery',
    description: 'A peaceful monastery station where the Order of Cosmic Harmony seeks enlightenment among the stars.',
    faction: 'Order of Cosmic Harmony',
    services: ['meditation_chambers', 'spiritual_guidance', 'healing_services', 'philosophical_discussion'],
    specialties: ['spiritual_services', 'meditation_techniques', 'philosophical_wisdom', 'peaceful_conflict_resolution'],
    atmosphere: 'Serene halls filled with soft chanting, the gentle glow of meditation crystals, and an overwhelming sense of peace.',
    visualStyle: {
      architecture: 'Organic flowing curves with crystal formations',
      lighting: 'Soft multicolored crystal illumination',
      colors: ['soft blue', 'gentle purple', 'warm gold', 'crystal clear'],
      atmosphere: 'Peaceful and transcendent'
    },
    economy: {
      wealthLevel: 'modest',
      primaryIndustries: ['spiritual_services', 'meditation_instruction', 'philosophical_teaching', 'healing_arts'],
      majorExports: ['spiritual_guidance', 'meditation_crystals', 'philosophical_teachings', 'peaceful_solutions'],
      majorImports: ['simple_foods', 'meditation_supplies', 'books', 'crystal_materials']
    },
    population: {
      size: 'small',
      demographics: ['monks', 'spiritual_seekers', 'pilgrims', 'philosophers', 'healers'],
      culture: 'Peaceful, contemplative, wisdom-seeking'
    },
    security: {
      level: 'minimal',
      enforcementAgency: 'Monastery Guardians',
      restrictions: ['no_violence', 'respectful_behavior', 'quiet_zones']
    },
    uniqueFeatures: [
      'Zero-gravity meditation chambers',
      'Crystal resonance halls',
      'Star observation domes',
      'Philosophical debate forums',
      'Healing gardens'
    ],
    questOpportunities: [
      'spiritual_pilgrimage',
      'philosophical_debates',
      'peaceful_mediation',
      'healing_missions',
      'wisdom_seeking'
    ]
  },

  {
    id: 'gambling-paradise',
    name: 'Fortune\'s Wheel Casino Station',
    type: 'casino_station',
    description: 'A dazzling entertainment complex where fortunes change hands in games of chance and skill.',
    faction: 'Entertainment Syndicate',
    services: ['gambling', 'entertainment', 'fine_dining', 'luxury_accommodation', 'high_stakes_trading'],
    specialties: ['games_of_chance', 'entertainment_acts', 'high_stakes_trading', 'luxury_experiences'],
    atmosphere: 'Flashing lights and ringing bells create excitement as fortunes are won and lost at tables where the stakes are always high.',
    visualStyle: {
      architecture: 'Art Deco with neon lighting and holographic displays',
      lighting: 'Bright neon colors with sparkling effects',
      colors: ['neon blue', 'electric pink', 'gold', 'bright white'],
      atmosphere: 'Exciting and overwhelming'
    },
    economy: {
      wealthLevel: 'wealthy',
      primaryIndustries: ['gambling', 'entertainment', 'hospitality', 'luxury_services'],
      majorExports: ['entertainment_experiences', 'gambling_services', 'luxury_hospitality'],
      majorImports: ['luxury_goods', 'entertainment_acts', 'fine_foods', 'alcohol']
    },
    population: {
      size: 'large',
      demographics: ['gamblers', 'entertainers', 'service_staff', 'high_rollers', 'tourists'],
      culture: 'Risk-taking, pleasure-seeking, status-conscious'
    },
    security: {
      level: 'heavy',
      enforcementAgency: 'Casino Security',
      restrictions: ['age_verification', 'credit_limits', 'cheating_prevention', 'debt_collection']
    },
    uniqueFeatures: [
      'Zero-gravity roulette wheels',
      'Holographic poker tournaments',
      'High-roller private rooms',
      'Celebrity entertainment venues',
      'Fortune prediction chambers'
    ],
    questOpportunities: [
      'high_stakes_gambling',
      'entertainment_booking',
      'security_investigations',
      'debt_collection',
      'celebrity_protection'
    ]
  }
];

/**
 * STATION COLLECTIONS BY TYPE
 */
export const ALL_ENHANCED_STATIONS = [
  ...CORE_WORLDS_STATIONS,
  ...INDUSTRIAL_STATIONS,
  ...FRONTIER_STATIONS,
  ...SPECIALIZED_STATIONS
];

/**
 * STATION GENERATION UTILITIES
 */
export function generateStationByType(type: StationType): EnhancedStationInfo | null {
  const stationsOfType = ALL_ENHANCED_STATIONS.filter(station => station.type === type);
  if (stationsOfType.length === 0) return null;
  
  return stationsOfType[Math.floor(Math.random() * stationsOfType.length)];
}

export function getStationsByFaction(faction: string): EnhancedStationInfo[] {
  return ALL_ENHANCED_STATIONS.filter(station => station.faction === faction);
}

export function getStationsByWealth(wealthLevel: string): EnhancedStationInfo[] {
  return ALL_ENHANCED_STATIONS.filter(station => station.economy.wealthLevel === wealthLevel);
}