import React, { useState } from 'react';
import { MapPin, Navigation, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateUserLocationAction } from '../store/authSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';

export default function LocationPermissionModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleEnableLocation = () => {
    setLoading(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setLoading(false);
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.put('/api/auth/location', { latitude, longitude });
          if (res.data.success) {
            dispatch(updateUserLocationAction(res.data.location));
            toast.success('Location access granted!');
            setLoading(false);
            if (onSuccess) onSuccess(res.data.location);
            if (onClose) onClose();
          } else {
            setLoading(false);
            setErrorMsg('Failed to update location on server.');
          }
        } catch (err) {
          setLoading(false);
          setErrorMsg('Error saving location coordinates.');
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. Please allow location access in your browser settings to proceed with delivery.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMsg('Location information is unavailable. Please check your GPS or network connection.');
        } else if (error.code === error.TIMEOUT) {
          setErrorMsg('Location request timed out. Please try again.');
        } else {
          setErrorMsg('Could not obtain location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 space-y-5 relative animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center pt-2 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#40A2E3] to-[#38bdf8] text-white flex items-center justify-center shadow-lg shadow-[#40A2E3]/30 animate-pulse-subtle">
            <MapPin size={32} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight">
              Enable Precise Location
            </h3>
            <p className="text-xs font-semibold text-[#64748B] dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Loopers delivers right to your hostel or home within 10 minutes.
            </p>
          </div>
        </div>

        {/* Value Points */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-start space-x-3 text-xs text-[#0F172A] dark:text-slate-200 font-semibold">
            <Navigation size={18} className="text-[#40A2E3] shrink-0 mt-0.5" />
            <span>Pinpoint exact delivery spot for your runner</span>
          </div>
          <div className="flex items-start space-x-3 text-xs text-[#0F172A] dark:text-slate-200 font-semibold">
            <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>Your location is only shared during active orders</span>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-start space-x-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleEnableLocation}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#40A2E3] hover:bg-[#38bdf8] text-white font-extrabold text-xs shadow-lg shadow-[#40A2E3]/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Acquiring Coordinates...</span>
              </span>
            ) : (
              <>
                <MapPin size={16} />
                <span>Allow Precise Location & Continue</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
          >
            Decide Later
          </button>
        </div>
      </div>
    </div>
  );
}
