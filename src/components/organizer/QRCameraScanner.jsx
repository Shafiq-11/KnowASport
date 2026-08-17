import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, RefreshCw, AlertCircle, XCircle, ShieldAlert,
  CheckCircle2, SwitchCamera, QrCode, PowerOff
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Button from '../common/Button.jsx';

export default function QRCameraScanner({
  onScan,
  isPaused = false,
  disabled = false,
  className = '',
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState(''); // 'permission' | 'insecure' | 'not_found' | 'in_use' | 'general'
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const scannerRef = useRef(null);
  const readerElementId = 'kas-qr-scanner-viewfinder';
  const isCleaningUpRef = useRef(false);
  const lastScannedRef = useRef({ code: '', time: 0 });

  // Check secure context
  const isSecureEnvironment = () => {
    if (typeof window === 'undefined') return true;
    if (window.isSecureContext) return true;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  };

  // Stop camera helper
  const stopCameraStream = async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    try {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      }
    } catch (err) {
      console.warn('Error during scanner cleanup:', err);
    } finally {
      setIsScanning(false);
      isCleaningUpRef.current = false;
    }
  };

  // Start Scanner
  const startScanner = async (preferredCameraId = null) => {
    if (disabled) return;
    setErrorMessage('');
    setErrorType('');
    setIsInitializing(true);

    // 1. Verify Secure Context
    if (!isSecureEnvironment()) {
      setErrorType('insecure');
      setErrorMessage('Camera access requires a secure connection (HTTPS) or localhost.');
      setIsInitializing(false);
      return;
    }

    // 2. Check MediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorType('not_found');
      setErrorMessage('Camera API is not supported on this browser or device.');
      setIsInitializing(false);
      return;
    }

    try {
      // Ensure previous instance is stopped
      await stopCameraStream();

      // Instantiate Html5Qrcode
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      // Enumerate available camera devices
      let availableCameras = [];
      try {
        availableCameras = await Html5Qrcode.getCameras();
        setCameras(availableCameras || []);
      } catch (camErr) {
        console.warn('Could not enumerate cameras prior to permission:', camErr);
      }

      // Camera Selection Strategy:
      // 1. Use explicit camera ID if switching
      // 2. Otherwise request environment (rear camera) on mobile
      const cameraConfig = preferredCameraId
        ? preferredCameraId
        : { facingMode: 'environment' };

      const qrConfig = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.max(180, Math.floor(minEdge * 0.72));
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        cameraConfig,
        qrConfig,
        (decodedText) => {
          if (isPaused) return;

          // Debounce same QR code within 2 seconds
          const now = Date.now();
          if (
            lastScannedRef.current.code === decodedText &&
            now - lastScannedRef.current.time < 2000
          ) {
            return;
          }

          lastScannedRef.current = { code: decodedText, time: now };
          setHasScanned(true);

          // Vibrate if supported on mobile
          if (navigator.vibrate) {
            try {
              navigator.vibrate(80);
            } catch (e) {
              // Ignore vibrate error
            }
          }

          if (onScan) {
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Normal frame scan tick, no QR found in this frame
        }
      );

      setIsScanning(true);
      if (preferredCameraId) {
        setActiveCameraId(preferredCameraId);
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      const errStr = String(err?.name || err?.message || err).toLowerCase();

      if (errStr.includes('notallowed') || errStr.includes('permission') || errStr.includes('denied')) {
        setErrorType('permission');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (errStr.includes('notfound') || errStr.includes('nodevice') || errStr.includes('devicesnotfound')) {
        setErrorType('not_found');
        setErrorMessage('No camera was detected on this device.');
      } else if (errStr.includes('notreadable') || errStr.includes('trackstart') || errStr.includes('in use') || errStr.includes('busy')) {
        setErrorType('in_use');
        setErrorMessage('Camera is currently in use by another application. Please close other apps using the camera.');
      } else if (errStr.includes('overconstrained') && !preferredCameraId) {
        // Retry with default camera fallback
        try {
          const cams = await Html5Qrcode.getCameras();
          if (cams.length > 0) {
            return startScanner(cams[0].id);
          }
        } catch (retryErr) {
          setErrorType('general');
          setErrorMessage('Could not initialize camera. Please try manual entry or reload.');
        }
      } else {
        setErrorType('general');
        setErrorMessage('Could not open camera stream. Please allow permission or try manual pass code entry.');
      }

      setIsScanning(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Switch Camera helper
  const handleSwitchCamera = async () => {
    if (cameras.length < 2) return;
    const currentIdx = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIdx = (currentIdx + 1) % cameras.length;
    const nextCamera = cameras[nextIdx];
    if (nextCamera) {
      await startScanner(nextCamera.id);
    }
  };

  // Pause / Resume scanner stream based on isPaused prop
  useEffect(() => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        if (isPaused) {
          scannerRef.current.pause(true);
        } else {
          scannerRef.current.resume();
          setHasScanned(false);
        }
      } catch (err) {
        console.warn('Scanner pause/resume toggle warning:', err);
      }
    }
  }, [isPaused]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Viewfinder Card ── */}
      <div className="bg-navy-950 rounded-[18px] border border-navy-800 p-4 sm:p-6 text-white space-y-4 shadow-xl overflow-hidden relative">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between border-b border-navy-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-800 uppercase tracking-wider text-amber-400">
              Live QR Check-In Scanner
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isScanning && cameras.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwitchCamera}
                icon={<SwitchCamera size={14} />}
                className="text-xs text-neutral-300 hover:text-white hover:bg-navy-900 border border-navy-800"
              >
                Switch Camera
              </Button>
            )}

            {isScanning && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopCameraStream}
                icon={<PowerOff size={14} />}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/30"
              >
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* ── Viewfinder Viewport ── */}
        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-[16px] overflow-hidden bg-black/90 border-2 border-navy-800 flex items-center justify-center">
          {/* HTML5 QR reader DOM target */}
          <div
            id={readerElementId}
            className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
          />

          {/* Idle / Unstarted State */}
          {!isScanning && !errorMessage && !isInitializing && (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Camera size={32} />
              </div>

              <div className="space-y-1">
                <span className="text-sm font-800 text-white block">Camera Scanner Ready</span>
                <span className="text-xs text-neutral-400 block max-w-xs mx-auto">
                  Click below to allow camera permission and scan athlete ticket QR codes.
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => startScanner()}
                disabled={disabled}
                icon={<Camera size={18} />}
                className="font-800 shadow-md text-sm px-6 py-3"
              >
                Start Scanner
              </Button>
            </div>
          )}

          {/* Initializing Spinner */}
          {isInitializing && (
            <div className="p-6 text-center space-y-3">
              <RefreshCw size={32} className="animate-spin text-amber-400 mx-auto" />
              <span className="text-xs font-700 text-neutral-300 block">
                Requesting camera permission...
              </span>
            </div>
          )}

          {/* Camera Scanning Overlay Target Frame */}
          {isScanning && !isPaused && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Corner reticle */}
              <div className="w-56 h-56 relative border-2 border-amber-400/40 rounded-[16px]">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-[8px]" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-[8px]" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-[8px]" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-[8px]" />

                {/* Subdued scan line */}
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                  animate={{ y: [0, 210, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              <span className="absolute bottom-4 text-[11px] font-700 text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                Point camera at registration QR pass
              </span>
            </div>
          )}

          {/* Scanned Paused State */}
          {isScanning && isPaused && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 size={28} />
              </motion.div>
              <span className="text-xs font-800 text-white">QR Code Captured</span>
              <span className="text-[11px] text-neutral-400">Verifying with KnowASport backend...</span>
            </div>
          )}

          {/* Error View */}
          {errorMessage && (
            <div className="p-6 text-center space-y-3 bg-red-950/40 w-full h-full flex flex-col items-center justify-center">
              <AlertCircle size={32} className="text-red-400 mx-auto" />
              <div className="space-y-1">
                <span className="text-xs font-800 text-red-300 block">
                  {errorType === 'permission'
                    ? 'Camera Access Blocked'
                    : errorType === 'insecure'
                    ? 'HTTPS Required'
                    : 'Camera Unavailable'}
                </span>
                <p className="text-[11px] text-neutral-300 max-w-xs mx-auto leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => startScanner()}
                className="border-red-500/40 text-red-300 hover:bg-red-900/30 text-xs font-700 mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
