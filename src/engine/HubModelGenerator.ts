import * as THREE from 'three';
import { ShipHubTemplate } from '../types/shipHubs';

/**
 * Hub Model Generator
 * 
 * Creates simple 3D models for ship hubs based on their category and specifications.
 * Each hub type gets a distinct geometric representation that reflects its function.
 */

export interface HubModelOptions {
  scale?: number;
  wireframe?: boolean;
  opacity?: number;
  color?: string;
}

export class HubModelGenerator {
  private materials: Map<string, THREE.Material>;
  private geometries: Map<string, THREE.BufferGeometry>;

  constructor() {
    this.materials = new Map();
    this.geometries = new Map();
    this.initializeMaterials();
  }

  /**
   * Initialize materials for different hub categories
   */
  private initializeMaterials(): void {
    const materialConfigs = {
      command: { color: 0x4CAF50, emissive: 0x0a2e0a },    // Green - command & control
      power: { color: 0xFFEB3B, emissive: 0x3e3808 },      // Yellow - energy
      propulsion: { color: 0x2196F3, emissive: 0x051e3e }, // Blue - engines
      cargo: { color: 0x795548, emissive: 0x1a1410 },      // Brown - storage
      defense: { color: 0xF44336, emissive: 0x3e0a08 },    // Red - weapons/shields
      utility: { color: 0x9C27B0, emissive: 0x250a2e },    // Purple - support systems
      structural: { color: 0x607D8B, emissive: 0x0e1419 }  // Gray - hull/framework
    };

    for (const [category, config] of Object.entries(materialConfigs)) {
      const material = new THREE.MeshLambertMaterial({
        color: config.color,
        emissive: config.emissive,
        transparent: true,
        opacity: 0.9
      });
      this.materials.set(category, material);
    }
  }

  /**
   * Generate a 3D model for a hub template
   */
  generateHubModel(template: ShipHubTemplate, options: HubModelOptions = {}): THREE.Object3D {
    const group = new THREE.Group();
    group.name = `hub-${template.id}`;

    // Create main body geometry based on hub category
    const geometry = this.getGeometryForCategory(template);
    
    // Apply hub dimensions
    const scaleX = template.size.width * (options.scale || 1);
    const scaleY = template.size.height * (options.scale || 1);
    const scaleZ = template.size.depth * (options.scale || 1);

    // Get material for category
    const material = this.getMaterialForCategory(template.category, options);
    
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.scale.set(scaleX, scaleY, scaleZ);
    group.add(mainMesh);

    // Add category-specific details
    this.addCategorySpecificDetails(group, template, options);

    // Add glow effect for powered components
    if (template.powerGeneration > 0) {
      this.addGlowEffect(group, template);
    }

    return group;
  }

  /**
   * Get base geometry for hub category
   */
  private getGeometryForCategory(template: ShipHubTemplate): THREE.BufferGeometry {
    const cacheKey = `${template.category}-base`;
    
    if (this.geometries.has(cacheKey)) {
      return this.geometries.get(cacheKey)!;
    }

    let geometry: THREE.BufferGeometry;

    switch (template.category) {
      case 'command':
        // Command hubs are dome-like
        geometry = new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
        break;
      
      case 'power':
        // Power hubs are cylindrical with hexagonal cross-section
        geometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 6);
        break;
      
      case 'propulsion':
        // Propulsion hubs are cone-shaped (nozzles)
        geometry = new THREE.ConeGeometry(0.3, 1, 8);
        break;
      
      case 'cargo':
        // Cargo hubs are simple boxes
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      
      case 'defense':
        // Defense hubs are octagonal
        geometry = new THREE.CylinderGeometry(0.45, 0.45, 0.6, 8);
        break;
      
      case 'utility':
        // Utility hubs are rounded boxes
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        // Add some rounding by scaling corners (simplified approach)
        break;
      
      case 'structural':
        // Structural hubs are simple frames
        geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        break;
      
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    this.geometries.set(cacheKey, geometry);
    return geometry;
  }

  /**
   * Get material for hub category with options
   */
  private getMaterialForCategory(category: string, options: HubModelOptions): THREE.Material {
    const baseMaterial = this.materials.get(category);
    if (!baseMaterial || !options.color && !options.wireframe && !options.opacity) {
      return baseMaterial || this.materials.get('structural')!;
    }

    // Create custom material if options provided
    const material = baseMaterial.clone();
    
    if (options.color) {
      (material as THREE.MeshLambertMaterial).color.setHex(parseInt(options.color.replace('#', ''), 16));
    }
    
    if (options.wireframe !== undefined) {
      (material as THREE.MeshLambertMaterial).wireframe = options.wireframe;
    }
    
    if (options.opacity !== undefined) {
      material.transparent = true;
      material.opacity = options.opacity;
    }

    return material;
  }

  /**
   * Add category-specific details to hub model
   */
  private addCategorySpecificDetails(group: THREE.Object3D, template: ShipHubTemplate, options: HubModelOptions): void {
    const scale = options.scale || 1;

    switch (template.category) {
      case 'command':
        // Add antenna/sensor array
        const antenna = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4),
          new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        antenna.position.set(0, 0.6 * scale, 0);
        group.add(antenna);
        break;

      case 'propulsion':
        // Add thrust nozzle glow
        const nozzleGlow = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.4, 6),
          new THREE.MeshBasicMaterial({ 
            color: 0x00AAFF, 
            transparent: true, 
            opacity: 0.6 
          })
        );
        nozzleGlow.position.set(0, 0, -0.7 * scale);
        group.add(nozzleGlow);
        break;

      case 'defense':
        // Add shield generator rings
        if (template.capabilities?.shieldStrength) {
          const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 16);
          const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
          });
          
          const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
          ring1.rotation.x = Math.PI / 2;
          ring1.position.y = 0.2 * scale;
          group.add(ring1);
          
          const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
          ring2.rotation.x = Math.PI / 2;
          ring2.position.y = -0.2 * scale;
          group.add(ring2);
        }
        break;

      case 'cargo':
        // Add cargo bay door indicators
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const door1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.05, 0.05),
          doorMaterial
        );
        door1.position.set(0, 0, 0.5 * scale);
        group.add(door1);
        break;

      case 'utility':
        // Add utility ports/connections
        const portGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 6);
        const portMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        for (let i = 0; i < 4; i++) {
          const port = new THREE.Mesh(portGeometry, portMaterial);
          const angle = (i * Math.PI * 2) / 4;
          port.position.set(
            Math.cos(angle) * 0.4 * scale,
            0,
            Math.sin(angle) * 0.4 * scale
          );
          port.rotation.z = angle + Math.PI / 2;
          group.add(port);
        }
        break;
    }
  }

  /**
   * Add glow effect for power-generating hubs
   */
  private addGlowEffect(group: THREE.Object3D, template: ShipHubTemplate): void {
    const glowGeometry = new THREE.SphereGeometry(0.6, 16, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF88,
      transparent: true,
      opacity: 0.2
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.set(
      template.size.width * 1.2,
      template.size.height * 1.2,
      template.size.depth * 1.2
    );
    group.add(glow);
  }

  /**
   * Create a complete ship model from hub design
   */
  generateShipFromHubDesign(hubs: { template: ShipHubTemplate; position: { x: number; y: number; z: number } }[], options: HubModelOptions = {}): THREE.Object3D {
    const shipGroup = new THREE.Group();
    shipGroup.name = 'hub-ship';

    // Add each hub at its designated position
    hubs.forEach((hub, index) => {
      const hubModel = this.generateHubModel(hub.template, options);
      
      // Position the hub in the ship
      hubModel.position.set(
        hub.position.x,
        hub.position.y, 
        hub.position.z
      );

      hubModel.name = `hub-${index}-${hub.template.id}`;
      shipGroup.add(hubModel);
    });

    // Add connecting framework (simple lines between hubs)
    this.addShipFramework(shipGroup, hubs);

    return shipGroup;
  }

  /**
   * Add simple framework connections between hubs
   */
  private addShipFramework(shipGroup: THREE.Object3D, hubs: { template: ShipHubTemplate; position: { x: number; y: number; z: number } }[]): void {
    const frameworkMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });

    // Connect adjacent hubs with simple lines
    for (let i = 0; i < hubs.length; i++) {
      for (let j = i + 1; j < hubs.length; j++) {
        const hub1 = hubs[i];
        const hub2 = hubs[j];
        
        // Only connect hubs that are adjacent (within 2 units distance)
        const distance = Math.sqrt(
          Math.pow(hub1.position.x - hub2.position.x, 2) +
          Math.pow(hub1.position.y - hub2.position.y, 2) +
          Math.pow(hub1.position.z - hub2.position.z, 2)
        );

        if (distance <= 2.5) {
          const points = [
            new THREE.Vector3(hub1.position.x, hub1.position.y, hub1.position.z),
            new THREE.Vector3(hub2.position.x, hub2.position.y, hub2.position.z)
          ];
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, frameworkMaterial);
          line.name = `framework-${i}-${j}`;
          shipGroup.add(line);
        }
      }
    }
  }

  /**
   * Dispose of cached geometries and materials
   */
  dispose(): void {
    this.geometries.forEach(geometry => geometry.dispose());
    this.materials.forEach(material => material.dispose());
    this.geometries.clear();
    this.materials.clear();
  }
}

// Singleton instance
export const hubModelGenerator = new HubModelGenerator();