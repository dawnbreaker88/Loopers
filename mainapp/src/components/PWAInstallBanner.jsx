import React, { useState, useEffect } from 'react';
import { Download, X, Zap, Shield, Sparkles } from 'lucide-react';
import usePWA from '../hooks/usePWA.js';

export default function PWAInstallBanner() {
  const { canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const lastDismissed = localStorage.getItem('loopers-pwa-dismissed');
    if (!lastDismissed) {
      setDismissed(false);
    } else {
      // Re-prompt after 3 days if dismissed
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(lastDismissed, 10) > threeDays) {
        setDismissed(false);
      }
    }
  }, []);

  if (!canInstall || dismissed) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('loopers-pwa-dismissed', Date.now().toString());
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-40 max-w-md mx-auto animate-slide-up">
      <div className="bg-[#0F172A]/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-white relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>

        <div className="flex items-start space-x-3.5 pr-6">
          <div className="w-12 h-12 rounded-xl bg-[#40A2E3] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#40A2E3]/30 p-2">
            <img src="/loopers.svg" alt="Loopers" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-sm font-black text-white">Install Loopers App</h4>
              <span className="bg-[#40A2E3]/20 text-[#40A2E3] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-[#40A2E3]/30 flex items-center gap-1">
                <Sparkles size={10} /> Fast
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Add to Home Screen for 1-tap ordering, instant tracking, and a native app experience.
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center space-x-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#40A2E3] hover:bg-[#38bdf8] text-white font-black text-xs shadow-md shadow-[#40A2E3]/20 flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98]"
          >
            <Download size={14} />
            <span>Install App</span>
          </button>

          <button
            onClick={handleDismiss}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
