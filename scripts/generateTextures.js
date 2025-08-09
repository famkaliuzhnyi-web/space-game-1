#!/usr/bin/env node

/**
 * Ship Texture Generator
 * 
 * Generates basic ship component textures programmatically using Canvas API.
 * Creates modular textures that can be combined to build different ship types.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Since we might not have node-canvas available, we'll create simple data URL textures
// and basic image files using a browser-compatible approach

// Texture specifications for ship components
const TEXTURES = {
  // Hull panels - different sizes and styles
  'hull-panel-small': {
    width: 64,
    height: 64,
    type: 'hull',
    description: 'Small hull panel with metallic texture'
  },
  'hull-panel-medium': {
    width: 128,
    height: 64,
    type: 'hull',
    description: 'Medium hull panel for main ship body'
  },
  'hull-panel-large': {
    width: 128,
    height: 128,
    type: 'hull',
    description: 'Large hull panel for heavy ships'
  },
  
  // Engine components
  'engine-thruster-small': {
    width: 32,
    height: 64,
    type: 'engine',
    description: 'Small thruster nozzle'
  },
  'engine-thruster-large': {
    width: 48,
    height: 96,
    type: 'engine',
    description: 'Large thruster for heavy ships'
  },
  'engine-glow': {
    width: 64,
    height: 64,
    type: 'engine',
    description: 'Engine glow effect texture'
  },
  
  // Weapon mounts
  'weapon-mount-light': {
    width: 32,
    height: 32,
    type: 'weapon',
    description: 'Light weapon hardpoint'
  },
  'weapon-mount-heavy': {
    width: 48,
    height: 48,
    type: 'weapon',
    description: 'Heavy weapon hardpoint'
  },
  
  // Cockpit/Bridge sections
  'cockpit-small': {
    width: 64,
    height: 64,
    type: 'cockpit',
    description: 'Small ship cockpit window'
  },
  'bridge-section': {
    width: 96,
    height: 64,
    type: 'cockpit',
    description: 'Ship bridge section'
  }
};

/**
 * Create a simple SVG texture
 */
function createSVGTexture(name, spec) {
  const { width, height, type } = spec;
  
  let content = '';
  let backgroundColor = '#666666';
  
  switch (type) {
    case 'hull':
      backgroundColor = '#4a7299';
      // Hull panel with rivets and panels
      content = `
        <defs>
          <linearGradient id="hull-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6699cc;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#4a7299;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#336688;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hull-gradient)"/>
        <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="#2a5577" stroke-width="2"/>
        ${Array.from({length: Math.floor(width/16) * Math.floor(height/16)}, (_, i) => {
          const x = (i % Math.floor(width/16)) * 16 + 8;
          const y = Math.floor(i / Math.floor(width/16)) * 16 + 8;
          return `<circle cx="${x}" cy="${y}" r="2" fill="#5588bb"/>`;
        }).join('')}
      `;
      break;
      
    case 'engine':
      if (spec.description.includes('glow')) {
        backgroundColor = '#ff6600';
        content = `
          <defs>
            <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#ffaa00;stop-opacity:1" />
              <stop offset="30%" style="stop-color:#ff6600;stop-opacity:1" />
              <stop offset="60%" style="stop-color:#ff3300;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ff0000;stop-opacity:0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#glow-gradient)"/>
        `;
      } else {
        backgroundColor = '#666666';
        content = `
          <defs>
            <linearGradient id="thruster-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#999999;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#666666;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#thruster-gradient)"/>
          <rect x="${width * 0.2}" y="${height * 0.1}" width="${width * 0.6}" height="${height * 0.8}" fill="#111111"/>
          <rect x="${width * 0.25}" y="${height * 0.2}" width="${width * 0.5}" height="${height * 0.6}" fill="#ff4400" opacity="0.3"/>
        `;
      }
      break;
      
    case 'weapon':
      backgroundColor = '#444444';
      content = `
        <rect width="100%" height="100%" fill="#444444"/>
        <rect x="4" y="4" width="${width-8}" height="${height-8}" fill="#666666"/>
        <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height) * 0.15}" fill="#222222"/>
        ${[0, 1, 2, 3].map(i => {
          const angle = (i / 4) * Math.PI * 2;
          const distance = Math.min(width, height) * 0.15 + 6;
          const x = width/2 + Math.cos(angle) * distance;
          const y = height/2 + Math.sin(angle) * distance;
          return `<circle cx="${x}" cy="${y}" r="2" fill="#777777"/>`;
        }).join('')}
      `;
      break;
      
    case 'cockpit':
      backgroundColor = '#5588aa';
      content = `
        <defs>
          <linearGradient id="cockpit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#5588aa;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#334455;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#cockpit-gradient)"/>
        <rect x="${width * 0.2}" y="${height * 0.3}" width="${width * 0.6}" height="${height * 0.4}" fill="#1a2a3a" stroke="#666699" stroke-width="2"/>
        <rect x="2" y="${height - 12}" width="${width - 4}" height="10" fill="#443355"/>
      `;
      break;
  }
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${backgroundColor}"/>
    ${content}
  </svg>`;
}

/**
 * Main generation function
 */
function generateAllTextures() {
  const outputDir = path.join(__dirname, '..', 'public', 'textures', 'ships', 'components');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Generating ship component textures...');
  console.log(`Output directory: ${outputDir}`);
  
  // Generate each texture as SVG
  for (const [name, spec] of Object.entries(TEXTURES)) {
    try {
      const svgContent = createSVGTexture(name, spec);
      const filename = path.join(outputDir, `${name}.svg`);
      fs.writeFileSync(filename, svgContent);
      console.log(`Generated: ${filename}`);
    } catch (error) {
      console.error(`Failed to generate ${name}: ${error.message}`);
    }
  }
  
  // Generate texture manifest
  const manifest = {
    version: "1.0.0",
    generated: new Date().toISOString(),
    textures: TEXTURES,
    format: "svg",
    description: "Ship component textures for modular ship construction"
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`Generated ${Object.keys(TEXTURES).length} textures`);
  console.log('Texture generation complete!');
}

// Run the generator if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllTextures();
}

export { generateAllTextures, TEXTURES };