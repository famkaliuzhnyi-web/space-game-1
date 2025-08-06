/**
 * Space Game - Application Entry Point
 * 
 * This file initializes the React application and mounts it to the DOM.
 * Uses React 18's createRoot API for concurrent features and better performance.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Get the root DOM element
const rootElement = document.getElementById('root')!

// Create React root and render the application
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
