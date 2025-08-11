import React, { useState, useRef, useEffect } from 'react';
import { Sector, Galaxy } from '../../types/world';
import './SectorsMapPanel.css';

interface SectorsMapPanelProps {
  galaxy: Galaxy;
  onNavigateToSector: (sectorId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface SectorMapNode {
  sector: Sector;
  x: number;
  y: number;
  connections: string[]; // Connected sector IDs
}

const SectorsMapPanel: React.FC<SectorsMapPanelProps> = ({
  galaxy,
  onNavigateToSector,
  isVisible,
  onClose
}) => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate sector map layout
  const generateSectorLayout = (): SectorMapNode[] => {
    if (!galaxy.sectors || galaxy.sectors.length === 0) return [];

    const nodes: SectorMapNode[] = [];
    const mapWidth = 800;
    const mapHeight = 600;
    const padding = 100;

    // Simple grid-based layout for now - can be enhanced later
    const cols = Math.ceil(Math.sqrt(galaxy.sectors.length));
    const rows = Math.ceil(galaxy.sectors.length / cols);
    
    galaxy.sectors.forEach((sector, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = padding + (col * (mapWidth - 2 * padding)) / (cols - 1 || 1);
      const y = padding + (row * (mapHeight - 2 * padding)) / (rows - 1 || 1);

      // Find connections through gates
      const connections: string[] = [];
      sector.systems.forEach(system => {
        system.gates.forEach(gate => {
          if (gate.destinationSectorId !== sector.id) {
            connections.push(gate.destinationSectorId);
          }
        });
      });

      nodes.push({
        sector,
        x,
        y,
        connections: [...new Set(connections)] // Remove duplicates
      });
    });

    return nodes;
  };

  const sectorNodes = generateSectorLayout();

  // Draw the map
  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind nodes)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    sectorNodes.forEach(node => {
      node.connections.forEach(connectionId => {
        const targetNode = sectorNodes.find(n => n.sector.id === connectionId);
        if (targetNode) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
        }
      });
    });

    // Draw sector nodes
    sectorNodes.forEach(node => {
      const isCurrentLocation = galaxy.currentPlayerLocation.sectorId === node.sector.id;
      const isSelected = selectedSector === node.sector.id;
      const isHovered = hoveredSector === node.sector.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isCurrentLocation ? 20 : 15, 0, 2 * Math.PI);
      
      // Fill color based on controlling faction
      let fillColor = '#666'; // Default neutral
      if (node.sector.controllingFaction) {
        switch (node.sector.controllingFaction.toLowerCase()) {
          case 'traders guild': fillColor = '#4a90e2'; break;
          case 'security forces': fillColor = '#7ed321'; break;
          case 'outer colonies': fillColor = '#f5a623'; break;
          case 'pirates': fillColor = '#d0021b'; break;
          default: fillColor = '#9013fe'; break;
        }
      }

      ctx.fillStyle = isCurrentLocation ? '#fff' : fillColor;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? '#fff' : (isHovered ? '#ccc' : '#333');
      ctx.lineWidth = isCurrentLocation ? 3 : 2;
      ctx.stroke();

      // Sector name
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.sector.name, node.x, node.y + 35);
    });
  }, [isVisible, selectedSector, hoveredSector, sectorNodes, galaxy.currentPlayerLocation.sectorId]);

  // Handle canvas clicks
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Find clicked sector
    const clickedSector = sectorNodes.find(node => {
      const distance = Math.sqrt(Math.pow(clickX - node.x, 2) + Math.pow(clickY - node.y, 2));
      return distance <= 20; // Click radius
    });

    if (clickedSector) {
      if (selectedSector === clickedSector.sector.id) {
        // Double click to navigate
        onNavigateToSector(clickedSector.sector.id);
        onClose();
      } else {
        setSelectedSector(clickedSector.sector.id);
      }
    } else {
      setSelectedSector(null);
    }
  };

  // Handle canvas mouse move for hover effects
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const hoveredSectorNode = sectorNodes.find(node => {
      const distance = Math.sqrt(Math.pow(mouseX - node.x, 2) + Math.pow(mouseY - node.y, 2));
      return distance <= 20;
    });

    setHoveredSector(hoveredSectorNode ? hoveredSectorNode.sector.id : null);
  };

  if (!isVisible) return null;

  const selectedSectorData = selectedSector 
    ? sectorNodes.find(n => n.sector.id === selectedSector)?.sector 
    : null;

  return (
    <div className="sectors-map-panel">
      <div className="panel-header">
        <h2>🗺️ Sectors Map</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="map-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="sectors-map-canvas"
        />
      </div>

      {selectedSectorData && (
        <div className="sector-info-panel">
          <h3>{selectedSectorData.name}</h3>
          <div className="sector-details">
            <p><strong>Controlling Faction:</strong> {selectedSectorData.controllingFaction || 'None'}</p>
            <p><strong>Systems:</strong> {selectedSectorData.systems.length}</p>
            <p><strong>Description:</strong> {selectedSectorData.description}</p>
            <div className="sector-systems">
              <strong>Star Systems:</strong>
              <ul>
                {selectedSectorData.systems.map(system => (
                  <li key={system.id}>
                    {system.name} ({system.stations.length} stations, {system.planets.length} planets)
                  </li>
                ))}
              </ul>
            </div>
            <button 
              className="navigate-button"
              onClick={() => {
                onNavigateToSector(selectedSectorData.id);
                onClose();
              }}
            >
              Navigate to {selectedSectorData.name}
            </button>
          </div>
        </div>
      )}

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4a90e2' }}></div>
          <span>Traders Guild</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#7ed321' }}></div>
          <span>Security Forces</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f5a623' }}></div>
          <span>Outer Colonies</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#d0021b' }}></div>
          <span>Pirates</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#fff', border: '2px solid #333' }}></div>
          <span>Current Location</span>
        </div>
      </div>

      <div className="map-instructions">
        <p>Click a sector to select it. Click again to navigate. Hover for quick info.</p>
      </div>
    </div>
  );
};

export default SectorsMapPanel;