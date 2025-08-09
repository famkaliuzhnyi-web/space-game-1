import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import { Station, Planet } from '../types/world';
import { Scene } from './Scene';

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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.context = context;
    
    // Set up canvas for crisp pixel art
    this.context.imageSmoothingEnabled = false;
    
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
  render(camera: Camera, worldManager: WorldManager, timeManager: TimeManager, scene?: Scene | null): void {
    this.clearCanvas();
    this.setupCamera(camera);
    
    // Render world content
    this.renderStars(camera);
    this.renderWorldObjects(worldManager);
    
    // Render scene actors (ships, etc.)
    if (scene) {
      scene.render(this.context, camera);
    }
    
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
   * Render background stars with parallax effect
   */
  private renderStars(camera: Camera): void {
    this.context.fillStyle = '#ffffff';
    
    const starCount = 200;
    for (let i = 0; i < starCount; i++) {
      const parallaxFactor = 0.1;
      const x = (i * 17 + camera.x * parallaxFactor) % 1000 - 500;
      const y = (i * 31 + camera.y * parallaxFactor) % 800 - 400;
      const size = (i % 3) + 1;
      
      this.context.globalAlpha = 0.3 + (i % 7) * 0.1;
      this.context.fillRect(x, y, size, size);
    }
    this.context.globalAlpha = 1;
  }

  /**
   * Render all world objects (stations, planets, stars)
   */
  private renderWorldObjects(worldManager: WorldManager): void {
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
      }
    });
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
   * Render a station with current location indicator
   */
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
    this.context.fillText('WASD/Arrows: Move Camera', this.canvas.width - 10, this.canvas.height - 75);
    this.context.fillText('+/-: Zoom', this.canvas.width - 10, this.canvas.height - 60);
    this.context.fillText('Click: Navigate', this.canvas.width - 10, this.canvas.height - 45);
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