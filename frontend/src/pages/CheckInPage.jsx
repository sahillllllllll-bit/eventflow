import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { eventAPI, registrationAPI } from '../api/endpoints.js';
import Sidebar from '../components/Sidebar.jsx';
import useToast, { Toast } from '../hooks/useToast.jsx';
import { QrCode, Keyboard, Camera, X, CheckCircle, AlertCircle, Menu } from 'lucide-react';

/* ─────────────────────────────────────────────
   QR Scanner component using jsQR + getUserMedia
   ───────────────────────────────────────────── */
const QRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [camError, setCamError] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanning(true);
        }
      } catch (err) {
        setCamError('Camera access denied or not available on this device.');
      }
    };

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Load jsQR dynamically so no install needed
  useEffect(() => {
    if (!scanning) return;

    let jsQR = null;
    let mounted = true;

    const loadAndScan = async () => {
      if (!window.jsQR) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      jsQR = window.jsQR;

      const tick = () => {
        if (!mounted) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            onScan(code.data);
            return; // stop after first scan
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    loadAndScan().catch(() => setCamError('Failed to load QR scanning library.'));

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scanning, onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand" />
            <span className="font-semibold text-white">Scan QR Code</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black aspect-square">
          {camError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-gray-300 text-sm">{camError}</p>
              <p className="text-gray-500 text-xs">Use manual Ticket ID entry instead.</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  {/* Corner borders */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand rounded-tl-lg" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand rounded-br-lg" />
                  {/* Scan line animation */}
                  <span className="absolute left-1 right-1 top-1/2 h-0.5 bg-brand/70 animate-scan-line" />
                </div>
              </div>
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
                </div>
              )}
            </>
          )}
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="px-5 py-4 text-center">
          <p className="text-gray-400 text-sm">Point camera at attendee's ticket QR code</p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Check-in result flash card
   ───────────────────────────────────────────── */
const ResultCard = ({ result, onDismiss }) => {
  if (!result) return null;
  const isSuccess = result.type === 'success';
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 animate-fade-in ${
        isSuccess
          ? 'border-green-500/40 bg-green-500/10'
          : 'border-red-500/40 bg-red-500/10'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
      ) : (
        <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
          {isSuccess ? 'Checked In!' : 'Check-In Failed'}
        </p>
        <p className="text-sm text-gray-400 truncate">{result.message}</p>
      </div>
      <button onClick={onDismiss} className="text-gray-500 hover:text-white shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main CheckInPage
   ───────────────────────────────────────────── */
const CheckInPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [event, setEvent] = useState(null);
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeMode, setActiveMode] = useState('manual'); // 'manual' | 'qr'
  const [result, setResult] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const res = await eventAPI.getEventById(eventId);
        setEvent(res.data.event);
      } catch (error) {
        showToast('Unable to load event details', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId]);

  const performCheckIn = async (id) => {
    if (!id?.trim()) {
      showToast('Enter a Ticket ID to check in', 'error');
      return;
    }
    try {
      setCheckingIn(true);
      setResult(null);
      await registrationAPI.checkIn(id.trim());
      const successResult = { type: 'success', message: `Ticket ${id.trim()} checked in successfully`, ticketId: id.trim() };
      setResult(successResult);
      setRecentCheckins((prev) => [successResult, ...prev].slice(0, 10));
      showToast('Attendee checked in successfully', 'success');
      setTicketId('');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Check-in failed. Please try again.';
      setResult({ type: 'error', message: msg });
      showToast(msg, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleManualCheckIn = (e) => {
    e.preventDefault();
    performCheckIn(ticketId);
  };

  const handleQRScan = async (data) => {
    setShowScanner(false);
    showToast(`QR scanned: ${data}`, 'success');
    await performCheckIn(data);
  };

  if (loading && !event) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto" />
          <p className="text-gray-400 mt-4">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar — same as EventDetailPage */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content — offset for sidebar on desktop */}
      <div className="lg:ml-60 min-h-screen">
        {/* Top header bar */}
        <div className="bg-surface border-b border-surface-overlay px-4 sm:px-6 py-4 sm:py-5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-overlay text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/dashboard/events/${eventId}`)}
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  ← Back
                </button>
                <span className="text-gray-600 text-sm">/</span>
                <span className="text-gray-400 text-sm truncate">{event?.title || 'Event'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">Check-In</h1>
            </div>

            {/* Event status pill */}
            {event && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-gray-300">{event.currentRegistrations ?? 0} registered</span>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

          {/* Event info strip */}
          {event && (
            <div className="rounded-2xl bg-surface border border-surface-overlay p-4 sm:p-5 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{event.title}</h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {new Date(event.date).toLocaleString()} · {event.isOnline ? 'Online' : event.venue || 'Venue TBD'}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <div className="rounded-xl bg-slate-800 px-3 py-2 text-center">
                  <div className="text-white font-bold">{event.currentRegistrations ?? 0}</div>
                  <div className="text-gray-500 text-xs">Registered</div>
                </div>
              </div>
            </div>
          )}

          {/* Mode switcher */}
          <div className="flex rounded-2xl bg-surface border border-surface-overlay p-1 gap-1">
            <button
              onClick={() => setActiveMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition ${
                activeMode === 'manual'
                  ? 'bg-brand text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
            <button
              onClick={() => setActiveMode('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition ${
                activeMode === 'qr'
                  ? 'bg-brand text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Scan</span>
            </button>
          </div>

          {/* Result card */}
          <ResultCard result={result} onDismiss={() => setResult(null)} />

          {/* Manual entry panel */}
          {activeMode === 'manual' && (
            <div className="rounded-2xl bg-surface border border-surface-overlay p-5 sm:p-7 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white">Manual Check-In</h3>
                <p className="text-gray-400 text-sm mt-1">Type the attendee's Ticket ID and hit check in.</p>
              </div>
              <form onSubmit={handleManualCheckIn} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ticket ID</label>
                  <input
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="w-full rounded-xl border border-surface-overlay bg-bg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand transition"
                    placeholder="e.g. TKT-A3F92B"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingIn}
                  className="w-full rounded-xl bg-brand px-4 py-3 text-black font-semibold hover:bg-brand-dark disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {checkingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                      Checking in…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Check in attendee
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* QR scan panel */}
          {activeMode === 'qr' && (
            <div className="rounded-2xl bg-surface border border-surface-overlay p-5 sm:p-7 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-white">QR Code Check-In</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Open the camera and point at the attendee's ticket QR code to instantly check them in.
                </p>
              </div>

              <button
                onClick={() => setShowScanner(true)}
                className="w-full rounded-xl border-2 border-dashed border-brand/40 hover:border-brand bg-brand/5 hover:bg-brand/10 py-10 flex flex-col items-center gap-3 transition group"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand/10 group-hover:bg-brand/20 flex items-center justify-center transition">
                  <Camera className="w-8 h-8 text-brand" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Open Camera Scanner</p>
                  <p className="text-gray-500 text-sm mt-1">Tap to activate camera</p>
                </div>
              </button>

              <div className="rounded-xl bg-slate-900 border border-surface-overlay p-4 text-sm text-gray-400 space-y-1">
                <p className="font-medium text-gray-300">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Click the button above to open your camera</li>
                  <li>Allow camera permissions if prompted</li>
                  <li>Point the camera at the QR code on the attendee's ticket</li>
                  <li>Check-in happens automatically when code is detected</li>
                </ol>
              </div>
            </div>
          )}

          {/* Recent check-ins */}
          {recentCheckins.length > 0 && (
            <div className="rounded-2xl bg-surface border border-surface-overlay p-5 sm:p-6">
              <h3 className="font-semibold text-white mb-4">Recent Check-Ins This Session</h3>
              <div className="space-y-2">
                {recentCheckins.map((c, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                      c.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    {c.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className={`font-mono font-medium ${c.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                      {c.ticketId}
                    </span>
                    <span className="text-gray-500 text-xs ml-auto">{c.type === 'success' ? '✓ Checked in' : '✗ Failed'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Scan line keyframe — injected once */}
      <style>{`
        @keyframes scan-line {
          0%   { transform: translateY(-100px); opacity: 0.8; }
          50%  { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0.8; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CheckInPage;