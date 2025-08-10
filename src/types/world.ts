import { Vector3D } from './index';

export interface Coordinates extends Vector3D {
  // Unified coordinate system - all coordinates now have x, y, z
  // z represents the layer (Ships: 50, Stations: 30, Planets/Stars: 0)
  // This interface provides semantic meaning for coordinate usage throughout the game
}

export interface Station {
  id: string;
  name: string;
  type: 'trade' | 'industrial' | 'military' | 'research' | 'mining' | 'luxury' | 'diplomatic' | 
        'entertainment' | 'pirate' | 'agricultural' | 'medical' | 'exploration' | 'colonial' | 
        'salvage' | 'observatory' | 'foundry' | 'habitat' | 'security' | 'prison' | 'energy' | 
        'shipyard' | 'refinery' | 'manufacturing_hub';
  position: Coordinates;
  faction: string;
  dockingCapacity: number;
  services: string[];
  description: string;
}

export interface Planet {
  id: string;
  name: string;
  type: 'terrestrial' | 'gas-giant' | 'ice' | 'desert' | 'ocean';
  position: Coordinates;
  radius: number;
  habitable: boolean;
  population?: number;
  description: string;
}

export interface StarSystem {
  id: string;
  name: string;
  position: Coordinates;
  star: {
    name: string;
    type: 'red-dwarf' | 'yellow-dwarf' | 'blue-giant' | 'red-giant' | 'white-dwarf';
    temperature: number;
  };
  stations: Station[];
  planets: Planet[];
  securityLevel: number; // 0-10, 0 being lawless, 10 being maximum security
}

export interface Sector {
  id: string;
  name: string;
  position: Coordinates;
  systems: StarSystem[];
  controllingFaction?: string;
  description: string;
}

export interface Galaxy {
  sectors: Sector[];
  currentPlayerLocation: {
    sectorId: string;
    systemId: string;
    stationId?: string;
  };
}

export interface NavigationTarget {
  type: 'sector' | 'system' | 'station' | 'planet';
  id: string;
  name: string;
  position: Coordinates;
  distance: number;
  estimatedTravelTime: number;
}