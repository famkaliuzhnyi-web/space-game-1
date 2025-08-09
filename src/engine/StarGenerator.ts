/**
 * Seed-based infinite star generator for the space game background.
 * 
 * This system generates stars using a deterministic hash-based approach that
 * eliminates visible patterns and "follow lines" while providing infinite,
 * non-repeating star fields.
 * 
 * Key features:
 * - Deterministic generation based on seed and coordinates
 * - Grid-based system for efficient rendering
 * - No visible patterns or repetition
 * - Smooth parallax support
 * - Performance optimized for real-time rendering
 */

export interface StarData {
  x: number;
  y: number;
  size: number;
  brightness: number;
}

export interface StarGeneratorConfig {
  seed: number;
  starDensity: number; // Stars per 1000x1000 area
  cellSize: number;    // Size of each generation cell
  minSize: number;
  maxSize: number;
  minBrightness: number;
  maxBrightness: number;
}

export class StarGenerator {
  private config: StarGeneratorConfig;

  constructor(config: Partial<StarGeneratorConfig> = {}) {
    this.config = {
      seed: 12345,
      starDensity: 200,
      cellSize: 500,
      minSize: 1,
      maxSize: 4,
      minBrightness: 0.3,
      maxBrightness: 1.0,
      ...config
    };
  }

  /**
   * Generate stars visible in the given viewport with parallax offset
   */
  generateStarsInViewport(
    cameraX: number, 
    cameraY: number, 
    viewportWidth: number, 
    viewportHeight: number,
    parallaxFactor: number = 1.0
  ): StarData[] {
    const stars: StarData[] = [];
    
    // Calculate the effective viewport in star space considering parallax
    const starSpaceX = cameraX * parallaxFactor;
    const starSpaceY = cameraY * parallaxFactor;
    
    // Determine which cells we need to generate
    const leftCell = Math.floor((starSpaceX - viewportWidth / 2) / this.config.cellSize);
    const rightCell = Math.floor((starSpaceX + viewportWidth / 2) / this.config.cellSize);
    const topCell = Math.floor((starSpaceY - viewportHeight / 2) / this.config.cellSize);
    const bottomCell = Math.floor((starSpaceY + viewportHeight / 2) / this.config.cellSize);
    
    // Generate stars for each relevant cell
    for (let cellX = leftCell; cellX <= rightCell; cellX++) {
      for (let cellY = topCell; cellY <= bottomCell; cellY++) {
        const cellStars = this.generateStarsInCell(cellX, cellY);
        stars.push(...cellStars);
      }
    }
    
    return stars;
  }

  /**
   * Generate stars for a specific cell using deterministic hashing
   */
  private generateStarsInCell(cellX: number, cellY: number): StarData[] {
    const stars: StarData[] = [];
    
    // Create a seed for this cell using improved hashing
    const cellSeed = this.hashCellCoordinates(cellX, cellY, this.config.seed);
    
    // Initialize PRNG state for this cell
    let rngState = cellSeed;
    
    // Determine number of stars in this cell
    const baseStarCount = Math.floor(this.config.starDensity * (this.config.cellSize / 1000) ** 2);
    rngState = this.xorshift32(rngState);
    const starCount = baseStarCount + (Math.abs(rngState) % 5) - 2; // ±2 variation
    
    // Generate stars at deterministic positions within the cell
    for (let i = 0; i < Math.max(0, starCount); i++) {
      // Generate position within cell using improved randomness
      rngState = this.xorshift32(rngState);
      const localX = Math.abs(rngState) % this.config.cellSize;
      
      rngState = this.xorshift32(rngState);
      const localY = Math.abs(rngState) % this.config.cellSize;
      
      const x = cellX * this.config.cellSize + localX;
      const y = cellY * this.config.cellSize + localY;
      
      // Generate star properties with better distribution
      rngState = this.xorshift32(rngState);
      const sizeRange = this.config.maxSize - this.config.minSize;
      const size = this.config.minSize + (Math.abs(rngState) / 0x7fffffff) * sizeRange;
      
      rngState = this.xorshift32(rngState);
      const brightnessRange = this.config.maxBrightness - this.config.minBrightness;
      const brightness = this.config.minBrightness + (Math.abs(rngState) / 0x7fffffff) * brightnessRange;
      
      stars.push({ x, y, size, brightness });
    }
    
    return stars;
  }

  /**
   * Hash cell coordinates with seed to create deterministic randomness
   * Uses FNV-1a hash for better distribution
   */
  private hashCellCoordinates(cellX: number, cellY: number, seed: number): number {
    // FNV-1a hash algorithm for better randomness
    let hash = seed ^ 0x811c9dc5; // FNV offset basis
    
    // Hash cellX
    const xBytes = new Uint8Array(new Int32Array([cellX]).buffer);
    for (const byte of xBytes) {
      hash ^= byte;
      hash = (hash * 0x01000193) >>> 0; // FNV prime
    }
    
    // Hash cellY  
    const yBytes = new Uint8Array(new Int32Array([cellY]).buffer);
    for (const byte of yBytes) {
      hash ^= byte;
      hash = (hash * 0x01000193) >>> 0; // FNV prime
    }
    
    return hash & 0x7fffffff; // Ensure positive
  }

  /**
   * Xorshift32 PRNG for high-quality pseudo-random sequences
   * Much better distribution than linear congruential generators
   */
  private xorshift32(state: number): number {
    if (state === 0) state = 1; // Avoid zero state
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state & 0x7fffffff; // Keep positive
  }

  /**
   * Update generator configuration
   */
  updateConfig(newConfig: Partial<StarGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): StarGeneratorConfig {
    return { ...this.config };
  }
}