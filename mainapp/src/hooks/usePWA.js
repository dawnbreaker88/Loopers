import { useState, useEffect } from 'react';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Check if app is running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Online / Offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Intercept BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for post-installation completion
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      // Set flag to trigger the post-install welcome dialog
      localStorage.setItem('loopers-pwa-show-welcome', 'true');
      // Dispatch a custom event to notify components immediately
      window.dispatchEvent(new CustomEvent('loopers-app-installed'));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Register Service Worker and watch for updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/app/sw.js', { scope: '/app/' })
        .then((reg) => {
          setSwRegistration(reg);

          // If there is already a waiting worker, set it
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
          }

          // Listen for new service worker installation events
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });

      // Reload window when the waiting service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      localStorage.setItem('loopers-pwa-show-welcome', 'true');
      window.dispatchEvent(new CustomEvent('loopers-app-installed'));
      return true;
    }
    return false;
  };

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    isOnline,
    isInstalled,
    canInstall: !!deferredPrompt && !isInstalled,
    promptInstall,
    swRegistration,
    updateAvailable,
    updateApp
  };
}

export default usePWA;
