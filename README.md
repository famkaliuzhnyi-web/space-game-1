# React + TypeScript + Vite Space Game 🚀

A mobile-friendly space adventure game built with React, TypeScript, and Vite.

## 📱 Mobile-Friendly Branch Previews

This project supports **automatic branch preview deployments** perfect for checking results from your phone!

### How it works:
- **Every branch** gets its own preview URL when pushed
- **Pull requests** automatically get deployment comments with:
  - 🔗 Direct preview link
  - 📱 QR code for easy mobile access
  - Mobile-optimized interface

### Accessing Previews:
1. Push to any branch or create a pull request
2. GitHub Actions will build and deploy your branch
3. Check the PR comment for the mobile-friendly preview URL
4. Scan the QR code with your phone for instant access! 📱

### Live Deployment:
- **Main branch**: [https://famkaliuzhnyi-web.github.io/space-game-1/](https://famkaliuzhnyi-web.github.io/space-game-1/)
- **Branch previews**: `https://famkaliuzhnyi-web.github.io/space-game-1/{branch-name}/`

## 📋 Development Planning & Execution

**For GitHub Agents and Developers:**

- **[High-Level Execution Plan](./EXECUTION_PLAN.md)** - Master development roadmap and phases
- **[Agent Instructions](./AGENT_INSTRUCTIONS.md)** - Detailed guidelines for GitHub agents
- **[Progress Tracker](./PROGRESS_TRACKER.md)** - Current status and milestone tracking
- **[Task Templates](./TASK_TEMPLATES.md)** - Templates for creating development tasks

## 📖 Game Documentation

This project includes comprehensive documentation for a 2D Space RPG with logistics-focused gameplay:

- **[Complete Game Documentation](./docs/README.md)** - Full design specification
- **[Game Design Document](./docs/game-design-document.md)** - Core vision and mechanics  
- **[World Structure](./docs/world-structure.md)** - Galaxy, sectors, and stations
- **[Economic Systems](./docs/economy/README.md)** - Complex supply chain simulation
- **[Factions & Politics](./docs/factions.md)** - Human faction relationships
- **[Ship Systems](./docs/ships/ship-classes.md)** - Modular ship building and classes
- **[Game Systems](./docs/systems/security.md)** - Security, NPCs, cargo, and hacking

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
