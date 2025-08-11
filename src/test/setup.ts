import '@testing-library/jest-dom';

// Mock AudioContext for testing environment
const mockAudioContext = {
  createOscillator: () => ({
    connect: () => {},
    disconnect: () => {},
    start: () => {},
    stop: () => {},
    frequency: { value: 440 },
    type: 'sine'
  }),
  createGain: () => ({
    connect: () => {},
    disconnect: () => {},
    gain: { value: 1 }
  }),
  createAnalyser: () => ({
    connect: () => {},
    disconnect: () => {},
    frequencyBinCount: 1024
  }),
  createBiquadFilter: () => ({
    connect: () => {},
    disconnect: () => {},
    frequency: { value: 350 },
    Q: { value: 1 },
    type: 'lowpass'
  }),
  createBufferSource: () => ({
    connect: () => {},
    disconnect: () => {},
    start: () => {},
    stop: () => {},
    buffer: null
  }),
  createDynamicsCompressor: () => ({
    connect: () => {},
    disconnect: () => {}
  }),
  createPanner: () => ({
    connect: () => {},
    disconnect: () => {},
    positionX: { value: 0 },
    positionY: { value: 0 },
    positionZ: { value: 0 }
  }),
  createStereoPanner: () => ({
    connect: () => {},
    disconnect: () => {},
    pan: { value: 0 }
  }),
  createDelay: () => ({
    connect: () => {},
    disconnect: () => {},
    delayTime: { value: 0 }
  }),
  createConvolver: () => ({
    connect: () => {},
    disconnect: () => {},
    buffer: null
  }),
  createWaveShaper: () => ({
    connect: () => {},
    disconnect: () => {},
    curve: null
  }),
  createBuffer: () => null,
  decodeAudioData: () => Promise.resolve(null),
  close: () => Promise.resolve(),
  suspend: () => Promise.resolve(),
  resume: () => Promise.resolve(),
  destination: { 
    connect: () => {}, 
    disconnect: () => {},
    channelCount: 2
  },
  listener: {
    positionX: { value: 0 },
    positionY: { value: 0 },
    positionZ: { value: 0 },
    forwardX: { value: 0 },
    forwardY: { value: 0 },
    forwardZ: { value: -1 },
    upX: { value: 0 },
    upY: { value: 1 },
    upZ: { value: 0 }
  },
  state: 'running',
  sampleRate: 44100,
  currentTime: 0,
};

// @ts-ignore
global.AudioContext = function() {
  return mockAudioContext;
};

// @ts-ignore
global.webkitAudioContext = function() {
  return mockAudioContext;
};