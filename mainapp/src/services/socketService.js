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
    // Quiet audio fallback
  }
};

let notificationAudio = null;
let audioUnlocked = false;

try {
  notificationAudio = new Audio('https://upload.wikimedia.org/wikipedia/commons/d/d4/Notification_sound_1.mp3');
  notificationAudio.load();
} catch (e) {
  // Audio preload fallback
}

const unlockAudio = () => {
  if (audioUnlocked) return;
  if (notificationAudio) {
    notificationAudio.play().then(() => {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
      audioUnlocked = true;
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    }).catch(() => {});
  } else {
    audioUnlocked = true;
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
}

let isPlayingSound = false;
const playNotificationSound = () => {
  if (isPlayingSound) return;
  isPlayingSound = true;
  setTimeout(() => { isPlayingSound = false; }, 2000);

  if (notificationAudio && audioUnlocked) {
    notificationAudio.currentTime = 0;
    notificationAudio.play()
      .catch(() => {
        playNotificationChime();
      });
  } else {
    playNotificationChime();
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
    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit('join-user-room', userId);
    }
    if (user && user.role === 'admin') {
      socket.emit('join-admin-room');
    }
  });

  // Authoritative new order listener for notifications & admin store
  socket.on('newOrder', (data) => {
    playNotificationSound();
    listeners.forEach(cb => cb('newOrder', data));
  });

  socket.on('orderUpdated', (order) => {
    store.dispatch(orderUpdatedSocket(order));
    listeners.forEach(cb => cb('orderUpdated', order));
  });

  socket.on('riderLocationUpdate', (data) => {
    store.dispatch(riderLocationUpdatedSocket(data));
    listeners.forEach(cb => cb('riderLocationUpdate', data));
  });

  socket.on('productCreated', (product) => {
    store.dispatch(productAddedFromSocket(product));
    listeners.forEach(cb => cb('productCreated', product));
  });

  socket.on('productUpdated', (product) => {
    store.dispatch(productUpdatedFromSocket(product));
    listeners.forEach(cb => cb('productUpdated', product));
  });

  socket.on('productDeleted', (data) => {
    store.dispatch(productDeletedFromSocket(data));
    listeners.forEach(cb => cb('productDeleted', data));
  });

  socket.on('storeStatusUpdated', (storeData) => {
    listeners.forEach(cb => cb('storeStatusUpdated', storeData));
  });

  // Status change notification forwarding
  const forwardStatusEvent = (eventName) => {
    socket.on(eventName, (data) => {
      listeners.forEach(cb => cb(eventName, data));
    });
  };

  ['order-status-update'].forEach(forwardStatusEvent);

  socket.on('disconnect', () => {});

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
