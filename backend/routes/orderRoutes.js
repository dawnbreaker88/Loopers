import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  cancelOrder, 
  rateOrder 
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { validate, idParamSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/create', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, validate(idParamSchema), getOrderById);
router.put('/cancel', protect, cancelOrder);
router.post('/:id/rate', protect, validate(idParamSchema), rateOrder);

export default router;
