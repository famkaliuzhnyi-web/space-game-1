# API Documentation 📖

## 🧩 Component API

### App Component

**Location**: `src/App.tsx`

```typescript
function App(): JSX.Element
```

**Description**: Main application component that renders the space game interface.

**State**:
```typescript
const [score, setScore] = useState<number>(0)
```

**Props**: None

**Returns**: JSX element containing the complete game interface

**Example**:
```typescript
import App from './App'

// Usage in main.tsx
<App />
```

**CSS Classes**:
- `.card` - Game content container
- `.read-the-docs` - Footer text styling

---

## 🎮 Game Logic API

### Score Management

**Current Implementation**:
```typescript
// State
const [score, setScore] = useState(0)

// Score increment handler
const handleStarClick = () => setScore((score) => score + 10)
```

**Future API Design**:
```typescript
interface GameState {
  score: number
  highScore: number
  level: number
  lives: number
  isPlaying: boolean
}

interface GameActions {
  collectStar: (points?: number) => void
  resetGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  levelUp: () => void
}

// Custom hook API
const useGameState = (): [GameState, GameActions] => {
  // Implementation details
}
```

---

## 🎨 Styling API

### CSS Custom Properties

**Current Theme Variables**:
```css
:root {
  --font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  --line-height: 1.5;
  --font-weight: 400;
  
  --color-scheme: light dark;
  --color: rgba(255, 255, 255, 0.87);
  --background-color: #1a1a1a;
  
  --font-synthesis: none;
  --text-rendering: optimizeLegibility;
  --webkit-font-smoothing: antialiased;
  --moz-osx-font-smoothing: grayscale;
  --webkit-text-size-adjust: 100%;
}
```

**Planned Theme API**:
```css
:root {
  /* Color System */
  --color-primary: #646cff;
  --color-primary-hover: #535bf2;
  --color-secondary: #61dafb;
  --color-accent: #f9f;
  
  --color-background: #1a1a1a;
  --color-background-alt: #2a2a2a;
  --color-surface: #3a3a3a;
  
  --color-text: #ffffff;
  --color-text-secondary: #cccccc;
  --color-text-muted: #888888;
  
  /* Spacing System */
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 1rem;     /* 16px */
  --space-lg: 2rem;     /* 32px */
  --space-xl: 4rem;     /* 64px */
  
  /* Typography */
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.25rem;   /* 20px */
  --font-size-xl: 1.5rem;    /* 24px */
  --font-size-2xl: 2rem;     /* 32px */
  
  /* Borders & Shadows */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
  
  /* Animation */
  --transition-fast: 0.15s ease;
  --transition-base: 0.3s ease;
  --transition-slow: 0.5s ease;
}
```

### Component Classes

**Button Components**:
```css
/* Base button class */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;  /* Touch target minimum */
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition-fast);
  touch-action: manipulation;  /* Prevent iOS zoom */
}

/* Button variants */
.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background: var(--color-primary-hover);
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
}

/* Button sizes */
.btn--small {
  min-height: 36px;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
}

.btn--large {
  min-height: 56px;
  padding: var(--space-md) var(--space-lg);
  font-size: var(--font-size-lg);
}
```

**Layout Components**:
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-md);
}

.game-board {
  display: grid;
  gap: var(--space-md);
  max-width: 800px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .game-board {
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## 🔧 Utility Functions API

### Planned Utility Functions

**Score Utilities**:
```typescript
/**
 * Format score for display with commas
 * @param score - Raw score number
 * @returns Formatted score string
 * @example formatScore(12345) // "12,345"
 */
export const formatScore = (score: number): string => {
  return score.toLocaleString()
}

/**
 * Calculate score multiplier based on level
 * @param level - Current game level
 * @returns Score multiplier
 */
export const getScoreMultiplier = (level: number): number => {
  return Math.max(1, Math.floor(level / 5) + 1)
}

/**
 * Calculate required score for next level
 * @param currentLevel - Current game level
 * @returns Score needed for next level
 */
export const getNextLevelScore = (currentLevel: number): number => {
  return currentLevel * 100 + (currentLevel - 1) * 50
}
```

**Local Storage Utilities**:
```typescript
/**
 * Save game state to local storage
 * @param key - Storage key
 * @param value - Value to store
 */
export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

/**
 * Load game state from local storage
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Stored value or default
 */
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
    return defaultValue
  }
}
```

**Animation Utilities**:
```typescript
/**
 * Request animation frame hook
 * @param callback - Function to call on each frame
 * @param running - Whether animation should be running
 */
export const useAnimationFrame = (
  callback: () => void,
  running: boolean = true
): void => {
  const callbackRef = useRef(callback)
  const frameRef = useRef<number>()
  
  useEffect(() => {
    callbackRef.current = callback
  })
  
  useEffect(() => {
    if (!running) return
    
    const tick = () => {
      callbackRef.current()
      frameRef.current = requestAnimationFrame(tick)
    }
    
    frameRef.current = requestAnimationFrame(tick)
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [running])
}

/**
 * Easing functions for animations
 */
export const easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => 
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
}
```

---

## 🎵 Audio API (Planned)

```typescript
interface AudioManager {
  /**
   * Play a sound effect
   * @param soundId - Unique identifier for the sound
   * @param volume - Volume level (0-1)
   */
  playSound: (soundId: string, volume?: number) => void
  
  /**
   * Play background music
   * @param musicId - Unique identifier for the music
   * @param volume - Volume level (0-1)
   * @param loop - Whether to loop the music
   */
  playMusic: (musicId: string, volume?: number, loop?: boolean) => void
  
  /**
   * Stop all sounds
   */
  stopAll: () => void
  
  /**
   * Set master volume
   * @param volume - Master volume level (0-1)
   */
  setVolume: (volume: number) => void
  
  /**
   * Mute/unmute audio
   * @param muted - Whether audio should be muted
   */
  setMuted: (muted: boolean) => void
}

// Usage example
const audioManager = useAudioManager()

// Play sound on star collection
const handleStarClick = () => {
  audioManager.playSound('star-collect', 0.7)
  setScore(score => score + 10)
}
```

---

## 🎮 Game Engine API (Planned)

```typescript
interface GameObject {
  id: string
  x: number
  y: number
  width: number
  height: number
  velocity: { x: number; y: number }
  visible: boolean
  update: (deltaTime: number) => void
  render: (context: CanvasRenderingContext2D) => void
  collidesWith: (other: GameObject) => boolean
}

interface GameEngine {
  /**
   * Add object to the game world
   * @param object - Game object to add
   */
  addObject: (object: GameObject) => void
  
  /**
   * Remove object from the game world
   * @param id - ID of object to remove
   */
  removeObject: (id: string) => void
  
  /**
   * Get object by ID
   * @param id - Object ID
   * @returns Game object or undefined
   */
  getObject: (id: string) => GameObject | undefined
  
  /**
   * Start the game loop
   */
  start: () => void
  
  /**
   * Stop the game loop
   */
  stop: () => void
  
  /**
   * Pause/unpause the game
   * @param paused - Whether game should be paused
   */
  setPaused: (paused: boolean) => void
}
```

---

## 📱 Mobile API

### Touch Event Handling
```typescript
interface TouchHandler {
  /**
   * Handle touch start event
   * @param event - Touch event
   * @param callback - Function to call on touch start
   */
  onTouchStart: (event: TouchEvent, callback: (touch: Touch) => void) => void
  
  /**
   * Handle touch move event
   * @param event - Touch event
   * @param callback - Function to call on touch move
   */
  onTouchMove: (event: TouchEvent, callback: (touch: Touch) => void) => void
  
  /**
   * Handle touch end event
   * @param event - Touch event
   * @param callback - Function to call on touch end
   */
  onTouchEnd: (event: TouchEvent, callback: (touch: Touch) => void) => void
  
  /**
   * Prevent default touch behaviors
   * @param element - Element to apply prevention to
   */
  preventDefaults: (element: HTMLElement) => void
}
```

### Device Detection
```typescript
/**
 * Detect if device supports touch
 * @returns True if touch is supported
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Detect if device is mobile
 * @returns True if mobile device
 */
export const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Get viewport dimensions
 * @returns Viewport width and height
 */
export const getViewportSize = (): { width: number; height: number } => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}
```

---

## 🔧 Development API

### Testing Utilities
```typescript
/**
 * Mock game state for testing
 * @param overrides - Partial state to override defaults
 * @returns Mock game state
 */
export const createMockGameState = (
  overrides: Partial<GameState> = {}
): GameState => {
  return {
    score: 0,
    highScore: 1000,
    level: 1,
    lives: 3,
    isPlaying: false,
    ...overrides
  }
}

/**
 * Render component with game context for testing
 * @param component - Component to render
 * @param gameState - Initial game state
 */
export const renderWithGameContext = (
  component: ReactElement,
  gameState: GameState = createMockGameState()
) => {
  return render(
    <GameProvider initialState={gameState}>
      {component}
    </GameProvider>
  )
}
```

---

## 📊 Analytics API (Planned)

```typescript
interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: number
}

interface Analytics {
  /**
   * Track game event
   * @param event - Event name
   * @param properties - Additional event properties
   */
  track: (event: string, properties?: Record<string, any>) => void
  
  /**
   * Track page view
   * @param page - Page identifier
   */
  pageView: (page: string) => void
  
  /**
   * Set user properties
   * @param properties - User properties to set
   */
  setUserProperties: (properties: Record<string, any>) => void
}

// Usage examples
analytics.track('star_collected', { score: 100, level: 2 })
analytics.track('game_started')
analytics.track('game_ended', { finalScore: 1250, duration: 120 })
```

---

*This API documentation will evolve as the game grows in complexity. All APIs are designed with TypeScript-first approach for better developer experience.* 🚀