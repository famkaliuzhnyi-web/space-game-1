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
    
    // Create a seed for this cell
    const cellSeed = this.hashCellCoordinates(cellX, cellY, this.config.seed);
    
    // Determine number of stars in this cell
    const baseStarCount = Math.floor(this.config.starDensity * (this.config.cellSize / 1000) ** 2);
    const starCount = baseStarCount + (this.fastHash(cellSeed + 1) % 5) - 2; // ±2 variation
    
    // Generate stars at deterministic positions within the cell
    for (let i = 0; i < Math.max(0, starCount); i++) {
      const starSeed = cellSeed + i * 1000; // Ensure unique seed per star
      
      // Generate position within cell
      const localX = (this.fastHash(starSeed) % this.config.cellSize);
      const localY = (this.fastHash(starSeed + 1) % this.config.cellSize);
      
      const x = cellX * this.config.cellSize + localX;
      const y = cellY * this.config.cellSize + localY;
      
      // Generate star properties
      const sizeRange = this.config.maxSize - this.config.minSize;
      const size = this.config.minSize + ((this.fastHash(starSeed + 2) % 100) / 100) * sizeRange;
      
      const brightnessRange = this.config.maxBrightness - this.config.minBrightness;
      const brightness = this.config.minBrightness + ((this.fastHash(starSeed + 3) % 100) / 100) * brightnessRange;
      
      stars.push({ x, y, size, brightness });
    }
    
    return stars;
  }

  /**
   * Hash cell coordinates with seed to create deterministic randomness
   */
  private hashCellCoordinates(cellX: number, cellY: number, seed: number): number {
    // Simple hash function that combines cell coordinates with seed
    let hash = seed;
    hash = (hash * 31 + cellX) & 0x7fffffff;
    hash = (hash * 31 + cellY) & 0x7fffffff;
    return hash;
  }

  /**
   * Fast hash function for generating pseudo-random numbers
   * Based on the linear congruential generator pattern
   */
  private fastHash(input: number): number {
    let hash = input;
    hash = ((hash * 1664525) + 1013904223) & 0x7fffffff;
    return hash;
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