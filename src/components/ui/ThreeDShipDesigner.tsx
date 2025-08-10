import React, { useState, useEffect, useRef } from 'react';
import { HubShipConstructionSystem } from '../../systems/HubShipConstructionSystem';
import { 
  ShipHubDesign, 
  HubConstructionConstraints, 
  ShipHubTemplate,
  HubPlacement
} from '../../types/shipHubs';
import { getHubTemplate } from '../../data/shipHubs';
import * as THREE from 'three';

interface ThreeDShipDesignerProps {
  stationId: string;
  stationType: string;
  techLevel: number;
  playerCredits: number;
  availableMaterials: { [materialId: string]: number };
  onConstructShip: (design: ShipHubDesign, shipName: string) => void;
  onCancel: () => void;
}

// interface GridPosition3D { // Removed as it's unused - 3D positioning handled by existing types

const ThreeDShipDesigner: React.FC<ThreeDShipDesignerProps> = ({
  techLevel,
  playerCredits,
  availableMaterials,
  onConstructShip,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hubObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const gridLinesRef = useRef<THREE.Object3D | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const [constructionSystem] = useState(new HubShipConstructionSystem());
  const [design, setDesign] = useState<ShipHubDesign | null>(null);
  const [shipName, setShipName] = useState('');
  const [availableHubs, setAvailableHubs] = useState<ShipHubTemplate[]>([]);
  const [selectedHubTemplate, setSelectedHubTemplate] = useState<string | null>(null);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'setup' | 'design' | 'review'>('setup');
  const [cameraControls, setCameraControls] = useState({
    rotation: { x: -0.5, y: 0.5 },
    distance: 50,
    target: { x: 7.5, y: 7.5, z: 7.5 }
  });

  const [constraints] = useState<HubConstructionConstraints>({
    maxShipSize: { width: 15, height: 15, depth: 15 },
    availableTechLevel: techLevel,
    availableMaterials,
    requirePowerBalance: true,
    requireBasicSystems: true,
    requireLifeSupport: true,
    maxMassStructural: 1000
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Create 3D grid
    createGrid();
    
    return () => {
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Update camera position
  useEffect(() => {
    if (!cameraRef.current) return;

    const { rotation, distance, target } = cameraControls;
    
    cameraRef.current.position.set(
      target.x + distance * Math.cos(rotation.y) * Math.cos(rotation.x),
      target.y + distance * Math.sin(rotation.x),
      target.z + distance * Math.sin(rotation.y) * Math.cos(rotation.x)
    );
    
    cameraRef.current.lookAt(target.x, target.y, target.z);
    render3DScene();
  }, [cameraControls]);

  // Load available hubs
  useEffect(() => {
    const hubs = constructionSystem.getAvailableHubTemplates(constraints);
    setAvailableHubs(hubs);
  }, [constructionSystem, constraints]);

  // Update 3D scene when design changes
  useEffect(() => {
    if (design) {
      update3DScene();
    }
  }, [design]);

  const createGrid = () => {
    if (!sceneRef.current) return;

    const { width, height, depth } = constraints.maxShipSize;
    const gridGroup = new THREE.Group();

    // Grid material
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.5
    });

    // Create XY plane grids
    for (let z = 0; z <= depth; z++) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];

      // Horizontal lines
      for (let y = 0; y <= height; y++) {
        positions.push(0, y, z, width, y, z);
      }
      
      // Vertical lines
      for (let x = 0; x <= width; x++) {
        positions.push(x, 0, z, x, height, z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(geometry, gridMaterial);
      gridGroup.add(lines);
    }

    // Create XZ plane grids
    for (let y = 0; y <= height; y++) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];

      // Forward/back lines
      for (let z = 0; z <= depth; z++) {
        positions.push(0, y, z, width, y, z);
      }
      
      // Left/right lines
      for (let x = 0; x <= width; x++) {
        positions.push(x, y, 0, x, y, depth);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(geometry, gridMaterial);
      gridGroup.add(lines);
    }

    // Create YZ plane grids
    for (let x = 0; x <= width; x++) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];

      // Up/down lines
      for (let y = 0; y <= height; y++) {
        positions.push(x, y, 0, x, y, depth);
      }
      
      // Forward/back lines
      for (let z = 0; z <= depth; z++) {
        positions.push(x, 0, z, x, height, z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(geometry, gridMaterial);
      gridGroup.add(lines);
    }

    sceneRef.current.add(gridGroup);
    gridLinesRef.current = gridGroup;
  };

  const create3DHubMesh = (hub: HubPlacement, template: ShipHubTemplate, isSelected: boolean = false): THREE.Object3D => {
    const group = new THREE.Group();
    
    // Main hub geometry
    const geometry = new THREE.BoxGeometry(
      template.size.width,
      template.size.height,
      template.size.depth
    );
    
    // Color based on hub category
    let color = 0x666666;
    switch (template.category) {
      case 'command': color = 0x4a90e2; break;
      case 'power': color = 0xff9500; break;
      case 'propulsion': color = 0x00aa55; break;
      case 'cargo': color = 0x8b4513; break;
      case 'defense': color = 0xff4444; break;
      case 'utility': color = 0x9966cc; break;
      case 'structural': color = 0x808080; break;
    }
    
    const material = new THREE.MeshLambertMaterial({
      color: isSelected ? 0xffff00 : color,
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      hub.position.x + template.size.width / 2,
      hub.position.y + template.size.height / 2,
      hub.position.z + template.size.depth / 2
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { hubId: hub.hubId, templateId: hub.templateId };
    
    // Add outline for better visibility
    const edges = new THREE.EdgesGeometry(geometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ 
      color: isSelected ? 0xffffff : 0x000000,
      linewidth: 2
    });
    const outline = new THREE.LineSegments(edges, outlineMaterial);
    outline.position.copy(mesh.position);
    
    group.add(mesh);
    group.add(outline);
    
    return group;
  };

  const update3DScene = () => {
    if (!sceneRef.current || !design) return;

    // Clear existing hub objects
    hubObjectsRef.current.forEach((obj) => {
      sceneRef.current!.remove(obj);
    });
    hubObjectsRef.current.clear();

    // Add hub meshes
    design.hubs.forEach((hub) => {
      const template = getHubTemplate(hub.templateId);
      if (template) {
        const isSelected = selectedHub === hub.hubId;
        const mesh = create3DHubMesh(hub, template, isSelected);
        sceneRef.current!.add(mesh);
        hubObjectsRef.current.set(hub.hubId, mesh);
      }
    });

    render3DScene();
  };

  const render3DScene = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current || !design) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Check for hub selection
    const hubObjects = Array.from(hubObjectsRef.current.values());
    const intersects = raycasterRef.current.intersectObjects(hubObjects, true);
    
    if (intersects.length > 0) {
      const userData = intersects[0].object.userData || intersects[0].object.parent?.userData;
      if (userData?.hubId) {
        setSelectedHub(selectedHub === userData.hubId ? null : userData.hubId);
        return;
      }
    }

    // Check for grid placement
    if (selectedHubTemplate) {
      // Create invisible grid planes for intersection testing
      const gridIntersects = [];
      
      // Test intersection with grid at different Z levels
      for (let z = 0; z <= constraints.maxShipSize.depth; z++) {
        const planeGeometry = new THREE.PlaneGeometry(
          constraints.maxShipSize.width, 
          constraints.maxShipSize.height
        );
        const planeMaterial = new THREE.MeshBasicMaterial({ 
          visible: false 
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.set(
          constraints.maxShipSize.width / 2,
          constraints.maxShipSize.height / 2,
          z
        );
        
        const planeIntersects = raycasterRef.current.intersectObject(plane);
        if (planeIntersects.length > 0) {
          const point = planeIntersects[0].point;
          gridIntersects.push({
            x: Math.floor(point.x),
            y: Math.floor(point.y),
            z: z,
            distance: planeIntersects[0].distance
          });
        }
      }
      
      // Find closest valid grid position
      if (gridIntersects.length > 0) {
        const closest = gridIntersects.reduce((prev, curr) => 
          curr.distance < prev.distance ? curr : prev
        );
        
        handleAddHub(closest.x, closest.y, closest.z);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.buttons === 1) { // Left mouse button
      const deltaX = event.movementX * 0.01;
      const deltaY = event.movementY * 0.01;
      
      setCameraControls(prev => ({
        ...prev,
        rotation: {
          x: Math.max(-Math.PI/2, Math.min(Math.PI/2, prev.rotation.x + deltaY)),
          y: prev.rotation.y + deltaX
        }
      }));
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY * 0.01;
    
    setCameraControls(prev => ({
      ...prev,
      distance: Math.max(10, Math.min(100, prev.distance + delta))
    }));
  };

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
      <h3 style={{ color: '#e2e8f0', marginBottom: '20px' }}>New 3D Ship Design</h3>
      
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
          <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Ship Constraints</h4>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <div>Max Size: {constraints.maxShipSize.width}×{constraints.maxShipSize.height}×{constraints.maxShipSize.depth} units</div>
            <div>Max Mass: {constraints.maxMassStructural} units</div>
            <div>Tech Level: {constraints.availableTechLevel}</div>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Available Resources</h4>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <div>Credits: {playerCredits.toLocaleString()}</div>
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
          Start 3D Design →
        </button>
      </div>
    </div>
  );

  const renderHubPalette = () => (
    <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
      <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Available Hubs</h4>
      <div style={{ display: 'grid', gap: '8px' }}>
        {availableHubs.map((hub) => (
          <div
            key={hub.id}
            style={{
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              backgroundColor: selectedHubTemplate === hub.id ? '#1f2937' : '#111827',
              transition: 'all 0.2s'
            }}
            onClick={() => setSelectedHubTemplate(selectedHubTemplate === hub.id ? null : hub.id)}
          >
            <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '11px' }}>{hub.name}</div>
            <div style={{ fontSize: '9px', color: '#9ca3af' }}>
              {hub.size.width}×{hub.size.height}×{hub.size.depth} | {hub.basePrice.toLocaleString()} CR
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDesignStep = () => (
    <div style={{ display: 'flex', height: '80vh' }}>
      {/* 3D Viewport */}
      <div style={{ flex: '1', marginRight: '20px' }}>
        <div style={{ marginBottom: '10px', color: '#e2e8f0' }}>
          <strong>3D Ship Designer</strong>
          {selectedHubTemplate && <span style={{ marginLeft: '10px', color: '#10b981' }}>Click in 3D space to place hub</span>}
        </div>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'calc(100% - 30px)',
            border: '1px solid #374151',
            borderRadius: '4px',
            cursor: selectedHubTemplate ? 'crosshair' : 'grab'
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        />
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
          Left-click drag: Rotate camera | Mouse wheel: Zoom | Click hubs to select
        </div>
      </div>

      {/* Controls Panel */}
      <div style={{ width: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0' }}>Design: {design?.name}</h3>
          <button 
            onClick={() => setCurrentStep('setup')}
            style={{
              padding: '6px 12px',
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

        {selectedHub && (
          <button
            onClick={() => selectedHub && handleRemoveHub(selectedHub)}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            Remove Selected Hub
          </button>
        )}

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
              <div style={{ backgroundColor: '#7f1d1d', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                <div style={{ color: '#fecaca', fontSize: '11px', fontWeight: 'bold' }}>Errors:</div>
                {design.validation.errors.map((error, i) => (
                  <div key={i} style={{ color: '#fecaca', fontSize: '10px' }}>• {error}</div>
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
      maxHeight: '95vh',
      overflowY: 'auto'
    }}>
      {currentStep === 'setup' && renderSetupStep()}
      {currentStep === 'design' && renderDesignStep()}
      {currentStep === 'review' && renderReviewStep()}
    </div>
  );
};

export default ThreeDShipDesigner;