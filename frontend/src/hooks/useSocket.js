import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

export const useSocket = (orderId, onStatusUpdate, onLocationUpdate) => {
  const socketRef = useRef(null);
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || user?._id;

  useEffect(() => {
    // Connect socket
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin || 'http://localhost:5000';
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
      if (userId) {
        socket.emit('join-user-room', userId);
      }
      if (orderId) {
        socket.emit('join-order-room', orderId);
      }
    });

    socket.on('order-update', (data) => {
      console.log('Order update received via socket:', data);
      if (onStatusUpdate) {
        onStatusUpdate(data);
      }
      if (onLocationUpdate) {
        onLocationUpdate(data);
      }
    });

    return () => {
      if (socket) {
        socket.disconnect();
        console.log('Socket disconnected on clean up');
      }
    };
  }, [orderId, userId, onStatusUpdate, onLocationUpdate]);

  const emitAgentLocation = (agentId, orderId, lat, lng) => {
    if (socketRef.current) {
      socketRef.current.emit('updateAgentLocation', { agentId, orderId, lat, lng });
    }
  };

  return {
    socket: socketRef.current,
    emitAgentLocation,
  };
};

export default useSocket;
