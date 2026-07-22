import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import usePWA from '../hooks/usePWA.js';

export default function OfflineBanner() {
  const { isOnline } = usePWA();
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestored) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      {!isOnline ? (
        <div className="bg-slate-900 text-amber-400 px-4 py-2 border-b border-amber-500/30 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center space-x-2">
            <WifiOff size={15} className="animate-pulse shrink-0 text-amber-400" />
            <span>You're Offline. Browsing cached catalog.</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg transition-colors text-[10px]"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      ) : showRestored ? (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-center space-x-2 text-xs font-black shadow-md">
          <Wifi size={15} />
          <span>Connection restored! You are back online.</span>
        </div>
      ) : null}
    </div>
  );
}
