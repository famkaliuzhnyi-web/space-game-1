import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SectorsMapPanel from '../components/ui/SectorsMapPanel';
import { Galaxy } from '../types/world';

// Mock galaxy data for testing
const mockGalaxy: Galaxy = {
  sectors: [
    {
      id: 'core-worlds',
      name: 'Core Worlds Sector',
      position: { x: 100, y: 100, z: 0 },
      systems: [
        {
          id: 'sol',
          name: 'Sol System',
          position: { x: 0, y: 0, z: 0 },
          star: { name: 'Sol', type: 'yellow-dwarf', temperature: 5778 },
          stations: [],
          planets: [],
          gates: [],
          securityLevel: 9
        }
      ],
      controllingFaction: 'Security Forces',
      description: 'The heart of civilized space'
    },
    {
      id: 'frontier',
      name: 'Frontier Sector',
      position: { x: 200, y: 100, z: 0 },
      systems: [],
      controllingFaction: 'Outer Colonies',
      description: 'Dangerous frontier territory'
    }
  ],
  currentPlayerLocation: {
    sectorId: 'core-worlds',
    systemId: 'sol'
  }
};

describe('SectorsMapPanel', () => {
  it('should render sectors map panel when visible', () => {
    const mockOnNavigate = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <SectorsMapPanel
        isVisible={true}
        onClose={mockOnClose}
        galaxy={mockGalaxy}
        onNavigateToSector={mockOnNavigate}
      />
    );

    expect(screen.getByText('🗺️ Sectors Map')).toBeInTheDocument();
    expect(screen.getByText('Click a sector to select it. Click again to navigate. Hover for quick info.')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    const mockOnNavigate = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <SectorsMapPanel
        isVisible={false}
        onClose={mockOnClose}
        galaxy={mockGalaxy}
        onNavigateToSector={mockOnNavigate}
      />
    );

    expect(screen.queryByText('🗺️ Sectors Map')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnNavigate = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <SectorsMapPanel
        isVisible={true}
        onClose={mockOnClose}
        galaxy={mockGalaxy}
        onNavigateToSector={mockOnNavigate}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render legend with faction colors', () => {
    const mockOnNavigate = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <SectorsMapPanel
        isVisible={true}
        onClose={mockOnClose}
        galaxy={mockGalaxy}
        onNavigateToSector={mockOnNavigate}
      />
    );

    expect(screen.getByText('Traders Guild')).toBeInTheDocument();
    expect(screen.getByText('Security Forces')).toBeInTheDocument();
    expect(screen.getByText('Outer Colonies')).toBeInTheDocument();
    expect(screen.getByText('Pirates')).toBeInTheDocument();
    expect(screen.getByText('Current Location')).toBeInTheDocument();
  });

  it('should render canvas for map display', () => {
    const mockOnNavigate = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <SectorsMapPanel
        isVisible={true}
        onClose={mockOnClose}
        galaxy={mockGalaxy}
        onNavigateToSector={mockOnNavigate}
      />
    );

    const canvas = document.querySelector('.sectors-map-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('should handle empty galaxy gracefully', () => {
    const emptyGalaxy: Galaxy = {
      sectors: [],
      currentPlayerLocation: { sectorId: '', systemId: '' }
    };

    const mockOnNavigate = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <SectorsMapPanel
        isVisible={true}
        onClose={mockOnClose}
        galaxy={emptyGalaxy}
        onNavigateToSector={mockOnNavigate}
      />
    );

    expect(screen.getByText('🗺️ Sectors Map')).toBeInTheDocument();
    // Should not crash with empty sectors array
  });
});