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

// 1. Production Environment Validation on Startup
const requiredEnvVars = [
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(name => !process.env[name]);
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  missingEnvVars.push('MONGODB_URI / MONGO_URI');
}

if (missingEnvVars.length > 0) {
  console.error(`\n[FATAL] Startup failure: Missing required environment variables:\n  ${missingEnvVars.join('\n  ')}\n`);
  process.exit(1);
}

// Connect Database
connectDB().then(() => {
  if (process.env.AUTO_SEED_DATABASE === 'true') {
    seedContentManagement();
    console.log('✅ Seeding completed (AUTO_SEED_DATABASE=true)');
  } else {
    console.log('ℹ️ Seeding skipped (AUTO_SEED_DATABASE=false)');
  }
});


const app = express();
const server = http.createServer(app);

// Security Middleware: Helmet & Rate Limiter
app.use(helmet({
  contentSecurityPolicy: false // Allows inline scripts in dev/demo if needed
}));

// Configurable CORS Origin
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(o => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    console.log("Incoming Origin:", origin);
    console.log("Allowed Origins:", allowedOrigins);

    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      console.log("✅ Allowed:", normalizedOrigin);
      return callback(null, true);
    }

    console.error("❌ Blocked:", normalizedOrigin);

    callback(new Error("Not allowed by CORS"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // Default: 15 mins
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100', 10),
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '500', 10),
  message: { success: false, message: 'Too many API requests. Please try again later.' }
});

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin(origin, callback) {

      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.error("❌ Socket CORS Blocked:", normalizedOrigin);

      callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST"]
  }
});

// Make io accessible to controllers
app.set('socketio', io);

// Request body parser limit
app.use(express.json({ limit: process.env.MAX_REQUEST_BODY_SIZE || '10mb' }));

// Apply Rate Limiters
app.use('/api/', apiLimiter);
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
  }

  // Join User Room (Explicit fallback)
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(userId);
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

  socket.once('disconnect', () => {
    socket.removeAllListeners('join-user-room');
    socket.removeAllListeners('join-admin-room');
    socket.removeAllListeners('join-order-room');
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
