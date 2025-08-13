import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerPanelProps {
  onScanResult: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const QRScannerPanel: React.FC<QRScannerPanelProps> = ({
  onScanResult,
  onClose,
  isOpen
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initializeScanner = async () => {
      try {
        if (!videoRef.current) return;

        // Check camera permission
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data);
            onScanResult(result.data);
            scanner.stop();
            setIsScanning(false);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        qrScannerRef.current = scanner;

        await scanner.start();
        setIsScanning(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize QR scanner:', err);
        setError('Failed to access camera. Please check permissions.');
      }
    };

    initializeScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      setIsScanning(false);
    };
  }, [isOpen, onScanResult]);

  const handleManualInput = () => {
    const input = prompt('Enter the game join code manually:');
    if (input) {
      onScanResult(input);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #333',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          margin: '0 0 20px 0', 
          color: '#4a9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          📱 Scan QR Code to Join Game
        </h2>

        {error ? (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              color: '#ff6b6b', 
              marginBottom: '16px',
              fontSize: '16px'
            }}>
              ⚠️ {error}
            </div>
            <button
              onClick={handleManualInput}
              style={{
                backgroundColor: '#4a9',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '10px'
              }}
            >
              Enter Code Manually
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                backgroundColor: '#000',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
              playsInline
              muted
            />
            
            {isScanning && (
              <div style={{
                marginTop: '12px',
                color: '#4a9',
                fontSize: '14px'
              }}>
                📷 Camera active - Point at QR code
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={handleManualInput}
                style={{
                  backgroundColor: '#555',
                  border: '1px solid #777',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '10px'
                }}
              >
                Enter Code Manually
              </button>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center' 
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#666',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#888',
          textAlign: 'left'
        }}>
          <strong>How to use:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Point your camera at the QR code shared by the host</li>
            <li>The code will be detected automatically</li>
            <li>Or enter the join code manually if camera isn't working</li>
          </ul>
        </div>
      </div>
    </div>
  );
};