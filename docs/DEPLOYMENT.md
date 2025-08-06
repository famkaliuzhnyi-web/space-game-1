# Deployment Guide 🚀

## 🌐 Overview

This Space Game uses a sophisticated deployment strategy with GitHub Actions and GitHub Pages, featuring automatic branch previews and mobile-optimized deployment workflows.

## 📋 Quick Setup

### Prerequisites
- GitHub repository with admin access
- Node.js project with `npm run build` script
- GitHub Pages enabled in repository settings

### Enable GitHub Pages
1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click the "Settings" tab

2. **Configure GitHub Pages**
   - Scroll to "Pages" in the left sidebar
   - Under "Source", select **"GitHub Actions"**
   - Save the settings

3. **Verify Permissions**
   - The workflows already include necessary permissions:
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
     pull-requests: write
   ```

## 🔄 Deployment Workflows

### Main Branch Deployment

**File**: `.github/workflows/deploy-main.yml`

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Process**:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Build project (`npm run build`)
5. Deploy to GitHub Pages root

**URL**: `https://your-username.github.io/space-game-1/`

### Branch Preview Deployment

**File**: `.github/workflows/deploy-branch-preview.yml`

**Triggers**:
- Push to any branch (except `main`)
- Pull request events (opened, synchronize, reopened)

**Process**:
1. Build the project
2. Create branch-specific directory
3. Deploy to GitHub Pages subfolder
4. Comment on PR with preview link and QR code

**URL Pattern**: `https://your-username.github.io/space-game-1/{branch-name}/`

## 📱 Mobile-Friendly Features

### QR Code Generation
```yaml
# Automatic QR code in PR comments
QR Code: 
![QR Code](https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deployUrl)})
```

### Touch Optimization
```css
/* Mobile-optimized styles included */
.game-button {
  min-height: 44px;              /* iOS touch target minimum */
  touch-action: manipulation;     /* Prevent zoom on double-tap */
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
}
```

### Performance Optimization
```javascript
// PWA-ready configuration
{
  "name": "Space Game",
  "short_name": "SpaceGame",
  "theme_color": "#646cff",
  "background_color": "#1a1a1a",
  "display": "standalone",
  "start_url": "./"
}
```

## 🛠️ Advanced Configuration

### Custom Deployment Settings

#### Environment Variables
```yaml
# In workflow files
env:
  NODE_VERSION: '18'
  BUILD_PATH: './dist'
  DEPLOY_BRANCH: 'gh-pages'  # If using legacy deployment
```

#### Build Customization
```typescript
// vite.config.ts for GitHub Pages
export default defineConfig({
  base: '/space-game-1/',  // Repository name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
})
```

### Multi-Environment Setup

#### Development Environment
```bash
# Local development
npm run dev
# Available at: http://localhost:5173
```

#### Staging Environment
```bash
# Preview production build locally
npm run build
npm run preview
# Available at: http://localhost:4173
```

#### Production Environment
```bash
# GitHub Pages production
# Available at: https://your-username.github.io/space-game-1/
```

## 🔍 Troubleshooting

### Common Issues

#### 1. GitHub Pages Not Loading
**Symptoms**: 404 error on GitHub Pages URL

**Solutions**:
- Verify GitHub Pages is enabled with "GitHub Actions" source
- Check repository name matches `base` in `vite.config.ts`
- Ensure workflows have completed successfully
- Wait 5-10 minutes for DNS propagation

#### 2. Branch Previews Not Working
**Symptoms**: Branch URLs return 404

**Solutions**:
```yaml
# Check branch name sanitization
BRANCH_SAFE=$(echo "${{ steps.branch.outputs.branch_name }}" | sed 's/[^a-zA-Z0-9-]/-/g')
```

**Common fixes**:
- Special characters in branch names are converted to hyphens
- Check Actions tab for deployment status
- Verify branch was pushed to GitHub

#### 3. Mobile QR Codes Not Appearing
**Symptoms**: PR comments missing QR codes

**Solutions**:
- Verify `pull-requests: write` permission in workflow
- Check if PR is from a fork (requires approval)
- Ensure QR service `qrserver.com` is accessible

#### 4. Build Failures
**Symptoms**: Red X in Actions tab

**Common fixes**:
```bash
# Locally reproduce the build
npm ci          # Clean install
npm run build   # Build project
npm run lint    # Check for errors
```

**TypeScript issues**:
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

#### 5. Asset Loading Issues
**Symptoms**: Images/CSS not loading on GitHub Pages

**Solutions**:
```typescript
// Ensure correct base path in vite.config.ts
export default defineConfig({
  base: '/your-repo-name/',  // Must match repository name
})
```

### Debug Workflows

#### View Deployment Logs
1. Go to repository "Actions" tab
2. Click on the failed workflow run
3. Expand failing step to see detailed logs

#### Test Branch Deployment Locally
```bash
# Simulate branch deployment structure
mkdir -p pages-deploy/your-branch-name
npm run build
cp -r dist/* pages-deploy/your-branch-name/
cd pages-deploy && python -m http.server 8000
# Test at: http://localhost:8000/your-branch-name/
```

#### Validate GitHub Pages Configuration
```bash
# Check repository settings via GitHub CLI
gh api repos/:owner/:repo/pages
```

### Performance Monitoring

#### Lighthouse CI Integration
```yaml
# Add to workflow for performance monitoring
- name: Run Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

## 🚀 Deployment Best Practices

### Security
- ✅ Never commit secrets to repository
- ✅ Use GitHub's built-in GITHUB_TOKEN
- ✅ Minimize workflow permissions
- ✅ Validate all external inputs

### Performance
- ✅ Enable gzip compression in GitHub Pages
- ✅ Optimize images for web (WebP format)
- ✅ Use code splitting for large bundles
- ✅ Enable source maps for debugging

### Mobile Optimization
- ✅ Test on actual mobile devices
- ✅ Verify touch targets are ≥44px
- ✅ Check performance on 3G networks
- ✅ Validate PWA installation flow

### Monitoring
- ✅ Set up deployment notifications
- ✅ Monitor Core Web Vitals
- ✅ Track deployment success rates
- ✅ Monitor branch preview usage

## 📊 Deployment Metrics

### Success Indicators
- **Build Time**: < 2 minutes average
- **Deployment Time**: < 5 minutes end-to-end
- **Success Rate**: > 95% for all deployments
- **Mobile Load Time**: < 3 seconds on 3G

### Monitoring Tools
```yaml
# GitHub Actions status badges
![Deploy Status](https://github.com/your-username/space-game-1/workflows/Deploy%20Main%20to%20GitHub%20Pages/badge.svg)
![Preview Status](https://github.com/your-username/space-game-1/workflows/Deploy%20Branch%20Preview/badge.svg)
```

## 🔧 Advanced Workflows

### Conditional Deployments
```yaml
# Deploy only on specific conditions
if: contains(github.event.head_commit.message, '[deploy]')
```

### Multi-Stage Deployments
```yaml
# Deploy to staging first, then production
jobs:
  deploy-staging:
    # ... staging deployment
  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    # ... production deployment
```

### Integration Testing
```yaml
# Run tests after deployment
- name: Test Deployment
  run: |
    curl -f ${{ steps.deployment.outputs.page_url }} || exit 1
    # Add more integration tests
```

## 📚 Related Documentation

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Architecture Overview](ARCHITECTURE.md)

---

*This deployment setup ensures reliable, fast, and mobile-friendly deployments for the Space Game project.* 🌟