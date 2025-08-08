# 🚀 Space Game - Advanced 2D Space Trading RPG

**A comprehensive space adventure game featuring deep trading mechanics, faction politics, and complex economic simulation.**

**🚨 Currently Migrating to Godot Engine** - The original React/TypeScript implementation is preserved in the `orig/` directory while we migrate to Godot for better performance and platform support.

Built with React, TypeScript, and Vite - featuring a fully playable space trading RPG with character progression, combat, diplomacy, and economic strategy.

## 🎮 Game Features

### Core Gameplay Systems
- **🎭 Character Creation**: 4 unique backgrounds (Merchant, Pilot, Engineer, Explorer) with specialized bonuses
- **🗺️ Navigation & Trading**: Complex galactic economy with supply/demand dynamics
- **⚔️ Combat System**: Ship-to-ship combat with tactical elements and electronic warfare
- **🤖 NPC Interactions**: Dynamic AI characters including pirates, patrols, and traders
- **🏛️ Faction Politics**: 5+ major factions with reputation, relationships, and territorial control

### Advanced Features  
- **💰 Investment System**: Portfolio management, market speculation, and economic warfare
- **🔧 Ship Construction**: Modular ship building with equipment customization
- **📋 Quest System**: Multi-layered storylines and faction-specific missions
- **🎓 Tutorial System**: 7 comprehensive tutorial flows for new players
- **🏆 Achievement System**: 16+ achievements across trading, combat, and exploration

### Technical Implementation
- **135 TypeScript files** with comprehensive game systems
- **628+ passing tests** ensuring system reliability  
- **~20,000 lines** of game logic and mechanics
- **Real-time economic simulation** with dynamic pricing
- **Persistent character progression** and save system

## 🚀 Quick Start

### Play Online (Original Version)
- **Live Game**: [https://famkaliuzhnyi-web.github.io/space-game-1/](https://famkaliuzhnyi-web.github.io/space-game-1/)
- **Mobile-Friendly**: Optimized for both desktop and mobile play
- **Branch Previews**: Every branch gets its own preview URL for testing

### Development

#### Original React/TypeScript Version (in `orig/`)
```bash
cd orig/
npm install
npm run dev     # Start development server  
npm run build   # Build for production
npm run test    # Run comprehensive test suite (628 tests)
```

#### New Godot Version (in development)
```bash
# Open project.godot in Godot Editor
# Or run from command line with Godot engine
```

**Note**: The Godot version is currently under development. See [GODOT_MIGRATION.md](./GODOT_MIGRATION.md) for migration progress.

## 📖 Documentation 

### Quick Reference
- **[🎮 Complete Feature List](./FEATURES_IMPLEMENTED.md)** - All implemented systems and features
- **[📊 Progress Tracker](./PROGRESS_TRACKER.md)** - Current implementation status  
- **[📋 Game Design Docs](./docs/README.md)** - Complete design specification
- **[🔄 Godot Migration Plan](./GODOT_MIGRATION.md)** - Migration progress and strategy

### Development & Planning  
- **[Execution Plan](./EXECUTION_PLAN.md)** - Master development roadmap
- **[Agent Instructions](./AGENT_INSTRUCTIONS.md)** - Guidelines for GitHub agents
- **[Task Templates](./TASK_TEMPLATES.md)** - Development task templates

### Detailed Game Documentation
- **[World Structure](./docs/world-structure.md)** - Galaxy, sectors, and stations
- **[Economic Systems](./docs/economy/README.md)** - Supply chain simulation
- **[Factions & Politics](./docs/factions.md)** - Faction relationships  
- **[Ship Systems](./docs/ships/ship-classes.md)** - Modular ship building

## 🛠️ Technical Details

### Architecture & Performance

#### Current Godot Migration (In Progress)
- **Godot 4.3** with GDScript for core engine
- **Native Performance** with built-in optimizations
- **Cross-Platform** builds (Windows, macOS, Linux, Mobile)
- **Web Export** capabilities for browser deployment

#### Original React/TypeScript Implementation (Preserved in `orig/`)
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds  
- **Canvas-based Renderer** for smooth 2D graphics
- **Comprehensive Testing** with Vitest (628+ tests)
- **ESLint Integration** for code quality
- **Modular System Architecture** with dependency injection

### System Requirements

#### Godot Version
- **Godot**: >=4.3.0 (for development)
- **Target Platforms**: Windows, macOS, Linux, Android, iOS, Web
- **Memory**: Optimized native performance
- **Storage**: Save system with native file handling

#### Original Version  
- **Node.js**: >=14.18.0
- **Modern Browser**: Chrome, Firefox, Safari, Edge
- **Memory**: ~50MB for full game experience
- **Storage**: Automatic save system with localStorage

### Key Technologies

#### Current Migration Target
```json
{
  "engine": "Godot 4.3",
  "scripting": "GDScript",
  "platforms": "Multi-platform native + web",
  "ui": "Godot UI system",
  "state": "Native Godot scene management"
}
```

#### Original Implementation (Preserved)
```json
{
  "frontend": "React + TypeScript + Vite",
  "testing": "Vitest + Testing Library", 
  "graphics": "HTML5 Canvas",
  "state": "Custom Game Engine",
  "build": "Vite + TypeScript compilation"
}
```

## 🧪 Development & Testing

### Available Scripts

#### Original React/TypeScript Version
```bash
npm run install:orig   # Install dependencies for original version
npm run dev:orig       # Development server (http://localhost:5173)
npm run build:orig     # Production build
npm run test:orig      # Run test suite (628+ tests)
```

#### Godot Version (In Development)
```bash
npm run setup         # Setup both original and Godot development
npm run godot:run     # Run Godot project (requires Godot installed)
npm run godot:export  # Export for web deployment
```

#### Helper Scripts
```bash
npm run setup         # Install original dependencies and setup instructions
```

### Testing Framework
- **Unit Tests**: Individual system testing (29 system managers)
- **Integration Tests**: Cross-system functionality
- **UI Tests**: React component testing  
- **Game Logic Tests**: Economic simulation, combat, AI behavior
- **Performance Tests**: Memory usage and rendering optimization

## 🐛 Troubleshooting

### Common Development Issues

**Build Errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Test Failures:**
```bash
# Run specific test files
npm test -- src/test/SystemName.test.ts
# Run with coverage
npm run test:coverage
```

**Canvas/Game Engine Issues:**
- Ensure browser supports HTML5 Canvas
- Check console for WebGL or rendering errors
- Verify no ad blockers are interfering with game assets

**TypeScript Configuration:**
- Node.js version must be >=14.18.0  
- Ensure `@types/node` is installed as dev dependency
- Check `tsconfig.json` for proper path resolution

### Performance Optimization
- Game loads ~87KB gzipped JavaScript bundle
- Uses lazy loading for heavy UI panels
- Memory usage typically <50MB
- Canvas rendering optimized for 60fps

---

*This is a fully functional space trading RPG - not just a template. The game features complex economic simulation, faction politics, character progression, and strategic gameplay elements.*
