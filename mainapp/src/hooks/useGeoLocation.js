import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserLocationAction } from '../store/authSlice.js';
import api from '../services/api.js';

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

export const useGeoLocation = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Use refs to persist location state across watchPosition calls
  const lastPositionRef = useRef({ lat: null, lng: null });
  const lastUpdateTimeRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const updateLocationOnServer = async (latitude, longitude) => {
      const now = Date.now();
      const lastPos = lastPositionRef.current;
      const lastTime = lastUpdateTimeRef.current;

      // Throttle updates: movement > 10m and min 5s interval
      if (lastPos.lat !== null && lastPos.lng !== null) {
        const distance = calculateDistance(lastPos.lat, lastPos.lng, latitude, longitude);
        const timeElapsed = now - lastTime;

        if (distance <= 10 || timeElapsed < 5000) {
          // Skip updating if movement is not significant or it hasn't been 5 seconds
          return;
        }
      }

      try {
        const res = await api.put('/api/auth/location', { latitude, longitude });
        if (res.data.success) {
          dispatch(updateUserLocationAction(res.data.location));
          lastPositionRef.current = { lat: latitude, lng: longitude };
          lastUpdateTimeRef.current = now;
        }
      } catch (err) {
        // Location update error fallback
      }
    };

    if (navigator.geolocation) {
      // 1. Get initial position with high precision
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Set initial reference points and push initial coordinates
          lastPositionRef.current = { lat: latitude, lng: longitude };
          lastUpdateTimeRef.current = Date.now();
          api.put('/api/auth/location', { latitude, longitude })
            .then(res => {
              if (res.data.success) {
                dispatch(updateUserLocationAction(res.data.location));
              }
            })
            .catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );

      // 2. Watch position for periodic movement tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocationOnServer(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isAuthenticated, user?._id, dispatch]);
};

export default useGeoLocation;
