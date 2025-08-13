import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiplayerManager } from '../systems/MultiplayerManager';

// Mock WebSocket
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  public readyState: number;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    this.readyState = MockWebSocket.CONNECTING;
    
    // Simulate immediate connection failure
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onerror) {
        this.onerror(new Event('error'));
      }
      if (this.onclose) {
        this.onclose(new CloseEvent('close', { code: 1006 }));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000 }));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('MultiplayerManager', () => {
  let multiplayerManager: MultiplayerManager;

  beforeEach(() => {
    // Reset the singleton instance
    (MultiplayerManager as any).instance = null;
    multiplayerManager = MultiplayerManager.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    multiplayerManager.disconnect();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = MultiplayerManager.getInstance();
      const instance2 = MultiplayerManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Join Code Parsing', () => {
    test('should parse URL format join codes', async () => {
      const joinCode = 'https://example.com/join?session=abc123&host=ws://localhost:8080';
      
      const result = await multiplayerManager.joinSession(joinCode, 'TestPlayer');
      
      // Should fail to connect but parsing should work
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to connect to game server');
    });

    test('should parse pipe-separated format join codes', async () => {
      const joinCode = 'abc123|ws://localhost:8080';
      
      const result = await multiplayerManager.joinSession(joinCode, 'TestPlayer');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to connect to game server');
    });

    test('should parse simple session ID format', async () => {
      const joinCode = 'abc123';
      
      const result = await multiplayerManager.joinSession(joinCode, 'TestPlayer');
      
      // Should use default server and fail to connect
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to connect to game server');
    });

    test('should handle invalid join codes', async () => {
      const result = await multiplayerManager.joinSession('', 'TestPlayer');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid join code format');
    });
  });

  describe('Connection Management', () => {
    test('should prevent concurrent connection attempts', async () => {
      const joinCode = 'test-session';
      
      // Start first connection attempt
      const promise1 = multiplayerManager.joinSession(joinCode, 'Player1');
      
      // Attempt second connection while first is in progress
      const result = await multiplayerManager.joinSession(joinCode, 'Player2');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already attempting to connect');
      
      // Clean up first attempt
      await promise1.catch(() => {}); // Ignore error
    });

    test('should track connection state correctly', () => {
      expect(multiplayerManager.isConnected()).toBe(false);
      expect(multiplayerManager.getCurrentSession()).toBeNull();
    });

    test('should generate unique player IDs', () => {
      const playerId1 = multiplayerManager.getPlayerId();
      
      // Create new instance to get new ID
      (MultiplayerManager as any).instance = null;
      const newManager = MultiplayerManager.getInstance();
      const playerId2 = newManager.getPlayerId();
      
      expect(playerId1).not.toBe(playerId2);
      expect(playerId1).toMatch(/^player_\d+_[a-z0-9]{9}$/);
      expect(playerId2).toMatch(/^player_\d+_[a-z0-9]{9}$/);
    });
  });

  describe('Disconnection', () => {
    test('should clean up resources on disconnect', () => {
      const mockWS = {
        readyState: 1, // OPEN
        close: vi.fn(),
      };
      
      // Set up mock connection
      (multiplayerManager as any).websocket = mockWS;
      
      multiplayerManager.disconnect();
      
      expect(mockWS.close).toHaveBeenCalled();
      expect(multiplayerManager.isConnected()).toBe(false);
      expect(multiplayerManager.getCurrentSession()).toBeNull();
    });
  });
});