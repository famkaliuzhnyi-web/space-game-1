/**
 * TimeManager - Handles Earth-standard time system for the game
 * 
 * This system tracks:
 * - Real-time Earth date/time
 * - Game time (can be accelerated for travel)
 * - Time zone handling
 * - Event scheduling
 */

export interface GameTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayOfYear: number;
  isLeapYear: boolean;
}

export interface TimeEvent {
  id: string;
  triggerTime: Date;
  callback: () => void;
  recurring?: {
    interval: number; // milliseconds
    maxOccurrences?: number;
  };
  description: string;
}

export class TimeManager {
  private gameStartTime: Date; // The in-game time when the game started
  private timeAcceleration: number = 1; // 1 = real time, 2 = 2x speed, etc.
  private accumulatedTime: number = 0; // Accumulated game time in milliseconds
  private scheduledEvents: Map<string, TimeEvent> = new Map();
  private isRunning: boolean = false;

  constructor(startTime?: Date) {
    // Default to a near-future starting time if not provided
    this.gameStartTime = startTime || new Date('2157-01-01T00:00:00Z');
  }

  /**
   * Update the time system - should be called from the main game loop
   */
  update(deltaTime: number): void {
    if (!this.isRunning) return;

    // Add accelerated time
    this.accumulatedTime += deltaTime * 1000 * this.timeAcceleration;
    
    // Process scheduled events
    this.processScheduledEvents();
  }

  /**
   * Start the time system
   */
  start(): void {
    this.isRunning = true;
  }

  /**
   * Pause the time system
   */
  pause(): void {
    this.isRunning = false;
  }

  /**
   * Check if the time system is currently running (not paused)
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the current game time
   */
  getCurrentTime(): GameTime {
    const currentGameTime = new Date(this.gameStartTime.getTime() + this.accumulatedTime);
    return this.dateToGameTime(currentGameTime);
  }

  /**
   * Get the current game time as a Date object
   */
  getCurrentDate(): Date {
    return new Date(this.gameStartTime.getTime() + this.accumulatedTime);
  }

  /**
   * Set the time acceleration factor
   * 1 = real time, 2 = 2x speed, 0.5 = half speed, etc.
   */
  setTimeAcceleration(factor: number): void {
    this.timeAcceleration = Math.max(0, factor);
  }

  /**
   * Get the current time acceleration factor
   */
  getTimeAcceleration(): number {
    return this.timeAcceleration;
  }

  /**
   * Get the current game time as a timestamp (milliseconds since epoch)
   */
  getCurrentTimestamp(): number {
    return this.getCurrentDate().getTime();
  }

  /**
   * Schedule an event to occur at a specific game time
   */
  scheduleEvent(event: Omit<TimeEvent, 'id'>): string {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.scheduledEvents.set(id, { ...event, id });
    return id;
  }

  /**
   * Cancel a scheduled event
   */
  cancelEvent(eventId: string): boolean {
    return this.scheduledEvents.delete(eventId);
  }

  /**
   * Get all scheduled events
   */
  getScheduledEvents(): TimeEvent[] {
    return Array.from(this.scheduledEvents.values());
  }

  /**
   * Add time to the current game time (useful for travel time simulation)
   */
  addTime(milliseconds: number): void {
    this.accumulatedTime += milliseconds;
  }

  /**
   * Format time for display
   */
  formatTime(time?: GameTime, format: 'short' | 'long' | 'iso' = 'short'): string {
    const gameTime = time || this.getCurrentTime();
    
    switch (format) {
      case 'short':
        return `${gameTime.year}-${String(gameTime.month).padStart(2, '0')}-${String(gameTime.day).padStart(2, '0')} ` +
               `${String(gameTime.hour).padStart(2, '0')}:${String(gameTime.minute).padStart(2, '0')}`;
      
      case 'long': {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return `${dayNames[gameTime.dayOfWeek]}, ${monthNames[gameTime.month - 1]} ${gameTime.day}, ${gameTime.year} ` +
               `${String(gameTime.hour).padStart(2, '0')}:${String(gameTime.minute).padStart(2, '0')}:${String(gameTime.second).padStart(2, '0')}`;
      }
      
      case 'iso':
        return new Date(
          gameTime.year, 
          gameTime.month - 1, 
          gameTime.day, 
          gameTime.hour, 
          gameTime.minute, 
          gameTime.second, 
          gameTime.millisecond
        ).toISOString();
      
      default:
        return this.formatTime(gameTime, 'short');
    }
  }

  /**
   * Calculate time difference between two dates in human-readable format
   */
  getTimeDifference(from: Date, to: Date): string {
    const diffMs = Math.abs(to.getTime() - from.getTime());
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    return `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''}`;
  }

  /**
   * Get time until a specific date
   */
  getTimeUntil(targetDate: Date): string {
    const currentDate = this.getCurrentDate();
    if (targetDate <= currentDate) return 'Now';
    return this.getTimeDifference(currentDate, targetDate);
  }

  /**
   * Check if it's currently a specific time period (for events, etc.)
   */
  isTimeOfDay(hour: number, minute: number = 0): boolean {
    const currentTime = this.getCurrentTime();
    return currentTime.hour === hour && currentTime.minute === minute;
  }

  /**
   * Convert a Date object to GameTime interface
   */
  private dateToGameTime(date: Date): GameTime {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-based
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const millisecond = date.getMilliseconds();
    const dayOfWeek = date.getDay();
    
    // Calculate day of year
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    // Check if leap year
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      dayOfWeek,
      dayOfYear,
      isLeapYear
    };
  }

  /**
   * Process and trigger scheduled events
   */
  private processScheduledEvents(): void {
    const currentDate = this.getCurrentDate();
    const eventsToRemove: string[] = [];

    this.scheduledEvents.forEach((event) => {
      if (currentDate >= event.triggerTime) {
        try {
          event.callback();
          
          // Handle recurring events
          if (event.recurring) {
            const nextTriggerTime = new Date(event.triggerTime.getTime() + event.recurring.interval);
            
            if (event.recurring.maxOccurrences === undefined || 
                event.recurring.maxOccurrences > 1) {
              
              // Update the event for next occurrence
              const updatedEvent = {
                ...event,
                triggerTime: nextTriggerTime,
                recurring: event.recurring.maxOccurrences !== undefined ? 
                  { ...event.recurring, maxOccurrences: event.recurring.maxOccurrences - 1 } :
                  event.recurring
              };
              
              this.scheduledEvents.set(event.id, updatedEvent);
            } else {
              eventsToRemove.push(event.id);
            }
          } else {
            eventsToRemove.push(event.id);
          }
        } catch (error) {
          console.error(`Error executing scheduled event ${event.id}:`, error);
          eventsToRemove.push(event.id);
        }
      }
    });

    // Remove completed events
    eventsToRemove.forEach(id => this.scheduledEvents.delete(id));
  }

  /**
   * Get time manager state for save/load functionality
   */
  getState(): {
    gameStartTime: Date;
    accumulatedTime: number;
    timeAcceleration: number;
    scheduledEvents: TimeEvent[];
  } {
    return {
      gameStartTime: this.gameStartTime,
      accumulatedTime: this.accumulatedTime,
      timeAcceleration: this.timeAcceleration,
      scheduledEvents: Array.from(this.scheduledEvents.values())
    };
  }

  /**
   * Restore time manager state from save data
   */
  setState(state: {
    gameStartTime: Date;
    accumulatedTime: number;
    timeAcceleration: number;
    scheduledEvents: TimeEvent[];
  }): void {
    this.gameStartTime = new Date(state.gameStartTime);
    this.accumulatedTime = state.accumulatedTime;
    this.timeAcceleration = state.timeAcceleration;
    
    // Restore scheduled events
    this.scheduledEvents.clear();
    state.scheduledEvents.forEach(event => {
      this.scheduledEvents.set(event.id, {
        ...event,
        triggerTime: new Date(event.triggerTime)
      });
    });
  }
}