// WebRTC Service for multiplayer game connections
export interface GameMessage {
  type: 'game_move' | 'game_state' | 'player_join' | 'player_leave' | 'game_start' | 'game_end';
  data: any;
  timestamp: number;
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localPlayerId: string;
  private isHost: boolean = false;
  private players: Player[] = [];
  private onMessageCallbacks: ((message: GameMessage) => void)[] = [];
  private onPlayerJoinCallbacks: ((player: Player) => void)[] = [];
  private onPlayerLeaveCallbacks: ((playerId: string) => void)[] = [];
  private onConnectionStateChangeCallbacks: ((state: string) => void)[] = [];

  constructor() {
    this.localPlayerId = this.generatePlayerId();
  }

  // Generate a unique player ID
  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a session token for the host
  async createSession(): Promise<string> {
    this.isHost = true;
    const sessionData = {
      hostId: this.localPlayerId,
      timestamp: Date.now()
    };
    return btoa(JSON.stringify(sessionData));
  }

  // Join a session as a guest
  async joinSession(sessionToken: string): Promise<boolean> {
    try {
      const sessionData = JSON.parse(atob(sessionToken));
      const hostId = sessionData.hostId;
      
      if (Date.now() - sessionData.timestamp > 30 * 60 * 1000) { // 30 minutes
        throw new Error('Session token expired');
      }

      await this.connectToPeer(hostId);
      return true;
    } catch (error) {
      console.error('Failed to join session:', error);
      return false;
    }
  }

  // Create a peer connection to another player
  private async connectToPeer(peerId: string, isInitiator: boolean = true): Promise<void> {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peerConnections.set(peerId, peerConnection);

    // Create data channel for game communication
    let dataChannel: RTCDataChannel;
    if (isInitiator) {
      dataChannel = peerConnection.createDataChannel('game', { 
        ordered: true 
      });
      this.setupDataChannel(dataChannel, peerId);
    } else {
      peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        this.setupDataChannel(dataChannel, peerId);
      };
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, you'd send this to a signaling server
        // For this demo, we'll use a simplified approach
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      this.notifyConnectionStateChange(peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        this.handlePlayerDisconnect(peerId);
      }
    };

    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      // Send offer to peer through signaling server
    }
  }

  // Setup data channel for communication
  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    this.dataChannels.set(peerId, dataChannel);

    dataChannel.onopen = () => {
      console.log(`Data channel opened with ${peerId}`);
      this.addPlayer(peerId, `Player ${this.players.length + 1}`, false, true);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message: GameMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with ${peerId}`);
      this.handlePlayerDisconnect(peerId);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with ${peerId}:`, error);
    };
  }

  // Send a message to all connected players
  sendMessage(message: Omit<GameMessage, 'timestamp' | 'playerId'>): void {
    const fullMessage: GameMessage = {
      ...message,
      timestamp: Date.now(),
      playerId: this.localPlayerId
    };

    const messageStr = JSON.stringify(fullMessage);
    
    this.dataChannels.forEach((channel, peerId) => {
      if (channel.readyState === 'open') {
        try {
          channel.send(messageStr);
        } catch (error) {
          console.error(`Failed to send message to ${peerId}:`, error);
        }
      }
    });
  }

  // Send a message to a specific player
  sendMessageToPlayer(playerId: string, message: Omit<GameMessage, 'timestamp' | 'playerId'>): void {
    const channel = this.dataChannels.get(playerId);
    if (channel && channel.readyState === 'open') {
      const fullMessage: GameMessage = {
        ...message,
        timestamp: Date.now(),
        playerId: this.localPlayerId
      };
      
      try {
        channel.send(JSON.stringify(fullMessage));
      } catch (error) {
        console.error(`Failed to send message to ${playerId}:`, error);
      }
    }
  }

  // Handle incoming messages
  private handleIncomingMessage(message: GameMessage): void {
    this.onMessageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });
  }

  // Add a player to the session
  private addPlayer(id: string, name: string, isHost: boolean, isConnected: boolean): void {
    const existingPlayer = this.players.find(p => p.id === id);
    if (!existingPlayer) {
      const player: Player = { id, name, isHost, isConnected };
      this.players.push(player);
      this.notifyPlayerJoin(player);
    } else {
      existingPlayer.isConnected = isConnected;
    }
  }

  // Handle player disconnect
  private handlePlayerDisconnect(playerId: string): void {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      this.notifyPlayerLeave(playerId);
    }

    // Clean up connections
    this.peerConnections.delete(playerId);
    this.dataChannels.delete(playerId);
  }

  // Get current players
  getPlayers(): Player[] {
    return [...this.players];
  }

  // Get local player info
  getLocalPlayer(): Player {
    return {
      id: this.localPlayerId,
      name: this.isHost ? 'Host' : `Player ${this.players.length}`,
      isHost: this.isHost,
      isConnected: true
    };
  }

  // Check if we are the host
  isHostPlayer(): boolean {
    return this.isHost;
  }

  // Get connected player count
  getConnectedPlayerCount(): number {
    return this.players.filter(p => p.isConnected).length + 1; // +1 for local player
  }

  // Event listeners
  onMessage(callback: (message: GameMessage) => void): void {
    this.onMessageCallbacks.push(callback);
  }

  onPlayerJoin(callback: (player: Player) => void): void {
    this.onPlayerJoinCallbacks.push(callback);
  }

  onPlayerLeave(callback: (playerId: string) => void): void {
    this.onPlayerLeaveCallbacks.push(callback);
  }

  onConnectionStateChange(callback: (state: string) => void): void {
    this.onConnectionStateChangeCallbacks.push(callback);
  }

  // Notify callbacks
  private notifyPlayerJoin(player: Player): void {
    this.onPlayerJoinCallbacks.forEach(callback => {
      try {
        callback(player);
      } catch (error) {
        console.error('Error in player join callback:', error);
      }
    });
  }

  private notifyPlayerLeave(playerId: string): void {
    this.onPlayerLeaveCallbacks.forEach(callback => {
      try {
        callback(playerId);
      } catch (error) {
        console.error('Error in player leave callback:', error);
      }
    });
  }

  private notifyConnectionStateChange(state: string): void {
    this.onConnectionStateChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in connection state callback:', error);
      }
    });
  }

  // Cleanup connections
  disconnect(): void {
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.close();
      }
    });

    this.peerConnections.forEach(pc => {
      pc.close();
    });

    this.dataChannels.clear();
    this.peerConnections.clear();
    this.players = [];
  }
}