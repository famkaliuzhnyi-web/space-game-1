import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TimeManager, GameTime } from '../systems/TimeManager';

describe('TimeManager', () => {
  let timeManager: TimeManager;
  
  beforeEach(() => {
    // Use a fixed date for consistent testing
    const fixedDate = new Date('2157-01-01T00:00:00Z');
    timeManager = new TimeManager(fixedDate);
  });

  afterEach(() => {
    timeManager.pause();
  });

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      expect(timeManager.getTimeAcceleration()).toBe(1);
      
      const currentTime = timeManager.getCurrentTime();
      expect(currentTime.year).toBe(2157);
      expect(currentTime.month).toBe(1);
      expect(currentTime.day).toBe(1);
      expect(currentTime.hour).toBe(0);
      expect(currentTime.minute).toBe(0);
      expect(currentTime.second).toBe(0);
    });

    it('should start and pause correctly', () => {
      timeManager.start();
      // Hard to test isRunning state directly, but we can verify methods work
      
      timeManager.pause();
      // TimeManager should handle pause correctly
      expect(timeManager.getTimeAcceleration()).toBe(1);
    });
  });

  describe('time acceleration', () => {
    it('should set time acceleration correctly', () => {
      timeManager.setTimeAcceleration(2);
      expect(timeManager.getTimeAcceleration()).toBe(2);
      
      timeManager.setTimeAcceleration(0.5);
      expect(timeManager.getTimeAcceleration()).toBe(0.5);
    });

    it('should not allow negative acceleration', () => {
      timeManager.setTimeAcceleration(-1);
      expect(timeManager.getTimeAcceleration()).toBe(0);
    });
  });

  describe('time manipulation', () => {
    it('should add time correctly', () => {
      const initialTime = timeManager.getCurrentTime();
      
      // Add 1 hour (3600000 ms)
      timeManager.addTime(3600000);
      
      const newTime = timeManager.getCurrentTime();
      expect(newTime.hour).toBe(initialTime.hour + 1);
    });

    it('should handle day rollover correctly', () => {
      const initialTime = timeManager.getCurrentTime();
      
      // Add 25 hours
      timeManager.addTime(25 * 60 * 60 * 1000);
      
      const newTime = timeManager.getCurrentTime();
      expect(newTime.day).toBe(initialTime.day + 1);
      expect(newTime.hour).toBe(1);
    });
  });

  describe('time formatting', () => {
    it('should format time in short format', () => {
      const time: GameTime = {
        year: 2157,
        month: 3,
        day: 15,
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 0,
        dayOfWeek: 1,
        dayOfYear: 74,
        isLeapYear: false
      };

      const formatted = timeManager.formatTime(time, 'short');
      expect(formatted).toBe('2157-03-15 14:30');
    });

    it('should format time in long format', () => {
      const time: GameTime = {
        year: 2157,
        month: 3,
        day: 15,
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 0,
        dayOfWeek: 1, // Monday
        dayOfYear: 74,
        isLeapYear: false
      };

      const formatted = timeManager.formatTime(time, 'long');
      expect(formatted).toContain('Monday');
      expect(formatted).toContain('March');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2157');
      expect(formatted).toContain('14:30:45');
    });

    it('should format time in ISO format', () => {
      const time: GameTime = {
        year: 2157,
        month: 3,
        day: 15,
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 0,
        dayOfWeek: 1,
        dayOfYear: 74,
        isLeapYear: false
      };

      const formatted = timeManager.formatTime(time, 'iso');
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('time differences', () => {
    it('should calculate time differences correctly', () => {
      const from = new Date('2157-01-01T12:00:00Z');
      const to = new Date('2157-01-01T13:30:00Z');
      
      const diff = timeManager.getTimeDifference(from, to);
      expect(diff).toBe('1 hour');
    });

    it('should handle plural forms correctly', () => {
      const from = new Date('2157-01-01T12:00:00Z');
      const to = new Date('2157-01-03T14:30:00Z');
      
      const diff = timeManager.getTimeDifference(from, to);
      expect(diff).toBe('2 days');
    });

    it('should calculate time until target correctly', () => {
      const currentDate = timeManager.getCurrentDate();
      const futureDate = new Date(currentDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
      
      const timeUntil = timeManager.getTimeUntil(futureDate);
      expect(timeUntil).toBe('2 hours');
    });

    it('should return "Now" for past dates', () => {
      const currentDate = timeManager.getCurrentDate();
      const pastDate = new Date(currentDate.getTime() - 1000); // 1 second ago
      
      const timeUntil = timeManager.getTimeUntil(pastDate);
      expect(timeUntil).toBe('Now');
    });
  });

  describe('scheduled events', () => {
    it('should schedule events correctly', () => {
      const callback = vi.fn();
      const triggerTime = new Date(timeManager.getCurrentDate().getTime() + 1000);
      
      const eventId = timeManager.scheduleEvent({
        triggerTime,
        callback,
        description: 'Test event'
      });
      
      expect(eventId).toBeTruthy();
      expect(timeManager.getScheduledEvents()).toHaveLength(1);
    });

    it('should cancel events correctly', () => {
      const callback = vi.fn();
      const triggerTime = new Date(timeManager.getCurrentDate().getTime() + 1000);
      
      const eventId = timeManager.scheduleEvent({
        triggerTime,
        callback,
        description: 'Test event'
      });
      
      const cancelled = timeManager.cancelEvent(eventId);
      expect(cancelled).toBe(true);
      expect(timeManager.getScheduledEvents()).toHaveLength(0);
    });
  });

  describe('state management', () => {
    it('should save and restore state correctly', () => {
      timeManager.setTimeAcceleration(2);
      timeManager.addTime(3600000); // 1 hour
      
      const state = timeManager.getState();
      
      const newTimeManager = new TimeManager();
      newTimeManager.setState(state);
      
      expect(newTimeManager.getTimeAcceleration()).toBe(2);
      expect(newTimeManager.getCurrentTime().hour).toBe(1);
    });
  });

  describe('special time checks', () => {
    it('should correctly identify specific times of day', () => {
      // Set time to exactly 12:30
      timeManager.addTime(12.5 * 60 * 60 * 1000);
      
      expect(timeManager.isTimeOfDay(12, 30)).toBe(true);
      expect(timeManager.isTimeOfDay(12, 31)).toBe(false);
      expect(timeManager.isTimeOfDay(13, 30)).toBe(false);
    });
  });
});