/**
 * Station Visual Mapping System
 * 
 * Maps station types to visual properties for rendering.
 * Uses data from stationTypes.ts to create distinct visual representations.
 */

import { Station } from '../types/world';

export interface StationVisualConfig {
  primaryColor: string;
  secondaryColor: string;
  lightColor: string;
  shape: 'cross' | 'diamond' | 'triangle' | 'hexagon' | 'square' | 'circle';
  size: number;
  glowIntensity: number;
}

/**
 * Maps station types to visual configurations based on their characteristics
 */
export const STATION_VISUAL_MAPPING: Record<string, StationVisualConfig> = {
  // Trade Stations - Blue/Green for commerce
  'trade': {
    primaryColor: '#4a90e2', // Blue
    secondaryColor: '#5cb85c', // Green
    lightColor: '#00ccff', // Cyan
    shape: 'cross',
    size: 1.0,
    glowIntensity: 0.8
  },

  // Industrial Stations - Orange/Gray for manufacturing
  'industrial': {
    primaryColor: '#d2691e', // Orange
    secondaryColor: '#708090', // Gray
    lightColor: '#ff6b42', // Orange glow
    shape: 'square',
    size: 1.2,
    glowIntensity: 0.9
  },

  // Military Stations - Red/Dark Gray for defense
  'military': {
    primaryColor: '#cc0000', // Red
    secondaryColor: '#2f2f2f', // Dark gray
    lightColor: '#ff0000', // Red glow
    shape: 'diamond',
    size: 1.1,
    glowIntensity: 1.0
  },

  // Research Stations - White/Blue for science
  'research': {
    primaryColor: '#ffffff', // White
    secondaryColor: '#6495ed', // Cornflower blue
    lightColor: '#87ceeb', // Sky blue
    shape: 'hexagon',
    size: 1.0,
    glowIntensity: 0.7
  },

  // Mining Stations - Brown/Yellow for raw materials
  'mining': {
    primaryColor: '#8b4513', // Saddle brown
    secondaryColor: '#daa520', // Goldenrod
    lightColor: '#ffff00', // Yellow
    shape: 'triangle',
    size: 0.9,
    glowIntensity: 0.6
  },

  // Luxury Stations - Gold/Purple for wealth
  'luxury': {
    primaryColor: '#ffd700', // Gold
    secondaryColor: '#9932cc', // Dark orchid
    lightColor: '#ffdf00', // Golden glow
    shape: 'circle',
    size: 1.1,
    glowIntensity: 1.2
  },

  // Medical Stations - White/Red cross for healing
  'medical': {
    primaryColor: '#ffffff', // White
    secondaryColor: '#ff6b6b', // Light red
    lightColor: '#ff1493', // Deep pink
    shape: 'cross',
    size: 1.0,
    glowIntensity: 0.8
  },

  // Agricultural Stations - Green/Brown for farming
  'agricultural': {
    primaryColor: '#228b22', // Forest green
    secondaryColor: '#8b4513', // Saddle brown
    lightColor: '#32cd32', // Lime green
    shape: 'hexagon',
    size: 1.1,
    glowIntensity: 0.7
  },

  // Entertainment/Casino Stations - Pink/Gold for fun
  'entertainment': {
    primaryColor: '#ff69b4', // Hot pink
    secondaryColor: '#ffd700', // Gold
    lightColor: '#ff1493', // Deep pink
    shape: 'circle',
    size: 1.0,
    glowIntensity: 1.3
  },

  // Diplomatic Stations - Blue/White for peace
  'diplomatic': {
    primaryColor: '#4169e1', // Royal blue
    secondaryColor: '#f0f8ff', // Alice blue
    lightColor: '#87cefa', // Light sky blue
    shape: 'diamond',
    size: 1.0,
    glowIntensity: 0.8
  },

  // Refinery Stations - Orange/Steel for processing
  'refinery': {
    primaryColor: '#ff8c00', // Dark orange
    secondaryColor: '#708090', // Slate gray
    lightColor: '#ffa500', // Orange
    shape: 'square',
    size: 1.1,
    glowIntensity: 0.9
  },

  // Shipyard Stations - Steel/Blue for construction
  'shipyard': {
    primaryColor: '#4682b4', // Steel blue
    secondaryColor: '#696969', // Dim gray
    lightColor: '#5f9ea0', // Cadet blue
    shape: 'hexagon',
    size: 1.3,
    glowIntensity: 0.9
  },

  // Manufacturing Hub - Purple/Gray for advanced production
  'manufacturing_hub': {
    primaryColor: '#9370db', // Medium purple
    secondaryColor: '#708090', // Slate gray
    lightColor: '#ba55d3', // Medium orchid
    shape: 'square',
    size: 1.2,
    glowIntensity: 0.8
  },

  // Energy Stations - Yellow/White for power
  'energy': {
    primaryColor: '#ffff00', // Yellow
    secondaryColor: '#ffffff', // White
    lightColor: '#ffff66', // Light yellow
    shape: 'circle',
    size: 1.1,
    glowIntensity: 1.4
  },

  // Default fallback for unknown types
  'default': {
    primaryColor: '#aaaaaa', // Gray
    secondaryColor: '#888888', // Darker gray
    lightColor: '#00ccff', // Cyan
    shape: 'cross',
    size: 1.0,
    glowIntensity: 0.8
  }
};

/**
 * Get visual configuration for a station based on its type
 */
export function getStationVisualConfig(station: Station): StationVisualConfig {
  return STATION_VISUAL_MAPPING[station.type] || STATION_VISUAL_MAPPING['default'];
}

/**
 * Get a description of the station's visual characteristics for UI display
 */
export function getStationVisualDescription(station: Station): string {
  const config = getStationVisualConfig(station);
  const shapeDescriptions = {
    'cross': 'Cross-shaped structure',
    'diamond': 'Diamond configuration',
    'triangle': 'Triangular array',
    'hexagon': 'Hexagonal platform',
    'square': 'Square framework',
    'circle': 'Circular complex'
  };
  
  return `${shapeDescriptions[config.shape]} with ${config.primaryColor} hull`;
}