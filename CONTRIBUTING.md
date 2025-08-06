# Contributing to Space Game 🚀

Thank you for your interest in contributing to our space adventure game! This guide will help you get started.

## 🚀 Getting Started

### Prerequisites
- Node.js >= 14.18.0
- npm (comes with Node.js)
- Git
- A modern web browser

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/space-game-1.git
   cd space-game-1
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:5173`

## 📝 Development Workflow

### Making Changes

1. **Create a new branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following our code style guidelines

3. **Test your changes**:
   ```bash
   npm run build  # Ensure it builds successfully
   npm run lint   # Check for linting errors
   ```

4. **Commit your changes** with a clear message:
   ```bash
   git add .
   git commit -m "feat: add new star collection animation"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### 📱 Testing Your Changes

Our project includes automatic branch previews! When you push your branch:

1. GitHub Actions will build and deploy your branch
2. Check the Actions tab for deployment progress
3. Your branch will be available at: `https://famkaliuzhnyi-web.github.io/space-game-1/your-branch-name/`
4. Test on mobile devices using the QR code in PR comments

## 🎯 Code Style Guidelines

### TypeScript & React
- Use TypeScript for all new code
- Follow React hooks patterns
- Use functional components over class components
- Implement proper error boundaries where needed

### Naming Conventions
- **Components**: PascalCase (`GameButton.tsx`)
- **Functions**: camelCase (`collectStar()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SCORE`)
- **CSS Classes**: kebab-case (`star-button`)

### Code Organization
```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── assets/        # Images, icons, etc.
└── styles/        # Global styles
```

### ESLint Configuration

We use ESLint with TypeScript support. For production applications, consider these enhanced configurations:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      // For stricter rules:
      ...tseslint.configs.strictTypeChecked,
      // For stylistic rules:
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

Optional React-specific plugins:
```bash
npm install eslint-plugin-react-x eslint-plugin-react-dom
```

## 🎮 Game Development Guidelines

### Adding New Features
1. **Game Mechanics**: Keep gameplay simple and mobile-friendly
2. **Performance**: Ensure smooth 60fps on mobile devices
3. **Accessibility**: Include keyboard navigation and screen reader support
4. **Mobile First**: Design for touch interfaces primarily

### UI/UX Principles
- **Touch Targets**: Minimum 44px for mobile tappable elements
- **Responsive Design**: Support all screen sizes
- **Loading States**: Provide feedback for all user actions
- **Error Handling**: Graceful fallbacks for all features

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code builds successfully (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] Tested on mobile devices
- [ ] Updated documentation if needed
- [ ] Added/updated tests if applicable

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested on mobile
- [ ] Branch preview verified

## Screenshots
Include screenshots/GIFs of UI changes
```

## 🐛 Reporting Issues

### Bug Reports
Include:
- Browser and version
- Device type (mobile/desktop)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Feature Requests
Include:
- Clear description of the feature
- Use case/motivation
- Possible implementation approach
- Mobile considerations

## 🏗️ Architecture

See our [Architecture Guide](docs/ARCHITECTURE.md) for detailed information about:
- Project structure
- Component hierarchy
- State management
- Build process

## 📚 Additional Resources

- [Game Features & Roadmap](docs/GAME_FEATURES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Have fun building an awesome space game! 🚀

---

Thank you for contributing to Space Game! Your efforts help make this project better for everyone. 🌟