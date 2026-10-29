import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) {
    return null;
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md transition-all z-50 sticky top-0"
      >
        <Wifi size={14} className="shrink-0" />
        <span>Connection restored! You are back online.</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      className="bg-amber-600 text-slate-950 text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md transition-all z-50 sticky top-0"
    >
      <WifiOff size={14} className="shrink-0 text-slate-950" />
      <span>
        You are currently working offline. RecallLoop AI is running in local fallback mode. Your progress is saved locally.
      </span>
    </div>
  );
};
