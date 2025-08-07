import { GameEngine } from '../types';
import { InputManager, TimeManager, SaveManager, EconomicSystem, ContractManager, RouteAnalyzer, PlayerManager } from '../systems';
import { MaintenanceManager } from '../systems/MaintenanceManager';
import { CharacterManager } from '../systems/CharacterManager';
import { WorldManager } from '../systems/WorldManager';
import { Station, Planet } from '../types/world';

export class Engine implements GameEngine {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  isRunning: boolean = false;
  lastFrameTime: number = 0;
  private inputManager: InputManager;
  private worldManager: WorldManager;
  private timeManager: TimeManager;
  private saveManager: SaveManager;
  private economicSystem: EconomicSystem;
  private contractManager: ContractManager;
  private routeAnalyzer: RouteAnalyzer;
  private playerManager: PlayerManager;
  private characterManager: CharacterManager;
  private maintenanceManager: MaintenanceManager;
  private animationFrameId: number = 0;
  private camera: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas. This may occur on older devices or browsers that don\'t support HTML5 Canvas.');
    }
    this.context = context;
    
    this.inputManager = new InputManager(canvas);
    this.worldManager = new WorldManager();
    this.timeManager = new TimeManager();
    this.saveManager = new SaveManager();
    this.economicSystem = new EconomicSystem();
    this.contractManager = new ContractManager();
    this.routeAnalyzer = new RouteAnalyzer();
    this.playerManager = new PlayerManager();
    this.characterManager = new CharacterManager();
    this.maintenanceManager = new MaintenanceManager(this.timeManager);
    
    // Initialize economics for existing stations
    this.initializeEconomics();
    
    // Set up canvas for crisp pixel art
    this.context.imageSmoothingEnabled = false;
    
    // Ensure canvas has a dark background
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, canvas.width, canvas.height);
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.timeManager.start();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.timeManager.pause();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  update(deltaTime: number): void {
    // Update time system
    this.timeManager.update(deltaTime);
    
    // Update economic system
    this.economicSystem.update(deltaTime * 1000); // Convert to milliseconds for economic system
    
    // Update contract system
    this.contractManager.update(deltaTime * 1000);

    // Handle input for camera movement
    if (this.inputManager.isKeyPressed('KeyW') || this.inputManager.isKeyPressed('ArrowUp')) {
      this.camera.y -= 100 * deltaTime;
    }
    if (this.inputManager.isKeyPressed('KeyS') || this.inputManager.isKeyPressed('ArrowDown')) {
      this.camera.y += 100 * deltaTime;
    }
    if (this.inputManager.isKeyPressed('KeyA') || this.inputManager.isKeyPressed('ArrowLeft')) {
      this.camera.x -= 100 * deltaTime;
    }
    if (this.inputManager.isKeyPressed('KeyD') || this.inputManager.isKeyPressed('ArrowRight')) {
      this.camera.x += 100 * deltaTime;
    }

    // Handle zoom
    if (this.inputManager.isKeyPressed('Equal') || this.inputManager.isKeyPressed('NumpadAdd')) {
      this.camera.zoom = Math.min(this.camera.zoom + deltaTime, 3);
    }
    if (this.inputManager.isKeyPressed('Minus') || this.inputManager.isKeyPressed('NumpadSubtract')) {
      this.camera.zoom = Math.max(this.camera.zoom - deltaTime, 0.1);
    }

    // Handle mouse/touch input for navigation
    const mousePos = this.inputManager.getMousePosition();
    if (this.inputManager.isMouseButtonPressed(0)) { // Left click
      this.handleClick(mousePos.x, mousePos.y);
    }

    const touches = this.inputManager.getTouchPositions();
    if (touches.length === 1) {
      // Single touch for navigation
      this.handleClick(touches[0].x, touches[0].y);
    }
  }

  private handleClick(x: number, y: number): void {
    // Convert screen coordinates to world coordinates
    const worldX = (x - this.canvas.width / 2) / this.camera.zoom + this.camera.x;
    const worldY = (y - this.canvas.height / 2) / this.camera.zoom + this.camera.y;

    // Check if click is on any navigable object
    const objects = this.worldManager.getAllVisibleObjects();
    for (const obj of objects) {
      const distance = Math.sqrt(
        Math.pow(worldX - obj.position.x, 2) + 
        Math.pow(worldY - obj.position.y, 2)
      );

      // Check if click is within object bounds
      let clickRadius = 20; // Default click radius
      if (obj.type === 'station') clickRadius = 15;
      if (obj.type === 'planet' && 'radius' in obj.object) clickRadius = obj.object.radius || 25;
      if (obj.type === 'star') clickRadius = 30;

      if (distance <= clickRadius) {
        if (obj.type === 'station' && 'id' in obj.object) {
          this.worldManager.navigateToTarget(obj.object.id);
        }
        break;
      }
    }
  }

  render(): void {
    // Clear the canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set a dark space background
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Save context for camera transformations
    this.context.save();
    
    // Apply camera transformations
    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.context.scale(this.camera.zoom, this.camera.zoom);
    this.context.translate(-this.camera.x, -this.camera.y);
    
    // Render background stars
    this.renderStars();
    
    // Render world objects
    this.renderWorldObjects();
    
    // Restore context
    this.context.restore();
    
    // Render UI elements (not affected by camera)
    this.renderUI();
  }

  private renderStars(): void {
    this.context.fillStyle = '#ffffff';
    
    // Create a star field that moves with camera but feels infinite
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      // Use camera position to create parallax effect
      const parallaxFactor = 0.1;
      const x = (i * 17 + this.camera.x * parallaxFactor) % 1000 - 500;
      const y = (i * 31 + this.camera.y * parallaxFactor) % 800 - 400;
      const size = (i % 3) + 1;
      
      this.context.globalAlpha = 0.3 + (i % 7) * 0.1;
      this.context.fillRect(x, y, size, size);
    }
    this.context.globalAlpha = 1;
  }

  private renderWorldObjects(): void {
    const objects = this.worldManager.getAllVisibleObjects();
    const currentStation = this.worldManager.getCurrentStation();

    objects.forEach(obj => {
      const { position } = obj;
      
      switch (obj.type) {
        case 'star':
          this.renderStar(position.x, position.y);
          break;
        case 'station': {
          const isCurrentStation = currentStation?.id === ('id' in obj.object ? obj.object.id : '');
          if ('id' in obj.object) {
            this.renderStation(position.x, position.y, obj.object as Station, isCurrentStation);
          }
          break;
        }
        case 'planet':
          if ('radius' in obj.object) {
            this.renderPlanet(position.x, position.y, obj.object as Planet);
          }
          break;
      }
    });
  }

  private renderStar(x: number, y: number): void {
    // Render star with glow effect
    this.context.save();
    
    // Outer glow
    const gradient = this.context.createRadialGradient(x, y, 0, x, y, 30);
    gradient.addColorStop(0, '#ffff99');
    gradient.addColorStop(0.3, '#ffdd44');
    gradient.addColorStop(1, 'transparent');
    
    this.context.fillStyle = gradient;
    this.context.fillRect(x - 30, y - 30, 60, 60);
    
    // Core
    this.context.fillStyle = '#ffff99';
    this.context.fillRect(x - 5, y - 5, 10, 10);
    
    this.context.restore();
  }

  private renderStation(x: number, y: number, station: Station, isCurrent: boolean): void {
    this.context.save();
    
    // Station structure
    this.context.fillStyle = isCurrent ? '#00ff00' : '#aaaaaa';
    this.context.fillRect(x - 8, y - 3, 16, 6);
    this.context.fillRect(x - 3, y - 8, 6, 16);
    
    // Docking lights
    this.context.fillStyle = '#00ccff';
    this.context.fillRect(x - 2, y - 2, 4, 4);
    
    // Name label
    this.context.fillStyle = '#ffffff';
    this.context.font = '12px monospace';
    this.context.textAlign = 'center';
    this.context.fillText(station.name, x, y + 20);
    
    this.context.restore();
  }

  private renderPlanet(x: number, y: number, planet: Planet): void {
    this.context.save();
    
    const radius = planet.radius || 15;
    
    // Planet body
    let color = '#888888';
    switch (planet.type) {
      case 'terrestrial':
        color = planet.habitable ? '#4a90e2' : '#8b4513';
        break;
      case 'gas-giant':
        color = '#daa520';
        break;
      case 'ice':
        color = '#b0e0e6';
        break;
      case 'desert':
        color = '#f4a460';
        break;
      case 'ocean':
        color = '#006994';
        break;
    }
    
    this.context.fillStyle = color;
    this.context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    
    // Simple atmosphere for habitable planets
    if (planet.habitable) {
      this.context.strokeStyle = '#87ceeb';
      this.context.lineWidth = 2;
      this.context.strokeRect(x - radius - 2, y - radius - 2, (radius + 2) * 2, (radius + 2) * 2);
    }
    
    this.context.restore();
  }

  private renderUI(): void {
    const currentSystem = this.worldManager.getCurrentSystem();
    const currentStation = this.worldManager.getCurrentStation();
    const currentTime = this.timeManager.getCurrentTime();
    const timeAcceleration = this.timeManager.getTimeAcceleration();
    
    // System info
    this.context.fillStyle = '#ffffff';
    this.context.font = '16px monospace';
    this.context.textAlign = 'left';
    
    if (currentSystem) {
      this.context.fillText(`System: ${currentSystem.name}`, 10, 30);
      this.context.fillText(`Security: ${currentSystem.securityLevel}/10`, 10, 50);
    }
    
    if (currentStation) {
      this.context.fillText(`Docked: ${currentStation.name}`, 10, 70);
      this.context.fillText(`Type: ${currentStation.type}`, 10, 90);
    }
    
    // Time display
    this.context.font = '14px monospace';
    this.context.fillText(`Time: ${this.timeManager.formatTime(currentTime)}`, 10, 120);
    if (timeAcceleration !== 1) {
      this.context.fillStyle = '#ffaa00';
      this.context.fillText(`Speed: ${timeAcceleration}x`, 10, 140);
    }
    
    // Controls help
    this.context.font = '12px monospace';
    this.context.fillStyle = '#aaaaaa';
    this.context.textAlign = 'right';
    this.context.fillText('WASD/Arrows: Move Camera', this.canvas.width - 10, this.canvas.height - 75);
    this.context.fillText('+/-: Zoom', this.canvas.width - 10, this.canvas.height - 60);
    this.context.fillText('Click: Navigate', this.canvas.width - 10, this.canvas.height - 45);
    this.context.fillText('N: Navigation Panel', this.canvas.width - 10, this.canvas.height - 30);
    this.context.fillText('Touch: Navigate (Mobile)', this.canvas.width - 10, this.canvas.height - 15);
  }

  getInputManager(): InputManager {
    return this.inputManager;
  }

  getWorldManager(): WorldManager {
    return this.worldManager;
  }

  getEconomicSystem(): EconomicSystem {
    return this.economicSystem;
  }

  getTimeManager(): TimeManager {
    return this.timeManager;
  }

  getSaveManager(): SaveManager {
    return this.saveManager;
  }

  getContractManager(): ContractManager {
    return this.contractManager;
  }

  getRouteAnalyzer(): RouteAnalyzer {
    return this.routeAnalyzer;
  }

  getPlayerManager(): PlayerManager {
    return this.playerManager;
  }

  getCharacterManager(): CharacterManager {
    return this.characterManager;
  }

  getMaintenanceManager(): MaintenanceManager {
    return this.maintenanceManager;
  }

  private initializeEconomics(): void {
    // Initialize economics for all existing stations
    const allStations = this.worldManager.getAllStations();
    for (const station of allStations) {
      // Find the system this station belongs to
      const system = this.findSystemForStation(station.id);
      this.economicSystem.initializeStationEconomics(station, system);
    }
  }

  private findSystemForStation(stationId: string): {securityLevel: number} | undefined {
    // Get the galaxy from WorldManager and find the system containing this station
    const galaxy = this.worldManager.getGalaxy();
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        if (system.stations.some(station => station.id === stationId)) {
          return { securityLevel: system.securityLevel };
        }
      }
    }
    return undefined;
  }

  dispose(): void {
    this.stop();
    this.inputManager.dispose();
  }

  // Utility methods
  resizeCanvas(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.imageSmoothingEnabled = false;
    
    // Ensure canvas maintains dark background after resize
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, width, height);
  }
}