import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import usePWA from '../hooks/usePWA.js';

export default function PWAUpdatePrompt() {
  const { updateAvailable, updateApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true);
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    updateApp();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-40 max-w-md mx-auto animate-slide-up">
      <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white">
        <div className="flex items-start space-x-3.5">
          {/* Animated Spinner Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#40A2E3]/20 text-[#40A2E3] flex items-center justify-center shrink-0 border border-[#40A2E3]/35 shadow-inner">
            <RefreshCw className="animate-spin stroke-[2]" size={18} />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-black text-white">Update Available</h4>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-0.5 uppercase tracking-wider">
                <Sparkles size={8} /> New Features
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              A new version of Loopers is available. Update now to enjoy faster ordering and improvements.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-3.5 flex items-center space-x-2 pt-2.5 border-t border-slate-800">
          <button
            onClick={handleUpdate}
            className="flex-1 py-2 px-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-[11px] transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-primary-500/20 active:scale-[0.98]"
          >
            <RefreshCw size={12} />
            <span>Update Now</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
