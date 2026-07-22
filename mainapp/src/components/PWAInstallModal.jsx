import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, CheckCircle2 } from 'lucide-react';
import usePWA from '../hooks/usePWA.js';

// Engagement utility to track PWA actions
export const updatePWAEngagement = (action) => {
  try {
    const defaultState = {
      sessionCount: 0,
      productViews: 0,
      hasLoggedIn: false,
      hasAddedToCart: false,
      hasPlacedOrder: false
    };
    const stored = localStorage.getItem('loopers-pwa-engagement');
    const state = stored ? { ...defaultState, ...JSON.parse(stored) } : defaultState;

    if (action === 'session') {
      const sessionActive = sessionStorage.getItem('loopers-pwa-session-active');
      if (!sessionActive) {
        sessionStorage.setItem('loopers-pwa-session-active', 'true');
        state.sessionCount += 1;
      }
    } else if (action === 'product_view') {
      state.productViews += 1;
    } else if (action === 'login') {
      state.hasLoggedIn = true;
    } else if (action === 'add_to_cart') {
      state.hasAddedToCart = true;
    } else if (action === 'place_order') {
      state.hasPlacedOrder = true;
    }

    localStorage.setItem('loopers-pwa-engagement', JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('loopers-pwa-engagement-updated'));
  } catch (e) {
    console.warn('Failed to update PWA engagement:', e);
  }
};

export default function PWAInstallModal() {
  const { canInstall, promptInstall } = usePWA();
  const [isOpen, setIsOpen] = useState(false);

  const checkEligibility = () => {
    if (!canInstall) {
      setIsOpen(false);
      return;
    }

    // Respect dismissal cooldown (7 days)
    const lastDismissed = localStorage.getItem('loopers-pwa-dismissed');
    if (lastDismissed) {
      const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - parseInt(lastDismissed, 10) < cooldownPeriod) {
        setIsOpen(false);
        return;
      }
    }

    // Evaluate engagement criteria
    try {
      const stored = localStorage.getItem('loopers-pwa-engagement');
      if (!stored) {
        setIsOpen(false);
        return;
      }

      const state = JSON.parse(stored);
      const hasMeaningfulEngagement =
        state.hasLoggedIn ||
        state.productViews >= 3 ||
        state.hasAddedToCart ||
        state.hasPlacedOrder ||
        state.sessionCount >= 2;

      setIsOpen(hasMeaningfulEngagement);
    } catch (e) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    // 1. Initialize session engagement tracking on mount
    updatePWAEngagement('session');
    
    // 2. Check eligibility immediately
    checkEligibility();

    // 3. Listen for future engagement updates or install prompt readiness
    window.addEventListener('loopers-pwa-engagement-updated', checkEligibility);
    
    // The beforeinstallprompt event might fire after mount, which sets canInstall to true
    const checkTimer = setTimeout(checkEligibility, 1000);

    return () => {
      window.removeEventListener('loopers-pwa-engagement-updated', checkEligibility);
      clearTimeout(checkTimer);
    };
  }, [canInstall]);

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      setIsOpen(false);
    }
  };

  const handleDismissClick = () => {
    localStorage.setItem('loopers-pwa-dismissed', Date.now().toString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={handleDismissClick}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
      />

      {/* Modal Dialog */}
      <div className="w-full max-w-sm bg-sys-surface border border-sys-border rounded-3xl p-6 shadow-2xl relative z-10 animate-slide-up transition-all">
        {/* Dismiss Button */}
        <button
          onClick={handleDismissClick}
          className="absolute top-4 right-4 text-sys-text-secondary hover:text-sys-text-primary p-1.5 rounded-xl bg-sys-surface-secondary hover:bg-sys-surface-tertiary transition-colors"
          aria-label="Close dialog"
        >
          <X size={15} />
        </button>

        {/* Logo and Tagline */}
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#40A2E3] flex items-center justify-center shadow-lg shadow-[#40A2E3]/20 p-3.5 shrink-0">
            <img src="/pwa-192x192.png" alt="Loopers" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1.5">
              <h3 className="text-base font-black text-sys-text-primary">Install Loopers</h3>
              <span className="bg-primary-500/10 text-primary-500 text-[9px] font-black px-2 py-0.5 rounded-md border border-primary-500/20 flex items-center gap-0.5">
                <Sparkles size={10} /> RECOMMENDED
              </span>
            </div>
            <p className="text-xs text-sys-text-secondary mt-1">
              Add to home screen for the ultimate shopping experience.
            </p>
          </div>
        </div>

        {/* Benefit Bullets */}
        <div className="space-y-3.5 bg-sys-surface-secondary border border-sys-border rounded-2xl p-4 mb-6">
          {[
            'Opens instantly from home screen',
            'Faster checkout & 1-tap ordering',
            'Real-time order & rider tracking',
            'Direct push alerts on status updates',
            'Works offline when connection drops'
          ].map((benefit, index) => (
            <div key={index} className="flex items-start space-x-2.5">
              <CheckCircle2 size={15} className="text-[#40A2E3] shrink-0 mt-0.5" />
              <span className="text-[11px] font-semibold text-sys-text-primary leading-tight">
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2.5">
          <button
            onClick={handleInstallClick}
            className="w-full py-3 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs shadow-md shadow-primary-500/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Download size={14} />
            <span>Install Loopers App</span>
          </button>
          
          <button
            onClick={handleDismissClick}
            className="w-full py-3 px-4 rounded-xl bg-sys-surface-secondary hover:bg-sys-surface-tertiary text-sys-text-secondary hover:text-sys-text-primary font-bold text-xs transition-colors text-center"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
