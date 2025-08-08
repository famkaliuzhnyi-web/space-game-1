import React, { useState, useEffect } from 'react';
import { ShipClass } from '../../types/player';
import { 
  ShipConstructionSystem, 
  ShipConstructionConfig, 
  ConstructionCost, 
  ConstructionValidation,
  ShipPerformanceStats 
} from '../../systems/ShipConstructionSystem';
import { EquipmentTemplate } from '../../data/equipment';

interface ShipConstructionPanelProps {
  stationId: string;
  stationType: string;
  techLevel: number;
  playerCredits: number;
  onConstructShip: (config: ShipConstructionConfig) => void;
  onCancel: () => void;
}

const ShipConstructionPanel: React.FC<ShipConstructionPanelProps> = ({
  stationType,
  techLevel,
  playerCredits,
  onConstructShip,
  onCancel
}) => {
  const [constructionSystem] = useState(new ShipConstructionSystem());
  const [availableShipClasses, setAvailableShipClasses] = useState<ShipClass[]>([]);
  const [selectedShipClass, setSelectedShipClass] = useState<ShipClass | null>(null);
  const [shipName, setShipName] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<ShipConstructionConfig['selectedEquipment']>({
    engines: [],
    cargo: [],
    shields: [],
    weapons: [],
    utility: []
  });
  const [availableEquipment, setAvailableEquipment] = useState<Record<string, EquipmentTemplate[]>>({});
  const [cost, setCost] = useState<ConstructionCost | null>(null);
  const [validation, setValidation] = useState<ConstructionValidation | null>(null);
  const [stats, setStats] = useState<ShipPerformanceStats | null>(null);
  const [currentStep, setCurrentStep] = useState<'ship-class' | 'equipment' | 'review'>('ship-class');

  useEffect(() => {
    const shipClasses = constructionSystem.getAvailableShipClasses(stationType, techLevel);
    setAvailableShipClasses(shipClasses);
  }, [constructionSystem, stationType, techLevel]);

  useEffect(() => {
    if (selectedShipClass) {
      // Load available equipment for each slot type
      const equipment: Record<string, EquipmentTemplate[]> = {};
      const slotTypes: (keyof ShipClass['equipmentSlots'])[] = ['engines', 'cargo', 'shields', 'weapons', 'utility'];
      
      slotTypes.forEach(slotType => {
        equipment[slotType] = constructionSystem.getCompatibleEquipment(
          selectedShipClass.id, 
          slotType, 
          stationType, 
          techLevel
        );
      });
      
      setAvailableEquipment(equipment);
      
      // Generate default ship name
      if (!shipName) {
        setShipName(`${selectedShipClass.name} ${Math.floor(Math.random() * 1000)}`);
      }
    }
  }, [selectedShipClass, constructionSystem, stationType, techLevel, shipName]);

  useEffect(() => {
    if (selectedShipClass && shipName) {
      const config: ShipConstructionConfig = {
        shipClassId: selectedShipClass.id,
        shipName,
        selectedEquipment
      };

      try {
        const newCost = constructionSystem.calculateConstructionCost(config);
        const newValidation = constructionSystem.validateConfiguration(config);
        const newStats = constructionSystem.calculatePerformanceStats(config);
        
        setCost(newCost);
        setValidation(newValidation);
        setStats(newStats);
      } catch (error) {
        console.error('Error calculating construction details:', error);
      }
    }
  }, [selectedShipClass, shipName, selectedEquipment, constructionSystem]);

  const handleShipClassSelect = (shipClass: ShipClass) => {
    setSelectedShipClass(shipClass);
    setSelectedEquipment({
      engines: [],
      cargo: [],
      shields: [],
      weapons: [],
      utility: []
    });
    setCurrentStep('equipment');
  };

  const handleEquipmentToggle = (slotType: keyof typeof selectedEquipment, equipmentId: string) => {
    if (!selectedShipClass) return;

    const maxSlots = selectedShipClass.equipmentSlots[slotType];
    const currentEquipment = selectedEquipment[slotType];
    
    let newEquipment: string[];
    if (currentEquipment.includes(equipmentId)) {
      // Remove equipment
      newEquipment = currentEquipment.filter(id => id !== equipmentId);
    } else {
      // Add equipment if there's space
      if (currentEquipment.length < maxSlots) {
        newEquipment = [...currentEquipment, equipmentId];
      } else {
        return; // No space available
      }
    }

    setSelectedEquipment(prev => ({
      ...prev,
      [slotType]: newEquipment
    }));
  };

  const handleConstruct = () => {
    if (!selectedShipClass || !validation?.isValid) return;

    const config: ShipConstructionConfig = {
      shipClassId: selectedShipClass.id,
      shipName,
      selectedEquipment
    };

    onConstructShip(config);
  };

  const canAfford = cost ? playerCredits >= cost.totalCredits : false;

  const renderShipClassSelection = () => (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#e2e8f0' }}>Select Ship Class</h3>
      <div style={{ display: 'grid', gap: '15px' }}>
        {availableShipClasses.map(shipClass => (
          <div
            key={shipClass.id}
            style={{
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '15px',
              cursor: 'pointer',
              backgroundColor: selectedShipClass?.id === shipClass.id ? '#1f2937' : '#111827',
              transition: 'all 0.2s'
            }}
            onClick={() => handleShipClassSelect(shipClass)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#e2e8f0' }}>{shipClass.name}</h4>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '10px' }}>
                  Category: {shipClass.category}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
                  <div>Cargo: {shipClass.baseCargoCapacity}</div>
                  <div>Speed: {shipClass.baseSpeed}</div>
                  <div>Shields: {shipClass.baseShields}</div>
                  <div>Fuel: {shipClass.baseFuelCapacity}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', color: '#10b981', fontWeight: 'bold' }}>
                  {constructionSystem.calculateConstructionCost({
                    shipClassId: shipClass.id,
                    shipName: 'Temp',
                    selectedEquipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] }
                  }).baseShipCost.toLocaleString()} CR
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Base Price</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEquipmentSelection = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Configure {selectedShipClass?.name}</h3>
        <button 
          onClick={() => setCurrentStep('ship-class')}
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

      {Object.entries(availableEquipment).map(([slotType, equipment]) => {
        const maxSlots = selectedShipClass?.equipmentSlots[slotType as keyof typeof selectedShipClass.equipmentSlots] || 0;
        const selectedCount = selectedEquipment[slotType as keyof typeof selectedEquipment].length;
        
        if (equipment.length === 0 || maxSlots === 0) return null;

        return (
          <div key={slotType} style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>
              {slotType.charAt(0).toUpperCase() + slotType.slice(1)} ({selectedCount}/{maxSlots})
            </h4>
            <div style={{ display: 'grid', gap: '10px' }}>
              {equipment.map(eq => {
                const isSelected = selectedEquipment[slotType as keyof typeof selectedEquipment].includes(eq.id);
                const canSelect = selectedCount < maxSlots || isSelected;
                
                return (
                  <div
                    key={eq.id}
                    style={{
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      padding: '12px',
                      cursor: canSelect ? 'pointer' : 'not-allowed',
                      backgroundColor: isSelected ? '#1f2937' : '#111827',
                      opacity: canSelect ? 1 : 0.5,
                      transition: 'all 0.2s'
                    }}
                    onClick={() => canSelect && handleEquipmentToggle(slotType as keyof typeof selectedEquipment, eq.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{eq.name}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '5px' }}>{eq.description}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {Object.entries(eq.effects).map(([effect, value]) => (
                            <span key={effect} style={{ marginRight: '10px' }}>
                              {effect}: +{value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                          {eq.basePrice.toLocaleString()} CR
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {eq.rarity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => setCurrentStep('ship-class')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentStep('review')}
          disabled={!validation?.isValid}
          style={{
            padding: '12px 24px',
            backgroundColor: validation?.isValid ? '#059669' : '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: validation?.isValid ? 'pointer' : 'not-allowed'
          }}
        >
          Review & Build →
        </button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#e2e8f0' }}>Review & Confirm</h3>
        <button 
          onClick={() => setCurrentStep('equipment')}
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

      {validation && !validation.isValid && (
        <div style={{ 
          backgroundColor: '#7f1d1d', 
          border: '1px solid #dc2626', 
          borderRadius: '6px', 
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#fecaca', margin: '0 0 10px 0' }}>⚠️ Configuration Issues:</h4>
          {validation.errors.map((error, i) => (
            <div key={i} style={{ color: '#fecaca', fontSize: '14px' }}>• {error}</div>
          ))}
        </div>
      )}

      {validation?.warnings && validation.warnings.length > 0 && (
        <div style={{ 
          backgroundColor: '#78350f', 
          border: '1px solid #d97706', 
          borderRadius: '6px', 
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#fed7aa', margin: '0 0 10px 0' }}>⚠️ Warnings:</h4>
          {validation.warnings.map((warning, i) => (
            <div key={i} style={{ color: '#fed7aa', fontSize: '14px' }}>• {warning}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #374151', borderRadius: '8px', padding: '15px' }}>
          <h4 style={{ color: '#e2e8f0', margin: '0 0 15px 0' }}>Ship Configuration</h4>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#e2e8f0' }}>Name:</strong> {shipName}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#e2e8f0' }}>Class:</strong> {selectedShipClass?.name}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: '#e2e8f0' }}>Category:</strong> {selectedShipClass?.category}
          </div>
          
          {stats && (
            <div style={{ marginTop: '15px' }}>
              <h5 style={{ color: '#e2e8f0', margin: '0 0 10px 0' }}>Performance Stats:</h5>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                <div>Cargo: {Math.round(stats.cargoCapacity)} units</div>
                <div>Speed: {Math.round(stats.speed)} km/h</div>
                <div>Shields: {Math.round(stats.shields)} points</div>
                <div>Fuel Efficiency: {(stats.fuelEfficiency * 100).toFixed(1)}%</div>
                <div>Scanner Range: {Math.round(stats.scannerRange)} km</div>
                {stats.weaponDamage > 0 && <div>Weapon Damage: {Math.round(stats.weaponDamage)}</div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ border: '1px solid #374151', borderRadius: '8px', padding: '15px' }}>
          <h4 style={{ color: '#e2e8f0', margin: '0 0 15px 0' }}>Cost Breakdown</h4>
          {cost && (
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Base Ship:</span>
                <span>{cost.baseShipCost.toLocaleString()} CR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Equipment:</span>
                <span>{cost.equipmentCost.toLocaleString()} CR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Construction Fee:</span>
                <span>{cost.constructionFee.toLocaleString()} CR</span>
              </div>
              <hr style={{ border: '1px solid #374151', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ color: '#e2e8f0' }}>Total:</strong>
                <strong style={{ color: canAfford ? '#10b981' : '#ef4444' }}>
                  {cost.totalCredits.toLocaleString()} CR
                </strong>
              </div>
              
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Your Credits: {playerCredits.toLocaleString()} CR
              </div>
              {!canAfford && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px' }}>
                  Insufficient funds!
                </div>
              )}
            </div>
          )}
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
          onClick={handleConstruct}
          disabled={!validation?.isValid || !canAfford}
          style={{
            padding: '12px 24px',
            backgroundColor: (validation?.isValid && canAfford) ? '#059669' : '#374151',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: (validation?.isValid && canAfford) ? 'pointer' : 'not-allowed'
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
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {currentStep === 'ship-class' && renderShipClassSelection()}
      {currentStep === 'equipment' && renderEquipmentSelection()}
      {currentStep === 'review' && renderReview()}
    </div>
  );
};

export default ShipConstructionPanel;