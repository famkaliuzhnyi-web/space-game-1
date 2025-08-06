import React, { useState, useEffect } from 'react';
import { HubShipConstructionSystem } from '../../systems/HubShipConstructionSystem';
import { 
  ShipHubDesign, 
  HubConstructionConstraints, 
  ShipHubTemplate
} from '../../types/shipHubs';
import { getHubTemplate } from '../../data/shipHubs';

interface HubShipDesignerProps {
  stationId: string;
  stationType: string;
  techLevel: number;
  playerCredits: number;
  availableMaterials: { [materialId: string]: number };
  onConstructShip: (design: ShipHubDesign, shipName: string) => void;
  onCancel: () => void;
}

const HubShipDesigner: React.FC<HubShipDesignerProps> = ({
  techLevel,
  playerCredits,
  availableMaterials,
  onConstructShip,
  onCancel
}) => {
  const [constructionSystem] = useState(new HubShipConstructionSystem());
  const [design, setDesign] = useState<ShipHubDesign | null>(null);
  const [shipName, setShipName] = useState('');
  const [availableHubs, setAvailableHubs] = useState<ShipHubTemplate[]>([]);
  const [selectedHubTemplate, setSelectedHubTemplate] = useState<string | null>(null);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'setup' | 'design' | 'review'>('setup');
  const [constraints] = useState<HubConstructionConstraints>({
    maxShipSize: { width: 15, height: 15, depth: 15 },
    availableTechLevel: techLevel,
    availableMaterials,
    requirePowerBalance: true,
    requireBasicSystems: true,
    requireLifeSupport: true,
    maxMassStructural: 1000
  });

  useEffect(() => {
    // Load available hubs based on constraints
    const hubs = constructionSystem.getAvailableHubTemplates(constraints);
    setAvailableHubs(hubs);
  }, [constructionSystem, constraints]);

  const handleCreateNewDesign = () => {
    const newDesign = constructionSystem.createNewDesign(
      shipName || 'New Ship',
      constraints.maxShipSize
    );
    setDesign(newDesign);
    setCurrentStep('design');
  };

  const handleAddHub = (x: number, y: number, z: number) => {
    if (!design || !selectedHubTemplate) return;

    const result = constructionSystem.addHub(design, selectedHubTemplate, { x, y, z });
    if (result.success) {
      setDesign({ ...design });
      setSelectedHubTemplate(null);
    } else {
      alert(`Cannot place hub: ${result.error}`);
    }
  };

  const handleRemoveHub = (hubId: string) => {
    if (!design) return;

    const success = constructionSystem.removeHub(design, hubId);
    if (success) {
      setDesign({ ...design });
      setSelectedHub(null);
    }
  };

  const handleConstruct = () => {
    if (!design) return;

    onConstructShip(design, shipName);
  };

  const canAfford = design ? playerCredits >= design.cost.totalCredits : false;

  const renderSetupStep = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#e2e8f0', marginBottom: '20px' }}>New Hub Ship Design</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontWeight: 'bold' }}>
          Ship Name:
        </label>
        <input
          type="text"
          value={shipName}
          onChange={(e) => setShipName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            color: '#e2e8f0'
          }}
          placeholder="Enter ship name..."
          maxLength={50}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Ship Size Limits</h4>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <div>Max Width: {constraints.maxShipSize.width} units</div>
            <div>Max Height: {constraints.maxShipSize.height} units</div>
            <div>Max Depth: {constraints.maxShipSize.depth} units</div>
            <div>Max Mass: {constraints.maxMassStructural} units</div>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Available Resources</h4>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <div>Credits: {playerCredits.toLocaleString()}</div>
            <div>Tech Level: {constraints.availableTechLevel}</div>
            <div>Hub Types: {availableHubs.length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            backgroundColor: '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreateNewDesign}
          disabled={!shipName.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: shipName.trim() ? '#059669' : '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: shipName.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Start Design →
        </button>
      </div>
    </div>
  );

  const renderHubGrid = () => {
    if (!design) return null;

    const gridSize = 20; // CSS pixels per grid unit
    const { width, height } = design.maxSize;

    return (
      <div 
        style={{
          position: 'relative',
          width: `${width * gridSize}px`,
          height: `${height * gridSize}px`,
          backgroundColor: '#1f2937',
          border: '2px solid #374151',
          borderRadius: '8px',
          margin: '20px 0'
        }}
      >
        {/* Grid lines */}
        {Array.from({ length: width + 1 }, (_, x) => (
          <div
            key={`v-${x}`}
            style={{
              position: 'absolute',
              left: `${x * gridSize}px`,
              top: 0,
              width: '1px',
              height: '100%',
              backgroundColor: '#374151'
            }}
          />
        ))}
        {Array.from({ length: height + 1 }, (_, y) => (
          <div
            key={`h-${y}`}
            style={{
              position: 'absolute',
              left: 0,
              top: `${y * gridSize}px`,
              width: '100%',
              height: '1px',
              backgroundColor: '#374151'
            }}
          />
        ))}

        {/* Placed hubs */}
        {design.hubs.map((hub) => {
          const template = getHubTemplate(hub.templateId);
          if (!template) return null;

          return (
            <div
              key={hub.hubId}
              style={{
                position: 'absolute',
                left: `${hub.position.x * gridSize}px`,
                top: `${hub.position.y * gridSize}px`,
                width: `${template.size.width * gridSize}px`,
                height: `${template.size.height * gridSize}px`,
                backgroundColor: selectedHub === hub.hubId ? '#1f2937' : '#059669',
                border: '2px solid #10b981',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#ffffff',
                textAlign: 'center',
                overflow: 'hidden',
                zIndex: 10
              }}
              onClick={() => setSelectedHub(selectedHub === hub.hubId ? null : hub.hubId)}
              title={template.name}
            >
              {template.name.split(' ')[0]}
            </div>
          );
        })}

        {/* Grid click areas for placing hubs */}
        {Array.from({ length: width }, (_, x) =>
          Array.from({ length: height }, (_, y) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: `${x * gridSize}px`,
                top: `${y * gridSize}px`,
                width: `${gridSize}px`,
                height: `${gridSize}px`,
                cursor: selectedHubTemplate ? 'crosshair' : 'default',
                zIndex: 1
              }}
              onClick={() => selectedHubTemplate && handleAddHub(x, y, 0)}
            />
          ))
        )}
      </div>
    );
  };

  const renderHubPalette = () => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Available Hubs</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
        {availableHubs.map((hub) => (
          <div
            key={hub.id}
            style={{
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '10px',
              cursor: 'pointer',
              backgroundColor: selectedHubTemplate === hub.id ? '#1f2937' : '#111827',
              transition: 'all 0.2s'
            }}
            onClick={() => setSelectedHubTemplate(selectedHubTemplate === hub.id ? null : hub.id)}
          >
            <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '12px' }}>{hub.name}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '5px' }}>{hub.category}</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              <div>Size: {hub.size.width}×{hub.size.height}×{hub.size.depth}</div>
              <div>Mass: {hub.mass}</div>
              {hub.powerGeneration > 0 && <div>Power: +{hub.powerGeneration}</div>}
              {hub.powerConsumption > 0 && <div>Power: -{hub.powerConsumption}</div>}
              <div>Cost: {hub.basePrice.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDesignStep = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Designing: {design?.name}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedHub && (
            <button
              onClick={() => selectedHub && handleRemoveHub(selectedHub)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Remove Hub
            </button>
          )}
          <button 
            onClick={() => setCurrentStep('setup')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        <div>
          <div style={{ marginBottom: '10px', color: '#e2e8f0' }}>
            {selectedHubTemplate ? 'Click on grid to place hub' : 'Select a hub from the palette to place'}
          </div>
          {renderHubGrid()}
        </div>

        <div>
          {renderHubPalette()}
          
          {design && (
            <div style={{ border: '1px solid #374151', borderRadius: '8px', padding: '15px' }}>
              <h4 style={{ color: '#e2e8f0', margin: '0 0 10px 0' }}>Design Status</h4>
              
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                <div>Hubs: {design.hubs.length}</div>
                <div>Mass: {design.performance.totalMass}</div>
                <div>Power: {design.performance.powerBalance > 0 ? '+' : ''}{design.performance.powerBalance}</div>
                <div>Cargo: {design.performance.cargoCapacity}</div>
                <div>Cost: {design.cost.totalCredits.toLocaleString()}</div>
              </div>

              {design.validation.errors.length > 0 && (
                <div style={{ backgroundColor: '#7f1d1d', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                  <div style={{ color: '#fecaca', fontSize: '12px', fontWeight: 'bold' }}>Errors:</div>
                  {design.validation.errors.map((error, i) => (
                    <div key={i} style={{ color: '#fecaca', fontSize: '11px' }}>• {error}</div>
                  ))}
                </div>
              )}

              {design.validation.warnings.length > 0 && (
                <div style={{ backgroundColor: '#78350f', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                  <div style={{ color: '#fed7aa', fontSize: '12px', fontWeight: 'bold' }}>Warnings:</div>
                  {design.validation.warnings.map((warning, i) => (
                    <div key={i} style={{ color: '#fed7aa', fontSize: '11px' }}>• {warning}</div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setCurrentStep('review')}
                disabled={!design.isValid}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: design.isValid ? '#059669' : '#374151',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: design.isValid ? 'pointer' : 'not-allowed'
                }}
              >
                Review & Build →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Review Design: {design?.name}</h3>
        <button 
          onClick={() => setCurrentStep('design')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Design
        </button>
      </div>

      {design && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #374151', borderRadius: '8px', padding: '15px' }}>
            <h4 style={{ color: '#e2e8f0', margin: '0 0 15px 0' }}>Ship Performance</h4>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
              <div>Total Mass: {design.performance.totalMass} units</div>
              <div>Power Balance: {design.performance.powerBalance > 0 ? '+' : ''}{design.performance.powerBalance} units</div>
              <div>Cargo Capacity: {design.performance.cargoCapacity} units</div>
              <div>Thrust: {design.performance.thrust} units</div>
              <div>Maneuverability: {design.performance.maneuverability} units</div>
              <div>Defense Rating: {Math.round(design.performance.defenseRating)} units</div>
              <div>Crew Capacity: {design.performance.crewCapacity} people</div>
              <div>Fuel Efficiency: {(design.performance.fuelEfficiency * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div style={{ border: '1px solid #374151', borderRadius: '8px', padding: '15px' }}>
            <h4 style={{ color: '#e2e8f0', margin: '0 0 15px 0' }}>Construction Cost</h4>
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Total Cost:</span>
                <span style={{ color: canAfford ? '#10b981' : '#ef4444' }}>
                  {design.cost.totalCredits.toLocaleString()} CR
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Construction Time:</span>
                <span>{design.cost.constructionTime} hours</span>
              </div>
              
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Materials Required:</div>
                {Object.entries(design.cost.materials).map(([material, amount]) => (
                  <div key={material} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>{material}:</span>
                    <span>{amount}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
                Your Credits: {playerCredits.toLocaleString()} CR
              </div>
              {!canAfford && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
                  Insufficient funds!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            backgroundColor: '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConstruct}
          disabled={!design?.isValid || !canAfford}
          style={{
            padding: '12px 24px',
            backgroundColor: (design?.isValid && canAfford) ? '#059669' : '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: (design?.isValid && canAfford) ? 'pointer' : 'not-allowed'
          }}
        >
          🔨 Construct Ship
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      backgroundColor: '#111827',
      color: '#e2e8f0',
      padding: '20px',
      borderRadius: '8px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      {currentStep === 'setup' && renderSetupStep()}
      {currentStep === 'design' && renderDesignStep()}
      {currentStep === 'review' && renderReviewStep()}
    </div>
  );
};

export default HubShipDesigner;