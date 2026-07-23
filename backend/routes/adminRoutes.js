import express from 'express';
import { 
  getAllUsers, 
  updateUserStatus, 
  acceptOrder,
  printOrder,
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
import { validate, idParamSchema } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id/status', validate(idParamSchema), updateUserStatus);

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
router.post('/orders/:id/accept', validate(idParamSchema), acceptOrder);
router.post('/orders/:id/print', validate(idParamSchema), printOrder);
router.post('/orders/:id/pack', validate(idParamSchema), packOrder);
router.post('/orders/:id/out-for-delivery', validate(idParamSchema), outForDeliveryOrder);
router.post('/orders/:id/deliver', validate(idParamSchema), deliverOrder);
router.post('/orders/:id/cancel', validate(idParamSchema), cancelOrderAdmin);

export default router;
