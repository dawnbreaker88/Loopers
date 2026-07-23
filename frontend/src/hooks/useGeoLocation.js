import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserLocationAction } from '../store/authSlice.js';
import api from '../services/api.js';

export const useGeoLocation = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let watchId = null;
    let isStopped = false;

    const updateLocationOnServer = async (latitude, longitude) => {
      try {
        const res = await api.put('/api/auth/location', { latitude, longitude });
        if (res.data.success && !isStopped) {
          dispatch(updateUserLocationAction(res.data.location));
        }
      } catch (err) {
        console.error('Error updating location on server:', err);
      }
    };

    const startTracking = () => {
      if (!navigator.geolocation) return;

      // 1. Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isStopped) return;
          const { latitude, longitude } = position.coords;
          updateLocationOnServer(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation initial request error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );

      // 2. Watch position for periodic movement tracking
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (isStopped) return;
          const { latitude, longitude } = position.coords;
          updateLocationOnServer(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation watch error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    };

    const checkAndStartTracking = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (result.state === 'granted') {
            startTracking();
          } else {
            if (import.meta.env.DEV) console.log('[useGeoLocation] Geolocation state is ' + result.state + ', skipping automatic prompt.');
          }
        } catch (err) {
          console.warn('Permissions query error:', err.message);
        }
      } else {
        // Fallback for Safari/iOS:
        // Only auto-request on start if the user already has location coordinates saved (assumes previous grant)
        const coords = user?.location;
        const hasCoords = coords && coords.latitude && coords.longitude;
        if (hasCoords) {
          startTracking();
        }
      }
    };

    checkAndStartTracking();

    return () => {
      isStopped = true;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isAuthenticated, user?._id, dispatch]);
};

export default useGeoLocation;
