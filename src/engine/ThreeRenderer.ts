import * as THREE from 'three';
import { WorldManager } from '../systems/WorldManager';
import { TimeManager } from '../systems/TimeManager';
import { Station, Planet } from '../types/world';
import { Camera } from './Renderer';
import { StarGenerator } from './StarGenerator';

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
  private starGenerator: StarGenerator;

  // Dummy mesh cache for performance
  private dummyMeshCache: Map<string, THREE.BufferGeometry> = new Map();

  // Camera control properties
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private cameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 300);

  // 3D Navigation and interaction properties
  private isDragging: boolean = false;
  private dragStart: { x: number, y: number } = { x: 0, y: 0 };
  private selectedObject: THREE.Object3D | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  // Orbital visualization
  private planetOrbits: THREE.Group = new THREE.Group();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    try {
      // Initialize star generator for 3D space
      this.starGenerator = new StarGenerator({
        seed: 42, // Same seed as 2D renderer for consistency
        starDensity: 100, // Lower density for 3D space performance
        cellSize: 1000,   // Larger cells for 3D space
        minSize: 1,
        maxSize: 3,
        minBrightness: 0.3,
        maxBrightness: 1.0
      });
      
      // Initialize Three.js renderer with error handling
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: true
      });
      
      // Set renderer properties
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

      // Create orbital visualization group
      this.scene.add(this.planetOrbits);

      // Handle window resize
      this.setupResizeHandler();

      // Set up 3D navigation input handlers
      this.setupInputHandlers();
    } catch (error) {
      console.error('ThreeRenderer initialization failed:', error);
      throw new Error(`Failed to initialize 3D renderer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up lighting for the 3D scene
   */
  private setupLighting(): void {
    try {
      // Ambient light for general illumination
      this.ambientLight = new THREE.AmbientLight(0x404040, 0.4); // Dim ambient
      this.scene.add(this.ambientLight);

      // Directional light to simulate distant sun
      this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
      
      // Ensure the light was created successfully before setting properties
      if (this.sunLight && this.sunLight.position) {
        this.sunLight.position.set(1000, 500, 1000);
        this.sunLight.castShadow = false; // Disable shadows for performance
        this.scene.add(this.sunLight);
      } else {
        console.warn('Failed to create directional light, using ambient light only');
      }
    } catch (error) {
      console.error('Error setting up lighting:', error);
      // Fall back to basic ambient light only
      if (!this.ambientLight) {
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Brighter ambient as fallback
        this.scene.add(this.ambientLight);
      }
    }
  }

  /**
   * Create a 3D NPC ship with appropriate styling based on type
   */
  private createNPCShip(_x: number, _y: number, npcShip: any): THREE.Object3D {
    const shipGroup = new THREE.Group();
    shipGroup.name = `npc-ship-${npcShip.id}`;

    // Main hull - different colors based on NPC type
    const hullGeometry = new THREE.ConeGeometry(3, 12, 6);
    let hullColor = 0x666666; // Default gray

    switch (npcShip.type) {
      case 'trader':
        hullColor = 0x4a90e2; // Blue
        break;
      case 'pirate':
        hullColor = 0xff4444; // Red
        break;
      case 'patrol':
        hullColor = 0x44ff44; // Green
        break;
      case 'civilian':
        hullColor = 0xffff44; // Yellow
        break;
      case 'transport':
        hullColor = 0x8844ff; // Purple
        break;
    }

    const hullMaterial = new THREE.MeshLambertMaterial({ color: hullColor });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.rotateZ(Math.PI / 2); // Point to the right
    shipGroup.add(hullMesh);

    // Engine glow
    const engineGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    const engineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7
    });
    const engineMesh = new THREE.Mesh(engineGeometry, engineMaterial);
    engineMesh.position.set(-8, 0, 0);
    shipGroup.add(engineMesh);

    // Wings/fins
    const wingGeometry = new THREE.BoxGeometry(2, 8, 1);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: hullColor });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(2, 0, 2);
    shipGroup.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(2, 0, -2);
    shipGroup.add(rightWing);

    return shipGroup;
  }

  /**
   * Create a field of stars using seed-based generation
   */
  private createStarField(): void {
    // Generate initial set of stars for a large area around the origin
    const stars = this.starGenerator.generateStarsInViewport(
      0, 0, // Center at origin
      8000, 8000, // Large area to populate
      1.0 // No parallax for initial generation
    );

    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);

    stars.forEach((star, i) => {
      const index = i * 3;
      
      // Position
      positions[index] = star.x;
      positions[index + 1] = -star.y; // Flip Y for 3D space
      positions[index + 2] = (Math.random() - 0.5) * 2000; // Random Z depth
      
      // Color based on brightness
      const intensity = star.brightness;
      colors[index] = intensity;     // R
      colors[index + 1] = intensity; // G
      colors[index + 2] = intensity; // B
    });

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      sizeAttenuation: false // Keep consistent size regardless of distance
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
  render(camera: Camera, worldManager: WorldManager, timeManager: TimeManager): void {
    // Update camera position based on 2D camera for consistency
    this.updateCameraFromGameCamera(camera);

    // Update world objects (with pause state for animations)
    this.updateWorldObjects(worldManager, timeManager);

    // Update planet orbits
    this.createPlanetOrbits(worldManager);

    // Stars should remain fixed in space (no rotation)

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update 3D camera position based on game's 2D camera
   */
  private updateCameraFromGameCamera(gameCamera: Camera): void {
    // Convert 2D camera position to 3D - maintain true top-down perspective
    this.cameraTarget.set(gameCamera.x, -gameCamera.y, 0); // Flip Y for 3D space
    
    // Calculate camera distance based on zoom for consistent field of view
    const distance = 500 / gameCamera.zoom; // Increased base distance for better visibility
    
    // Position camera directly above the target for true top-down view
    this.cameraPosition.set(
      gameCamera.x,     // Same X as target
      -gameCamera.y,    // Same Y as target (flipped)
      distance          // Positioned directly above
    );

    this.camera.position.copy(this.cameraPosition);
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Update all world objects in the 3D scene
   */
  private updateWorldObjects(worldManager: WorldManager, timeManager?: TimeManager): void {
    const objects = worldManager.getAllVisibleObjects();
    const currentStation = worldManager.getCurrentStation() || null;
    const currentObjectIds = new Set<string>();
    const isTimeRunning = timeManager ? timeManager.getIsRunning() : true;

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
        
        // Add subtle animations only if time is running (not paused)
        if (isTimeRunning) {
          this.animate3DObject(mesh, obj.type);
        }
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
      case 'ship':
        return this.createShip(position.x, position.y, obj.object);
      case 'npc-ship':
        return this.createNPCShip(position.x, position.y, obj.object);
      case 'cargo':
        return this.createCargo(position.x, position.y, obj.object);
      case 'debris':
        return this.createDebris(position.x, position.y, obj.object);
      default:
        // Create a generic dummy mesh for unknown object types
        return this.createDummyMesh(obj.type, position.x, position.y);
    }
  }

  /**
   * Create a dummy mesh for objects without specific 3D representations
   */
  private createDummyMesh(objectType: string, _x: number, _y: number): THREE.Object3D {
    const group = new THREE.Group();
    
    // Get or create cached geometry for this object type
    let geometry = this.dummyMeshCache.get(objectType);
    if (!geometry) {
      // Create different dummy shapes based on object type
      switch (objectType) {
        case 'asteroid':
          geometry = new THREE.DodecahedronGeometry(5, 0);
          break;
        case 'beacon':
          geometry = new THREE.ConeGeometry(2, 8, 6);
          break;
        case 'probe':
          geometry = new THREE.OctahedronGeometry(3);
          break;
        case 'mine':
          geometry = new THREE.IcosahedronGeometry(4);
          break;
        default:
          // Generic cube for unknown types
          geometry = new THREE.BoxGeometry(4, 4, 4);
      }
      this.dummyMeshCache.set(objectType, geometry);
    }

    // Create material based on object type
    let color = 0x888888;
    let emissiveColor = 0x000000;
    
    switch (objectType) {
      case 'asteroid':
        color = 0x8b7355;
        break;
      case 'beacon':
        color = 0x00ff00;
        emissiveColor = 0x003300;
        break;
      case 'probe':
        color = 0x4a90e2;
        emissiveColor = 0x001122;
        break;
      case 'mine':
        color = 0xff4444;
        emissiveColor = 0x220000;
        break;
      default:
        color = 0x666666;
    }

    const material = new THREE.MeshLambertMaterial({ 
      color,
      emissive: emissiveColor,
      emissiveIntensity: emissiveColor !== 0x000000 ? 0.3 : 0
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    return group;
  }

  /**
   * Create a 3D star with glow effect
   */
  private createStar(_x: number, _y: number): THREE.Object3D {
    const starGroup = new THREE.Group();

    // Core star
    const coreGeometry = new THREE.SphereGeometry(8, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff99
    });
    // MeshBasicMaterial doesn't need emissive since it's unlit
    
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
      emissive: isCurrent ? 0x003300 : 0x000000,
      emissiveIntensity: isCurrent ? 0.3 : 0
    });
    
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
      color: 0x00ccff
    });
    // MeshBasicMaterial is unlit, so it appears bright by default

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
      emissive: emissiveColor,
      emissiveIntensity: 0.1
    });

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
   * Create a 3D ship representation
   */
  private createShip(_x: number, _y: number, ship: any): THREE.Object3D {
    const shipGroup = new THREE.Group();

    // Main hull
    const hullGeometry = new THREE.CylinderGeometry(2, 4, 12, 8);
    const hullMaterial = new THREE.MeshLambertMaterial({
      color: ship?.color || 0x4a90e2
    });
    const hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.rotation.z = Math.PI / 2; // Point forward
    shipGroup.add(hullMesh);

    // Engine glow
    const engineGeometry = new THREE.ConeGeometry(1.5, 3, 6);
    const engineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff
    });
    // MeshBasicMaterial is unlit, so it appears bright by default
    
    const engineMesh = new THREE.Mesh(engineGeometry, engineMaterial);
    engineMesh.position.set(-8, 0, 0);
    engineMesh.rotation.z = -Math.PI / 2;
    shipGroup.add(engineMesh);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(3, 8, 0.5);
    const wingMaterial = new THREE.MeshLambertMaterial({
      color: ship?.color || 0x4a90e2
    });
    const wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
    wingMesh.position.set(-2, 0, 0);
    shipGroup.add(wingMesh);

    return shipGroup;
  }

  /**
   * Create a 3D cargo container representation
   */
  private createCargo(_x: number, _y: number, cargo: any): THREE.Object3D {
    const cargoGroup = new THREE.Group();

    // Main container box
    const containerGeometry = new THREE.BoxGeometry(6, 6, 8);
    const containerMaterial = new THREE.MeshLambertMaterial({
      color: cargo?.type === 'valuable' ? 0xffd700 : 0x888888
    });
    const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
    cargoGroup.add(containerMesh);

    // Corner reinforcements
    const cornerGeometry = new THREE.BoxGeometry(1, 1, 8.2);
    const cornerMaterial = new THREE.MeshLambertMaterial({
      color: 0x555555
    });

    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
        corner.position.set(i * 2.5, j * 2.5, 0);
        cargoGroup.add(corner);
      }
    }

    return cargoGroup;
  }

  /**
   * Create a 3D debris representation
   */
  private createDebris(_x: number, _y: number, debris: any): THREE.Object3D {
    const debrisGroup = new THREE.Group();

    // Random debris shapes
    const pieces = Math.floor(Math.random() * 3) + 2; // 2-4 pieces

    for (let i = 0; i < pieces; i++) {
      const size = Math.random() * 2 + 1;
      const geometry = Math.random() > 0.5 ? 
        new THREE.BoxGeometry(size, size, size) :
        new THREE.DodecahedronGeometry(size);
      
      const material = new THREE.MeshLambertMaterial({
        color: debris?.metallic ? 0x999999 : 0x654321
      });

      const piece = new THREE.Mesh(geometry, material);
      piece.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      piece.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      debrisGroup.add(piece);
    }

    return debrisGroup;
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
        // Slow rotation - only if not paused
        mesh.rotation.z += 0.001;
        break;
      case 'planet':
        // Planet rotation
        mesh.rotation.y += 0.002;
        break;
      case 'ship':
        // Engine glow pulse - use opacity changes for MeshBasicMaterial
        if (mesh instanceof THREE.Group && mesh.children.length > 1) {
          const engineMesh = mesh.children[1];
          if (engineMesh instanceof THREE.Mesh && engineMesh.material instanceof THREE.MeshBasicMaterial) {
            const intensity = 0.7 + Math.sin(time * 8) * 0.3;
            engineMesh.material.opacity = intensity;
            engineMesh.material.transparent = true;
          }
        }
        break;
      case 'debris':
        // Tumbling motion
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.005;
        mesh.rotation.z += 0.008;
        break;
      case 'beacon':
        // Blinking light - use opacity for effect with MeshLambertMaterial
        if (mesh instanceof THREE.Group && mesh.children.length > 0) {
          const beaconMesh = mesh.children[0];
          if (beaconMesh instanceof THREE.Mesh && beaconMesh.material instanceof THREE.MeshLambertMaterial) {
            const blink = Math.sin(time * 4) > 0.5 ? 1 : 0.2;
            beaconMesh.material.emissiveIntensity = blink * 0.5;
          }
        }
        break;
      case 'asteroid':
        // Slow rotation
        mesh.rotation.x += 0.002;
        mesh.rotation.y += 0.003;
        break;
      default:
        // Generic slow rotation for unknown objects
        mesh.rotation.y += 0.001;
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
   * Set up 3D navigation input handlers
   */
  private setupInputHandlers(): void {
    // Right-click drag for camera movement
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Left-click for object selection
    this.canvas.addEventListener('click', this.onMouseClick.bind(this));
    
    // Mouse wheel for zoom
    this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
    
    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle mouse down events
   */
  private onMouseDown(event: MouseEvent): void {
    if (event.button === 2) { // Right mouse button
      this.isDragging = true;
      this.dragStart.x = event.clientX;
      this.dragStart.y = event.clientY;
    }
  }

  /**
   * Handle mouse move events
   */
  private onMouseMove(event: MouseEvent): void {
    if (this.isDragging && event.buttons === 4) { // Right mouse button is down
      const deltaX = event.clientX - this.dragStart.x;
      const deltaY = event.clientY - this.dragStart.y;
      
      // Calculate movement based on camera distance for consistent feel
      const distance = this.cameraPosition.distanceTo(this.cameraTarget);
      const movementSpeed = distance * 0.002;
      
      // Move camera target based on mouse movement
      this.cameraTarget.x -= deltaX * movementSpeed;
      this.cameraTarget.y += deltaY * movementSpeed; // Invert Y for natural feel
      
      // Update camera position to maintain relative position to target
      this.cameraPosition.x = this.cameraTarget.x;
      this.cameraPosition.y = this.cameraTarget.y;
      
      // Update camera
      this.camera.position.copy(this.cameraPosition);
      this.camera.lookAt(this.cameraTarget);
      
      // Update drag start position for smooth continuous dragging
      this.dragStart.x = event.clientX;
      this.dragStart.y = event.clientY;
    }
  }

  /**
   * Handle mouse up events
   */
  private onMouseUp(event: MouseEvent): void {
    if (event.button === 2) { // Right mouse button
      this.isDragging = false;
    }
  }

  /**
   * Handle mouse click events for object selection
   */
  private onMouseClick(event: MouseEvent): void {
    if (event.button === 0) { // Left mouse button
      // Calculate normalized device coordinates
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // Calculate objects intersecting the picking ray
      const intersects = this.raycaster.intersectObjects([...this.spaceObjects.values()], true);
      
      if (intersects.length > 0) {
        // Select the closest object
        this.selectObject(intersects[0].object);
      } else {
        // Deselect current object
        this.deselectObject();
      }
    }
  }

  /**
   * Handle mouse wheel events for zoom
   */
  private onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    
    // Calculate zoom based on wheel delta
    const zoomSpeed = 0.1;
    const zoomDelta = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    
    // Calculate new camera distance
    const currentDistance = this.cameraPosition.distanceTo(this.cameraTarget);
    const newDistance = Math.max(50, Math.min(2000, currentDistance * zoomDelta)); // Clamp zoom
    
    // Update camera position to maintain target focus
    this.cameraPosition.z = this.cameraTarget.z + newDistance;
    this.camera.position.copy(this.cameraPosition);
  }

  /**
   * Select an object and show its information
   */
  private selectObject(object: THREE.Object3D): void {
    // Deselect previous object
    this.deselectObject();
    
    // Find the top-level object in our space objects map
    let topLevelObject = object;
    while (topLevelObject.parent && topLevelObject.parent !== this.scene) {
      topLevelObject = topLevelObject.parent;
    }
    
    this.selectedObject = topLevelObject;
    
    // Add visual selection indicator (outline or glow effect)
    this.addSelectionIndicator(topLevelObject);
    
    // TODO: Dispatch event or call callback to show object information panel
    console.log('Selected object:', topLevelObject.name || 'Unknown object');
  }

  /**
   * Deselect the currently selected object
   */
  private deselectObject(): void {
    if (this.selectedObject) {
      this.removeSelectionIndicator(this.selectedObject);
      this.selectedObject = null;
    }
  }

  /**
   * Add visual selection indicator to an object
   */
  private addSelectionIndicator(object: THREE.Object3D): void {
    // Create an outline effect as selection indicator instead of wireframe
    if (object instanceof THREE.Group && object.children.length > 0) {
      const mainMesh = object.children[0];
      if (mainMesh instanceof THREE.Mesh) {
        // Create outline using edge geometry
        const edges = new THREE.EdgesGeometry(mainMesh.geometry);
        const outlineMaterial = new THREE.LineBasicMaterial({
          color: 0x00ff00,
          linewidth: 2,
          transparent: true,
          opacity: 0.8
        });
        
        const outline = new THREE.LineSegments(edges, outlineMaterial);
        outline.name = 'selection-indicator';
        outline.scale.setScalar(1.05); // Slightly larger than original for outline effect
        
        object.add(outline);
      }
    }
  }

  /**
   * Create planet orbits for visualization
   */
  private createPlanetOrbits(worldManager: WorldManager): void {
    // Clear existing orbits
    this.planetOrbits.clear();

    const currentSystem = worldManager.getCurrentSystem();
    if (!currentSystem || !currentSystem.planets) return;

    // Find system center (star position)
    const systemCenter = new THREE.Vector3(currentSystem.position.x, -currentSystem.position.y, 0);

    // Create orbit lines for each planet
    currentSystem.planets.forEach(planet => {
      const planetPos = new THREE.Vector3(planet.position.x, -planet.position.y, 0);
      const orbitRadius = planetPos.distanceTo(systemCenter);

      if (orbitRadius > 5) { // Only show orbits for planets with reasonable distance
        const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.5, orbitRadius + 0.5, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
          color: 0x444444,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });

        const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbitMesh.position.copy(systemCenter);
        orbitMesh.rotateX(Math.PI / 2); // Make it horizontal
        
        this.planetOrbits.add(orbitMesh);
      }
    });
  }

  /**
   * Remove visual selection indicator from an object
   */
  private removeSelectionIndicator(object: THREE.Object3D): void {
    const indicator = object.children.find(child => child.name === 'selection-indicator');
    if (indicator) {
      object.remove(indicator);
      // Clean up geometry and material for LineSegments
      if (indicator instanceof THREE.LineSegments) {
        indicator.geometry.dispose();
        if (indicator.material instanceof THREE.Material) {
          indicator.material.dispose();
        }
      }
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.removeEventListener('click', this.onMouseClick.bind(this));
    this.canvas.removeEventListener('wheel', this.onMouseWheel.bind(this));
    
    // Deselect any selected object
    this.deselectObject();

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

    // Dispose of cached dummy mesh geometries
    this.dummyMeshCache.forEach((geometry) => {
      geometry.dispose();
    });
    this.dummyMeshCache.clear();

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