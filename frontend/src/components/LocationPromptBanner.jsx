import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Sparkles } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserLocationAction } from '../store/authSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';

export default function LocationPromptBanner() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // 1. Skip for Admins
    if (user?.role === 'admin') {
      if (isMounted.current) setShowPrompt(false);
      return;
    }

    // 2. Check browser geolocation support
    if (!('navigator' in window) || !('geolocation' in navigator)) {
      return;
    }

    // 3. Check if location coordinates already exist on user object
    const coords = user?.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)) {
      if (isMounted.current) setShowPrompt(false);
      return;
    }

    // 4. Check localStorage dismissal cooldown (24h)
    try {
      const lastDismissed = localStorage.getItem('loopers-location-prompt-dismissed');
      if (lastDismissed) {
        const oneDay = 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(lastDismissed, 10) < oneDay) {
          return;
        }
      }
    } catch (e) {
      console.warn('[LocationPromptBanner] Storage access error:', e);
    }

    // 4b. Defer until PWA install prompt is resolved (either installed/standalone or dismissed)
    const pwaDismissed = localStorage.getItem('loopers-pwa-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!isStandalone && !pwaDismissed) {
      if (isMounted.current) setShowPrompt(false);
      return;
    }

    // 5. Check permission state if permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (!isMounted.current) return;
        setPermissionState(result.state);
        
        result.onchange = () => {
          if (!isMounted.current) return;
          setPermissionState(result.state);
          if (result.state === 'granted') {
            setShowPrompt(false);
          } else {
            setShowPrompt(true);
          }
        };

        if (result.state === 'granted') {
          setShowPrompt(false);
        } else {
          setShowPrompt(true);
        }
      }).catch(() => {
        if (isMounted.current) setShowPrompt(true);
      });
    } else {
      if (isMounted.current) setShowPrompt(true);
    }
  }, [isAuthenticated, user?.location?.coordinates, user?.role]);

  const handleEnableLocation = () => {
    if (loading) return;
    setLoading(true);

    if (!navigator.geolocation) {
      if (isMounted.current) setLoading(false);
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!position || !position.coords) {
          if (isMounted.current) setLoading(false);
          toast.error('Failed to read location coordinates');
          return;
        }
        const { latitude, longitude } = position.coords;
        try {
          if (isAuthenticated) {
            const res = await api.put('/api/auth/location', { latitude, longitude });
            if (res.data?.success && isMounted.current) {
              dispatch(updateUserLocationAction(res.data.location));
            }
          }
          toast.success('Location enabled for 10-min delivery!');
          if (isMounted.current) setShowPrompt(false);
        } catch (err) {
          console.warn('Failed to update location on server:', err);
          toast.success('Location acquired!');
          if (isMounted.current) setShowPrompt(false);
        } finally {
          if (isMounted.current) setLoading(false);
        }
      },
      (error) => {
        if (isMounted.current) setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission was denied. Please allow location access in browser settings.');
        } else {
          toast.error('Could not acquire location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('loopers-location-prompt-dismissed', Date.now().toString());
    } catch (e) {
      console.warn('[LocationPromptBanner] Storage set error:', e);
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  const isDenied = permissionState === 'denied';

  const handleOpenSettingsGuide = () => {
    toast.error(
      'To enable location: Click the lock icon in your browser URL bar and change Location permission to Allow.',
      { id: 'loc-settings-toast', duration: 5000 }
    );
  };

  return (
    <div className="bg-[#40A2E3]/10 border border-[#40A2E3]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in my-3 shadow-xs">
      <div className="flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#40A2E3]/20 text-[#40A2E3] flex items-center justify-center shrink-0 border border-[#40A2E3]/30 shadow-inner">
          <MapPin className="animate-bounce stroke-[2.5]" size={20} />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h4 className="text-xs font-black text-sys-text-primary">
              {isDenied ? 'Location Disabled' : 'Enable Location for 10-Min Delivery'}
            </h4>
            <span className="bg-[#40A2E3]/20 text-[#40A2E3] text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-[#40A2E3]/30 flex items-center gap-0.5 uppercase tracking-wider">
              <Sparkles size={8} /> {isDenied ? 'Blocked' : 'Fast Delivery'}
            </span>
          </div>
          <p className="text-[11px] text-sys-text-secondary mt-1 leading-snug">
            {isDenied
              ? 'Location permission is denied. Please open browser settings and allow location access to continue.'
              : 'Allow location access so our delivery agent can deliver orders right to your exact room.'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto self-end sm:self-center shrink-0">
        {isDenied ? (
          <button
            onClick={handleOpenSettingsGuide}
            className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-[0.98]"
          >
            <Navigation size={13} />
            <span>Open Browser Settings</span>
          </button>
        ) : (
          <button
            onClick={handleEnableLocation}
            disabled={loading}
            className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-[#40A2E3] hover:bg-[#2E94D9] text-white font-extrabold text-[11px] transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-[#40A2E3]/20 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <span>Acquiring...</span>
            ) : (
              <>
                <Navigation size={13} />
                <span>Enable Location</span>
              </>
            )}
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="py-2 px-3 rounded-xl bg-sys-surface-secondary hover:bg-sys-surface-hover text-sys-text-secondary font-bold text-[11px] transition-colors border border-sys-border"
        >
          Later
        </button>
      </div>
    </div>
  );
}
