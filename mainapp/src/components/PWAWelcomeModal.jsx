import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag } from 'lucide-react';

export default function PWAWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  const checkWelcomeFlag = () => {
    const showWelcome = localStorage.getItem('loopers-pwa-show-welcome');
    if (showWelcome === 'true') {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    // Check on initial load
    checkWelcomeFlag();

    // Listen for custom app-installed triggers
    const handleAppInstalled = () => {
      setIsOpen(true);
    };

    window.addEventListener('loopers-app-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('loopers-app-installed', handleAppInstalled);
    };
  }, []);

  const handleClose = () => {
    localStorage.removeItem('loopers-pwa-show-welcome');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
      />

      {/* Welcome Card */}
      <div className="w-full max-w-sm bg-sys-surface border border-sys-border rounded-3xl p-6 shadow-2xl relative z-10 animate-slide-up text-center">
        {/* Celebration Ring */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-inner relative">
            <ShoppingBag size={30} className="stroke-[1.75]" />
            <div className="absolute -top-1 -right-1 text-amber-400 animate-bounce">
              <Sparkles size={16} />
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-black text-sys-text-primary">Welcome to Loopers!</h3>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 py-1 px-3 rounded-full inline-block">
            App installed successfully
          </p>
          <p className="text-xs text-sys-text-secondary leading-relaxed pt-2">
            Enjoy lightning-fast ordering, instant desktop/home launcher access, and real-time delivery notifications.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full py-3 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs shadow-md shadow-primary-500/20 transition-all active:scale-[0.98]"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
