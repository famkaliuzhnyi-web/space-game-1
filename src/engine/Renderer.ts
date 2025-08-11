import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import { Station, Planet } from '../types/world';
import { Ship } from '../types/player';
import { SceneManager } from './SceneManager';
import { StarGenerator } from './StarGenerator';
import { getStationVisualConfig } from '../utils/stationVisuals';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  camera: Camera;
}

/**
 * Dedicated rendering system for the space game engine.
 * Handles all visual rendering including world objects, UI, and effects.
 * Separated from game logic for better maintainability and testability.
 */
export class Renderer {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private starGenerator: StarGenerator;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.context = context;
    
    // Set up canvas for crisp pixel art
    this.context.imageSmoothingEnabled = false;
    
    // Initialize star generator with default settings
    this.starGenerator = new StarGenerator({
      seed: 42, // Consistent seed for deterministic stars
      starDensity: 200,
      cellSize: 500,
      minSize: 1,
      maxSize: 4,
      minBrightness: 0.3,
      maxBrightness: 1.0
    });
    
    // Mobile performance optimizations
    this.optimizeCanvasForMobile();
  }

  /**
   * Apply mobile-specific optimizations
   */
  private optimizeCanvasForMobile(): void {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Reduce rendering quality slightly for better performance on mobile
      this.context.imageSmoothingQuality = 'low';
      
      // Set up canvas for mobile-optimized rendering
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      
      // Scale canvas for device pixel ratio but limit for performance
      const maxDpr = 2; // Limit DPR for performance
      const effectiveDpr = Math.min(dpr, maxDpr);
      
      this.canvas.width = rect.width * effectiveDpr;
      this.canvas.height = rect.height * effectiveDpr;
      this.context.scale(effectiveDpr, effectiveDpr);
    }
  }

  /**
   * Main render method - orchestrates the entire rendering pipeline
   */
  render(camera: Camera, worldManager: WorldManager, timeManager: TimeManager, sceneManager?: SceneManager): void {
    this.clearCanvas();
    this.setupCamera(camera);
    
    // Render world content
    this.renderStars(camera);
    this.renderWorldObjects(worldManager, sceneManager);
    
    this.resetCamera();
    
    // Render UI (not affected by camera)
    this.renderUI(worldManager, timeManager);
  }

  /**
   * Clear canvas with dark space background
   */
  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Apply camera transformations for world rendering
   */
  private setupCamera(camera: Camera): void {
    this.context.save();
    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.context.scale(camera.zoom, camera.zoom);
    this.context.translate(-camera.x, -camera.y);
  }

  /**
   * Reset camera transformations
   */
  private resetCamera(): void {
    this.context.restore();
  }

  /**
   * Render background stars using seed-based infinite generation
   */
  private renderStars(camera: Camera): void {
    // Generate stars for current viewport
    const stars = this.starGenerator.generateStarsInViewport(
      camera.x,
      camera.y,
      this.canvas.width / camera.zoom,
      this.canvas.height / camera.zoom,
      0.1 // Parallax factor for background stars
    );

    // Render each star
    this.context.fillStyle = '#ffffff';
    
    // Calculate distance-based opacity factor
    // When zoom is high (close up), stars should be more visible
    // When zoom is low (zoomed out), stars should be less visible
    const zoomOpacityFactor = Math.min(1.0, Math.max(0.1, camera.zoom * 0.5));
    
    stars.forEach(star => {
      // Apply parallax offset for the rendering position
      const parallaxFactor = 0.1;
      const renderX = star.x - camera.x * parallaxFactor;
      const renderY = star.y - camera.y * parallaxFactor;
      
      // Set opacity based on star brightness and distance (zoom level)
      const finalOpacity = star.brightness * zoomOpacityFactor;
      this.context.globalAlpha = finalOpacity;
      
      // Render star as a small rectangle
      this.context.fillRect(
        Math.round(renderX - star.size / 2),
        Math.round(renderY - star.size / 2),
        star.size,
        star.size
      );
    });
    
    // Reset alpha for subsequent rendering
    this.context.globalAlpha = 1;
  }

  /**
   * Render all world objects (stations, planets, stars, ships)
   */
  private renderWorldObjects(worldManager: WorldManager, sceneManager?: SceneManager): void {
    const objects = worldManager.getAllVisibleObjects();
    const currentStation = worldManager.getCurrentStation();

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
        case 'ship':
          // Skip rendering ships here if we have a scene manager - it will render them with actors
          if (!sceneManager) {
            this.renderShip(position.x, position.y, obj.object as Ship);
          }
          break;
        case 'gate':
          console.log('Rendering gate:', obj.object, 'at position', position);
          if ('id' in obj.object) {
            this.renderGate(position.x, position.y, obj.object as any);
          }
          break;
      }
    });
    
    // Render actors from scene manager if available
    if (sceneManager) {
      sceneManager.render(this.context);
    }
  }

  /**
   * Render a star with glow effect
   */
  private renderStar(x: number, y: number): void {
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

  /**
   * Render a station with type-specific visual styling
   */
  private renderStation(x: number, y: number, station: Station, isCurrent: boolean): void {
    this.context.save();
    
    // Get visual configuration based on station type
    const visualConfig = getStationVisualConfig(station);
    
    // Scale size based on zoom for better visibility
    const baseSize = 8;
    const scaledSize = baseSize * visualConfig.size;
    
    // Enhanced glow effect for current station or high-intensity stations
    if (isCurrent || visualConfig.glowIntensity > 1.0) {
      const glowRadius = scaledSize * 2;
      const gradient = this.context.createRadialGradient(x, y, 0, x, y, glowRadius);
      gradient.addColorStop(0, visualConfig.lightColor + '40'); // 25% opacity
      gradient.addColorStop(1, 'transparent');
      
      this.context.fillStyle = gradient;
      this.context.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
    }
    
    // Primary color (current station gets enhanced brightness)
    const primaryColor = isCurrent ? this.brightenColor(visualConfig.primaryColor, 30) : visualConfig.primaryColor;
    const secondaryColor = isCurrent ? this.brightenColor(visualConfig.secondaryColor, 20) : visualConfig.secondaryColor;
    
    // Render station based on its shape type
    switch (visualConfig.shape) {
      case 'cross':
        this.renderCrossStation(x, y, scaledSize, primaryColor, secondaryColor);
        break;
      case 'diamond':
        this.renderDiamondStation(x, y, scaledSize, primaryColor, secondaryColor);
        break;
      case 'triangle':
        this.renderTriangleStation(x, y, scaledSize, primaryColor, secondaryColor);
        break;
      case 'hexagon':
        this.renderHexagonStation(x, y, scaledSize, primaryColor, secondaryColor);
        break;
      case 'square':
        this.renderSquareStation(x, y, scaledSize, primaryColor, secondaryColor);
        break;
      case 'circle':
        this.renderCircleStation(x, y, scaledSize, primaryColor, secondaryColor);
        break;
      default:
        this.renderCrossStation(x, y, scaledSize, primaryColor, secondaryColor);
    }
    
    // Central docking lights
    this.context.fillStyle = visualConfig.lightColor;
    this.context.fillRect(x - 2, y - 2, 4, 4);
    
    // Name label
    this.context.fillStyle = '#ffffff';
    this.context.font = '12px monospace';
    this.context.textAlign = 'center';
    this.context.fillText(station.name, x, y + 20);
    
    this.context.restore();
  }

  /**
   * Render cross-shaped station (traditional)
   */
  private renderCrossStation(x: number, y: number, size: number, primary: string, secondary: string): void {
    this.context.fillStyle = primary;
    this.context.fillRect(x - size, y - size/3, size * 2, size * 2/3); // Horizontal bar
    this.context.fillStyle = secondary;
    this.context.fillRect(x - size/3, y - size, size * 2/3, size * 2); // Vertical bar
  }

  /**
   * Render diamond-shaped station
   */
  private renderDiamondStation(x: number, y: number, size: number, primary: string, secondary: string): void {
    this.context.fillStyle = primary;
    this.context.beginPath();
    this.context.moveTo(x, y - size);
    this.context.lineTo(x + size, y);
    this.context.lineTo(x, y + size);
    this.context.lineTo(x - size, y);
    this.context.closePath();
    this.context.fill();
    
    // Inner diamond with secondary color
    this.context.fillStyle = secondary;
    const innerSize = size * 0.6;
    this.context.beginPath();
    this.context.moveTo(x, y - innerSize);
    this.context.lineTo(x + innerSize, y);
    this.context.lineTo(x, y + innerSize);
    this.context.lineTo(x - innerSize, y);
    this.context.closePath();
    this.context.fill();
  }

  /**
   * Render triangular station array
   */
  private renderTriangleStation(x: number, y: number, size: number, primary: string, secondary: string): void {
    this.context.fillStyle = primary;
    this.context.beginPath();
    this.context.moveTo(x, y - size);
    this.context.lineTo(x + size, y + size);
    this.context.lineTo(x - size, y + size);
    this.context.closePath();
    this.context.fill();
    
    // Inner triangle with secondary color
    this.context.fillStyle = secondary;
    const innerSize = size * 0.5;
    this.context.beginPath();
    this.context.moveTo(x, y - innerSize);
    this.context.lineTo(x + innerSize, y + innerSize);
    this.context.lineTo(x - innerSize, y + innerSize);
    this.context.closePath();
    this.context.fill();
  }

  /**
   * Render hexagonal platform
   */
  private renderHexagonStation(x: number, y: number, size: number, primary: string, secondary: string): void {
    this.context.fillStyle = primary;
    this.context.beginPath();
    const angle = Math.PI / 3; // 60 degrees
    for (let i = 0; i < 6; i++) {
      const px = x + size * Math.cos(i * angle);
      const py = y + size * Math.sin(i * angle);
      if (i === 0) {
        this.context.moveTo(px, py);
      } else {
        this.context.lineTo(px, py);
      }
    }
    this.context.closePath();
    this.context.fill();
    
    // Inner hexagon with secondary color
    this.context.fillStyle = secondary;
    this.context.beginPath();
    const innerSize = size * 0.6;
    for (let i = 0; i < 6; i++) {
      const px = x + innerSize * Math.cos(i * angle);
      const py = y + innerSize * Math.sin(i * angle);
      if (i === 0) {
        this.context.moveTo(px, py);
      } else {
        this.context.lineTo(px, py);
      }
    }
    this.context.closePath();
    this.context.fill();
  }

  /**
   * Render square framework station
   */
  private renderSquareStation(x: number, y: number, size: number, primary: string, secondary: string): void {
    this.context.fillStyle = primary;
    this.context.fillRect(x - size, y - size, size * 2, size * 2);
    
    // Inner square with secondary color
    this.context.fillStyle = secondary;
    const innerSize = size * 0.6;
    this.context.fillRect(x - innerSize, y - innerSize, innerSize * 2, innerSize * 2);
  }

  /**
   * Render circular station complex
   */
  private renderCircleStation(x: number, y: number, size: number, primary: string, secondary: string): void {
    // Outer circle
    this.context.fillStyle = primary;
    this.context.beginPath();
    this.context.arc(x, y, size, 0, Math.PI * 2);
    this.context.fill();
    
    // Inner circle with secondary color
    this.context.fillStyle = secondary;
    this.context.beginPath();
    this.context.arc(x, y, size * 0.6, 0, Math.PI * 2);
    this.context.fill();
  }

  /**
   * Brighten a color by a percentage for current station highlighting
   */
  private brightenColor(color: string, percent: number): string {
    // Simple brightness enhancement by converting hex to RGB and brightening
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + percent);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + percent);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + percent);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Render a planet based on its type
   */
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

  /**
   * Render the player's ship
   */
  private renderShip(x: number, y: number, ship: Ship): void {
    this.context.save();
    
    // Ship hull (triangle pointing up)
    this.context.fillStyle = '#4a90e2';
    this.context.beginPath();
    this.context.moveTo(x, y - 8);       // Top point
    this.context.lineTo(x - 6, y + 6);   // Bottom left
    this.context.lineTo(x + 6, y + 6);   // Bottom right
    this.context.closePath();
    this.context.fill();
    
    // Ship engine glow when in transit
    if (ship.location.isInTransit) {
      this.context.fillStyle = '#ff6b42';
      this.context.globalAlpha = 0.7;
      this.context.fillRect(x - 2, y + 6, 4, 4);
      this.context.globalAlpha = 1;
    }
    
    // Ship name label
    this.context.fillStyle = '#ffffff';
    this.context.font = '10px monospace';
    this.context.textAlign = 'center';
    this.context.fillText(ship.name, x, y + 20);
    
    this.context.restore();
  }

  /**
   * Render a gate with distinctive visual effects
   */
  private renderGate(x: number, y: number, gate: any): void {
    this.context.save();
    
    // Outer ring - pulsing energy effect
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 2) * 0.3 + 0.7;
    this.context.strokeStyle = gate.isActive ? `rgba(64, 224, 255, ${pulse})` : '#666666';
    this.context.lineWidth = 3;
    this.context.beginPath();
    this.context.arc(x, y, 25, 0, Math.PI * 2);
    this.context.stroke();
    
    // Inner swirling energy (only for active gates)
    if (gate.isActive) {
      this.context.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.arc(x, y, 18, time, time + Math.PI * 1.5);
      this.context.stroke();
    }
    
    // Center symbol (gate icon)
    this.context.fillStyle = gate.isActive ? '#40e0ff' : '#888888';
    this.context.font = '20px monospace';
    this.context.textAlign = 'center';
    this.context.fillText('🌀', x, y + 6);
    
    // Gate name label
    this.context.fillStyle = '#ffffff';
    this.context.font = '10px monospace';
    this.context.textAlign = 'center';
    this.context.fillText(gate.name, x, y + 40);
    
    this.context.restore();
  }

  /**
   * Render UI elements (HUD, controls, etc.)
   */
  private renderUI(worldManager: WorldManager, timeManager: TimeManager): void {
    const currentSystem = worldManager.getCurrentSystem();
    const currentStation = worldManager.getCurrentStation();
    const currentTime = timeManager.getCurrentTime();
    const timeAcceleration = timeManager.getTimeAcceleration();
    
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
    this.context.fillText(`Time: ${timeManager.formatTime(currentTime)}`, 10, 120);
    if (timeAcceleration !== 1) {
      this.context.fillStyle = '#ffaa00';
      this.context.fillText(`Speed: ${timeAcceleration}x`, 10, 140);
    }
    
    // Controls help
    this.context.font = '12px monospace';
    this.context.fillStyle = '#aaaaaa';
    this.context.textAlign = 'right';
    this.context.fillText('WASD/Arrows: Move Camera', this.canvas.width - 10, this.canvas.height - 105);
    this.context.fillText('+/-: Zoom', this.canvas.width - 10, this.canvas.height - 90);
    this.context.fillText('Mouse Wheel: Zoom', this.canvas.width - 10, this.canvas.height - 75);
    this.context.fillText('Right-Click+Drag: Pan Camera', this.canvas.width - 10, this.canvas.height - 60);
    this.context.fillText('Left-Click: Navigate', this.canvas.width - 10, this.canvas.height - 45);
    this.context.fillText('N: Navigation Panel', this.canvas.width - 10, this.canvas.height - 30);
    this.context.fillText('Touch: Navigate (Mobile)', this.canvas.width - 10, this.canvas.height - 15);
  }

  /**
   * Resize the canvas and maintain quality settings
   */
  resizeCanvas(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.imageSmoothingEnabled = false;
    
    // Ensure canvas maintains dark background after resize
    this.context.fillStyle = '#0a0a0a';
    this.context.fillRect(0, 0, width, height);
  }
}