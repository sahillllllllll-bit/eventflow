import React, { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

/**
 * DesktopNudge — shows a sticky bottom banner on mobile devices.
 * Disappears once dismissed (stored in sessionStorage so it
 * doesn't reappear within the same browser session).
 *
 * Props:
 *  storageKey  — unique key per page so each page has its own dismiss state
 *  message     — custom body text
 */
const DesktopNudge = ({
  storageKey = 'desktop_nudge_dismissed',
  message = 'Creating events is easier on a larger screen. Switch to your laptop or desktop for the full experience.',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on genuinely mobile-width viewports
    const isMobile = window.innerWidth < 1024;
    const dismissed = sessionStorage.getItem(storageKey);
    if (isMobile && !dismissed) setVisible(true);
  }, [storageKey]);

  const dismiss = () => {
    sessionStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop blur on mobile only */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 pt-2 lg:hidden"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      >
        <div className="w-full max-w-lg mx-auto bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-brand via-brand-light to-brand" />

          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-brand" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight mb-1">
                  Best viewed on desktop
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Close */}
              <button
                onClick={dismiss}
                className="flex-shrink-0 w-7 h-7 rounded-lg bg-surface-overlay flex items-center justify-center hover:bg-border transition"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-400 border border-border hover:text-white hover:border-gray-500 transition"
              >
                Continue on mobile
              </button>
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand hover:bg-brand-light transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesktopNudge;