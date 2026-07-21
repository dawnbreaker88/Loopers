import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getSocket, subscribeToSocketEvents } from '../services/socketService.js';

export const useSocket = (orderId, onStatusUpdate, onLocationUpdate) => {
  const socketRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || user?._id;

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (socket && socket.connected) {
      if (userId) {
        socket.emit('join-user-room', userId);
      }
      if (orderId) {
        socket.emit('join-order-room', orderId);
      }
    }

    const unsubscribe = subscribeToSocketEvents((eventName, data) => {
      if (eventName === 'orderUpdated' || eventName === 'order-status-update') {
        if (!orderId || data?._id === orderId || data?.orderId === orderId) {
          if (onStatusUpdate) onStatusUpdate(data);
        }
      }
      if (eventName === 'riderLocationUpdate' || eventName === 'riderLocationUpdated') {
        if (!orderId || data?.orderId === orderId) {
          if (onLocationUpdate) onLocationUpdate(data);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId, userId, onStatusUpdate, onLocationUpdate]);

  const emitAgentLocation = (agentId, orderId, lat, lng) => {
    const socket = socketRef.current || getSocket();
    if (socket) {
      socket.emit('updateAgentLocation', { agentId, orderId, lat, lng });
    }
  };

  return {
    socket: socketRef.current || getSocket(),
    emitAgentLocation,
  };
};

export default useSocket;
