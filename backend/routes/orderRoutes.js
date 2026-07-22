import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  cancelOrder, 
  rateOrder,
  downloadOrderPrintout
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:id/printout/:index/download', protect, downloadOrderPrintout);
router.get('/:id', protect, getOrderById);
router.put('/cancel', protect, cancelOrder);
router.post('/:id/rate', protect, rateOrder);

export default router;
