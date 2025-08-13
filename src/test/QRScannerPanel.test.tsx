import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { QRScannerPanel } from '../components/ui/QRScannerPanel';

// Mock QrScanner
vi.mock('qr-scanner', () => ({
  default: vi.fn(),
  hasCamera: vi.fn(),
}));

// Mock window.prompt
const originalPrompt = window.prompt;

describe('QRScannerPanel', () => {
  const mockOnScanResult = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.prompt = vi.fn();
  });

  afterEach(() => {
    window.prompt = originalPrompt;
  });

  test('should not render when isOpen is false', () => {
    const { container } = render(
      <QRScannerPanel
        isOpen={false}
        onScanResult={mockOnScanResult}
        onClose={mockOnClose}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('should render when isOpen is true', () => {
    render(
      <QRScannerPanel
        isOpen={true}
        onScanResult={mockOnScanResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('📱 Scan QR Code to Join Game')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('should handle manual code entry', () => {
    (window.prompt as any).mockReturnValue('test-code-123');

    render(
      <QRScannerPanel
        isOpen={true}
        onScanResult={mockOnScanResult}
        onClose={mockOnClose}
      />
    );

    const manualButton = screen.getAllByText('Enter Code Manually')[0];
    fireEvent.click(manualButton);

    expect(window.prompt).toHaveBeenCalledWith('Enter the game join code manually:');
    expect(mockOnScanResult).toHaveBeenCalledWith('test-code-123');
  });

  test('should handle manual code entry cancellation', () => {
    (window.prompt as any).mockReturnValue(null); // User cancelled

    render(
      <QRScannerPanel
        isOpen={true}
        onScanResult={mockOnScanResult}
        onClose={mockOnClose}
      />
    );

    const manualButton = screen.getAllByText('Enter Code Manually')[0];
    fireEvent.click(manualButton);

    expect(window.prompt).toHaveBeenCalled();
    expect(mockOnScanResult).not.toHaveBeenCalled();
  });

  test('should call onClose when Cancel button is clicked', () => {
    render(
      <QRScannerPanel
        isOpen={true}
        onScanResult={mockOnScanResult}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should include usage instructions', () => {
    render(
      <QRScannerPanel
        isOpen={true}
        onScanResult={mockOnScanResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('How to use:')).toBeInTheDocument();
    expect(screen.getByText('Point your camera at the QR code shared by the host')).toBeInTheDocument();
    expect(screen.getByText('The code will be detected automatically')).toBeInTheDocument();
    expect(screen.getByText('Or enter the join code manually if camera isn\'t working')).toBeInTheDocument();
  });
});