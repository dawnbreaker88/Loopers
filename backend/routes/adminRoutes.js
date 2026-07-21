import express from 'express';
import { 
  getAllUsers, 
  updateUserStatus, 
  acceptOrder,
  packOrder,
  outForDeliveryOrder,
  deliverOrder,
  cancelOrderAdmin,
  getVapidPublicKey,
  subscribeAdmin
} from '../controllers/adminController.js';
import {
  getAdminAnalyticsSummary,
  getOrderAnalytics,
  getRevenueAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getGeographicAnalytics
} from '../controllers/analyticsController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

// Web Push MVP routes
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', subscribeAdmin);

// Analytics endpoints
router.get('/analytics', getAdminAnalyticsSummary);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/products', getProductAnalytics);
router.get('/analytics/customers', getCustomerAnalytics);
router.get('/analytics/geographic', getGeographicAnalytics);

// Order Lifecycle routes
router.post('/orders/:id/accept', acceptOrder);
router.post('/orders/:id/pack', packOrder);
router.post('/orders/:id/out-for-delivery', outForDeliveryOrder);
router.post('/orders/:id/deliver', deliverOrder);
router.post('/orders/:id/cancel', cancelOrderAdmin);

export default router;
