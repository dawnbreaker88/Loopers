import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Order from './models/Order.js';
import { errorHandler } from './middleware/errorHandler.js';
import { JWT_SECRET } from './middleware/auth.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import printoutRoutes from './routes/printoutRoutes.js';
import { seedContentManagement } from './utils/seedCM.js';





// Connect Database
connectDB().then(() => {
  seedContentManagement();
});


const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Security Middleware: Helmet & Rate Limiters
app.use(helmet({
  contentSecurityPolicy: false // Allows inline scripts in dev/demo if needed
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Limit each IP/user to 15 file uploads per windowMs
  message: { success: false, message: 'Too many uploads from this IP. Please try again later.' }
});

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io accessible to controllers
app.set('socketio', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Apply rate limiters
app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/upload', uploadLimiter);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Loopers Quick Commerce Backend API is operational...' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/printouts', printoutRoutes);



// Socket.io Handshake Token Decoder Middleware
io.use(async (socket, next) => {
  let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  if (token) {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      if (socket.user) {
        console.log(`[AUTH] Token Verified: ${socket.user.email} (ID: ${socket.user._id}, Role: ${socket.user.role})`);
      }
    } catch (err) {
      console.warn(`[AUTH Warning] Failed token verification on socket ${socket.id}: ${err.message}`);
    }
  }
  next();
});

// Socket.io Real-Time Event Handlers
io.on('connection', (socket) => {
  if (socket.user) {
    // Automatically join user's personal room
    const userRoom = socket.user._id.toString();
    socket.join(userRoom);

    // Automatically join admin room if role is admin
    if (socket.user.role === 'admin') {
      socket.join('admin');
    }

    console.log(`[AUTH] Socket ${socket.id} connected (User: ${socket.user.email}, Role: ${socket.user.role}). Rooms:`, Array.from(socket.rooms));
  } else {
    console.log(`[AUTH] Socket ${socket.id} connected as Guest`);
  }

  // Join User Room (Explicit fallback)
  socket.on('join-user-room', (userId) => {
    if (userId) {
      if (socket.user && (socket.user._id.toString() === userId.toString() || socket.user.role === 'admin')) {
        socket.join(userId);
        console.log(`User socket ${socket.id} joined room: ${userId}`);
      } else {
        console.warn(`[Security Alert] Unauthorized join-user-room attempt for room ${userId} by socket ${socket.id}`);
        socket.emit('error', { message: 'Forbidden: Unauthorized access to this user room' });
      }
    }
  });

  // Join Admin Room (Explicit fallback)
  socket.on('join-admin-room', async () => {
    if (!socket.user) {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (token) {
        if (token.startsWith('Bearer ')) token = token.slice(7).trim();
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          socket.user = await User.findById(decoded.id).select('-password');
        } catch (err) {
          console.warn(`[AUTH Warning] Handshake retry failed for ${socket.id}: ${err.message}`);
        }
      }
    }
    if (socket.user && socket.user.role === 'admin') {
      socket.join('admin');
      console.log(`Admin socket ${socket.id} (${socket.user.name}) joined admin room`);
    } else {
      console.warn(`[Security Alert] Unauthorized join-admin-room attempt by socket ${socket.id}`);
      socket.emit('error', { message: 'Forbidden: Admin access required to join admin room' });
    }
  });

  // Join Order Room (for agent tracking updates on specific orders)
  socket.on('join-order-room', async (orderId) => {
    if (orderId && socket.user) {
      try {
        const order = await Order.findById(orderId);
        if (order) {
          const userIdStr = socket.user._id.toString();
          const orderUserStr = order.user.toString();
          const isAdmin = socket.user.role === 'admin';
          
          if (isAdmin || userIdStr === orderUserStr) {
            socket.join(orderId);
            console.log(`Socket ${socket.id} authorized and joined order room: ${orderId}`);
          } else {
            console.warn(`[Security Alert] Unauthorized join-order-room attempt for order ${orderId} by user ${socket.user.email}`);
            socket.emit('error', { message: 'Unauthorized access to this order room' });
          }
        }
      } catch (err) {
        console.error('Error joining order room:', err.message);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  console.log(`\n[Shutdown] Received ${signal}. Initializing graceful shutdown sequence...`);
  
  // Close HTTP server first (stops accepting new connections)
  server.close(async () => {
    console.log('[Shutdown] Active HTTP connections closed.');
    try {
      // Disconnect from database
      await mongoose.connection.close(false);
      console.log('[Shutdown] MongoDB connection closed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[Shutdown Error] Error closing MongoDB connection:', err.message);
      process.exit(1);
    }
  });

  // Enforce a hard timeout limit of 10s
  setTimeout(() => {
    console.error('[Shutdown Failure] Forced shutdown triggered due to shutdown timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Trigger nodemon reload
