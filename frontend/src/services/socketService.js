import { io } from 'socket.io-client';
import { store } from '../store/index.js';
import { newOrderReceived, orderUpdatedSocket, riderLocationUpdatedSocket } from '../store/orderSlice.js';
import { productAddedFromSocket, productUpdatedFromSocket, productDeletedFromSocket } from '../store/productSlice.js';

let socket = null;
const listeners = new Set();

// Web Audio API Chime Synthesizer for instant audible alerts
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Pleasant two-tone chime (D5 -> A5)
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.25); // D5
    playTone(880.00, now + 0.15, 0.4); // A5
  } catch (err) {
    console.warn('[SocketService] Audio chime play skipped:', err.message);
  }
};

// HTML5 Native Browser Notification Trigger
const triggerBrowserNotification = (order) => {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const orderId = order?.customId || (order?._id ? `LPR-${order._id.slice(-6).toUpperCase()}` : 'New Order');
    const customerName = order?.user?.name || order?.address?.name || 'Customer';
    const total = order?.totalPrice ? ` (₹${order.totalPrice.toFixed(2)})` : '';

    const title = `🚨 New Order Placed: ${orderId}`;
    const options = {
      body: `${customerName} placed an order${total}. Tap to view pending orders.`,
      icon: '/favicon.ico',
      tag: `new-order-${order?._id || Date.now()}`,
      renotify: true
    };

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  } catch (err) {
    console.warn('[SocketService] Browser notification trigger error:', err.message);
  }
};

export const initSocket = (user, token) => {
  if (socket) {
    socket.disconnect();
  }

  const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('[SocketService] Connected:', socket.id);
    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit('join-user-room', userId);
    }
    if (user && user.role === 'admin') {
      socket.emit('join-admin-room');
    }
  });

  // Global event listeners updating Redux store directly
  socket.on('new-order', (order) => {
    console.log('[SocketService] Received new-order:', order?._id);
    store.dispatch(newOrderReceived(order));
    playNotificationChime();
    triggerBrowserNotification(order);
    listeners.forEach(cb => cb('new-order', order));
  });

  socket.on('orderUpdated', (order) => {
    console.log('[SocketService] Received orderUpdated:', order?._id);
    store.dispatch(orderUpdatedSocket(order));
    listeners.forEach(cb => cb('orderUpdated', order));
  });

  const handleRiderLocation = (data) => {
    console.log('[SocketService] Received riderLocationUpdate:', data);
    store.dispatch(riderLocationUpdatedSocket(data));
    listeners.forEach(cb => cb('riderLocationUpdate', data));
  };

  socket.on('riderLocationUpdate', handleRiderLocation);
  socket.on('riderLocationUpdated', handleRiderLocation);

  socket.on('productCreated', (product) => {
    console.log('[SocketService] Received productCreated:', product?._id);
    store.dispatch(productAddedFromSocket(product));
    listeners.forEach(cb => cb('productCreated', product));
  });

  socket.on('productUpdated', (product) => {
    console.log('[SocketService] Received productUpdated:', product?._id);
    store.dispatch(productUpdatedFromSocket(product));
    listeners.forEach(cb => cb('productUpdated', product));
  });

  socket.on('productDeleted', (data) => {
    console.log('[SocketService] Received productDeleted:', data);
    store.dispatch(productDeletedFromSocket(data));
    listeners.forEach(cb => cb('productDeleted', data));
  });

  socket.on('storeStatusUpdated', (storeData) => {
    console.log('[SocketService] Received storeStatusUpdated:', storeData);
    listeners.forEach(cb => cb('storeStatusUpdated', storeData));
  });

  // Specific status change notifications
  const forwardStatusEvent = (eventName) => {
    socket.on(eventName, (data) => {
      console.log(`[SocketService] Received ${eventName}:`, data);
      listeners.forEach(cb => cb(eventName, data));
    });
  };

  ['order-status-update', 'orderAccepted', 'orderPacked', 'orderOutForDelivery', 'orderDelivered', 'orderCancelled'].forEach(forwardStatusEvent);

  socket.on('disconnect', (reason) => {
    console.log('[SocketService] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const subscribeToSocketEvents = (callback) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
