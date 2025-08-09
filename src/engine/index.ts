export { Engine } from './Engine';
export { Renderer } from './Renderer';
export { ThreeRenderer } from './ThreeRenderer';
export type { Camera, RenderContext } from './Renderer';
export { GameLoop } from './GameLoop';
export { InputHandler } from './InputHandler';
export type { ClickHandler } from './InputHandler';
export { SystemManager } from './SystemManager';
export { Actor } from './Actor';
export { Scene } from './Scene';
export { ShipActor } from './ShipActor';
export { NPCActor } from './NPCActor';
export { SceneManager } from './SceneManager';

// Modern engine systems
export { ObjectPool, PoolManager } from './ObjectPool';
export type { IPoolable } from './ObjectPool';
export { PerformanceMonitor, performanceMonitor } from './PerformanceMonitor';
export type { PerformanceMetrics, PerformanceConfig } from './PerformanceMonitor';
export { ResourceManager, resourceManager } from './ResourceManager';
export type { ResourceDescriptor, ResourceType, LoadProgress, ResourceStats } from './ResourceManager';
export { AudioEngine, audioEngine } from './AudioEngine';
export type { AudioConfig, AudioSource, ListenerConfig } from './AudioEngine';