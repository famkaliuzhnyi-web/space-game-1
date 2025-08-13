export interface MultiplayerSession {
  id: string;
  hostId: string;
  players: MultiplayerPlayer[];
  isActive: boolean;
  createdAt: number;
}

export interface MultiplayerPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  joinedAt: number;
}

export interface JoinRequest {
  sessionId: string;
  playerName: string;
  playerId?: string;
}

export interface MultiplayerMessage {
  type: 'join_request' | 'join_response' | 'player_joined' | 'player_left' | 'game_sync' | 'error';
  playerId: string;
  sessionId: string;
  data?: any;
  timestamp: number;
}

export class MultiplayerManager {
  private static instance: MultiplayerManager;
  private websocket: WebSocket | null = null;
  private currentSession: MultiplayerSession | null = null;
  private playerId: string;
  private playerName: string = '';
  private connectionCallbacks: Map<string, (data: any) => void> = new Map();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  private constructor() {
    this.playerId = this.generatePlayerId();
  }

  static getInstance(): MultiplayerManager {
    if (!MultiplayerManager.instance) {
      MultiplayerManager.instance = new MultiplayerManager();
    }
    return MultiplayerManager.instance;
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseJoinCode(joinCode: string): { serverUrl: string; sessionId: string; } | null {
    try {
      // Handle different QR code formats
      if (joinCode.startsWith('http')) {
        // URL format: https://example.com/join?session=abc123&host=ws://localhost:8080
        const url = new URL(joinCode);
        const sessionId = url.searchParams.get('session');
        const serverUrl = url.searchParams.get('host');
        
        if (sessionId && serverUrl) {
          return { serverUrl, sessionId };
        }
      } else if (joinCode.includes('|')) {
        // Simple format: sessionId|serverUrl
        const [sessionId, serverUrl] = joinCode.split('|');
        if (sessionId && serverUrl) {
          return { serverUrl, sessionId };
        }
      } else {
        // Assume it's just a session ID with default server
        const sessionId = joinCode.trim();
        if (sessionId) {
          return { 
            serverUrl: 'ws://localhost:8080', // Default WebSocket server
            sessionId 
          };
        }
      }
    } catch (error) {
      console.error('Failed to parse join code:', error);
    }
    
    return null;
  }

  async joinSession(joinCode: string, playerName: string): Promise<{ success: boolean; error?: string }> {
    if (this.isConnecting) {
      return { success: false, error: 'Already attempting to connect' };
    }

    const joinInfo = this.parseJoinCode(joinCode);
    if (!joinInfo) {
      return { success: false, error: 'Invalid join code format' };
    }

    this.playerName = playerName || `Player_${Math.random().toString(36).substr(2, 6)}`;
    this.isConnecting = true;

    try {
      await this.connectToServer(joinInfo.serverUrl);
      await this.requestJoinSession(joinInfo.sessionId);
      
      return { success: true };
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to join session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to game host' 
      };
    }
  }

  private async connectToServer(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(serverUrl);
        
        this.websocket.onopen = () => {
          console.log('Connected to multiplayer server');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.websocket.onclose = (event) => {
          console.log('Disconnected from multiplayer server', event.code, event.reason);
          this.handleDisconnection();
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('Failed to connect to game server'));
        };

        // Connection timeout
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            this.websocket?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private async requestJoinSession(sessionId: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to server');
    }

    const joinRequest: MultiplayerMessage = {
      type: 'join_request',
      playerId: this.playerId,
      sessionId: sessionId,
      data: {
        playerName: this.playerName
      },
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      // Set up response handler
      const handleJoinResponse = (response: MultiplayerMessage) => {
        if (response.type === 'join_response') {
          if (response.data?.success) {
            this.currentSession = response.data.session;
            this.isConnecting = false;
            resolve();
          } else {
            this.isConnecting = false;
            reject(new Error(response.data?.error || 'Failed to join session'));
          }
        }
      };

      this.connectionCallbacks.set('join_response', handleJoinResponse);
      
      // Send join request
      this.websocket!.send(JSON.stringify(joinRequest));

      // Join request timeout
      setTimeout(() => {
        this.connectionCallbacks.delete('join_response');
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(new Error('Join request timeout'));
        }
      }, 15000);
    });
  }

  private handleMessage(message: MultiplayerMessage): void {
    console.log('Received multiplayer message:', message.type);

    const callback = this.connectionCallbacks.get(message.type);
    if (callback) {
      callback(message);
    }

    switch (message.type) {
      case 'player_joined':
        this.onPlayerJoined(message.data);
        break;
      case 'player_left':
        this.onPlayerLeft(message.data);
        break;
      case 'game_sync':
        this.onGameSync(message.data);
        break;
      case 'error':
        this.onError(message.data);
        break;
    }
  }

  private onPlayerJoined(data: any): void {
    console.log('Player joined:', data);
    // Update UI or game state when player joins
  }

  private onPlayerLeft(data: any): void {
    console.log('Player left:', data);
    // Update UI or game state when player leaves
  }

  private onGameSync(data: any): void {
    console.log('Game sync received:', data);
    // Sync game state with other players
  }

  private onError(error: any): void {
    console.error('Multiplayer error:', error);
    // Handle multiplayer errors
  }

  private handleDisconnection(): void {
    this.websocket = null;
    this.isConnecting = false;
    
    if (this.currentSession && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnection();
    } else {
      this.currentSession = null;
    }
  }

  private async attemptReconnection(): Promise<void> {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, 2000 * this.reconnectAttempts));
    
    // Attempt to rejoin current session
    if (this.currentSession) {
      try {
        // Implementation would depend on having stored server URL
        // For now, we'll just log the attempt
        console.log('Would attempt to reconnect to session:', this.currentSession.id);
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.currentSession = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.connectionCallbacks.clear();
  }

  getCurrentSession(): MultiplayerSession | null {
    return this.currentSession;
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN && this.currentSession !== null;
  }

  getPlayerId(): string {
    return this.playerId;
  }
}