import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface QRScannerProps {
  onScan: (cslNumber: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    startScanning();

    return () => {
      isMountedRef.current = false;
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (isMountedRef.current) {
            handleScan(decodedText);
          }
        },
        (_errorMessage) => {
          // Ignore scanning errors (they happen continuously)
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Failed to start scanning:', err);
      setError(err.message || 'Failed to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScan = (decodedText: string) => {
    try {
      // Try to extract CSL number from URL
      if (decodedText.includes('verify?csl=')) {
        const url = new URL(decodedText);
        const csl = url.searchParams.get('csl');
        if (csl) {
          onScan(csl);
          stopScanning();
          return;
        }
      }

      // Check if it's a direct CSL number (format: YYYY-CODE-NNNN-HHHHHH)
      const cslPattern = /^\d{4}-[A-Z0-9]{2,20}-\d{4}-[A-Z0-9]{6}$/;
      if (cslPattern.test(decodedText)) {
        onScan(decodedText);
        stopScanning();
        return;
      }

      // If it's any other text, try to use it directly
      onScan(decodedText);
      stopScanning();
    } catch (err) {
      console.error('Error parsing QR code:', err);
      onScan(decodedText); // Use as-is if parsing fails
      stopScanning();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CameraIcon className="h-6 w-6 text-white" />
            <h3 className="text-xl font-semibold text-white">Scan QR Code</h3>
          </div>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Scanner */}
        <div className="mb-4">
          <div
            id="qr-reader"
            className="rounded-lg overflow-hidden"
            style={{ width: '100%' }}
          />
        </div>

        {/* Instructions */}
        {isScanning && !error && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm text-center">
              📷 Point your camera at the QR code on the certificate
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={startScanning}
              className="mt-3 w-full bg-red-500/30 hover:bg-red-500/40 text-white py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Manual Entry Option */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-gray-400 text-sm text-center">
            Can't scan? Try{' '}
            <button
              onClick={() => {
                stopScanning();
                onClose();
              }}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              manual entry
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
