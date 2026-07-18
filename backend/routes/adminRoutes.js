import express from 'express';
import { 
  getAllUsers, 
  updateUserStatus, 
  getAdminAnalytics,
  acceptOrder,
  packOrder,
  outForDeliveryOrder,
  deliverOrder,
  cancelOrderAdmin
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/analytics', getAdminAnalytics);

// Order Lifecycle routes
router.post('/orders/:id/accept', acceptOrder);
router.post('/orders/:id/pack', packOrder);
router.post('/orders/:id/out-for-delivery', outForDeliveryOrder);
router.post('/orders/:id/deliver', deliverOrder);
router.post('/orders/:id/cancel', cancelOrderAdmin);

export default router;
