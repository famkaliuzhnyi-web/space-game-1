import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/space-game-1/' : '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and DOM libraries
          'react-vendor': ['react', 'react-dom'],
          
          // Game systems - large modules that can be loaded separately
          'game-systems': [
            './src/systems/CombatManager.ts',
            './src/systems/NPCAIManager.ts',
            './src/systems/HackingManager.ts'
          ],
          
          // Economy and trading systems
          'economy-systems': [
            './src/systems/EconomicSystem.ts',
            './src/systems/InvestmentManager.ts',
            './src/systems/ContractManager.ts'
          ],
          
          // Character and progression systems
          'character-systems': [
            './src/systems/CharacterManager.ts',
            './src/systems/CharacterProgressionSystem.ts',
            './src/systems/SkillSpecializationManager.ts'
          ],
          
          // UI components
          'ui-panels': [
            './src/components/ui/CombatPanel.tsx',
            './src/components/ui/HackingPanel.tsx',
            './src/components/ui/InvestmentPanel.tsx',
            './src/components/ui/FleetManagementPanel.tsx'
          ]
        }
      }
    },
    // Increase the chunk size warning limit since we're optimizing
    chunkSizeWarningLimit: 1000
  }
})
