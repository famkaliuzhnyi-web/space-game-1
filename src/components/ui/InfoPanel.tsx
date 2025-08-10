import React from 'react';
import { Station, Planet } from '../../types/world';

// Interface for the object data that can be selected
interface SelectableObject {
  type: string;
  object: Station | Planet | any;
  position: { x: number; y: number; z?: number };
}

interface InfoPanelProps {
  selectedObject: SelectableObject | null;
  isVisible: boolean;
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedObject, isVisible, onClose }) => {
  if (!isVisible || !selectedObject) return null;

  const getObjectIcon = (type: string): string => {
    switch (type) {
      case 'station': return '🏗️';
      case 'planet': return '🪐';
      case 'star': return '⭐';
      case 'ship': return '🚀';
      case 'npc-ship': return '🛸';
      case 'cargo': return '📦';
      case 'debris': return '🗑️';
      default: return '❓';
    }
  };

  const renderStationInfo = (station: Station) => (
    <>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: '#4a90e2', margin: '0 0 10px 0' }}>
          {getObjectIcon('station')} {station.name}
        </h3>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Type:</strong> {station.type.replace('_', ' ')}
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Faction:</strong> {station.faction}
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Docking Capacity:</strong> {station.dockingCapacity} ships
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Position:</strong> ({Math.round(selectedObject.position.x)}, {Math.round(selectedObject.position.y)})
        </p>
      </div>
      
      {station.services && station.services.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ color: '#4a90e2', margin: '0 0 8px 0', fontSize: '14px' }}>Available Services:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {station.services.map((service, index) => (
              <span key={index} style={{
                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                color: '#4a90e2',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                border: '1px solid rgba(74, 144, 226, 0.3)'
              }}>
                {service.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {station.description && (
        <div>
          <h4 style={{ color: '#4a90e2', margin: '0 0 8px 0', fontSize: '14px' }}>Description:</h4>
          <p style={{ margin: '0', color: '#ccc', fontSize: '13px', lineHeight: '1.4' }}>
            {station.description}
          </p>
        </div>
      )}
    </>
  );

  const renderPlanetInfo = (planet: Planet) => (
    <>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: '#4a90e2', margin: '0 0 10px 0' }}>
          {getObjectIcon('planet')} {planet.name}
        </h3>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Type:</strong> {planet.type.replace('_', ' ')}
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Radius:</strong> {planet.radius} km
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Habitable:</strong> {planet.habitable ? 'Yes' : 'No'}
        </p>
        {planet.population && (
          <p style={{ margin: '5px 0', color: '#ccc' }}>
            <strong>Population:</strong> {planet.population.toLocaleString()}
          </p>
        )}
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Position:</strong> ({Math.round(selectedObject.position.x)}, {Math.round(selectedObject.position.y)})
        </p>
      </div>
      
      {planet.description && (
        <div>
          <h4 style={{ color: '#4a90e2', margin: '0 0 8px 0', fontSize: '14px' }}>Description:</h4>
          <p style={{ margin: '0', color: '#ccc', fontSize: '13px', lineHeight: '1.4' }}>
            {planet.description}
          </p>
        </div>
      )}
    </>
  );

  const renderStarInfo = (star: any) => (
    <>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: '#4a90e2', margin: '0 0 10px 0' }}>
          {getObjectIcon('star')} {star.name}
        </h3>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Type:</strong> {star.type.replace('-', ' ')}
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Temperature:</strong> {star.temperature.toLocaleString()}K
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Position:</strong> ({Math.round(selectedObject.position.x)}, {Math.round(selectedObject.position.y)})
        </p>
      </div>
    </>
  );

  const renderGenericInfo = (obj: any) => (
    <>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: '#4a90e2', margin: '0 0 10px 0' }}>
          {getObjectIcon(selectedObject.type)} {obj.name || `${selectedObject.type.replace('-', ' ')}`}
        </h3>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Type:</strong> {selectedObject.type.replace('-', ' ')}
        </p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>
          <strong>Position:</strong> ({Math.round(selectedObject.position.x)}, {Math.round(selectedObject.position.y)})
        </p>
      </div>
    </>
  );

  const renderObjectInfo = () => {
    const { type, object } = selectedObject;
    
    switch (type) {
      case 'station':
        return renderStationInfo(object as Station);
      case 'planet':
        return renderPlanetInfo(object as Planet);
      case 'star':
        return renderStarInfo(object);
      default:
        return renderGenericInfo(object);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '20px',
      zIndex: 1000,
      color: '#fff',
      fontSize: '14px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header with close button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#4a90e2', fontSize: '16px' }}>
          Object Information
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            lineHeight: 1
          }}
          title="Close Info Panel"
        >
          ✕
        </button>
      </div>

      {/* Object information content */}
      {renderObjectInfo()}
    </div>
  );
};

export default InfoPanel;