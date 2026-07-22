import 'dotenv/config';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'loopers_jwt_production_secret_key_987654321';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'loopers_jwt_refresh_production_secret_key_123456789';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'loopers_jwt_production_secret_key_987654321') {
    console.error('[CRITICAL SECURITY ERROR] JWT_SECRET is not configured or uses default fallback key in production mode! Exiting to prevent token forgery.');
    process.exit(1);
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'loopers_jwt_refresh_production_secret_key_123456789') {
    console.error('[CRITICAL SECURITY ERROR] JWT_REFRESH_SECRET is not configured or uses default fallback key in production mode! Exiting.');
    process.exit(1);
  }
} else {
  if (!process.env.JWT_SECRET) {
    console.warn('[WARNING] JWT_SECRET is not set in environment variables. Using internal fallback key.');
  }
}

// Generate Access Token (1 hour validity for enhanced security)
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Generate Refresh Token (7 days validity)
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify Refresh Token helper
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

// Protect HTTP Routes Middleware
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      if (req.user.isActive === false || req.user.status !== 'active') {
        return res.status(403).json({ success: false, message: 'User account is suspended or deactivated.' });
      }

      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Admin role check middleware
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden, admin access required' });
};

// Socket.io Connection Handshake Authentication Middleware
export const verifySocketToken = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid or expired token'));
  }
};
