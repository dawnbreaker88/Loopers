import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
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

// Security Middleware: Helmet & Rate Limiter
app.use(helmet({
  contentSecurityPolicy: false // Allows inline scripts in dev/demo if needed
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible to controllers
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Apply Rate Limiter to Auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
      socket.join(userId);
      console.log(`User socket ${socket.id} joined room: ${userId}`);
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
