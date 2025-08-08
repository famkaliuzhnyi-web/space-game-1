import * as THREE from 'three';
import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import { Station, Planet } from '../types/world';
import { Camera } from './Renderer';

/**
 * Three.js-based 3D renderer for the space game engine.
 * Provides 3D graphics rendering as an enhanced alternative to the 2D renderer.
 */
export class ThreeRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private stars!: THREE.Points; // Initialized in createStarField
  private spaceObjects: Map<string, THREE.Object3D> = new Map();
  private ambientLight!: THREE.AmbientLight; // Initialized in setupLighting
  private sunLight!: THREE.DirectionalLight; // Initialized in setupLighting

  // Camera control properties
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private cameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 300);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.renderer.setClearColor(0x000000, 1); // Black space background

    // Create scene
    this.scene = new THREE.Scene();

    // Set up camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      canvas.clientWidth / canvas.clientHeight, // Aspect ratio
      0.1, // Near clipping plane
      10000 // Far clipping plane
    );
    this.camera.position.copy(this.cameraPosition);

    // Set up lighting
    this.setupLighting();

    // Create star field
    this.createStarField();

    // Handle window resize
    this.setupResizeHandler();
  }

  /**
   * Set up lighting for the 3D scene
   */
  private setupLighting(): void {
    // Ambient light for general illumination
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4); // Dim ambient
    this.scene.add(this.ambientLight);

    // Directional light to simulate distant sun
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.sunLight.position.set(1000, 500, 1000);
    this.sunLight.castShadow = false; // Disable shadows for performance
    this.scene.add(this.sunLight);
  }

  /**
   * Create a field of stars in the background
   */
  private createStarField(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      // Create stars in a large sphere around the scene
      positions[i] = (Math.random() - 0.5) * 8000;     // x
      positions[i + 1] = (Math.random() - 0.5) * 8000; // y
      positions[i + 2] = (Math.random() - 0.5) * 8000; // z
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.8
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  /**
   * Set up resize handler to maintain aspect ratio
   */
  private setupResizeHandler(): void {
    const handleResize = () => {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    // Call initially
    handleResize();

    // Set up resize observer for responsive behavior
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(this.canvas.parentElement || this.canvas);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
    }
  }

  /**
   * Main render method - orchestrates the entire 3D rendering pipeline
   */
  render(camera: Camera, worldManager: WorldManager, _timeManager: TimeManager): void {
    // Update camera position based on 2D camera for consistency
    this.updateCameraFromGameCamera(camera);

    // Update world objects
    this.updateWorldObjects(worldManager);

    // Animate stars (subtle rotation)
    if (this.stars) {
      this.stars.rotation.y += 0.0002;
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update 3D camera position based on game's 2D camera
   */
  private updateCameraFromGameCamera(gameCamera: Camera): void {
    // Convert 2D camera position to 3D
    this.cameraTarget.set(gameCamera.x, -gameCamera.y, 0); // Flip Y for 3D space
    
    // Update camera position with zoom
    const distance = 300 / gameCamera.zoom;
    this.cameraPosition.set(
      gameCamera.x,
      -gameCamera.y + distance * 0.5, // Slightly elevated view
      distance
    );

    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Update all world objects in the 3D scene
   */
  private updateWorldObjects(worldManager: WorldManager): void {
    const objects = worldManager.getAllVisibleObjects();
    const currentStation = worldManager.getCurrentStation() || null;
    const currentObjectIds = new Set<string>();

    objects.forEach(obj => {
      const objectId = `${obj.type}-${obj.position.x}-${obj.position.y}`;
      currentObjectIds.add(objectId);

      let mesh = this.spaceObjects.get(objectId);
      
      if (!mesh) {
        // Create new 3D object
        const newMesh = this.create3DObject(obj, currentStation);
        if (newMesh) {
          mesh = newMesh;
          this.spaceObjects.set(objectId, mesh);
          this.scene.add(mesh);
        }
      }

      if (mesh) {
        // Update position
        mesh.position.set(obj.position.x, -obj.position.y, 0); // Flip Y for 3D space
        
        // Add subtle animations
        this.animate3DObject(mesh, obj.type);
      }
    });

    // Remove objects that are no longer visible
    for (const [objectId, mesh] of this.spaceObjects.entries()) {
      if (!currentObjectIds.has(objectId)) {
        this.scene.remove(mesh);
        this.spaceObjects.delete(objectId);
        
        // Clean up geometry and materials
        if (mesh instanceof THREE.Mesh) {
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      }
    }
  }

  /**
   * Create a 3D representation of a world object
   */
  private create3DObject(obj: any, currentStation: Station | null): THREE.Object3D | null {
    const { position } = obj;

    switch (obj.type) {
      case 'star':
        return this.createStar(position.x, position.y);
      case 'station':
        const isCurrentStation = currentStation?.id === ('id' in obj.object ? obj.object.id : '');
        return this.createStation(position.x, position.y, obj.object as Station, isCurrentStation);
      case 'planet':
        return this.createPlanet(position.x, position.y, obj.object as Planet);
      default:
        return null;
    }
  }

  /**
   * Create a 3D star with glow effect
   */
  private createStar(_x: number, _y: number): THREE.Object3D {
    const starGroup = new THREE.Group();

    // Core star
    const coreGeometry = new THREE.SphereGeometry(8, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff99,
    });
    // Add emissive property manually for glow
    (coreMaterial as any).emissive = new THREE.Color(0xffff99);
    (coreMaterial as any).emissiveIntensity = 0.5;
    
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    starGroup.add(coreMesh);

    // Glow effect using a larger, semi-transparent sphere
    const glowGeometry = new THREE.SphereGeometry(25, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff99,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    starGroup.add(glowMesh);

    return starGroup;
  }

  /**
   * Create a 3D space station
   */
  private createStation(_x: number, _y: number, _station: Station, isCurrent: boolean): THREE.Object3D {
    const stationGroup = new THREE.Group();

    // Main station structure (box-like)
    const mainGeometry = new THREE.BoxGeometry(16, 6, 12);
    const mainMaterial = new THREE.MeshLambertMaterial({
      color: isCurrent ? 0x00ff00 : 0xaaaaaa,
    });
    // Add emissive property manually for current station glow
    if (isCurrent) {
      (mainMaterial as any).emissive = new THREE.Color(0x003300);
    }
    
    const mainStructure = new THREE.Mesh(mainGeometry, mainMaterial);
    stationGroup.add(mainStructure);

    // Cross structure
    const crossGeometry = new THREE.BoxGeometry(6, 16, 8);
    const crossMaterial = new THREE.MeshLambertMaterial({
      color: isCurrent ? 0x00dd00 : 0x999999
    });
    const crossStructure = new THREE.Mesh(crossGeometry, crossMaterial);
    stationGroup.add(crossStructure);

    // Docking lights
    const lightGeometry = new THREE.SphereGeometry(1, 8, 8);
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
    });
    // Add emissive property manually for lights glow
    (lightMaterial as any).emissive = new THREE.Color(0x00ccff);
    (lightMaterial as any).emissiveIntensity = 0.8;

    // Add multiple docking lights
    for (let i = 0; i < 4; i++) {
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      const angle = (i / 4) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 10, Math.sin(angle) * 10, 6);
      stationGroup.add(light);
    }

    return stationGroup;
  }

  /**
   * Create a 3D planet
   */
  private createPlanet(_x: number, _y: number, planet: Planet): THREE.Object3D {
    const planetGroup = new THREE.Group();
    const radius = planet.radius || 15;

    // Planet surface
    const planetGeometry = new THREE.SphereGeometry(radius, 32, 32);
    let color = 0x888888;
    let emissiveColor = 0x000000;

    switch (planet.type) {
      case 'terrestrial':
        color = planet.habitable ? 0x4a90e2 : 0x8b4513;
        emissiveColor = planet.habitable ? 0x001122 : 0x000000;
        break;
      case 'gas-giant':
        color = 0xdaa520;
        emissiveColor = 0x221100;
        break;
      case 'ice':
        color = 0xb0e0e6;
        emissiveColor = 0x001111;
        break;
      case 'desert':
        color = 0xf4a460;
        emissiveColor = 0x221100;
        break;
      case 'ocean':
        color = 0x006994;
        emissiveColor = 0x001122;
        break;
    }

    const planetMaterial = new THREE.MeshLambertMaterial({
      color: color,
    });
    // Add emissive property manually
    (planetMaterial as any).emissive = new THREE.Color(emissiveColor);
    (planetMaterial as any).emissiveIntensity = 0.1;

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    planetGroup.add(planetMesh);

    // Atmosphere for habitable planets
    if (planet.habitable) {
      const atmosphereGeometry = new THREE.SphereGeometry(radius + 2, 32, 32);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      });
      const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      planetGroup.add(atmosphereMesh);
    }

    return planetGroup;
  }

  /**
   * Add subtle animations to 3D objects
   */
  private animate3DObject(mesh: THREE.Object3D, objectType: string): void {
    const time = Date.now() * 0.001; // Time in seconds

    switch (objectType) {
      case 'star':
        // Pulsing glow effect
        if (mesh instanceof THREE.Group && mesh.children.length > 1) {
          const glowMesh = mesh.children[1];
          if (glowMesh instanceof THREE.Mesh && glowMesh.material instanceof THREE.MeshBasicMaterial) {
            glowMesh.material.opacity = 0.1 + Math.sin(time * 2) * 0.05;
          }
        }
        break;
      case 'station':
        // Slow rotation
        mesh.rotation.z += 0.001;
        break;
      case 'planet':
        // Planet rotation
        mesh.rotation.y += 0.002;
        break;
    }
  }

  /**
   * Resize the renderer
   */
  resizeRenderer(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Dispose of all geometries and materials
    this.spaceObjects.forEach((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    // Dispose of star field
    if (this.stars) {
      this.stars.geometry.dispose();
      if (this.stars.material instanceof THREE.Material) {
        this.stars.material.dispose();
      }
    }

    // Dispose of renderer
    this.renderer.dispose();
  }
}