# GitHub Pages Setup Instructions

To enable the branch preview functionality, you need to enable GitHub Pages in your repository settings:

## Steps to Enable GitHub Pages:

1. **Go to Repository Settings**:
   - Navigate to your repository on GitHub
   - Click on the "Settings" tab

2. **Enable GitHub Pages**:
   - Scroll down to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"
   - Save the settings

3. **Verify Permissions**:
   - The workflows are already configured with the necessary permissions
   - `contents: read`, `pages: write`, `id-token: write`, `pull-requests: write`

## How It Works:

### Branch Previews:
- Every branch push (except main) triggers the `Deploy Branch Preview` workflow
- Each branch gets deployed to: `https://your-username.github.io/space-game-1/{branch-name}/`
- Pull requests automatically get comments with preview URLs and QR codes

### Main Branch:
- Pushes to main trigger the `Deploy Main to GitHub Pages` workflow
- Main branch deploys to: `https://your-username.github.io/space-game-1/`

## Mobile-Friendly Features:
- 📱 QR codes in PR comments for easy mobile access
- Touch-optimized interface with 44px minimum touch targets
- Responsive design that works perfectly on phones
- `touch-action: manipulation` to prevent iOS zoom on double-tap

## Testing:
1. Create a new branch and push changes
2. The workflow will automatically deploy your branch
3. Check the Actions tab to see the deployment progress
4. Once complete, visit the URL or scan the QR code from your phone!

**Note**: The first deployment may take a few minutes to become available after enabling GitHub Pages.