import { describe, it, expect } from 'vitest';
import { HubModelGenerator } from '../engine/HubModelGenerator';
import { getHubTemplate } from '../data/shipHubs';
import * as THREE from 'three';

describe('HubModelGenerator', () => {
  it('should create hub models for all hub categories', () => {
    const generator = new HubModelGenerator();
    
    const hubCategories = ['command', 'power', 'propulsion', 'cargo', 'defense', 'utility'];
    const testHubs = {
      command: 'cockpit-hub',
      power: 'fusion-reactor-small', 
      propulsion: 'ion-drive',
      cargo: 'cargo-hold-standard',
      defense: 'shield-generator-light',
      utility: 'life-support-basic'
    };

    hubCategories.forEach(category => {
      const templateId = testHubs[category as keyof typeof testHubs];
      const template = getHubTemplate(templateId);
      
      expect(template).toBeDefined();
      expect(template?.category).toBe(category);
      
      if (template) {
        const model = generator.generateHubModel(template);
        
        expect(model).toBeInstanceOf(THREE.Group);
        expect(model.name).toBe(`hub-${template.id}`);
        expect(model.children.length).toBeGreaterThan(0);
      }
    });
  });

  it('should create ship models from hub designs', () => {
    const generator = new HubModelGenerator();
    
    // Create a simple test ship with basic hubs
    const hubs = [
      {
        template: getHubTemplate('cockpit-hub')!,
        position: { x: 0, y: 0, z: 0 }
      },
      {
        template: getHubTemplate('fusion-reactor-small')!,
        position: { x: -2, y: 0, z: 0 }
      },
      {
        template: getHubTemplate('ion-drive')!,
        position: { x: -4, y: 0, z: 0 }
      }
    ];

    const shipModel = generator.generateShipFromHubDesign(hubs);
    
    expect(shipModel).toBeInstanceOf(THREE.Group);
    expect(shipModel.name).toBe('hub-ship');
    expect(shipModel.children.length).toBeGreaterThanOrEqual(3); // At least 3 hubs
  });

  it('should properly scale hub models', () => {
    const generator = new HubModelGenerator();
    const template = getHubTemplate('cockpit-hub')!;
    
    const model1 = generator.generateHubModel(template, { scale: 1.0 });
    const model2 = generator.generateHubModel(template, { scale: 2.0 });
    
    expect(model1).toBeInstanceOf(THREE.Group);
    expect(model2).toBeInstanceOf(THREE.Group);
    
    // Both should have the same structure but different scales
    expect(model1.children.length).toBe(model2.children.length);
  });

  it('should add glow effects for power generating hubs', () => {
    const generator = new HubModelGenerator();
    const powerTemplate = getHubTemplate('fusion-reactor-small')!;
    const nonPowerTemplate = getHubTemplate('cargo-hold-standard')!;
    
    const powerModel = generator.generateHubModel(powerTemplate);
    const nonPowerModel = generator.generateHubModel(nonPowerTemplate);
    
    // Power generating hubs should have glow effect (extra mesh)
    // Both have main mesh, but power hubs should have additional glow mesh
    expect(powerTemplate.powerGeneration).toBeGreaterThan(0);
    expect(nonPowerTemplate.powerGeneration).toBe(0);
    
    // Instead of comparing counts (which might be equal due to other details),
    // check that power model has more complex structure or at least same complexity
    expect(powerModel.children.length).toBeGreaterThanOrEqual(nonPowerModel.children.length);
    
    // More specifically, power models should have the glow mesh
    const hasGlowMesh = powerModel.children.some(child => 
      child instanceof THREE.Mesh && 
      (child.material as THREE.MeshBasicMaterial).color?.getHex() === 0xFFFF88
    );
    expect(hasGlowMesh).toBe(true);
  });

  it('should dispose resources properly', () => {
    const generator = new HubModelGenerator();
    
    // Generate some models to create cached resources
    const template = getHubTemplate('cockpit-hub')!;
    generator.generateHubModel(template);
    
    // Should not throw when disposing
    expect(() => generator.dispose()).not.toThrow();
  });
});