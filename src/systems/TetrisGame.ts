import {
  TetrisBoard,
  TetrisPiece,
  TetrisGameState,
  TetrisPosition,
  TetrominoShape,
  TETRIS_SHAPES,
  TETRIS_BOARD_WIDTH,
  TETRIS_BOARD_HEIGHT,
  TETRIS_INITIAL_DROP_TIME
} from '../types/tetris';

export class TetrisGame {
  private state: TetrisGameState;
  private gameLoopId: number | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): TetrisGameState {
    return {
      board: this.createEmptyBoard(),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      level: 1,
      lines: 0,
      isGameOver: false,
      isPaused: false,
      dropTime: TETRIS_INITIAL_DROP_TIME,
      lastDrop: Date.now()
    };
  }

  private createEmptyBoard(): TetrisBoard {
    const grid: (string | null)[][] = [];
    for (let y = 0; y < TETRIS_BOARD_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < TETRIS_BOARD_WIDTH; x++) {
        grid[y][x] = null;
      }
    }
    return {
      width: TETRIS_BOARD_WIDTH,
      height: TETRIS_BOARD_HEIGHT,
      grid
    };
  }

  private getRandomShape(): TetrominoShape {
    const randomIndex = Math.floor(Math.random() * TETRIS_SHAPES.length);
    return TETRIS_SHAPES[randomIndex];
  }

  private createPiece(shape: TetrominoShape): TetrisPiece {
    return {
      shape,
      position: { x: Math.floor(TETRIS_BOARD_WIDTH / 2) - 1, y: 0 },
      rotation: 0
    };
  }

  private spawnNewPiece(): void {
    if (this.state.nextPiece) {
      this.state.currentPiece = this.state.nextPiece;
    } else {
      this.state.currentPiece = this.createPiece(this.getRandomShape());
    }
    this.state.nextPiece = this.createPiece(this.getRandomShape());

    // Check for game over
    if (this.state.currentPiece && this.isColliding(this.state.currentPiece)) {
      this.state.isGameOver = true;
    }
  }

  private getPieceBlocks(piece: TetrisPiece): TetrisPosition[] {
    const blocks = piece.shape.rotations[piece.rotation];
    return blocks.map(block => ({
      x: block.x + piece.position.x,
      y: block.y + piece.position.y
    }));
  }

  private isColliding(piece: TetrisPiece, dx: number = 0, dy: number = 0, newRotation?: number): boolean {
    const rotation = newRotation !== undefined ? newRotation : piece.rotation;
    const blocks = piece.shape.rotations[rotation];
    
    for (const block of blocks) {
      const x = block.x + piece.position.x + dx;
      const y = block.y + piece.position.y + dy;

      // Check boundaries
      if (x < 0 || x >= TETRIS_BOARD_WIDTH || y >= TETRIS_BOARD_HEIGHT) {
        return true;
      }

      // Check collision with placed blocks (but not if we're above the board)
      if (y >= 0 && this.state.board.grid[y][x] !== null) {
        return true;
      }
    }

    return false;
  }

  private placePiece(): void {
    if (!this.state.currentPiece) return;

    const blocks = this.getPieceBlocks(this.state.currentPiece);
    for (const block of blocks) {
      if (block.y >= 0) {
        this.state.board.grid[block.y][block.x] = this.state.currentPiece.shape.color;
      }
    }

    this.clearLines();
    this.spawnNewPiece();
  }

  private clearLines(): void {
    let linesCleared = 0;
    
    for (let y = TETRIS_BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.state.board.grid[y].every(cell => cell !== null)) {
        // Remove the full line
        this.state.board.grid.splice(y, 1);
        // Add empty line at the top
        this.state.board.grid.unshift(new Array(TETRIS_BOARD_WIDTH).fill(null));
        linesCleared++;
        y++; // Check the same line again since we moved everything down
      }
    }

    if (linesCleared > 0) {
      this.state.lines += linesCleared;
      // Score calculation: more lines at once = exponentially more points
      const linePoints = [0, 40, 100, 300, 1200][linesCleared] || 1200;
      this.state.score += linePoints * (this.state.level + 1);
      
      // Level up every 10 lines
      const newLevel = Math.floor(this.state.lines / 10) + 1;
      if (newLevel > this.state.level) {
        this.state.level = newLevel;
        // Increase drop speed with level
        this.state.dropTime = Math.max(50, TETRIS_INITIAL_DROP_TIME - (this.state.level - 1) * 50);
      }
    }
  }

  public getState(): TetrisGameState {
    return { ...this.state };
  }

  public moveLeft(): boolean {
    if (!this.state.currentPiece || this.state.isGameOver || this.state.isPaused) return false;
    
    if (!this.isColliding(this.state.currentPiece, -1, 0)) {
      this.state.currentPiece.position.x -= 1;
      return true;
    }
    return false;
  }

  public moveRight(): boolean {
    if (!this.state.currentPiece || this.state.isGameOver || this.state.isPaused) return false;
    
    if (!this.isColliding(this.state.currentPiece, 1, 0)) {
      this.state.currentPiece.position.x += 1;
      return true;
    }
    return false;
  }

  public moveDown(): boolean {
    if (!this.state.currentPiece || this.state.isGameOver || this.state.isPaused) return false;
    
    if (!this.isColliding(this.state.currentPiece, 0, 1)) {
      this.state.currentPiece.position.y += 1;
      this.state.score += 1; // Soft drop bonus
      return true;
    } else {
      this.placePiece();
      return false;
    }
  }

  public rotate(): boolean {
    if (!this.state.currentPiece || this.state.isGameOver || this.state.isPaused) return false;
    
    const newRotation = (this.state.currentPiece.rotation + 1) % 4;
    if (!this.isColliding(this.state.currentPiece, 0, 0, newRotation)) {
      this.state.currentPiece.rotation = newRotation;
      return true;
    }
    return false;
  }

  public hardDrop(): number {
    if (!this.state.currentPiece || this.state.isGameOver || this.state.isPaused) return 0;
    
    let dropDistance = 0;
    while (!this.isColliding(this.state.currentPiece, 0, 1)) {
      this.state.currentPiece.position.y += 1;
      dropDistance++;
    }
    
    this.state.score += dropDistance * 2; // Hard drop bonus
    this.placePiece();
    return dropDistance;
  }

  public drop(): boolean {
    const now = Date.now();
    if (now - this.state.lastDrop >= this.state.dropTime) {
      this.state.lastDrop = now;
      return this.moveDown();
    }
    return false;
  }

  public pause(): void {
    this.state.isPaused = !this.state.isPaused;
  }

  public restart(): void {
    this.state = this.createInitialState();
    this.spawnNewPiece();
  }

  public start(): void {
    if (!this.state.currentPiece && !this.state.isGameOver) {
      this.spawnNewPiece();
    }
  }

  public update(): void {
    if (this.state.isGameOver || this.state.isPaused) return;
    
    if (!this.state.currentPiece) {
      this.spawnNewPiece();
    } else {
      this.drop();
    }
  }

  public startGameLoop(callback: () => void): void {
    this.stopGameLoop();
    
    const loop = () => {
      this.update();
      callback();
      this.gameLoopId = requestAnimationFrame(loop);
    };
    
    this.gameLoopId = requestAnimationFrame(loop);
  }

  public stopGameLoop(): void {
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }
}