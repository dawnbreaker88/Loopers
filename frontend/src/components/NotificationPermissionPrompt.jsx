import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function NotificationPermissionPrompt() {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isCheckoutRoute = ['/checkout', '/payment'].includes(location.pathname);

  const keyEndpoint = isAdmin ? '/api/admin/vapid-public-key' : '/api/auth/vapid-public-key';
  const subEndpoint = isAdmin ? '/api/admin/subscribe' : '/api/auth/subscribe';

  useEffect(() => {
    // 1. Only prompt authenticated users
    if (!isAuthenticated || isCheckoutRoute) {
      setShowPrompt(false);
      return;
    }

    // 2. Check if Notification API & ServiceWorker are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      if (import.meta.env.DEV) console.log('[Notification Prompt] Push notifications not supported in this browser.');
      return;
    }

    // 3. Skip if permission is already granted or blocked
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      if (Notification.permission === 'granted') {
        checkAndSyncSubscription();
      }
      return;
    }

    // 3b. Defer notifications prompt until PWA and Location prompts are resolved
    const pwaDismissed = localStorage.getItem('loopers-pwa-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone && !pwaDismissed) {
      setShowPrompt(false);
      return;
    }

    const locationDismissed = localStorage.getItem('loopers-location-prompt-dismissed');
    const locationCoordsSet = Array.isArray(user?.location?.coordinates) && user.location.coordinates.length === 2 && (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0);
    if (!locationDismissed && !locationCoordsSet) {
      setShowPrompt(false);
      return;
    }

    // 4. Check localStorage to respect dismissal cooldown
    const lastDismissed = localStorage.getItem('loopers-notif-prompt-dismissed');
    if (lastDismissed) {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(lastDismissed, 10) < threeDays) {
        return;
      }
    }

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.role, location.pathname]);

  const ensureServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null;
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    await navigator.serviceWorker.ready;
    return registration;
  };

  const checkAndSyncSubscription = async () => {
    try {
      const registration = await ensureServiceWorker();
      if (!registration) return;

      const keyRes = await api.get(keyEndpoint);
      if (!keyRes.data?.success || !keyRes.data?.publicKey) return;

      const expectedServerKey = urlBase64ToUint8Array(keyRes.data.publicKey);
      let subscription = await registration.pushManager.getSubscription();

      // Check if existing subscription key matches server key
      let needsNewSubscription = !subscription;
      if (subscription && subscription.options?.applicationServerKey) {
        const currentKey = new Uint8Array(subscription.options.applicationServerKey);
        if (currentKey.length !== expectedServerKey.length || !currentKey.every((val, i) => val === expectedServerKey[i])) {
          if (import.meta.env.DEV) console.log('[Notification Sync] VAPID key mismatch detected. Resubscribing...');
          await subscription.unsubscribe().catch(() => {});
          needsNewSubscription = true;
        }
      }

      if (needsNewSubscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: expectedServerKey
        });
      }

      if (subscription) {
        // Sync subscription with backend
        await api.post(subEndpoint, { subscription });
        if (import.meta.env.DEV) console.log('[Notification Sync] Push subscription synced with backend successfully.');
      }
    } catch (err) {
      console.warn('[Notification Prompt] Auto-sync check failed:', err.message);
    }
  };



  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const registration = await ensureServiceWorker();
      if (!registration) {
        throw new Error('Service worker is not supported in this browser.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Alerts permission was denied. You can enable it anytime in browser settings.');
        setShowPrompt(false);
        return;
      }

      // Fetch VAPID Public Key
      const keyRes = await api.get(keyEndpoint);
      if (!keyRes.data?.success || !keyRes.data?.publicKey) {
        throw new Error('Failed to retrieve server encryption key.');
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.data.publicKey)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      // Save subscription on server
      await api.post(subEndpoint, { subscription });
      
      toast.success('Order status notifications enabled successfully!');
      setShowPrompt(false);
    } catch (err) {
      console.error('[Notification Prompt Error]', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to enable notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('loopers-notif-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in mb-6">
      <div className="flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-500 flex items-center justify-center shrink-0 border border-primary-500/20 shadow-inner">
          <Bell className="animate-bounce stroke-[2]" size={20} />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs font-black text-sys-text-primary">Enable Order Alerts</h4>
            <span className="bg-primary-500/20 text-primary-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-primary-500/30 flex items-center gap-0.5 uppercase tracking-wider">
              <Sparkles size={8} /> Instant Updates
            </span>
          </div>
          <p className="text-[11px] text-sys-text-secondary mt-1 leading-snug">
            {isAdmin 
              ? 'Receive background notifications whenever a customer places an order.' 
              : 'Get instant background updates when your order is accepted and out for delivery.'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto self-end sm:self-center shrink-0">
        <button
          onClick={handleRequestPermission}
          disabled={loading}
          className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-[11px] transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-primary-500/20 active:scale-[0.98]"
        >
          {loading ? (
            <span>Enabling...</span>
          ) : (
            <>
              <Bell size={13} />
              <span>Enable Notifications</span>
            </>
          )}
        </button>
        <button
          onClick={handleDismiss}
          className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sys-text-secondary font-bold text-[11px] transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}

